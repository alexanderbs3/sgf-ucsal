package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.controller.AuthController.AlterarSenhaRequestDTO;
import br.leetjourney.sgf_backend.dto.request.DefinirSenhaRequestDTO;
import br.leetjourney.sgf_backend.dto.request.LoginRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LoginResponseDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.model.AuditLog;
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
    private final AuditService      auditService;

    public AuthService(UsuarioRepository repository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuditService auditService) {
        this.repository      = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
        this.auditService    = auditService;
    }

    /**
     * Autentica um usuário e retorna um token JWT.
     *
     * CORREÇÃO v6: logs de falha agora mascaram o email para conformidade LGPD.
     * Mensagem de erro para "sem senha definida" diferencia do erro padrão
     * para ajudar no setup inicial sem comprometer a segurança (username enum
     * parcial aceitável neste caso de uso operacional interno).
     */
    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO dto) {
        String emailNormalizado = dto.email().trim().toLowerCase();

        Usuario u = repository.findByEmail(emailNormalizado).orElseThrow(() -> {
            log.warn("Login falhou — email não encontrado: {}", maskEmail(emailNormalizado));
            auditService.registrar(AuditLog.Acao.ACESSO_NEGADO, "Auth", null,
                    "Login falhou: email não encontrado (" + maskEmail(emailNormalizado) + ")");
            return new RegraDeNegocioException("Credenciais inválidas.");
        });

        if (u.getSenhaHash() == null) {
            log.warn("Login falhou — usuário sem senha definida: {}", maskEmail(emailNormalizado));
            throw new RegraDeNegocioException(
                    "Este usuário ainda não possui senha definida. "
                    + "Solicite ao administrador que use POST /auth/definir-senha/{id}.");
        }

        if (!passwordEncoder.matches(dto.senha(), u.getSenhaHash())) {
            log.warn("Login falhou — senha incorreta: {}", maskEmail(emailNormalizado));
            auditService.registrar(AuditLog.Acao.ACESSO_NEGADO, "Auth", u.getId(),
                    "Login falhou: senha incorreta para " + maskEmail(emailNormalizado));
            throw new RegraDeNegocioException("Credenciais inválidas.");
        }

        String token = jwtUtil.gerar(u.getEmail(), u.getPapel().name());
        log.info("Login bem-sucedido: {} ({})", maskEmail(u.getEmail()), u.getPapel());
        auditService.registrar(AuditLog.Acao.LOGIN, "Auth", u.getId(),
                "Login bem-sucedido: " + maskEmail(u.getEmail()));

        return LoginResponseDTO.of(token, u);
    }

    /**
     * Define ou redefine a senha de um usuário pelo ID.
     * CORREÇÃO v6: agora exige autenticação de Admin (AuthController usa @PreAuthorize).
     *
     * @param usuarioId   UUID do usuário alvo
     * @param dto         nova senha
     * @param adminEmail  email do Admin que está realizando a operação (para auditoria)
     */
    @Transactional
    public void definirSenha(UUID usuarioId, DefinirSenhaRequestDTO dto, String adminEmail) {
        Usuario u = repository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado: " + usuarioId));

        UUID adminId = repository.findByEmail(adminEmail).map(Usuario::getId).orElse(null);

        u.setSenhaHash(passwordEncoder.encode(dto.senha()));
        repository.save(u);

        log.info("Senha definida para usuário {} por Admin {}", maskEmail(u.getEmail()), maskEmail(adminEmail));
        auditService.registrar(AuditLog.Acao.UPDATE, "Usuario", u.getId(), adminId,
                "Senha definida por Admin para " + maskEmail(u.getEmail()));
    }

    /**
     * Permite que o usuário autenticado altere a própria senha.
     * Exige a senha atual para confirmar identidade.
     */
    @Transactional
    public void alterarSenha(String email, AlterarSenhaRequestDTO dto) {
        Usuario u = repository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        if (u.getSenhaHash() == null || !passwordEncoder.matches(dto.senhaAtual(), u.getSenhaHash())) {
            log.warn("Alteração de senha falhou — senha atual incorreta: {}", maskEmail(email));
            throw new RegraDeNegocioException("Senha atual incorreta.");
        }

        if (dto.novaSenha().equals(dto.senhaAtual())) {
            throw new RegraDeNegocioException("A nova senha deve ser diferente da senha atual.");
        }

        u.setSenhaHash(passwordEncoder.encode(dto.novaSenha()));
        repository.save(u);

        log.info("Senha alterada pelo próprio usuário: {}", maskEmail(email));
        auditService.registrar(AuditLog.Acao.UPDATE, "Usuario", u.getId(), u.getId(),
                "Usuário alterou a própria senha");
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO me(String email) {
        return UsuarioResponseDTO.from(
                repository.findByEmail(email)
                        .orElseThrow(() -> new RecursoNaoEncontradoException(
                                "Usuário não encontrado: " + email)));
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (local.length() <= 2) return "**" + domain;
        return local.charAt(0) + "**" + domain;
    }
}
