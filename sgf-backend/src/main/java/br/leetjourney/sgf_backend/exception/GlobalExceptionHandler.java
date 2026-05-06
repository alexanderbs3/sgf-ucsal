package br.leetjourney.sgf_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 404 ──────────────────────────────────────────────────────────────────
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        log.warn("Recurso não encontrado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(erro(404, ex.getMessage()));
    }

    // ── 409 ──────────────────────────────────────────────────────────────────
    @ExceptionHandler(RecursoJaExisteException.class)
    public ResponseEntity<Map<String, Object>> handleConflito(RecursoJaExisteException ex) {
        log.warn("Conflito de recurso: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(erro(409, ex.getMessage()));
    }

    // ── 422 ──────────────────────────────────────────────────────────────────
    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<Map<String, Object>> handleRegra(RegraDeNegocioException ex) {
        log.warn("Regra de negócio violada: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(erro(422, ex.getMessage()));
    }

    // ── 400 — Bean Validation ─────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidacao(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce("", (a, b) -> a.isEmpty() ? b : a + " | " + b);
        log.warn("Validação falhou: {}", mensagem);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro(400, mensagem));
    }

    // ── 400 — Parâmetro de tipo errado (ex: UUID inválido) ───────────────────
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String mensagem = "Parâmetro inválido: '" + ex.getName() + "' = '" + ex.getValue() + "'";
        log.warn("Type mismatch: {}", mensagem);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro(400, mensagem));
    }

    // ── 400 — Body ausente ou malformado ─────────────────────────────────────
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBodyAusente(HttpMessageNotReadableException ex) {
        log.warn("Body ausente ou malformado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(erro(400, "Body da requisição ausente ou malformado"));
    }

    // ── 400 — Query param obrigatório ausente ─────────────────────────────────
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleParamAusente(MissingServletRequestParameterException ex) {
        String mensagem = "Parâmetro obrigatório ausente: '" + ex.getParameterName() + "'";
        log.warn(mensagem);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro(400, mensagem));
    }

    // ── 422 — Violação de integridade referencial do banco ─────────────────────
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegridade(DataIntegrityViolationException ex) {
        String causa = ex.getMostSpecificCause().getMessage();
        String mensagem;
        if (causa != null && causa.contains("fk_vistoria_usuario")) {
            mensagem = "Este usuário possui vistorias vinculadas e não pode ser excluído.";
        } else if (causa != null && causa.contains("fk_")) {
            mensagem = "Operação bloqueada: existem registros dependentes vinculados a este recurso.";
        } else {
            mensagem = "Violação de integridade de dados.";
        }
        log.warn("DataIntegrityViolation: {}", causa);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(erro(422, mensagem));
    }

    // ── 500 ──────────────────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeral(Exception ex) {
        log.error("Erro interno não tratado: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(erro(500, "Erro interno do servidor"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    private Map<String, Object> erro(int status, String mensagem) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("mensagem", mensagem);
        body.put("timestamp", LocalDateTime.now().toString());
        return body;
    }
}
