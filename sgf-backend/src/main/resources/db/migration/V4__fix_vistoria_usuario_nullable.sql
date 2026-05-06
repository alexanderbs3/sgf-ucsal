-- V4: Corrige a constraint de FK entre vistoria e usuario.
--
-- PROBLEMA: usuario_id era NOT NULL e a FK usava ON DELETE RESTRICT.
-- Isso impedia que o modo "forcar=true" do UsuarioService funcionasse,
-- pois o UPDATE vistoria SET usuario_id = NULL falhava com violação de NOT NULL,
-- e a FK RESTRICT bloqueava o DELETE mesmo com desvincularUsuario() chamado
-- dentro da mesma transação antes do delete.
--
-- SOLUÇÃO:
--   1. Remover a NOT NULL constraint da coluna usuario_id.
--   2. Recriar a FK com ON DELETE SET NULL — o banco desvincula automaticamente
--      quando um usuario é deletado, como fallback adicional de segurança.

-- Passo 1: permitir NULL na coluna
ALTER TABLE vistoria
    ALTER COLUMN usuario_id DROP NOT NULL;

-- Passo 2: remover a FK antiga (RESTRICT)
ALTER TABLE vistoria
    DROP CONSTRAINT IF EXISTS fk_vistoria_usuario;

-- Passo 3: recriar a FK com SET NULL — histórico preservado sem o vínculo
ALTER TABLE vistoria
    ADD CONSTRAINT fk_vistoria_usuario
        FOREIGN KEY (usuario_id)
            REFERENCES usuario (id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
