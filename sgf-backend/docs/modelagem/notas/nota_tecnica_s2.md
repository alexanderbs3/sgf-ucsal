# Nota Técnica — Semana 2
**Projeto:** Sistema de Gestão de Fiscalização (SGF)
**Orientando:** Alexander
**Data:** [data de hoje]
**Sprint:** S2 — Setup Spring Boot

---

## O que foi implementado

- Projeto Spring Boot inicializado via Spring Initializr com dependências:
  Spring Web, Spring Data JPA, PostgreSQL Driver, Validation e Lombok
- Estrutura de pacotes definida: controller, service, repository, model, dto,
  exception e config
- Banco de dados `sgf_db` criado no PostgreSQL local
- Conexão com banco configurada via application.properties
- Entidade JPA `Obra` implementada com mapeamento completo e enum `StatusObra`
- `ObraRepository` criado estendendo JpaRepository
- Endpoint GET /obras funcional retornando 200 com dados

## Decisões técnicas tomadas

**ddl-auto=update temporário**
Configurado `spring.jpa.hibernate.ddl-auto=update` para permitir que o Hibernate
gerencie o schema automaticamente durante o setup inicial. Na S3, quando os scripts
DDL forem produzidos e versionados, essa configuração será trocada para `validate`,
transferindo o controle do schema para os arquivos SQL versionados no repositório.

**Repository injetado diretamente no Controller (temporário)**
Para validar a conexão com o banco na S2, o ObraRepository foi injetado diretamente
no ObraController. Essa abordagem viola o critério de qualidade do projeto (Controller
sem lógica de domínio). Na S4, a camada Service será introduzida e o Controller
passará a depender apenas do ObraService.

**Injeção via construtor**
Adotada injeção de dependência via construtor em vez de @Autowired em campo.
Justificativa: torna as dependências explícitas, facilita testes unitários e é
a prática recomendada pelo Spring desde a versão 4.3.

## Dificuldades encontradas

[Descreva aqui qualquer dificuldade real — erro de conexão, porta ocupada, etc.
Se não teve: "Nenhuma dificuldade significativa nesta semana."]

## Próximos passos (S3)

- Criar scripts DDL completos para todas as tabelas do SGF
- Criar scripts DML com dados de teste representativos
- Implementar consultas SQL para os indicadores do dashboard
- Versionar tudo em /sql/ddl e /sql/dml
- Trocar ddl-auto=update para validate