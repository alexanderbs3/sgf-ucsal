package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.AtualizarStatusObraDTO;
import br.leetjourney.sgf_backend.dto.request.ObraRequestDTO;
import br.leetjourney.sgf_backend.dto.response.DashboardObraDTO;
import br.leetjourney.sgf_backend.dto.response.ObraResponseDTO;
import br.leetjourney.sgf_backend.dto.response.VistoriaTimelineDTO;
import br.leetjourney.sgf_backend.model.StatusObra;
import br.leetjourney.sgf_backend.service.ObraService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/obras")
public class ObraController {

    private final ObraService obraService;

    public ObraController(ObraService obraService) {
        this.obraService = obraService;
    }

    /**
     * GET /obras
     * Retorna todas as obras (sem filtro) — mantém compatibilidade com o frontend atual.
     */
    @GetMapping
    public ResponseEntity<List<ObraResponseDTO>> listar() {
        return ResponseEntity.ok(obraService.listarTodas());
    }

    /**
     * GET /obras/buscar?q=escola&status=EM_ANDAMENTO
     * Busca com filtros opcionais de texto livre e status.
     * Separado do GET / para não quebrar clientes que não passam parâmetros.
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ObraResponseDTO>> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) StatusObra status) {
        return ResponseEntity.ok(obraService.buscarComFiltros(q, status));
    }

    /** GET /obras/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ObraResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(obraService.buscarPorId(id));
    }

    /** GET /obras/{id}/dashboard */
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<DashboardObraDTO> dashboard(@PathVariable UUID id) {
        return ResponseEntity.ok(obraService.gerarDashboard(id));
    }

    /**
     * GET /obras/{id}/timeline
     * Retorna a contagem de vistorias agrupada por dia para o gráfico de linha.
     */
    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<VistoriaTimelineDTO>> timeline(@PathVariable UUID id) {
        return ResponseEntity.ok(obraService.timelineVistorias(id));
    }

    /** POST /obras */
    @PostMapping
    public ResponseEntity<ObraResponseDTO> criar(@Valid @RequestBody ObraRequestDTO dto) {
        return ResponseEntity.status(201).body(obraService.salvar(dto));
    }

    /**
     * PUT /obras/{id}
     * Atualiza código, descrição e datas de uma obra existente.
     * O status não é alterado aqui — use PATCH /obras/{id}/status.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ObraResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ObraRequestDTO dto) {
        return ResponseEntity.ok(obraService.atualizar(id, dto));
    }

    /**
     * PATCH /obras/{id}/status
     * Atualiza apenas o status da obra, com validação de transição.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ObraResponseDTO> atualizarStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarStatusObraDTO dto) {
        return ResponseEntity.ok(obraService.atualizarStatus(id, dto));
    }

    /** DELETE /obras/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        obraService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
