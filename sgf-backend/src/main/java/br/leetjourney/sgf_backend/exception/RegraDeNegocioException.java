package br.leetjourney.sgf_backend.exception;

/**
 * Violação de regra de negócio — mapeada para HTTP 422 Unprocessable Entity.
 * Exemplos: transição de status inválida, obra já concluída sendo editada.
 */
public class RegraDeNegocioException extends RuntimeException {
    public RegraDeNegocioException(String message) {
        super(message);
    }
}
