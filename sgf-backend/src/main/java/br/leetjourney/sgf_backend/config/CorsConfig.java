package br.leetjourney.sgf_backend.config;

/**
 * CORS removido desta classe — v6.0
 *
 * A configuração de CORS foi centralizada no SecurityConfig (CorsConfigurationSource bean),
 * que garante que o Spring Security processe os headers CORS *antes* de rejeitar
 * requisições preflight (OPTIONS). Manter configuração CORS dupla (WebMvcConfigurer +
 * SecurityConfig) causaria conflito de headers e comportamento imprevisível.
 *
 * A origem permitida agora é controlada via variável de ambiente:
 *   CORS_ALLOWED_ORIGINS=https://sgf.prefeitura.gov.br
 *
 * Padrão dev: http://localhost:5173
 *
 * @see br.leetjourney.sgf_backend.security.SecurityConfig#corsConfigurationSource()
 */
public class CorsConfig {
    // Classe mantida apenas para histórico de código.
    // Pode ser removida com segurança em uma refatoração futura.
}
