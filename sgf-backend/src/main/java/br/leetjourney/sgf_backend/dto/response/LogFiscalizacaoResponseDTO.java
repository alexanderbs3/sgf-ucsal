package br.leetjourney.sgf_backend.dto.response;

import br.leetjourney.sgf_backend.model.LogFiscalizacao;

import java.time.LocalDateTime;
import java.util.UUID;

public record LogFiscalizacaoResponseDTO(
        UUID id,
        UUID vistoriaId,
        UUID itemId,
        String itemDescricao,
        UUID origemDadoId,
        String origemDadoDescricao,
        String origemDadoTipo,
        String resultado,
        String statusItem,
        LocalDateTime criadoEm
) {
    public static LogFiscalizacaoResponseDTO from(LogFiscalizacao l) {
        return new LogFiscalizacaoResponseDTO(
                l.getId(),
                l.getVistoria().getId(),
                l.getItem().getId(),
                l.getItem().getDescricao(),
                l.getOrigemDado().getId(),
                l.getOrigemDado().getDescricao(),
                l.getOrigemDado().getTipo(),
                l.getResultado(),
                l.getStatusItem() != null ? l.getStatusItem().name() : null,
                l.getCriadoEm()
        );
    }
}
