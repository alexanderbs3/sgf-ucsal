package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.PapelUsuario;
import jakarta.validation.constraints.NotNull;

public record AtualizarPapelUsuarioDTO(
        @NotNull PapelUsuario papel
) {}
