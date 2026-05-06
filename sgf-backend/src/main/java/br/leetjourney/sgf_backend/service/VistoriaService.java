package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.VistoriaRequestDTO;
import br.leetjourney.sgf_backend.dto.response.VistoriaResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.model.Vistoria;
import br.leetjourney.sgf_backend.repository.ObraRepository;
import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class VistoriaService {

    private static final Logger log = LoggerFactory.getLogger(VistoriaService.class);

    private final VistoriaRepository vistoriaRepository;
    private final ObraRepository     obraRepository;
    private final UsuarioRepository  usuarioRepository;

    public VistoriaService(VistoriaRepository vistoriaRepository,
                           ObraRepository obraRepository,
                           UsuarioRepository usuarioRepository) {
        this.vistoriaRepository = vistoriaRepository;
        this.obraRepository     = obraRepository;
        this.usuarioRepository  = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<VistoriaResponseDTO> listarPorObra(UUID obraId) {
        // Verifica existência da obra antes de listar
        if (!obraRepository.existsById(obraId)) {
            throw new RecursoNaoEncontradoException("Obra não encontrada: " + obraId);
        }
        return vistoriaRepository.findByObraId(obraId)
                .stream()
                .map(VistoriaResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VistoriaResponseDTO buscarPorId(UUID id) {
        return VistoriaResponseDTO.from(buscarEntidade(id));
    }

    @Transactional
    public VistoriaResponseDTO salvar(VistoriaRequestDTO dto) {
        Vistoria vistoria = new Vistoria();
        vistoria.setObra(obraRepository.findById(dto.obraId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Obra não encontrada: " + dto.obraId())));
        vistoria.setUsuario(usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado: " + dto.usuarioId())));
        vistoria.setDataHora(dto.dataHora());
        vistoria.setObservacoes(dto.observacoes());
        log.info("Criando vistoria para obra: {}", dto.obraId());
        return VistoriaResponseDTO.from(vistoriaRepository.save(vistoria));
    }

    private Vistoria buscarEntidade(UUID id) {
        return vistoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Vistoria não encontrada: " + id));
    }
}
