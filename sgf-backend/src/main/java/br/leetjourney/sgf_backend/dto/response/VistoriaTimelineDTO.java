package br.leetjourney.sgf_backend.dto.response;

/**
 * Projeção para o gráfico de frequência de vistorias por dia (timeline).
 * Retornada por VistoriaRepository.contarPorDia().
 */
public record VistoriaTimelineDTO(
        String data,   // formato "yyyy-MM-dd"
        long   total
) {}
