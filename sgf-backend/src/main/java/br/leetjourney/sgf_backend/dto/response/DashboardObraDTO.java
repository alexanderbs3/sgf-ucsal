package br.leetjourney.sgf_backend.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record DashboardObraDTO(
        UUID   obraId,
        String codigo,
        String descricao,
        String statusObra,
        LocalDate dataInicio,
        LocalDate dataPrevisaoConclusao,
        long   totalItens,
        long   aprovados,
        long   reprovados,
        long   emVistoria,
        long   pendentes,
        long   itensClasseA,
        long   itensClasseB,
        long   itensClasseC,
        int    percentualAprovacao
) {}
