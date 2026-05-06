-- V3: Índices de performance + constraints adicionais
-- Aplicado após V1 (DDL) e V2 (seed data).

-- ── Obra ─────────────────────────────────────────────────────────────────────
-- Acelera filtro por status (GET /obras/buscar?status=EM_ANDAMENTO)
CREATE INDEX IF NOT EXISTS idx_obra_status ON obra(status);

-- Acelera busca case-insensitive em codigo e descricao (LOWER LIKE)
CREATE INDEX IF NOT EXISTS idx_obra_codigo_lower     ON obra(LOWER(codigo));
CREATE INDEX IF NOT EXISTS idx_obra_descricao_gin    ON obra USING gin(to_tsvector('portuguese', descricao));

-- ── Item ─────────────────────────────────────────────────────────────────────
-- Acelera listagem de itens por obra (query mais frequente)
CREATE INDEX IF NOT EXISTS idx_item_obra_id          ON item(obra_id);
-- Acelera filtro composto obra + status (tabela do dashboard)
CREATE INDEX IF NOT EXISTS idx_item_obra_status      ON item(obra_id, status);
-- Acelera filtro por classificação + obra
CREATE INDEX IF NOT EXISTS idx_item_obra_classif     ON item(obra_id, classificacao_id);

-- ── Vistoria ──────────────────────────────────────────────────────────────────
-- Acelera listagem e timeline por obra
CREATE INDEX IF NOT EXISTS idx_vistoria_obra_id      ON vistoria(obra_id);
-- Acelera ordenação por data (timeline DESC)
CREATE INDEX IF NOT EXISTS idx_vistoria_data_hora    ON vistoria(data_hora DESC);
-- Índice composto para a query de timeline agrupada por dia
CREATE INDEX IF NOT EXISTS idx_vistoria_obra_data    ON vistoria(obra_id, data_hora);

-- ── Log de Fiscalização ───────────────────────────────────────────────────────
-- Acelera lookup por vistoria e por item
CREATE INDEX IF NOT EXISTS idx_log_vistoria_id       ON log_fiscalizacao(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_log_item_id           ON log_fiscalizacao(item_id);

-- ── Comentário de auditoria ───────────────────────────────────────────────────
COMMENT ON INDEX idx_obra_status      IS 'Filtro por status em GET /obras/buscar';
COMMENT ON INDEX idx_item_obra_status IS 'Filtro composto obra+status na tabela do dashboard';
COMMENT ON INDEX idx_vistoria_obra_data IS 'Timeline de vistorias agrupada por dia';
