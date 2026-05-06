package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.response.ClassificacaoResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.repository.ClassificacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoint de lookup para classificações ABC.
 * Usado pelo frontend para popular selects de criação de itens.
 */
@RestController
@RequestMapping("/classificacoes")
public class ClassificacaoController {

    private final ClassificacaoRepository repository;

    public ClassificacaoController(ClassificacaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<ClassificacaoResponseDTO>> listar() {
        return ResponseEntity.ok(
                repository.findAll()
                        .stream()
                        .map(ClassificacaoResponseDTO::from)
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassificacaoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ClassificacaoResponseDTO.from(
                        repository.findById(id)
                                .orElseThrow(() -> new RecursoNaoEncontradoException(
                                        "Classificação não encontrada: " + id))
                )
        );
    }
}
