package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.AtualizarItemRequestDTO;
import br.leetjourney.sgf_backend.dto.request.AtualizarStatusItemDTO;
import br.leetjourney.sgf_backend.dto.request.ItemRequestDTO;
import br.leetjourney.sgf_backend.dto.response.ItemResponseDTO;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.model.Item;
import br.leetjourney.sgf_backend.model.StatusItem;
import br.leetjourney.sgf_backend.repository.ClassificacaoRepository;
import br.leetjourney.sgf_backend.repository.ItemRepository;
import br.leetjourney.sgf_backend.repository.ObraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ItemService {

    private static final Logger log = LoggerFactory.getLogger(ItemService.class);

    /**
     * Máquina de estados de StatusItem.
     * PENDENTE → EM_VISTORIA → APROVADO | REPROVADO → EM_VISTORIA (retrabalho)
     */
    private static final Map<StatusItem, Set<StatusItem>> TRANSICOES_VALIDAS = Map.of(
            StatusItem.PENDENTE,    EnumSet.of(StatusItem.EM_VISTORIA),
            StatusItem.EM_VISTORIA, EnumSet.of(StatusItem.APROVADO, StatusItem.REPROVADO),
            StatusItem.APROVADO,    EnumSet.of(StatusItem.EM_VISTORIA),   // reinspeção
            StatusItem.REPROVADO,   EnumSet.of(StatusItem.EM_VISTORIA)    // retrabalho
    );

    private final ItemRepository          itemRepository;
    private final ObraRepository          obraRepository;
    private final ClassificacaoRepository classificacaoRepository;

    public ItemService(ItemRepository itemRepository,
                       ObraRepository obraRepository,
                       ClassificacaoRepository classificacaoRepository) {
        this.itemRepository          = itemRepository;
        this.obraRepository          = obraRepository;
        this.classificacaoRepository = classificacaoRepository;
    }

    // ── Listagem simples ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ItemResponseDTO> listarPorObra(UUID obraId) {
        return itemRepository.findByObraId(obraId)
                .stream()
                .map(ItemResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDTO> listarPorObraEClassificacao(UUID obraId, Character tipo) {
        return itemRepository.findByObraIdAndClassificacaoTipo(obraId, tipo)
                .stream()
                .map(ItemResponseDTO::from)
                .toList();
    }

    // ── Listagem com filtros compostos ────────────────────────────────────────

    /**
     * Filtro composto: obra obrigatória + tipo de classificação + status + busca
     * por descrição, com ordenação dinâmica.
     *
     * @param obraId   obrigatório
     * @param tipo     filtro por classe ABC (nullable)
     * @param status   filtro por status (nullable)
     * @param q        busca por descrição (nullable)
     * @param sortBy   campo de ordenação — "descricao" | "status" | "classificacaoTipo"
     * @param sortDir  "asc" | "desc"
     */
    @Transactional(readOnly = true)
    public List<ItemResponseDTO> buscarComFiltros(UUID obraId,
                                                   Character tipo,
                                                   StatusItem status,
                                                   String q,
                                                   String sortBy,
                                                   String sortDir) {
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        // Mapeia os campos do frontend para os campos JPQL do model
        String campo = switch (sortBy == null ? "descricao" : sortBy) {
            case "status"            -> "status";
            case "classificacaoTipo" -> "classificacao.tipo";
            default                  -> "descricao";
        };

        Sort sort = Sort.by(dir, campo);

        return itemRepository.buscarComFiltros(
                        obraId,
                        tipo,
                        status,
                        (q != null && q.isBlank()) ? null : q,
                        sort
                )
                .stream()
                .map(ItemResponseDTO::from)
                .toList();
    }

    // ── Busca por ID ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ItemResponseDTO buscarPorId(UUID id) {
        return ItemResponseDTO.from(buscarEntidade(id));
    }

    // ── Atualização completa (PUT) ────────────────────────────────────────────

    /**
     * Atualiza classificação e descrição de um item.
     * Obra e status não são alterados — cada um tem endpoint dedicado.
     */
    @Transactional
    public ItemResponseDTO atualizar(UUID id, AtualizarItemRequestDTO dto) {
        Item item = buscarEntidade(id);
        item.setClassificacao(classificacaoRepository.findById(dto.classificacaoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Classificação não encontrada: " + dto.classificacaoId())));
        item.setDescricao(dto.descricao());
        log.info("Item {} atualizado: descrição={}", id, dto.descricao());
        return ItemResponseDTO.from(itemRepository.save(item));
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public ItemResponseDTO salvar(ItemRequestDTO dto) {
        Item item = new Item();
        item.setObra(obraRepository.findById(dto.obraId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Obra não encontrada: " + dto.obraId())));
        item.setClassificacao(classificacaoRepository.findById(dto.classificacaoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Classificação não encontrada: " + dto.classificacaoId())));
        item.setDescricao(dto.descricao());
        item.setStatus(dto.status());
        log.info("Criando item para obra: {}", dto.obraId());
        return ItemResponseDTO.from(itemRepository.save(item));
    }

    // ── Atualização de status (PATCH) ─────────────────────────────────────────

    @Transactional
    public ItemResponseDTO atualizarStatus(UUID id, AtualizarStatusItemDTO dto) {
        Item item   = buscarEntidade(id);
        StatusItem atual = item.getStatus();
        StatusItem novo  = dto.status();

        if (atual == novo) {
            return ItemResponseDTO.from(item); // idempotente
        }

        Set<StatusItem> permitidos = TRANSICOES_VALIDAS.getOrDefault(atual, Set.of());
        if (!permitidos.contains(novo)) {
            throw new RegraDeNegocioException(
                    "Transição de status inválida para o item: " + atual + " → " + novo
                    + ". Permitidos a partir de " + atual + ": " + permitidos);
        }

        item.setStatus(novo);
        log.info("Status do item {} atualizado: {} → {}", id, atual, novo);
        return ItemResponseDTO.from(itemRepository.save(item));
    }

    // ── Exclusão ──────────────────────────────────────────────────────────────

    @Transactional
    public void deletar(UUID id) {
        Item item = buscarEntidade(id);
        if (item.getStatus() == StatusItem.APROVADO) {
            throw new RegraDeNegocioException(
                    "Não é permitido excluir um item já APROVADO.");
        }
        log.info("Deletando item: {}", id);
        itemRepository.deleteById(id);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Item buscarEntidade(UUID id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item não encontrado: " + id));
    }
}
