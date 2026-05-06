package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.StatusObra;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusObraDTO(
        @NotNull StatusObra status
) {}
