package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.AtualizarPapelUsuarioDTO;
import br.leetjourney.sgf_backend.dto.request.UsuarioRequestDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoJaExisteException;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.model.AuditLog;
import br.leetjourney.sgf_backend.model.Usuario;
import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

    private final UsuarioRepository  repository;
    private final VistoriaRepository vistoriaRepository;
    private final AuditService       auditService;

    public UsuarioService(UsuarioRepository repository,
                          VistoriaRepository vistoriaRepository,
                          AuditService auditService) {
        this.repository         = repository;
        this.vistoriaRepository = vistoriaRepository;
        this.auditService       = auditService;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listar() {
        return repository.findAll().stream().map(UsuarioResponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(UUID id) {
        return UsuarioResponseDTO.from(buscarEntidade(id));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new RecursoJaExisteException(
                    "Já existe um usuário com o e-mail: " + dto.email());
        }
        Usuario u = new Usuario();
        u.setNome(dto.nome().trim());
        u.setEmail(dto.email().trim().toLowerCase());
        u.setPapel(dto.papel());

        Usuario salvo = repository.save(u);
        log.info("Usuário criado: {} ({})", dto.email(), dto.papel());

        UUID adminId = resolverUsuarioIdAtual();
        auditService.registrar(AuditLog.Acao.CREATE, "Usuario", salvo.getId(), adminId,
                "Usuário criado: " + dto.email() + " papel=" + dto.papel());

        return UsuarioResponseDTO.from(salvo);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponseDTO atualizar(UUID id, UsuarioRequestDTO dto) {
        Usuario u = buscarEntidade(id);
        if (!u.getEmail().equalsIgnoreCase(dto.email())
                && repository.existsByEmail(dto.email())) {
            throw new RecursoJaExisteException(
                    "Já existe um usuário com o e-mail: " + dto.email());
        }
        String papelAnterior = u.getPapel().name();
        u.setNome(dto.nome().trim());
        u.setEmail(dto.email().trim().toLowerCase());
        u.setPapel(dto.papel());

        Usuario salvo = repository.save(u);
        log.info("Usuário {} atualizado: nome={} papel={}", id, dto.nome(), dto.papel());

        UUID adminId = resolverUsuarioIdAtual();
        auditService.registrar(AuditLog.Acao.UPDATE, "Usuario", salvo.getId(), adminId,
                "Usuário atualizado: " + dto.email()
                + " | papel: " + papelAnterior + " → " + dto.papel());

        return UsuarioResponseDTO.from(salvo);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponseDTO atualizarPapel(UUID id, AtualizarPapelUsuarioDTO dto) {
        Usuario u = buscarEntidade(id);
        if (u.getPapel() == dto.papel()) return UsuarioResponseDTO.from(u);

        String papelAnterior = u.getPapel().name();
        u.setPapel(dto.papel());
        Usuario salvo = repository.save(u);

        log.info("Papel do usuário {} alterado: {} → {}", id, papelAnterior, dto.papel());
        UUID adminId = resolverUsuarioIdAtual();
        auditService.registrar(AuditLog.Acao.PATCH, "Usuario", salvo.getId(), adminId,
                "Papel alterado: " + papelAnterior + " → " + dto.papel()
                + " para " + u.getEmail());

        return UsuarioResponseDTO.from(salvo);
    }

    /**
     * Remove um usuário com defesa em profundidade via @PreAuthorize.
     *
     * CORREÇÃO v6: @PreAuthorize("hasRole('ADMIN')") adicionado como segunda linha
     * de defesa. O SecurityConfig já restringe DELETE /usuarios/** a ADMIN, mas
     * esta anotação garante que mudanças futuras no SecurityConfig não exponham
     * acidentalmente este método a outros papéis.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deletar(UUID id, boolean forcar) {
        Usuario u = buscarEntidade(id);
        long totalVistorias = vistoriaRepository.countByUsuarioId(id);

        if (totalVistorias > 0) {
            if (!forcar) {
                throw new RegraDeNegocioException(
                        "O usuário \"" + u.getNome() + "\" possui " + totalVistorias
                                + " vistoria(s) registrada(s) e não pode ser excluído. "
                                + "Reatribua as vistorias ou use a opção de remoção forçada (Admin).");
            }
            vistoriaRepository.desvincularUsuario(id);
            log.warn("Vistorias do usuário {} desvinculadas (remoção forçada)", id);
        }

        UUID adminId = resolverUsuarioIdAtual();
        auditService.registrar(AuditLog.Acao.DELETE, "Usuario", u.getId(), adminId,
                "Usuário removido: " + u.getEmail()
                + (forcar ? " (forçado — " + totalVistorias + " vistorias desvinculadas)" : ""));

        log.info("Usuário deletado: {} ({}) | forcar={}", u.getEmail(), id, forcar);
        repository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Extrai o email do usuário autenticado do SecurityContext.
     * Retorna null se não houver autenticação (não deve ocorrer em métodos
     * anotados com @PreAuthorize, mas é tratado defensivamente).
     */
    private UUID resolverUsuarioIdAtual() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            String email = (String) auth.getPrincipal();
            return repository.findByEmail(email).map(Usuario::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Usuario buscarEntidade(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado: " + id));
    }
}
