package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.model.AuditLog;
import br.leetjourney.sgf_backend.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

/**
 * Serviço de auditoria — registra toda ação relevante no sistema.
 *
 * Design:
 * - @Async: gravação assíncrona para não impactar latência das requisições.
 * - Propagation.REQUIRES_NEW: a gravação do log ocorre em transação separada,
 *   garantindo que o log seja persistido mesmo se a transação principal sofrer
 *   rollback (ex: login falho ainda deve ser registrado).
 * - Nunca lança exceção para o caller — falhas de auditoria são logadas mas
 *   não interrompem o fluxo principal da aplicação.
 *
 * Uso:
 *   auditService.registrar(AuditLog.Acao.CREATE, "Obra", obra.getId(),
 *       usuarioId, "Obra OBR-2025-001 criada");
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Registra uma ação de auditoria de forma assíncrona.
     *
     * @param acao       tipo da ação (CREATE, UPDATE, DELETE, LOGIN...)
     * @param entidade   nome da entidade afetada ("Obra", "Usuario"...)
     * @param entidadeId UUID da entidade afetada (nullable para ações genéricas)
     * @param usuarioId  UUID do usuário que realizou a ação (nullable para sistema)
     * @param descricao  descrição legível da ação
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(AuditLog.Acao acao,
                          String entidade,
                          UUID entidadeId,
                          UUID usuarioId,
                          String descricao) {
        try {
            String ip = resolverIp();
            AuditLog entry = AuditLog.builder()
                    .acao(acao)
                    .entidade(entidade)
                    .entidadeId(entidadeId)
                    .usuarioId(usuarioId)
                    .descricao(descricao)
                    .ipOrigem(ip)
                    .build();
            repository.save(entry);
            log.debug("Audit [{}] {} {} by {} from {}",
                    acao, entidade, entidadeId, usuarioId, ip);
        } catch (Exception e) {
            // Falha de auditoria NUNCA interrompe o fluxo principal
            log.error("Falha ao registrar audit log: {} {} {} — {}",
                    acao, entidade, entidadeId, e.getMessage());
        }
    }

    /** Sobrecarga sem entidadeId — para ações genéricas como LOGIN. */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(AuditLog.Acao acao,
                          String entidade,
                          UUID usuarioId,
                          String descricao) {
        registrar(acao, entidade, null, usuarioId, descricao);
    }

    /**
     * Tenta extrair o IP real da requisição atual.
     * Considera headers de proxy reverso (X-Forwarded-For, X-Real-IP).
     */
    private String resolverIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return "sistema";
            HttpServletRequest req = attrs.getRequest();

            String xff = req.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                // X-Forwarded-For pode ter múltiplos IPs separados por vírgula —
                // o primeiro é o IP original do cliente
                return xff.split(",")[0].trim();
            }
            String xReal = req.getHeader("X-Real-IP");
            if (xReal != null && !xReal.isBlank()) return xReal.trim();

            return req.getRemoteAddr();
        } catch (Exception e) {
            return "desconhecido";
        }
    }
}
