package br.leetjourney.sgf_backend.exception;

/**
 * Tentativa de criação de recurso com identificador duplicado.
 * Mapeada para HTTP 409 Conflict.
 */
public class RecursoJaExisteException extends RuntimeException {
    public RecursoJaExisteException(String message) {
        super(message);
    }
}
