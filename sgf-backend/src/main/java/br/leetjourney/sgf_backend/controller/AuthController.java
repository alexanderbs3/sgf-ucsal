package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.DefinirSenhaRequestDTO;
import br.leetjourney.sgf_backend.dto.request.LoginRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LoginResponseDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller de autenticação — v6.0
 *
 * CORREÇÃO v6 (auditoria crítica):
 * - POST /auth/definir-senha/{id} agora exige autenticação como ADMIN.
 *   Na v5, este endpoint era público — qualquer pessoa podia redefinir
 *   a senha de qualquer usuário, incluindo o Admin, sem autenticação.
 *
 * Endpoints:
 *   POST /auth/login                     → público — autentica e retorna JWT
 *   POST /auth/definir-senha/{id}        → ADMIN only — define/redefine senha
 *   POST /auth/alterar-minha-senha       → autenticado — usuário altera a própria senha
 *   GET  /auth/me                        → autenticado — dados do usuário logado
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /auth/login — público
     * Sujeito a rate limiting por IP (RateLimitFilter: 10 tentativas/60s).
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    /**
     * POST /auth/definir-senha/{id} — ADMIN only
     *
     * CORREÇÃO v6: era público na v5, permitindo que qualquer pessoa redefinisse
     * a senha de qualquer usuário. Agora exige ADMIN via @PreAuthorize.
     *
     * Uso: configuração inicial de usuários seed ou reset de senha por suporte.
     */
    @PostMapping("/definir-senha/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> definirSenha(
            @PathVariable UUID id,
            @Valid @RequestBody DefinirSenhaRequestDTO dto,
            @AuthenticationPrincipal String adminEmail) {
        authService.definirSenha(id, dto, adminEmail);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /auth/alterar-minha-senha — qualquer usuário autenticado
     *
     * Permite que o usuário altere a própria senha sem intervenção do Admin.
     * Exige a senha atual para confirmar identidade.
     */
    @PostMapping("/alterar-minha-senha")
    public ResponseEntity<Void> alterarMinhaSenha(
            @Valid @RequestBody AlterarSenhaRequestDTO dto,
            @AuthenticationPrincipal String email) {
        authService.alterarSenha(email, dto);
        return ResponseEntity.noContent().build();
    }

    /** GET /auth/me — qualquer usuário autenticado */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> me(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(authService.me(email));
    }

    // ── DTO interno (evita criar arquivo separado para DTO simples) ───────────
    public record AlterarSenhaRequestDTO(
            @jakarta.validation.constraints.NotBlank String senhaAtual,
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(min = 6, max = 100) String novaSenha
    ) {}
}
