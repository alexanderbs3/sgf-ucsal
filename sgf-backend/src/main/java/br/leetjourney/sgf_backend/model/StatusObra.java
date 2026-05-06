package br.leetjourney.sgf_backend.model;

/**
 * Status possíveis para uma Obra.
 * Deve estar em sincronia com o CHECK constraint do DDL:
 *   CHECK (status IN ('PLANEJADA', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA'))
 */
public enum StatusObra {
    PLANEJADA,
    EM_ANDAMENTO,
    PARALISADA,
    CONCLUIDA
}
