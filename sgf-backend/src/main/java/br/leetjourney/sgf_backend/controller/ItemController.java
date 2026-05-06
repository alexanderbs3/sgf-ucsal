package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.AtualizarItemRequestDTO;
import br.leetjourney.sgf_backend.dto.request.AtualizarStatusItemDTO;
import br.leetjourney.sgf_backend.dto.request.ItemRequestDTO;
import br.leetjourney.sgf_backend.dto.response.ItemResponseDTO;
import br.leetjourney.sgf_backend.model.StatusItem;
import br.leetjourney.sgf_backend.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/itens")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    /**
     * GET /itens?obraId=&classificacao=A
     * Mantém compatibilidade com o frontend original (filtro simples por obraId + classe).
     */
    @GetMapping
    public ResponseEntity<List<ItemResponseDTO>> listar(
            @RequestParam UUID obraId,
            @RequestParam(required = false) Character classificacao) {
        if (classificacao != null) {
            return ResponseEntity.ok(itemService.listarPorObraEClassificacao(obraId, classificacao));
        }
        return ResponseEntity.ok(itemService.listarPorObra(obraId));
    }

    /**
     * GET /itens/buscar?obraId=&tipo=A&status=PENDENTE&q=concreto&sortBy=descricao&sortDir=asc
     * Filtro composto com ordenação dinâmica — alimenta a tabela do dashboard.
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ItemResponseDTO>> buscar(
            @RequestParam UUID obraId,
            @RequestParam(required = false) Character tipo,
            @RequestParam(required = false) StatusItem status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "descricao") String sortBy,
            @RequestParam(required = false, defaultValue = "asc")       String sortDir) {
        return ResponseEntity.ok(
                itemService.buscarComFiltros(obraId, tipo, status, q, sortBy, sortDir));
    }

    /** GET /itens/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ItemResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(itemService.buscarPorId(id));
    }

    /** POST /itens */
    @PostMapping
    public ResponseEntity<ItemResponseDTO> criar(@Valid @RequestBody ItemRequestDTO dto) {
        return ResponseEntity.status(201).body(itemService.salvar(dto));
    }

    /**
     * PUT /itens/{id}
     * Atualiza classificação e descrição de um item existente.
     * Status e obra não são alterados aqui — use PATCH /itens/{id}/status.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ItemResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarItemRequestDTO dto) {
        return ResponseEntity.ok(itemService.atualizar(id, dto));
    }

    /**
     * PATCH /itens/{id}/status
     * Atualiza o status do item com validação de transição de estado.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ItemResponseDTO> atualizarStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarStatusItemDTO dto) {
        return ResponseEntity.ok(itemService.atualizarStatus(id, dto));
    }

    /** DELETE /itens/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        itemService.deletar(id);  // bug original corrigido — service era ignorado
        return ResponseEntity.noContent().build();
    }
}
