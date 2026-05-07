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
    //
    // CORREÇÃO v6: a v5 verificava o nome da FK por string literal ("fk_vistoria_usuario"),
    // o que era frágil — renomear a constraint em uma migration quebraria silenciosamente.
    // Agora usamos o SQLState do PostgreSQL:
    //   23503 = foreign_key_violation
    //   23505 = unique_violation
    // Estes códigos são estáveis e definidos pelo padrão SQL/PostgreSQL.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegridade(DataIntegrityViolationException ex) {
        String causa   = ex.getMostSpecificCause().getMessage();
        String sqlState = extrairSqlState(ex);
        String mensagem;

        if ("23503".equals(sqlState)) {
            // FK violation — detecta a entidade pelo nome da tabela na mensagem
            if (causa != null && causa.contains("vistoria")) {
                mensagem = "Este usuário possui vistorias vinculadas e não pode ser excluído. "
                         + "Use a opção de remoção forçada (Admin) para desvincular.";
            } else if (causa != null && causa.contains("item")) {
                mensagem = "Esta obra possui itens vinculados e não pode ser excluída.";
            } else {
                mensagem = "Operação bloqueada: existem registros dependentes vinculados a este recurso.";
            }
        } else if ("23505".equals(sqlState)) {
            // Unique violation — a mensagem do Spring já trata isso via RecursoJaExisteException,
            // mas mantemos aqui como fallback para constraints não verificadas antecipadamente.
            mensagem = "Já existe um registro com os mesmos dados únicos (ex: e-mail ou código).";
        } else {
            mensagem = "Violação de integridade de dados.";
        }

        log.warn("DataIntegrityViolation [SQLState={}]: {}", sqlState, causa);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(erro(422, mensagem));
    }

    /**
     * Extrai o SQLState da cadeia de causas da exceção.
     * O SQLState é um código de 5 dígitos definido pelo padrão SQL — mais estável
     * que verificar nomes de constraints por string.
     */
    private String extrairSqlState(DataIntegrityViolationException ex) {
        Throwable cause = ex.getMostSpecificCause();
        // PSQLException implementa SQLException que expõe getSQLState()
        if (cause instanceof java.sql.SQLException sqlEx) {
            return sqlEx.getSQLState();
        }
        return null;
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
