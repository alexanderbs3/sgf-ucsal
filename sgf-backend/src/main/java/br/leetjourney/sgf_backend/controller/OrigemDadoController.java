package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.response.OrigemDadoResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.repository.OrigemDadoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoint de lookup para origens de dado.
 * Usado pelo frontend para popular selects no formulário de log de fiscalização.
 */
@RestController
@RequestMapping("/origens-dado")
public class OrigemDadoController {

    private final OrigemDadoRepository repository;

    public OrigemDadoController(OrigemDadoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<OrigemDadoResponseDTO>> listar() {
        return ResponseEntity.ok(
                repository.findAll()
                        .stream()
                        .map(OrigemDadoResponseDTO::from)
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrigemDadoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(
                OrigemDadoResponseDTO.from(
                        repository.findById(id)
                                .orElseThrow(() -> new RecursoNaoEncontradoException(
                                        "Origem de dado não encontrada: " + id))
                )
        );
    }
}
