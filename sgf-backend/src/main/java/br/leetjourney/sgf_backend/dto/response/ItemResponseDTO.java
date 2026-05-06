package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Item;

import java.time.LocalDateTime;
import java.util.UUID;

public record ItemResponseDTO(
        UUID id,
        UUID obraId,
        String obraDescricao,
        UUID classificacaoId,
        Character classificacaoTipo,
        String classificacaoCriterio,
        String descricao,
        String status,
        LocalDateTime criadoEm
) {
    public static ItemResponseDTO from(Item item) {
        return new ItemResponseDTO(
                item.getId(),
                item.getObra().getId(),
                item.getObra().getDescricao(),
                item.getClassificacao().getId(),
                item.getClassificacao().getTipo(),
                item.getClassificacao().getCriterio(),
                item.getDescricao(),
                item.getStatus() != null ? item.getStatus().name() : null,
                item.getCriadoEm()
        );
    }
}
