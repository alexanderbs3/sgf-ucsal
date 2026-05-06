package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.Vistoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record VistoriaResponseDTO(
        UUID id,
        UUID obraId,
        String obraCodigo,
        UUID usuarioId,
        String usuarioNome,
        LocalDateTime dataHora,
        String observacoes,
        LocalDateTime criadoEm
) {
    public static VistoriaResponseDTO from(Vistoria v) {
        return new VistoriaResponseDTO(
                v.getId(),
                v.getObra().getId(),
                v.getObra().getCodigo(),
                // usuario pode ser null após remoção forçada de um fiscal
                v.getUsuario() != null ? v.getUsuario().getId()   : null,
                v.getUsuario() != null ? v.getUsuario().getNome() : "[Usuário removido]",
                v.getDataHora(),
                v.getObservacoes(),
                v.getCriadoEm()
        );
    }
}