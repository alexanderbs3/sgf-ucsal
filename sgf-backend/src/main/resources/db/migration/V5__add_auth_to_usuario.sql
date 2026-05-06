-- V5: Adiciona autenticação real ao sistema.
--
-- Antes desta migration, o "login" era apenas selecionar um usuário
-- em uma lista — sem senha, sem token, sem proteção real.
-- Esta migration adiciona a coluna `senha_hash` (BCrypt) à tabela usuario.
--
-- ATENÇÃO: o campo é nullable para não quebrar registros seed existentes.
-- O seed V2 será mantido como está; o AuthService impede login de usuários
-- sem senha definida, retornando 401 com mensagem orientativa.
-- Use o endpoint POST /auth/definir-senha para definir a senha inicial.

ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);

COMMENT ON COLUMN usuario.senha_hash IS
    'Hash BCrypt da senha do usuário. NULL = usuário seed sem senha definida ainda.';
