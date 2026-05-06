package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Usuario;

import java.util.UUID;

public record LoginResponseDTO(
        String token,
        UUID   id,
        String nome,
        String email,
        String papel
) {
    public static LoginResponseDTO of(String token, Usuario u) {
        return new LoginResponseDTO(
                token,
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPapel().name()
        );
    }
}
