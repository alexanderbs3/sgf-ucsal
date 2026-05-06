package br.leetjourney.sgf_backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record VistoriaRequestDTO(
        @NotNull UUID obraId,
        @NotNull UUID usuarioId,
        @NotNull LocalDateTime dataHora,
        String observacoes
) {}