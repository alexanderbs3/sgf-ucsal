package br.leetjourney.sgf_backend.dto.request;

import br.leetjourney.sgf_backend.model.PapelUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UsuarioRequestDTO(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotNull  PapelUsuario papel
) {}
