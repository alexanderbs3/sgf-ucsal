# SGF Backend — Sistema de Gestão de Fiscalização

> **Versão:** 5.0.0 · **Runtime:** Java 21 · **Framework:** Spring Boot 3.4.5 · **Banco:** PostgreSQL 16

API REST para gestão e fiscalização de obras públicas municipais. Construída com arquitetura em camadas (Controller → Service → Repository), autenticação JWT stateless, migrações versionadas com Flyway e controle de acesso baseado em papéis (RBAC).

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Técnica](#stack-técnica)
3. [Estrutura de Pacotes](#estrutura-de-pacotes)
4. [Modelo de Domínio](#modelo-de-domínio)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Endpoints da API](#endpoints-da-api)
7. [Migrações Flyway](#migrações-flyway)
8. [Configuração e Variáveis de Ambiente](#configuração-e-variáveis-de-ambiente)
9. [Como Executar](#como-executar)
10. [Primeiros Passos Após o Deploy](#primeiros-passos-após-o-deploy)
11. [Regras de Negócio](#regras-de-negócio)
12. [Decisões Arquiteturais](#decisões-arquiteturais)

---

## Visão Geral

O SGF Backend gerencia o ciclo completo de fiscalização de obras públicas:

- **Obras** são criadas com código único e passam por um fluxo controlado de status.
- Cada obra contém **Itens** classificados por critério de criticidade (A, B ou C).
- **Fiscais** realizam **Vistorias** vinculadas a obras, registrando o resultado de cada item em **Logs de Fiscalização**.
- Todo acesso é protegido por **JWT** com controle de permissões por papel (`ADMIN`, `GESTOR`, `FISCAL`).

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 21 (LTS) |
| Framework | Spring Boot 3.4.5 |
| Segurança | Spring Security 6 + JJWT 0.12.6 |
| Persistência | Spring Data JPA + Hibernate |
| Banco de Dados | PostgreSQL 16 |
| Migrações | Flyway 10 |
| Validação | Jakarta Bean Validation |
| Redução de boilerplate | Lombok |
| Build | Maven 3 |

---

## Estrutura de Pacotes

```
br.leetjourney.sgf_backend
├── controller/           # Camada HTTP — recebe requests, delega ao service
│   ├── AuthController
│   ├── ObraController
│   ├── ItemController
│   ├── VistoriaController
│   ├── LogFiscalizacaoController
│   ├── UsuarioController
│   ├── ClassificacaoController
│   └── OrigemDadoController
│
├── service/              # Regras de negócio e orquestração
│   ├── AuthService
│   ├── ObraService
│   ├── ItemService
│   ├── VistoriaService
│   ├── LogFiscalizacaoService
│   └── UsuarioService
│
├── repository/           # Spring Data JPA — acesso ao banco
│
├── model/                # Entidades JPA
│   ├── Obra
│   ├── Item
│   ├── Vistoria
│   ├── LogFiscalizacao
│   ├── Usuario
│   ├── Classificacao
│   ├── OrigemDado
│   ├── StatusObra        (enum)
│   ├── StatusItem        (enum)
│   └── PapelUsuario      (enum)
│
├── dto/
│   ├── request/          # Payloads de entrada (validados com @Valid)
│   └── response/         # Payloads de saída (mapeados a partir das entidades)
│
├── security/             # Infraestrutura JWT
│   ├── SecurityConfig    # Regras de autorização e CORS
│   ├── JwtUtil           # Geração, validação e extração de claims
│   └── JwtAuthFilter     # Filtro stateless injetado no filter chain
│
└── exception/            # Tratamento centralizado
    ├── GlobalExceptionHandler
    ├── RegraDeNegocioException
    ├── RecursoNaoEncontradoException
    └── RecursoJaExisteException
```

---

## Modelo de Domínio

```
Usuario (ADMIN | GESTOR | FISCAL)
    │
    └──> realiza ──> Vistoria
                         │ pertence a
                         ▼
                       Obra
                         │ contém
                         ▼
                        Item ──── classificado por ──── Classificacao (A | B | C)
                         ▲
                         │ registra resultado em
                    LogFiscalizacao ──── originado de ──── OrigemDado
```

### Fluxo de status de Obra

```
PLANEJADA ──► EM_ANDAMENTO ──► CONCLUIDA
                   │
                   └──► PARALISADA ──► EM_ANDAMENTO
```

### Fluxo de status de Item

```
PENDENTE ──► EM_VISTORIA ──► APROVADO
                  │
                  └──────────► REPROVADO
```

### Classificação de itens (critério de criticidade)

| Classe | Critério |
|---|---|
| **A** | Alto impacto — comprometem estrutura ou segurança da obra |
| **B** | Impacto intermediário — afetam funcionalidade sem risco imediato |
| **C** | Baixo impacto — acabamento e itens estéticos |

---

## Autenticação e Autorização

### Estratégia

O sistema usa **JWT stateless** (sem sessão HTTP). Cada requisição protegida deve enviar o token no header:

```
Authorization: Bearer <token>
```

O `JwtAuthFilter` intercepta todas as requisições, valida o token, extrai o email e o papel, e popula o `SecurityContext` com as authorities correspondentes.

### Papéis e Permissões

| Recurso | FISCAL | GESTOR | ADMIN |
|---|:---:|:---:|:---:|
| Listar obras, itens, vistorias, logs | ✅ | ✅ | ✅ |
| Criar vistoria e log | ✅ | ✅ | ✅ |
| Criar item | ✅ | ✅ | ✅ |
| Alterar status de obra/item | ✅ | ✅ | ✅ |
| Criar e editar obras | ❌ | ✅ | ✅ |
| Editar item (descrição/classificação) | ❌ | ✅ | ✅ |
| Deletar item | ❌ | ✅ | ✅ |
| Deletar obra | ❌ | ❌ | ✅ |
| Gerenciar usuários (CRUD) | ❌ | ❌ | ✅ |

### Tokens JWT

- **Algoritmo:** HMAC-SHA256
- **Expiração padrão:** 24 horas (configurável via `JWT_EXPIRACAO_MS`)
- **Claims:** `sub` (email), `papel`, `iat`, `exp`
- **Segredo:** configurado via variável de ambiente `JWT_SECRET` (mínimo 32 caracteres)

---

## Endpoints da API

### Auth — `/auth`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ Público | Autentica e retorna JWT |
| `POST` | `/auth/definir-senha/{id}` | ❌ Público | Define senha inicial para usuário seed |
| `GET` | `/auth/me` | ✅ JWT | Retorna dados do usuário autenticado |

**Login — request:**
```json
POST /auth/login
{
  "email": "admin@sgf.br",
  "senha": "suasenha123"
}
```

**Login — response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "id": "uuid-do-usuario",
  "nome": "Admin SGF",
  "email": "admin@sgf.br",
  "papel": "ADMIN"
}
```

---

### Obras — `/obras`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/obras` | FISCAL | Lista todas as obras |
| `GET` | `/obras/buscar?q=&status=` | FISCAL | Busca com filtro por texto e/ou status |
| `GET` | `/obras/{id}` | FISCAL | Busca obra por ID |
| `GET` | `/obras/{id}/dashboard` | FISCAL | KPIs e métricas da obra |
| `GET` | `/obras/{id}/timeline` | FISCAL | Linha do tempo de vistorias agrupadas por dia |
| `POST` | `/obras` | GESTOR | Cria nova obra |
| `PUT` | `/obras/{id}` | GESTOR | Atualiza dados da obra (sem alterar status) |
| `PATCH` | `/obras/{id}/status` | FISCAL | Altera status da obra conforme fluxo permitido |
| `DELETE` | `/obras/{id}` | ADMIN | Remove obra (bloqueado se tiver itens vinculados) |

**Criar/Atualizar Obra — request:**
```json
{
  "codigo": "OBR-2025-001",
  "descricao": "Construção de escola municipal no bairro Itapuã",
  "dataInicio": "2025-01-15",
  "dataPrevisaoConclusao": "2025-12-31"
}
```

---

### Itens — `/itens`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/itens` | FISCAL | Lista todos os itens |
| `GET` | `/itens/buscar?obraId=&status=` | FISCAL | Filtra itens por obra e/ou status |
| `GET` | `/itens/{id}` | FISCAL | Busca item por ID |
| `POST` | `/itens` | FISCAL | Cria novo item vinculado a uma obra |
| `PUT` | `/itens/{id}` | GESTOR | Atualiza classificação e descrição do item |
| `PATCH` | `/itens/{id}/status` | FISCAL | Atualiza status do item |
| `DELETE` | `/itens/{id}` | GESTOR | Remove item |

**Criar Item — request:**
```json
{
  "obraId": "uuid-da-obra",
  "classificacaoId": "uuid-da-classificacao",
  "descricao": "Fundação e estrutura de concreto"
}
```

**Atualizar Item — request (PUT):**
```json
{
  "classificacaoId": "uuid-da-classificacao",
  "descricao": "Descrição atualizada do item"
}
```

---

### Vistorias — `/vistorias`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/vistorias` | FISCAL | Lista todas as vistorias |
| `GET` | `/vistorias/{id}` | FISCAL | Busca vistoria por ID |
| `POST` | `/vistorias` | FISCAL | Registra nova vistoria |

> Vistorias são registros de auditoria — **não possuem DELETE nem PUT** por design. O histórico é imutável.

**Criar Vistoria — request:**
```json
{
  "obraId": "uuid-da-obra",
  "usuarioId": "uuid-do-fiscal",
  "dataHora": "2025-05-06T09:00:00",
  "observacoes": "Estrutura em conformidade com o projeto."
}
```

---

### Logs de Fiscalização — `/logs`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/logs` | FISCAL | Lista todos os logs |
| `POST` | `/logs` | FISCAL | Registra resultado de um item em uma vistoria |

> Logs também são append-only — sem DELETE por design.

**Criar Log — request:**
```json
{
  "vistoriaId": "uuid-da-vistoria",
  "itemId": "uuid-do-item",
  "origemDadoId": "uuid-da-origem",
  "resultado": "Item inspecionado. Estrutura dentro dos parâmetros técnicos.",
  "statusItem": "APROVADO"
}
```

---

### Usuários — `/usuarios`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/usuarios` | FISCAL | Lista todos os usuários |
| `GET` | `/usuarios/papeis` | FISCAL | Lista os papéis disponíveis |
| `GET` | `/usuarios/{id}` | FISCAL | Busca usuário por ID |
| `POST` | `/usuarios` | ADMIN | Cria novo usuário |
| `PUT` | `/usuarios/{id}` | ADMIN | Atualiza dados do usuário |
| `PATCH` | `/usuarios/{id}/papel` | ADMIN | Altera o papel do usuário |
| `DELETE` | `/usuarios/{id}?forcar=false` | ADMIN | Remove usuário. `forcar=true` desvincula vistorias antes de deletar. |

**Criar Usuário — request:**
```json
{
  "nome": "João Silva",
  "email": "joao.silva@prefeitura.gov.br",
  "papel": "FISCAL"
}
```

> Após criar o usuário, defina a senha via `POST /auth/definir-senha/{id}`.

---

### Classificações — `/classificacoes`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/classificacoes` | ❌ Público | Lista as classificações (A, B, C) |
| `GET` | `/classificacoes/{id}` | ❌ Público | Busca classificação por ID |

---

### Origens de Dado — `/origens-dado`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/origens-dado` | ❌ Público | Lista as origens de dado disponíveis |
| `GET` | `/origens-dado/{id}` | ❌ Público | Busca origem por ID |

---

## Migrações Flyway

As migrações são executadas automaticamente na inicialização e seguem versionamento sequencial. Nunca edite uma migration já aplicada em produção — crie uma nova versão.

| Versão | Arquivo | Descrição |
|---|---|---|
| V1 | `V1__create_tables.sql` | DDL completo: todas as tabelas, PKs, FKs e constraints |
| V2 | `V2__seed_data.sql` | Dados iniciais: classificações, origens, usuários, obras e vistoria de exemplo |
| V3 | `V3__add_indexes_and_constraints.sql` | Índices de performance (status, GIN full-text, compostos por obra) |
| V4 | `V4__fix_vistoria_usuario_nullable.sql` | Permite `usuario_id` nullable na vistoria; recria FK com `ON DELETE SET NULL` |
| V5 | `V5__add_auth_to_usuario.sql` | Adiciona coluna `senha_hash` (BCrypt) à tabela `usuario` |

### Tabelas do banco

| Tabela | Descrição |
|---|---|
| `usuario` | Usuários do sistema com papel (ADMIN, GESTOR, FISCAL) e hash da senha |
| `obra` | Obras fiscalizadas com código único e controle de status |
| `item` | Itens de uma obra classificados por criticidade |
| `classificacao` | Lookup de classes A, B, C com critério descritivo |
| `vistoria` | Registro de uma visita de fiscalização a uma obra |
| `log_fiscalizacao` | Resultado individual de um item em uma vistoria |
| `origem_dado` | Lookup do tipo de evidência usada no log (medição, foto, parecer, etc.) |

---

## Configuração e Variáveis de Ambiente

Todas as variáveis possuem valor padrão para desenvolvimento local. **Em produção, sempre sobrescreva via variável de ambiente.**

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `sgf_db` | Nome do banco de dados |
| `DB_USER` | `root` | Usuário do banco |
| `DB_PASSWORD` | `root` | Senha do banco |
| `APP_PORT` | `8080` | Porta da aplicação |
| `JWT_SECRET` | `sgf-default-dev-secret-...` | Segredo HMAC-SHA256 — **mínimo 32 caracteres em produção** |
| `JWT_EXPIRACAO_MS` | `86400000` | Expiração do token em ms (padrão: 24h) |

> ⚠️ **Nunca commite o valor real de `JWT_SECRET` no repositório.** Use variáveis de ambiente, `.env` no `.gitignore`, ou um serviço de secrets (AWS Secrets Manager, HashiCorp Vault).

---

## Como Executar

### Pré-requisitos

- Java 21+
- Maven 3.9+
- PostgreSQL 16+ rodando localmente (ou via Docker)

### 1. Banco de dados

```bash
# Opção rápida com Docker
docker run -d \
  --name sgf-db \
  -e POSTGRES_DB=sgf_db \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -p 5432:5432 \
  postgres:16
```

### 2. Clonar e configurar

```bash
git clone https://github.com/seu-usuario/sgf-backend.git
cd sgf-backend
```

Para sobrescrever configurações sem alterar o `application.yaml`, crie um `application-local.yaml` em `src/main/resources/` (já está no `.gitignore`):

```yaml
sgf:
  jwt:
    secret: meu-segredo-local-de-desenvolvimento-seguro-32chars
```

### 3. Executar

```bash
./mvnw spring-boot:run
```

As migrações Flyway são aplicadas automaticamente. A API estará disponível em `http://localhost:8080`.

### 4. Build para produção

```bash
./mvnw clean package -DskipTests
java -jar target/sgf-backend-*.jar \
  --spring.datasource.url=jdbc:postgresql://prod-host:5432/sgf_db \
  --JWT_SECRET=segredo-de-producao-seguro
```

---

## Primeiros Passos Após o Deploy

Os usuários criados pelo seed (V2) não possuem senha definida. Siga o fluxo abaixo para o primeiro acesso:

### Passo 1 — Descubra os UUIDs dos usuários seed

```bash
GET /usuarios
# Retorna a lista com os UUIDs de Carlos Andrade, Marina Costa e Admin SGF
```

### Passo 2 — Defina a senha de cada usuário

```bash
POST /auth/definir-senha/{uuid-do-admin}
Content-Type: application/json

{
  "senha": "suasenha123"
}
```

### Passo 3 — Faça login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@sgf.br",
  "senha": "suasenha123"
}
```

O response retorna o `token` JWT. Use-o em todas as próximas requisições:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Usuários seed disponíveis

| Nome | Email | Papel |
|---|---|---|
| Admin SGF | `admin@sgf.br` | ADMIN |
| Marina Costa | `marina.costa@ucsal.br` | GESTOR |
| Carlos Andrade | `carlos.andrade@ucsal.br` | FISCAL |

---

## Regras de Negócio

### Obras

- O `codigo` da obra é único em todo o sistema.
- `dataPrevisaoConclusao` não pode ser anterior a `dataInicio`.
- Uma obra não pode ser deletada se possuir itens vinculados.
- Transições de status são unidirecionais e controladas: `PLANEJADA → EM_ANDAMENTO → CONCLUIDA` (com possibilidade de `PARALISADA` a partir de `EM_ANDAMENTO`).

### Usuários

- Um usuário com vistorias registradas **não pode ser removido** sem usar `?forcar=true`.
- Com `forcar=true`, as vistorias são preservadas no histórico mas o campo `usuario_id` é definido como `NULL` (fiscal exibido como "Fiscal desvinculado" no frontend).
- Exclusividade de email é garantida por constraint única no banco.

### Vistorias e Logs

- Vistorias e logs são registros de auditoria — não há endpoints de DELETE nem de UPDATE por design. O histórico é imutável.
- Um log de fiscalização deve referenciar um item que pertença à mesma obra da vistoria.

---

## Decisões Arquiteturais

**Por que JWT stateless?**
Elimina a necessidade de armazenar sessões no servidor, facilitando a escalabilidade horizontal. Em um sistema de fiscalização pública com múltiplos fiscais em campo acessando simultaneamente, a ausência de estado no servidor é um benefício direto.

**Por que Flyway e não `ddl-auto: update`?**
`ddl-auto: update` é não-determinístico em produção — pode deixar colunas obsoletas, não remove constraints e não há rollback. Flyway garante rastreabilidade, versionamento e execução idempotente de cada mudança de schema, o que é obrigatório em sistemas com dados reais.

**Por que `ON DELETE SET NULL` na FK `vistoria.usuario_id`?**
Fiscais são desligados, mas o histórico de vistorias que realizaram não deve ser apagado. A escolha de `SET NULL` em vez de `CASCADE` preserva a integridade do histórico de auditoria enquanto permite a remoção do usuário sem cascatear deletes para registros de vistoria.

**Por que separar DTO de Entidade?**
Entidades JPA são gerenciadas pelo contexto de persistência e não devem vazar para a camada HTTP. DTOs de request carregam validação (`@Valid`) e DTOs de response controlam exatamente o que é serializado — evitando campos internos como `senhaHash` na resposta da API.

**Por que `GlobalExceptionHandler` centralizado?**
Garante respostas de erro consistentes em toda a API. Sem ele, exceções não tratadas retornam stack traces em JSON ou HTML padrão do Spring, o que é inseguro e inconsistente para o cliente.

---

## Namespace

`br.leetjourney` · PROVIC · UCSAL · SGF v5.0