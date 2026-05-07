package br.leetjourney.sgf_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilitário JWT — geração, extração de claims e validação de tokens.
 *
 * Decisão técnica (portfólio): segredo configurado via application.yaml,
 * externalizado em variável de ambiente em produção.
 * Em produção real, usar AWS Secrets Manager ou HashiCorp Vault.
 */
@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final SecretKey secretKey;
    private final long      expiracaoMs;

    public JwtUtil(
            @Value("${sgf.jwt.secret}") String secret,
            @Value("${sgf.jwt.expiracao-ms:86400000}") long expiracaoMs) {
        this.secretKey  = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiracaoMs;
    }

    /** Gera um token JWT para o email + papel informados. Inclui jti para rastreabilidade. */
    public String gerar(String email, String papel) {
        return Jwts.builder()
                .subject(email)
                .claim("papel", papel)
                .id(java.util.UUID.randomUUID().toString())  // jti — identificador único do token
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiracaoMs))
                .signWith(secretKey)
                .compact();
    }

    /** Extrai o email (subject) do token. */
    public String extrairEmail(String token) {
        return claims(token).getSubject();
    }

    /** Extrai o papel (claim "papel") do token. */
    public String extrairPapel(String token) {
        return claims(token).get("papel", String.class);
    }

    /** Valida assinatura + expiração. Retorna false se inválido. */
    public boolean validar(String token) {
        try {
            claims(token); // lança exceção se inválido ou expirado
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token JWT inválido: {}", e.getMessage());
            return false;
        }
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
