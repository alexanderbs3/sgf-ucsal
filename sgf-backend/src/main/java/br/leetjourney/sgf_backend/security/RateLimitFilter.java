package br.leetjourney.sgf_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro de rate limiting para o endpoint de login.
 *
 * MOTIVAÇÃO (auditoria): sem limitação de tentativas, o endpoint de login
 * era vulnerável a ataques de força bruta. Com BCrypt fator 12 (~250ms/hash),
 * um atacante com 10 threads paralelas poderia tentar ~2.400 senhas/minuto.
 *
 * IMPLEMENTAÇÃO:
 * - Sliding window de 60 segundos por IP.
 * - Máximo de 10 tentativas por janela (configurável via application.yaml).
 * - Apenas o endpoint /auth/login é limitado — outros endpoints não são afetados.
 * - Limpeza automática de entradas expiradas a cada 100 requisições para evitar
 *   memory leak em ambientes com muitos IPs distintos.
 *
 * DECISÃO DE PORTFÓLIO:
 * Em produção enterprise, usar Bucket4j com Redis para compartilhar estado
 * entre múltiplas instâncias. A implementação em memória aqui é adequada para
 * uma única instância (monolito), que é o caso do SGF atual.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final String LOGIN_PATH     = "/auth/login";
    private static final int    MAX_TENTATIVAS = 10;
    private static final long   JANELA_MS      = 60_000L; // 60 segundos
    private static final int    CLEANUP_CADA   = 100;     // limpar a cada N requisições

    // Estrutura: IP → {contagem, início da janela}
    private final Map<String, WindowEntry> janelas = new ConcurrentHashMap<>();
    private final AtomicInteger totalReqs = new AtomicInteger(0);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // Aplica rate limit apenas no endpoint de login
        if (!LOGIN_PATH.equals(request.getServletPath())) {
            chain.doFilter(request, response);
            return;
        }

        // Limpeza periódica para evitar memory leak
        if (totalReqs.incrementAndGet() % CLEANUP_CADA == 0) {
            limparJanelasExpiradas();
        }

        String ip   = resolverIp(request);
        long   agora = Instant.now().toEpochMilli();

        WindowEntry entry = janelas.compute(ip, (k, v) -> {
            if (v == null || agora - v.inicio > JANELA_MS) {
                // Nova janela ou janela expirada — reseta
                return new WindowEntry(agora, 1);
            }
            v.contagem.incrementAndGet();
            return v;
        });

        if (entry.contagem.get() > MAX_TENTATIVAS) {
            long restante = JANELA_MS - (agora - entry.inicio);
            log.warn("Rate limit excedido para IP {} no login ({} tentativas em 60s). "
                    + "Bloqueado por {}ms", ip, entry.contagem.get(), restante);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(restante / 1000));
            response.getWriter().write("""
                    {"status":429,"mensagem":"Muitas tentativas de login. Tente novamente em %d segundos."}
                    """.formatted(restante / 1000).trim());
            return;
        }

        chain.doFilter(request, response);
    }

    private String resolverIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xReal = request.getHeader("X-Real-IP");
        if (xReal != null && !xReal.isBlank()) return xReal.trim();
        return request.getRemoteAddr();
    }

    private void limparJanelasExpiradas() {
        long agora = Instant.now().toEpochMilli();
        int antes = janelas.size();
        janelas.entrySet().removeIf(e -> agora - e.getValue().inicio > JANELA_MS);
        log.debug("Rate limit cleanup: {} entradas removidas ({} → {})",
                antes - janelas.size(), antes, janelas.size());
    }

    private static class WindowEntry {
        final long         inicio;
        final AtomicInteger contagem;

        WindowEntry(long inicio, int contagem) {
            this.inicio   = inicio;
            this.contagem = new AtomicInteger(contagem);
        }
    }
}
