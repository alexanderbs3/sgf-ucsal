package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.DefinirSenhaRequestDTO;
import br.leetjourney.sgf_backend.dto.request.LoginRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LoginResponseDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller de autenticação.
 *
 * Endpoints públicos (sem JWT):
 *   POST /auth/login           → autentica e retorna token JWT
 *   POST /auth/definir-senha   → define senha inicial para usuários seed
 *
 * Endpoint protegido (exige JWT):
 *   GET  /auth/me              → retorna dados do usuário autenticado
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /auth/login
     *
     * Body: { "email": "admin@sgf.gov.br", "senha": "senha123" }
     * Retorna: { "token": "...", "id": "...", "nome": "...", "email": "...", "papel": "ADMIN" }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    /**
     * POST /auth/definir-senha/{id}
     *
     * Define ou redefine a senha de um usuário pelo UUID.
     * Usado no setup inicial dos usuários seed (que não possuem senha).
     *
     * Body: { "senha": "minhasenha123" }
     */
    @PostMapping("/definir-senha/{id}")
    public ResponseEntity<Void> definirSenha(
            @PathVariable UUID id,
            @Valid @RequestBody DefinirSenhaRequestDTO dto) {
        authService.definirSenha(id, dto);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /auth/me
     *
     * Retorna os dados do usuário autenticado.
     * O email é extraído automaticamente do JWT pelo JwtAuthFilter
     * e injetado via @AuthenticationPrincipal (o principal é o email/subject do token).
     */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> me(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(authService.me(email));
    }
}
