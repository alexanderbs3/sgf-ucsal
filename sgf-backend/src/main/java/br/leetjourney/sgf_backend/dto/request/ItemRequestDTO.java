package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.StatusItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ItemRequestDTO(
        @NotNull UUID obraId,
        @NotNull UUID classificacaoId,
        @NotBlank String descricao,
        @NotNull  StatusItem status
) {}
