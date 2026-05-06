-- classificacao
INSERT INTO classificacao (id, tipo, criterio) VALUES
                                                   (gen_random_uuid(), 'A', 'Itens de alto impacto: comprometem estrutura ou segurança da obra'),
                                                   (gen_random_uuid(), 'B', 'Itens de impacto intermediário: afetam funcionalidade sem risco imediato'),
                                                   (gen_random_uuid(), 'C', 'Itens de baixo impacto: acabamento e itens estéticos');

-- origem_dado
INSERT INTO origem_dado (id, descricao, tipo) VALUES
                                                  (gen_random_uuid(), 'Medição de campo realizada pelo fiscal', 'MEDICAO_CAMPO'),
                                                  (gen_random_uuid(), 'Registro fotográfico da vistoria', 'REGISTRO_FOTOGRAFICO'),
                                                  (gen_random_uuid(), 'Cronograma físico-financeiro', 'CRONOGRAMA'),
                                                  (gen_random_uuid(), 'Parecer técnico emitido', 'PARECER_TECNICO');

-- usuario
INSERT INTO usuario (id, nome, email, papel) VALUES
                                                 (gen_random_uuid(), 'Carlos Andrade', 'carlos.andrade@ucsal.br', 'FISCAL'),
                                                 (gen_random_uuid(), 'Marina Costa', 'marina.costa@ucsal.br', 'GESTOR'),
                                                 (gen_random_uuid(), 'Admin SGF', 'admin@sgf.br', 'ADMIN');

-- obra
INSERT INTO obra (id, codigo, descricao, data_inicio, data_previsao_conclusao, status) VALUES
                                                                                           ('a1b2c3d4-0001-0001-0001-000000000001', 'OBR-2024-001', 'Construção de escola municipal no bairro Itapuã', '2024-01-15', '2024-12-31', 'EM_ANDAMENTO'),
                                                                                           ('a1b2c3d4-0002-0002-0002-000000000002', 'OBR-2024-002', 'Pavimentação da Rua das Flores', '2024-03-01', '2024-09-30', 'PARALISADA'),
                                                                                           ('a1b2c3d4-0003-0003-0003-000000000003', 'OBR-2023-001', 'Reforma do posto de saúde central', '2023-06-01', '2023-12-31', 'CONCLUIDA');

-- item (referenciando obra OBR-2024-001)
INSERT INTO item (id, obra_id, classificacao_id, descricao, status)
SELECT
    gen_random_uuid(),
    'a1b2c3d4-0001-0001-0001-000000000001',
    c.id,
    desc_item,
    status_item
FROM (VALUES
          ('Fundação e estrutura de concreto', 'EM_VISTORIA'),
          ('Instalações elétricas internas', 'PENDENTE'),
          ('Revestimento de fachada', 'PENDENTE')
     ) AS dados(desc_item, status_item)
         CROSS JOIN (SELECT id FROM classificacao WHERE tipo = 'A' LIMIT 1) c;

INSERT INTO item (id, obra_id, classificacao_id, descricao, status)
SELECT
    gen_random_uuid(),
    'a1b2c3d4-0001-0001-0001-000000000001',
    c.id,
    desc_item,
    status_item
FROM (VALUES
          ('Esquadrias e janelas', 'PENDENTE'),
          ('Instalações hidráulicas', 'EM_VISTORIA')
     ) AS dados(desc_item, status_item)
         CROSS JOIN (SELECT id FROM classificacao WHERE tipo = 'B' LIMIT 1) c;

INSERT INTO item (id, obra_id, classificacao_id, descricao, status)
SELECT
    gen_random_uuid(),
    'a1b2c3d4-0001-0001-0001-000000000001',
    c.id,
    desc_item,
    status_item
FROM (VALUES
          ('Pintura interna', 'PENDENTE'),
          ('Paisagismo externo', 'PENDENTE')
     ) AS dados(desc_item, status_item)
         CROSS JOIN (SELECT id FROM classificacao WHERE tipo = 'C' LIMIT 1) c;

-- vistoria
INSERT INTO vistoria (id, obra_id, usuario_id, data_hora, observacoes)
SELECT
    'b2c3d4e5-0001-0001-0001-000000000001',
    'a1b2c3d4-0001-0001-0001-000000000001',
    u.id,
    '2024-04-10 09:00:00',
    'Primeira vistoria de acompanhamento. Estrutura em conformidade.'
FROM usuario u WHERE u.email = 'carlos.andrade@ucsal.br';

-- log_fiscalizacao
INSERT INTO log_fiscalizacao (id, vistoria_id, item_id, origem_dado_id, resultado, status_item)
SELECT
    gen_random_uuid(),
    'b2c3d4e5-0001-0001-0001-000000000001',
    i.id,
    o.id,
    'Item inspecionado. Estrutura de concreto dentro dos parâmetros técnicos.',
    'APROVADO'
FROM item i
         CROSS JOIN (SELECT id FROM origem_dado WHERE tipo = 'MEDICAO_CAMPO' LIMIT 1) o
WHERE i.descricao = 'Fundação e estrutura de concreto'
    LIMIT 1;