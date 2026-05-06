-- 1. Total de itens por classificação ABC em uma obra
SELECT
    c.tipo                          AS classificacao,
    COUNT(i.id)                     AS total_itens
FROM item i
         JOIN classificacao c ON c.id = i.classificacao_id
WHERE i.obra_id = 'a1b2c3d4-0001-0001-0001-000000000001'
GROUP BY c.tipo
ORDER BY c.tipo;

-- 2. Distribuição de status dos itens por obra
SELECT
    o.codigo                        AS obra,
    i.status                        AS status_item,
    COUNT(i.id)                     AS total
FROM item i
         JOIN obra o ON o.id = i.obra_id
GROUP BY o.codigo, i.status
ORDER BY o.codigo, i.status;

-- 3. Histórico de vistorias por obra com fiscal responsável
SELECT
    o.codigo                        AS obra,
    u.nome                          AS fiscal,
    v.data_hora,
    v.observacoes
FROM vistoria v
         JOIN obra o    ON o.id = v.obra_id
         JOIN usuario u ON u.id = v.usuario_id
ORDER BY v.data_hora DESC;

-- 4. Itens reprovados ou em vistoria por obra (atenção prioritária)
SELECT
    o.codigo                        AS obra,
    c.tipo                          AS classificacao,
    i.descricao                     AS item,
    i.status
FROM item i
         JOIN obra o          ON o.id = i.obra_id
         JOIN classificacao c ON c.id = i.classificacao_id
WHERE i.status IN ('REPROVADO', 'EM_VISTORIA')
ORDER BY c.tipo, o.codigo;

-- 5. Resumo executivo por obra para o dashboard
SELECT
    o.codigo,
    o.descricao,
    o.status                                                        AS status_obra,
    COUNT(i.id)                                                     AS total_itens,
    SUM(CASE WHEN i.status = 'APROVADO'    THEN 1 ELSE 0 END)      AS aprovados,
    SUM(CASE WHEN i.status = 'REPROVADO'   THEN 1 ELSE 0 END)      AS reprovados,
    SUM(CASE WHEN i.status = 'EM_VISTORIA' THEN 1 ELSE 0 END)      AS em_vistoria,
    SUM(CASE WHEN i.status = 'PENDENTE'    THEN 1 ELSE 0 END)      AS pendentes
FROM obra o
         LEFT JOIN item i ON i.obra_id = o.id
GROUP BY o.id, o.codigo, o.descricao, o.status
ORDER BY o.codigo;