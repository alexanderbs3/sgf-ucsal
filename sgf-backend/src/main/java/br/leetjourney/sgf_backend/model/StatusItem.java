package br.leetjourney.sgf_backend.model;

/**
 * Status possíveis para um Item fiscalizado.
 * Sincronizado com CHECK constraint:
 *   CHECK (status IN ('PENDENTE', 'EM_VISTORIA', 'APROVADO', 'REPROVADO'))
 */
public enum StatusItem {
    PENDENTE,
    EM_VISTORIA,
    APROVADO,
    REPROVADO
}
