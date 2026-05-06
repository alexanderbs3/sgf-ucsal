package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Usuario;

import java.time.LocalDateTime;
import java.util.UUID;

public record UsuarioResponseDTO(
        UUID          id,
        String        nome,
        String        email,
        String        papel,
        LocalDateTime criadoEm
) {
    public static UsuarioResponseDTO from(Usuario u) {
        return new UsuarioResponseDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPapel() != null ? u.getPapel().name() : null,
                u.getCriadoEm()
        );
    }
}
