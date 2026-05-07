package br.leetjourney.sgf_backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuração central do Spring Security — v6.0
 *
 * CORREÇÕES v6 (auditoria):
 * 1. CORS restrito: allowedOriginPatterns("*") substituído por lista de origens
 *    configuráveis via variável de ambiente CORS_ALLOWED_ORIGINS.
 * 2. Rate limiting injetado como filtro antes do JwtAuthFilter.
 * 3. @PreAuthorize habilitado via @EnableMethodSecurity para defesa em profundidade.
 * 4. /auth/definir-senha removido das rotas públicas — agora exige ADMIN.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter   jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    /**
     * Origens CORS permitidas — configuradas via variável de ambiente.
     * Padrão de desenvolvimento: apenas o servidor Vite local.
     * Em produção: definir CORS_ALLOWED_ORIGINS com o domínio real do frontend.
     */
    @Value("${sgf.cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthFilter   = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth

                // ── Rotas totalmente públicas ───────────────────────────────
                .requestMatchers("/auth/login").permitAll()

                // CORREÇÃO: /auth/definir-senha NÃO é mais público.
                // Agora exige autenticação como ADMIN (veja AuthController).
                // /auth/me exige JWT válido.

                // Lookups públicos (para popular selects no frontend sem login)
                .requestMatchers(HttpMethod.GET, "/classificacoes/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/origens-dado/**").permitAll()

                // ── Auth protegido ──────────────────────────────────────────
                .requestMatchers("/auth/**").authenticated()

                // ── Obras ───────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/obras/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/obras").hasAnyRole("ADMIN", "GESTOR")
                .requestMatchers(HttpMethod.PUT, "/obras/**").hasAnyRole("ADMIN", "GESTOR")
                .requestMatchers(HttpMethod.PATCH, "/obras/**").hasAnyRole("ADMIN", "GESTOR", "FISCAL")
                .requestMatchers(HttpMethod.DELETE, "/obras/**").hasRole("ADMIN")

                // ── Itens ───────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/itens/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/itens").hasAnyRole("ADMIN", "GESTOR", "FISCAL")
                .requestMatchers(HttpMethod.PUT, "/itens/**").hasAnyRole("ADMIN", "GESTOR")
                .requestMatchers(HttpMethod.PATCH, "/itens/**").hasAnyRole("ADMIN", "GESTOR", "FISCAL")
                .requestMatchers(HttpMethod.DELETE, "/itens/**").hasAnyRole("ADMIN", "GESTOR")

                // ── Vistorias ───────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/vistorias/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/vistorias").hasAnyRole("ADMIN", "GESTOR", "FISCAL")

                // ── Logs ────────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/logs/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/logs").hasAnyRole("ADMIN", "GESTOR", "FISCAL")

                // ── Usuários ────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/usuarios/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/usuarios").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/usuarios/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            // Rate limiting antes do JWT (protege o endpoint de login de brute force)
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORREÇÃO: CORS restrito a origens configuradas via variável de ambiente.
     * Substituição de allowedOriginPatterns("*") que aceitava qualquer origem.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse de lista separada por vírgula: "http://app.gov.br,http://localhost:5173"
        List<String> origens = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
        config.setAllowedOrigins(origens);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
