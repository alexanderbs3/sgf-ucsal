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
 * Extrai o Bearer token do header Authorization,
 * valida com JwtUtil e popula o SecurityContext se válido.
 * Requisições sem token chegam ao endpoint normalmente;
 * o SecurityConfig decide se a rota precisa de autenticação.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtil          jwtUtil;
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
            String papel = jwtUtil.extrairPapel(token);

            // Confirma que o usuário ainda existe no banco
            if (usuarioRepository.existsByEmail(email)) {
                var auth = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + papel))
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("JWT válido para {} com papel {}", email, papel);
            } else {
                log.warn("Token JWT com email não encontrado no banco: {}", email);
            }
        }

        chain.doFilter(request, response);
    }

    /** Extrai o token do header "Authorization: Bearer <token>". */
    private String extrairToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
