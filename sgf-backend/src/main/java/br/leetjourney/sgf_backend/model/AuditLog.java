package br.leetjourney.sgf_backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro imutável de toda ação relevante realizada no sistema.
 *
 * Motivação: LGPD Art. 37 exige que controladores de dados pessoais mantenham
 * registro das operações de tratamento. Em sistemas governamentais, audit logs
 * são obrigatórios para rastreabilidade e investigação forense.
 *
 * Design:
 * - Append-only: sem UPDATE nem DELETE nesta entidade.
 * - usuario pode ser null (ação de sistema ou usuário já removido).
 * - ip_origem armazenado para permitir correlação com logs de rede.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    public enum Acao {
        LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PATCH, ACESSO_NEGADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /** Usuário que realizou a ação. Nullable: ação de sistema ou usuário removido. */
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Acao acao;

    /** Nome da entidade afetada: "Obra", "Item", "Usuario", "Vistoria"... */
    @Column(nullable = false, length = 50)
    private String entidade;

    /** UUID da entidade afetada (nullable para ações genéricas como LOGIN). */
    @Column(name = "entidade_id")
    private UUID entidadeId;

    /** Descrição legível da ação para facilitar leitura humana dos logs. */
    @Column(columnDefinition = "TEXT")
    private String descricao;

    /** IP da requisição HTTP (IPv4 ou IPv6). */
    @Column(name = "ip_origem", length = 45)
    private String ipOrigem;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    // ── Construtor ────────────────────────────────────────────────────────────
    protected AuditLog() {}

    private AuditLog(Builder b) {
        this.usuarioId  = b.usuarioId;
        this.acao       = b.acao;
        this.entidade   = b.entidade;
        this.entidadeId = b.entidadeId;
        this.descricao  = b.descricao;
        this.ipOrigem   = b.ipOrigem;
    }

    // ── Getters (read-only — sem setters: entidade imutável) ──────────────────
    public UUID          getId()        { return id; }
    public UUID          getUsuarioId() { return usuarioId; }
    public Acao          getAcao()      { return acao; }
    public String        getEntidade()  { return entidade; }
    public UUID          getEntidadeId(){ return entidadeId; }
    public String        getDescricao() { return descricao; }
    public String        getIpOrigem()  { return ipOrigem; }
    public LocalDateTime getCriadoEm()  { return criadoEm; }

    // ── Builder ───────────────────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID   usuarioId;
        private Acao   acao;
        private String entidade;
        private UUID   entidadeId;
        private String descricao;
        private String ipOrigem;

        public Builder usuarioId(UUID v)  { this.usuarioId  = v; return this; }
        public Builder acao(Acao v)       { this.acao       = v; return this; }
        public Builder entidade(String v) { this.entidade   = v; return this; }
        public Builder entidadeId(UUID v) { this.entidadeId = v; return this; }
        public Builder descricao(String v){ this.descricao  = v; return this; }
        public Builder ipOrigem(String v) { this.ipOrigem   = v; return this; }
        public AuditLog build()           { return new AuditLog(this); }
    }
}
