package br.leetjourney.sgf_backend.security;

import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtro JWT — executa uma vez por requisição.
 *
 * CORREÇÃO v6 (auditoria):
 * - O papel do usuário agora é lido do BANCO a cada requisição, não do token.
 *   Isso elimina o delay de até 24h que existia quando um Admin rebaixava um
 *   usuário — antes, o papel antigo do token continuava válido até a expiração.
 * - findByEmail() substitui existsByEmail() — uma única query faz as duas
 *   verificações (existência + papel atual), sem custo adicional.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtil           jwtUtil;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.jwtUtil           = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String token = extrairToken(request);

        if (token != null && jwtUtil.validar(token)) {
            String email = jwtUtil.extrairEmail(token);

            // CORREÇÃO: papel lido do banco (não do token) para garantir que
            // alterações de papel sejam refletidas imediatamente, sem aguardar
            // a expiração do token.
            usuarioRepository.findByEmail(email).ifPresentOrElse(usuario -> {
                var auth = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getPapel().name()))
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("JWT válido para {} com papel {} (lido do banco)",
                        maskEmail(email), usuario.getPapel());
            }, () ->
                log.warn("Token JWT com email não encontrado no banco: {}", maskEmail(email))
            );
        }

        chain.doFilter(request, response);
    }

    private String extrairToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    /** Mascara o email nos logs: "jo**@prefeitura.gov.br" → protege LGPD. */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (local.length() <= 2) return "**" + domain;
        return local.charAt(0) + "**" + domain;
    }
}
