# Nota Técnica — Semana 1
**Projeto:** Sistema de Gestão de Fiscalização (SGF)
**Orientando:** Alexander
**Data:** [coloque a data de hoje]
**Sprint:** S1 — Domínio e Backlog

---

## O que foi implementado

Nesta semana foi realizada a etapa de modelagem conceitual do domínio do SGF.
As seguintes entregas foram produzidas:

- Glossário do domínio com 10 termos formalmente definidos
- Diagrama Entidade-Relacionamento (DER) conceitual com 6 entidades e cardinalidades
- Modelo lógico com chaves primárias, estrangeiras e atributos de cada tabela
- Repositório Git inicializado com estrutura de pastas organizada
- Issues abertas no repositório para as entregas da S2

## Decisões técnicas tomadas

**Classificação ABC por criticidade técnica qualitativa**
O minimundo do SGF não define um critério quantitativo para a Curva ABC.
Decidiu-se adotar classificação qualitativa baseada em criticidade técnica do item
fiscalizado: Classe A (alto impacto/risco estrutural ou legal), Classe B (impacto
moderado), Classe C (baixo impacto). A classificação é atribuída pelo fiscal no
momento do cadastro do item. Decisão passível de revisão em checkpoint.

**Classificação como tabela de domínio, não ENUM no banco**
Optou-se por modelar `classificacao` como entidade própria em vez de ENUM direto
no banco de dados. Justificativa: permite agrupamento, contagem e filtragem via
SQL nas consultas do dashboard sem conversão de tipo, e facilita eventual expansão
dos critérios de classificação sem alteração de schema.

**Responsável técnico como atributo simples em `obra`**
O responsável técnico foi modelado como atributo VARCHAR em `obra` e não como
entidade separada. Justificativa: o minimundo não indica que o responsável técnico
interage com o sistema como usuário autenticado. Caso essa regra mude, a extração
para entidade própria é direta.

## Dificuldades encontradas

[Descreva aqui qualquer dificuldade real que você teve — pode ser entender
o domínio, instalar o Git, qualquer coisa. Se não teve, escreva:
"Nenhuma dificuldade significativa nesta semana."]

## Próximos passos (S2)

- Inicializar projeto Spring Boot via Spring Initializr
- Configurar conexão com PostgreSQL no application.properties
- Implementar primeira entidade JPA (`Obra`)
- Validar conexão com banco via endpoint GET funcional