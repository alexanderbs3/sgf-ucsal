package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.StatusItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LogFiscalizacaoRequestDTO(
        @NotNull  UUID vistoriaId,
        @NotNull  UUID itemId,
        @NotNull  UUID origemDadoId,
        @NotBlank String resultado,
        @NotNull  StatusItem statusItem
) {}
