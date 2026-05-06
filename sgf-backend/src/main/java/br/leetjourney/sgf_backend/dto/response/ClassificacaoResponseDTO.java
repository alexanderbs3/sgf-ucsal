package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Classificacao;

import java.util.UUID;

public record ClassificacaoResponseDTO(
        UUID      id,
        Character tipo,
        String    criterio
) {
    public static ClassificacaoResponseDTO from(Classificacao c) {
        return new ClassificacaoResponseDTO(c.getId(), c.getTipo(), c.getCriterio());
    }
}
