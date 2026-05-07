package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository de AuditLog — somente insert (append-only).
 * Não expõe métodos de deleção herdados do JpaRepository na camada de serviço.
 * A interface mantém os métodos herdados para uso administrativo via console,
 * mas o AuditService nunca chama delete.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {}
