
package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.AtualizarPapelUsuarioDTO;
import br.leetjourney.sgf_backend.dto.request.UsuarioRequestDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoJaExisteException;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.model.Usuario;
import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

    private final UsuarioRepository  repository;
    private final VistoriaRepository vistoriaRepository;

    public UsuarioService(UsuarioRepository repository,
                          VistoriaRepository vistoriaRepository) {
        this.repository         = repository;
        this.vistoriaRepository = vistoriaRepository;
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
    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new RecursoJaExisteException(
                    "Já existe um usuário com o e-mail: " + dto.email());
        }
        Usuario u = new Usuario();
        u.setNome(dto.nome().trim());
        u.setEmail(dto.email().trim().toLowerCase());
        u.setPapel(dto.papel());
        log.info("Criando usuário: {} ({})", dto.email(), dto.papel());
        return UsuarioResponseDTO.from(repository.save(u));
    }

    @Transactional
    public UsuarioResponseDTO atualizar(UUID id, UsuarioRequestDTO dto) {
        Usuario u = buscarEntidade(id);
        if (!u.getEmail().equalsIgnoreCase(dto.email())
                && repository.existsByEmail(dto.email())) {
            throw new RecursoJaExisteException(
                    "Já existe um usuário com o e-mail: " + dto.email());
        }
        u.setNome(dto.nome().trim());
        u.setEmail(dto.email().trim().toLowerCase());
        u.setPapel(dto.papel());
        log.info("Usuário {} atualizado: nome={} papel={}", id, dto.nome(), dto.papel());
        return UsuarioResponseDTO.from(repository.save(u));
    }

    @Transactional
    public UsuarioResponseDTO atualizarPapel(UUID id, AtualizarPapelUsuarioDTO dto) {
        Usuario u = buscarEntidade(id);
        if (u.getPapel() == dto.papel()) return UsuarioResponseDTO.from(u);
        u.setPapel(dto.papel());
        log.info("Papel do usuário {} alterado para {}", id, dto.papel());
        return UsuarioResponseDTO.from(repository.save(u));
    }

    /**
     * Remove um usuário.
     *
     * <p>Regra padrão ({@code forcar=false}): bloqueia a exclusão se o usuário
     * possuir vistorias vinculadas — preserva integridade do histórico.
     *
     * <p>Modo forçado ({@code forcar=true}): exclusivo para Administradores.
     * Reatribui as vistorias do usuário para {@code null} (usuário_id = null)
     * antes de deletar, mantendo o registro histórico sem o vínculo.
     * <strong>Atenção:</strong> o DDL deve permitir {@code usuario_id NULL} na
     * tabela {@code vistoria} para que este modo funcione. Caso contrário, o
     * banco rejeitará com FK violation — o {@code GlobalExceptionHandler} trata
     * essa situação com HTTP 422 e mensagem legível.
     */
    @Transactional
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
            // Modo forçado: desvincula as vistorias antes de deletar
            vistoriaRepository.desvincularUsuario(id);
            log.warn("Vistorias do usuário {} desvinculadas (remoção forçada por Admin)", id);
        }

        log.info("Deletando usuário: {} ({}) | forcar={}", u.getEmail(), id, forcar);
        repository.deleteById(id);
    }

    private Usuario buscarEntidade(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado: " + id));
    }
}
