package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Obra;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ObraResponseDTO(
        UUID id,
        String codigo,
        String descricao,
        LocalDate dataInicio,
        LocalDate dataPrevisaoConclusao,
        String status,
        LocalDateTime criadoEm
) {
    public static ObraResponseDTO from(Obra obra) {
        return new ObraResponseDTO(
                obra.getId(),
                obra.getCodigo(),
                obra.getDescricao(),
                obra.getDataInicio(),
                obra.getDataPrevisaoConclusao(),
                obra.getStatus() != null ? obra.getStatus().name() : null,
                obra.getCriadoEm()
        );
    }
}
