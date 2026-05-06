package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.LogFiscalizacaoRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LogFiscalizacaoResponseDTO;
import br.leetjourney.sgf_backend.service.LogFiscalizacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/logs")
public class LogFiscalizacaoController {

    private final LogFiscalizacaoService logService;

    public LogFiscalizacaoController(LogFiscalizacaoService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<List<LogFiscalizacaoResponseDTO>> listar(
            @RequestParam(required = false) UUID vistoriaId,
            @RequestParam(required = false) UUID itemId) {
        if (vistoriaId != null) {
            return ResponseEntity.ok(logService.listarPorVistoria(vistoriaId));
        }
        if (itemId != null) {
            return ResponseEntity.ok(logService.listarPorItem(itemId));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping
    public ResponseEntity<LogFiscalizacaoResponseDTO> criar(@Valid @RequestBody LogFiscalizacaoRequestDTO dto) {
        return ResponseEntity.status(201).body(logService.salvar(dto));
    }
}
