# SGF — Sistema de Gestão de Fiscalização

> Backend da plataforma de inteligência de dados aplicada à fiscalização de obras públicas.
> Desenvolvido como projeto de Iniciação Científica — PROVIC/UCSAL.

---

## Sobre o Projeto

O SGF transforma registros brutos de fiscalização de obras públicas em indicadores interpretáveis para apoiar decisões técnicas baseadas em evidência. O sistema responde perguntas como:

- Quais itens de uma obra demandam atenção prioritária?
- Como a classificação ABC distribui o esforço de vistoria ao longo do tempo?
- Qual é a evolução histórica de cada item fiscalizado?

**Orientando:** Alexander Costa Brasiliano Silva
**Orientador:** Prof. Eng. Me. Rafael Bispo
**Instituição:** UCSAL — Universidade Católica do Salvador
**Programa:** PROVIC — Iniciação Científica


---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Java 21 |
| Framework | Spring Boot 4.0.5 |
| ORM | Hibernate 7.x / Spring Data JPA |
| Banco de dados | PostgreSQL 16 |
| Migrations | Flyway |
| Containerização | Docker / Docker Compose |
| Validação | Jakarta Bean Validation 3.1 |
| Logging | SLF4J / Logback |
| Build | Maven |

---

## Como Executar Localmente

### Pré-requisitos

- Java 21
- Maven
- Docker e Docker Compose

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd sgf-backend
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

### 3. Subir a aplicação

```bash
mvn spring-boot:run
```

> O Flyway executa automaticamente as migrações `V1__create_tables.sql` e `V2__seed_data.sql`
> na primeira inicialização. Não é necessário rodar scripts SQL manualmente.

A aplicação estará disponível em `http://localhost:8080`.

---

## Migrações — Flyway

O schema é gerenciado pelo Flyway. Os scripts estão em:

```
src/main/resources/db/migration/
├── V1__create_tables.sql   ← schema físico completo (7 tabelas)
└── V2__seed_data.sql       ← dados de teste
```

Para resetar o banco e reaplicar as migrações do zero:

```bash
docker exec -i sgf-db psql -U root -d sgf_db -c "
DROP TABLE IF EXISTS log_fiscalizacao, vistoria, item, obra,
usuario, origem_dado, classificacao, flyway_schema_history CASCADE;
"
# Reinicie a aplicação — o Flyway recria tudo automaticamente
```

---

## Endpoints da API

### Obras

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/obras` | Lista todas as obras |
| GET | `/obras/{id}` | Busca obra por ID |
| GET | `/obras/{id}/dashboard` | Retorna agregação ABC + status da obra |
| POST | `/obras` | Cria nova obra |
| DELETE | `/obras/{id}` | Remove obra por ID |

### Itens

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/itens?obraId={id}` | Lista itens de uma obra |
| GET | `/itens?obraId={id}&classificacao={A\|B\|C}` | Filtra itens por classificação ABC |
| GET | `/itens/{id}` | Busca item por ID |
| POST | `/itens` | Cria novo item |
| DELETE | `/itens/{id}` | Remove item por ID |

### Vistorias

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/vistorias?obraId={id}` | Lista vistorias de uma obra |
| GET | `/vistorias/{id}` | Busca vistoria por ID |
| POST | `/vistorias` | Registra nova vistoria |

### Logs de Fiscalização

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/logs?vistoriaId={id}` | Lista logs de uma vistoria |
| GET | `/logs?itemId={id}` | Lista histórico de um item |
| POST | `/logs` | Registra novo log de fiscalização |

---

## Exemplo — Dashboard de Obra

```bash
curl http://localhost:8080/obras/a1b2c3d4-0001-0001-0001-000000000001/dashboard
```

```json
{
  "obraId": "a1b2c3d4-0001-0001-0001-000000000001",
  "codigo": "OBR-2024-001",
  "descricao": "Construção de escola municipal no bairro Itapuã",
  "statusObra": "EM_ANDAMENTO",
  "totalItens": 7,
  "aprovados": 0,
  "reprovados": 0,
  "emVistoria": 2,
  "pendentes": 5,
  "itensClasseA": 3,
  "itensClasseB": 2,
  "itensClasseC": 2
}
```

---

## Estrutura do Projeto

```
sgf-backend/
├── src/main/resources/
│   └── db/migration/
│       ├── V1__create_tables.sql
│       └── V2__seed_data.sql
└── src/main/java/br/leetjourney/sgf_backend/
    ├── config/                    # CorsConfig
    ├── controller/                # ObraController, ItemController,
    │                              # VistoriaController, LogFiscalizacaoController
    ├── dto/
    │   ├── request/               # DTOs de entrada (Bean Validation)
    │   └── response/              # DTOs de saída (Java Records)
    ├── exception/                 # RecursoNaoEncontradoException
    │                              # GlobalExceptionHandler
    ├── model/                     # Entidades JPA
    ├── repository/                # Repositórios Spring Data
    ├── service/                   # Regras de negócio
    └── SgfBackendApplication.java
```

---

## Modelo de Dados

```
OBRA (1:N) ITEM
OBRA (1:N) VISTORIA
USUARIO (1:N) VISTORIA
VISTORIA (1:N) LOG_FISCALIZACAO
ITEM (1:N) LOG_FISCALIZACAO   ← tabela associativa N:N Vistoria × Item
ITEM (N:1) CLASSIFICACAO      ← tipo CHAR: A | B | C
LOG_FISCALIZACAO (N:1) ORIGEM_DADO
```

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `obra` | Unidade central de fiscalização |
| `item` | Elemento fiscalizado dentro de uma obra |
| `classificacao` | Critério ABC de criticidade (A, B, C) |
| `vistoria` | Evento de inspeção com fiscal responsável |
| `log_fiscalizacao` | Registro imutável do estado do item na vistoria |
| `origem_dado` | Fonte do registro (campo, fotografia, cronograma, parecer) |
| `usuario` | Fiscal ou gestor responsável |

---

## Decisões Arquiteturais

| Decisão | Justificativa |
|---------|--------------|
| UUID como PK | Evita colisão em ambiente distribuído; não expõe sequência na API |
| Flyway para migrations | Schema versionado e reproduzível; elimina execução manual de scripts |
| `ddl-auto: validate` | Hibernate apenas valida o schema — Flyway é o único responsável por alterações |
| `CLASSIFICACAO` como entidade separada | Permite versionar critérios ABC sem alterar os itens |
| `LOG_FISCALIZACAO` com `status_item` próprio | Captura o estado do item no momento da vistoria (histórico longitudinal) |
| `USUARIO` vinculado à `VISTORIA` | Rastreabilidade no nível do evento de inspeção |
| `FetchType.LAZY` + `@Transactional(readOnly = true)` | Evita carregamento desnecessário; sessão mantida aberta durante mapeamento para DTO |
| `open-in-view: false` | Elimina queries lazy fora do contexto transacional |
| Java Records para DTOs | Imutabilidade e ausência de boilerplate |

---

## Tratamento de Erros

Todas as respostas de erro seguem o padrão JSON:

```json
{
  "status": 404,
  "mensagem": "Obra não encontrada: 00000000-0000-0000-0000-000000000000",
  "timestamp": "2026-04-18T15:35:45"
}
```

| Código | Situação |
|--------|----------|
| 400 | Parâmetro inválido, body ausente ou falha de validação |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Padrão de Commits

```
feat(obra): adiciona endpoint de listagem
fix(item): corrige filtro por classificacao
docs(readme): atualiza documentacao de endpoints
refactor(service): extrai logica ABC para metodo privado
chore(flyway): adiciona migracao V3 com índices
```

---

## Status do Projeto

| Sprint | Foco | Status |
|--------|------|--------|
| S1 | Domínio e backlog | ✅ Concluída |
| S2 | Setup Spring Boot | ✅ Concluída |
| S3 | Esquema físico SQL | ✅ Concluída |
| S4 | Serviço e regras de negócio | ✅ Concluída |
| S5 | DTOs e filtros de API | ✅ Concluída |
| S6 | Validação e exceções | ✅ Concluída |
| S7 | Integração com dashboard | ✅ Concluída |
| S8 | Consolidação de IC | ✅ Concluída |
| Pós-S8 | Flyway + correções de integração | ✅ Concluída |

---

*SGF — PROVIC/UCSAL | Orientador: Prof. Eng. Me. Rafael Bispo*