package br.leetjourney.sgf_backend.security;

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

import java.util.List;

/**
 * Configuração central do Spring Security.
 *
 * Estratégia (portfólio):
 * - Stateless (JWT) — sem sessão HTTP
 * - CSRF desabilitado — desnecessário em APIs REST stateless
 * - Rotas públicas: /auth/** e leituras básicas para o frontend inicial
 * - Rotas protegidas: mutações (POST/PUT/PATCH/DELETE) exigem JWT
 * - Roles mapeadas: ADMIN > GESTOR > FISCAL
 *
 * Em produção real: usar HTTPS obrigatório + rate limiting no /auth/login.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF desnecessário para APIs REST stateless
            .csrf(AbstractHttpConfigurer::disable)

            // CORS via CorsConfigurationSource abaixo
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Sem sessão HTTP — JWT é stateless
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth

                // ── Rotas públicas ─────────────────────────────────────────
                .requestMatchers("/auth/**").permitAll()

                // Leitura pública de lookups (para popular selects no frontend)
                .requestMatchers(HttpMethod.GET, "/classificacoes/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/origens-dado/**").permitAll()

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

                // ── Logs de fiscalização ────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/logs/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/logs").hasAnyRole("ADMIN", "GESTOR", "FISCAL")

                // ── Usuários ────────────────────────────────────────────────
                // Listar: qualquer autenticado (para popular selects de fiscal)
                .requestMatchers(HttpMethod.GET, "/usuarios").authenticated()
                .requestMatchers(HttpMethod.GET, "/usuarios/**").authenticated()
                // CRUD: apenas Admin
                .requestMatchers(HttpMethod.POST, "/usuarios").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/usuarios/**").hasRole("ADMIN")

                // Qualquer outra rota exige autenticação
                .anyRequest().authenticated()
            )

            // Injeta o filtro JWT antes do filtro padrão de username/password
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt com força 12 (padrão recomendado — ~250ms por hash)
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS configurado aqui em vez de WebMvcConfigurer separado,
     * para garantir que o Spring Security também aplique o CORS
     * antes de rejeitar requisições preflight (OPTIONS).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
