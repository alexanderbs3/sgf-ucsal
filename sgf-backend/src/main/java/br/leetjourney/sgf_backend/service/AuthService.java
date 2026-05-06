package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.DefinirSenhaRequestDTO;
import br.leetjourney.sgf_backend.dto.request.LoginRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LoginResponseDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.model.Usuario;
import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import br.leetjourney.sgf_backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;

    public AuthService(UsuarioRepository repository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.repository      = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
    }

    /**
     * Autentica um usuário e retorna um token JWT.
     *
     * Regras:
     * - Email deve existir no banco
     * - Usuário deve ter senha definida (não-null) — usuários seed legados
     *   precisam passar por /auth/definir-senha antes do primeiro login
     * - Senha deve bater com o hash BCrypt armazenado
     *
     * Retorna HTTP 401 via RegraDeNegocioException em todos os casos de falha,
     * sem discriminar qual campo está errado (segurança).
     */
    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Usuario u = repository.findByEmail(dto.email().trim().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Tentativa de login com email não encontrado: {}", dto.email());
                    return new RegraDeNegocioException("Credenciais inválidas.");
                });

        if (u.getSenhaHash() == null) {
            log.warn("Tentativa de login de usuário sem senha definida: {}", dto.email());
            throw new RegraDeNegocioException(
                    "Este usuário ainda não possui senha definida. "
                    + "Solicite ao administrador que use POST /auth/definir-senha.");
        }

        if (!passwordEncoder.matches(dto.senha(), u.getSenhaHash())) {
            log.warn("Senha incorreta para usuário: {}", dto.email());
            throw new RegraDeNegocioException("Credenciais inválidas.");
        }

        String token = jwtUtil.gerar(u.getEmail(), u.getPapel().name());
        log.info("Login bem-sucedido: {} ({})", u.getEmail(), u.getPapel());
        return LoginResponseDTO.of(token, u);
    }

    /**
     * Define ou redefine a senha de um usuário.
     * Endpoint público para configuração inicial dos usuários seed.
     *
     * Em produção real: este endpoint deveria exigir um token de convite
     * por e-mail ou ser restrito ao ADMIN. Para o escopo de portfólio,
     * mantemos público para facilitar o setup inicial.
     */
    @Transactional
    public void definirSenha(UUID usuarioId, DefinirSenhaRequestDTO dto) {
        Usuario u = repository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado: " + usuarioId));
        u.setSenhaHash(passwordEncoder.encode(dto.senha()));
        repository.save(u);
        log.info("Senha definida para usuário: {}", u.getEmail());
    }

    /**
     * Retorna os dados do usuário autenticado com base no email extraído do JWT.
     * Usado pelo frontend após o login para popular o contexto de auth.
     */
    @Transactional(readOnly = true)
    public UsuarioResponseDTO me(String email) {
        return UsuarioResponseDTO.from(
                repository.findByEmail(email)
                        .orElseThrow(() -> new RecursoNaoEncontradoException(
                                "Usuário não encontrado: " + email))
        );
    }
}
