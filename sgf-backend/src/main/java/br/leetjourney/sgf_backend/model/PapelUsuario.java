package br.leetjourney.sgf_backend.model;

/**
 * Papéis de acesso no sistema SGF.
 * Sincronizado com CHECK constraint: CHECK (papel IN ('FISCAL', 'GESTOR', 'ADMIN'))
 */
public enum PapelUsuario {
    FISCAL,
    GESTOR,
    ADMIN
}
