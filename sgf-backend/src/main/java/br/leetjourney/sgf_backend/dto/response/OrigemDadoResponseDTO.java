package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.OrigemDado;

import java.util.UUID;

public record OrigemDadoResponseDTO(
        UUID   id,
        String descricao,
        String tipo
) {
    public static OrigemDadoResponseDTO from(OrigemDado o) {
        return new OrigemDadoResponseDTO(o.getId(), o.getDescricao(), o.getTipo());
    }
}
