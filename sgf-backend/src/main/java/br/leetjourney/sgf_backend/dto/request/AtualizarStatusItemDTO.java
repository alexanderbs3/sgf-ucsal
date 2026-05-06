package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.StatusItem;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusItemDTO(
        @NotNull StatusItem status
) {}
