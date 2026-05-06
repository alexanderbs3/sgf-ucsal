package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.StatusObra;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ObraRequestDTO(
        @NotBlank String codigo,
        @NotBlank String descricao,
        @NotNull  LocalDate dataInicio,
                  LocalDate dataPrevisaoConclusao,
        @NotNull  StatusObra status
) {}
