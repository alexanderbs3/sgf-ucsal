-- V6: Auditabilidade — coluna atualizado_em + tabela audit_log
--
-- PROBLEMA (auditoria v5): entidades mutáveis (obra, item, usuario) não tinham
-- timestamp de última modificação, impossibilitando rastreabilidade de alterações.
-- Além disso, o sistema não possuía nenhum registro de quem fez o quê e quando,
-- exigência básica de conformidade em sistemas governamentais (LGPD Art. 37).
--
-- SOLUÇÃO:
--   1. Adicionar coluna atualizado_em em obra, item, usuario.
--   2. Criar trigger PostgreSQL para atualizar automaticamente o campo.
--   3. Criar tabela audit_log com registro de ações (CREATE/UPDATE/DELETE/LOGIN).

-- ── Passo 1: coluna atualizado_em nas tabelas mutáveis ────────────────────────

ALTER TABLE obra
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT now();

ALTER TABLE item
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT now();

ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT now();

-- ── Passo 2: função + triggers para manter atualizado_em atualizado ───────────

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em obra
DROP TRIGGER IF EXISTS tg_obra_atualizado_em ON obra;
CREATE TRIGGER tg_obra_atualizado_em
    BEFORE UPDATE ON obra
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- Trigger em item
DROP TRIGGER IF EXISTS tg_item_atualizado_em ON item;
CREATE TRIGGER tg_item_atualizado_em
    BEFORE UPDATE ON item
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- Trigger em usuario
DROP TRIGGER IF EXISTS tg_usuario_atualizado_em ON usuario;
CREATE TRIGGER tg_usuario_atualizado_em
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- ── Passo 3: tabela de auditoria ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    usuario_id  UUID,                                    -- NULL = ação de sistema
    acao        VARCHAR(20) NOT NULL,                    -- LOGIN | CREATE | UPDATE | DELETE | PATCH
    entidade    VARCHAR(50) NOT NULL,                    -- Obra | Item | Usuario | Vistoria | ...
    entidade_id UUID,                                    -- UUID da entidade afetada
    descricao   TEXT,                                    -- resumo legível da ação
    ip_origem   VARCHAR(45),                             -- IPv4 ou IPv6
    criado_em   TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_log PRIMARY KEY (id),
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_audit_acao CHECK (
        acao IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'PATCH', 'ACESSO_NEGADO')
    )
);

COMMENT ON TABLE audit_log IS
    'Registro imutável de ações realizadas no sistema. '
    'Conforme LGPD Art. 37 — obrigação de manter registros de tratamento de dados.';

COMMENT ON COLUMN audit_log.usuario_id IS
    'Usuário que realizou a ação. NULL indica ação de sistema (ex: rotina automática).';

COMMENT ON COLUMN audit_log.ip_origem IS
    'IP da requisição HTTP. Armazenado para fins de investigação de incidentes.';

-- Índice para consultas por usuário (quem fez o quê)
CREATE INDEX IF NOT EXISTS idx_audit_usuario_id  ON audit_log(usuario_id);
-- Índice para consultas por entidade (o que aconteceu com X)
CREATE INDEX IF NOT EXISTS idx_audit_entidade     ON audit_log(entidade, entidade_id);
-- Índice temporal para relatórios de período
CREATE INDEX IF NOT EXISTS idx_audit_criado_em    ON audit_log(criado_em DESC);
