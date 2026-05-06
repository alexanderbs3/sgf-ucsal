CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- classificacao
CREATE TABLE classificacao (
                               id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                               tipo        CHAR(1)     NOT NULL,
                               criterio    TEXT        NOT NULL,
                               CONSTRAINT pk_classificacao PRIMARY KEY (id),
                               CONSTRAINT ck_classificacao_tipo CHECK (tipo IN ('A', 'B', 'C'))
);

-- origem_dado
CREATE TABLE origem_dado (
                             id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                             descricao   VARCHAR(100) NOT NULL,
                             tipo        VARCHAR(50)  NOT NULL,
                             CONSTRAINT pk_origem_dado PRIMARY KEY (id)
);

-- usuario
CREATE TABLE usuario (
                         id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                         nome        VARCHAR(100) NOT NULL,
                         email       VARCHAR(100) NOT NULL,
                         papel       VARCHAR(30)  NOT NULL,
                         criado_em   TIMESTAMP   NOT NULL DEFAULT now(),
                         CONSTRAINT pk_usuario    PRIMARY KEY (id),
                         CONSTRAINT uq_usuario_email UNIQUE (email),
                         CONSTRAINT ck_usuario_papel CHECK (papel IN ('FISCAL', 'GESTOR', 'ADMIN'))
);

-- obra
CREATE TABLE obra (
                      id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
                      codigo                  VARCHAR(30) NOT NULL,
                      descricao               TEXT        NOT NULL,
                      data_inicio             DATE        NOT NULL,
                      data_previsao_conclusao DATE,
                      status                  VARCHAR(30) NOT NULL,
                      criado_em               TIMESTAMP   NOT NULL DEFAULT now(),
                      CONSTRAINT pk_obra      PRIMARY KEY (id),
                      CONSTRAINT uq_obra_codigo UNIQUE (codigo),
                      CONSTRAINT ck_obra_status CHECK (status IN ('PLANEJADA', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA'))
);

-- item
CREATE TABLE item (
                      id                UUID        NOT NULL DEFAULT gen_random_uuid(),
                      obra_id           UUID        NOT NULL,
                      classificacao_id  UUID        NOT NULL,
                      descricao         TEXT        NOT NULL,
                      status            VARCHAR(30) NOT NULL,
                      criado_em         TIMESTAMP   NOT NULL DEFAULT now(),
                      CONSTRAINT pk_item          PRIMARY KEY (id),
                      CONSTRAINT fk_item_obra     FOREIGN KEY (obra_id)
                          REFERENCES obra(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                      CONSTRAINT fk_item_classif  FOREIGN KEY (classificacao_id)
                          REFERENCES classificacao(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                      CONSTRAINT ck_item_status   CHECK (status IN ('PENDENTE', 'EM_VISTORIA', 'APROVADO', 'REPROVADO'))
);

-- vistoria
CREATE TABLE vistoria (
                          id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                          obra_id     UUID        NOT NULL,
                          usuario_id  UUID        NOT NULL,
                          data_hora   TIMESTAMP   NOT NULL,
                          observacoes TEXT,
                          criado_em   TIMESTAMP   NOT NULL DEFAULT now(),
                          CONSTRAINT pk_vistoria          PRIMARY KEY (id),
                          CONSTRAINT fk_vistoria_obra     FOREIGN KEY (obra_id)
                              REFERENCES obra(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                          CONSTRAINT fk_vistoria_usuario  FOREIGN KEY (usuario_id)
                              REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- log_fiscalizacao
CREATE TABLE log_fiscalizacao (
                                  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
                                  vistoria_id     UUID        NOT NULL,
                                  item_id         UUID        NOT NULL,
                                  origem_dado_id  UUID        NOT NULL,
                                  resultado       TEXT        NOT NULL,
                                  status_item     VARCHAR(30) NOT NULL,
                                  criado_em       TIMESTAMP   NOT NULL DEFAULT now(),
                                  CONSTRAINT pk_log_fiscalizacao          PRIMARY KEY (id),
                                  CONSTRAINT fk_log_vistoria              FOREIGN KEY (vistoria_id)
                                      REFERENCES vistoria(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                                  CONSTRAINT fk_log_item                  FOREIGN KEY (item_id)
                                      REFERENCES item(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                                  CONSTRAINT fk_log_origem_dado           FOREIGN KEY (origem_dado_id)
                                      REFERENCES origem_dado(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                                  CONSTRAINT ck_log_status_item CHECK (status_item IN ('PENDENTE', 'EM_VISTORIA', 'APROVADO', 'REPROVADO'))
);