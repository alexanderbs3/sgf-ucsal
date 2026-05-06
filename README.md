
<div align="center">

# SGF — Sistema de Gestão de Fiscalização

**Plataforma completa para gestão e fiscalização de obras públicas municipais**

[![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.5-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)

</div>

---

## Sobre o Projeto

O SGF é uma aplicação fullstack desenvolvida para controle operacional de fiscalização de obras públicas. O sistema permite que equipes de gestão cadastrem obras, definam itens a fiscalizar, e que fiscais registrem vistorias com o resultado de cada item inspecionado em campo.

O repositório segue a estrutura de **monorepo**, com backend e frontend organizados em pacotes independentes que se comunicam via API REST com autenticação JWT.

### Funcionalidades principais

- Cadastro e acompanhamento de obras com fluxo de status controlado
- Itens fiscalizados classificados por critério de criticidade (A, B, C)
- Registro de vistorias e logs de fiscalização com histórico imutável de auditoria
- Controle de acesso por papel: `ADMIN`, `GESTOR` e `FISCAL`
- Dashboard por obra com KPIs, timeline de vistorias e exportação de CSV
- Tema claro/escuro com persistência, notificações dinâmicas e preferências por usuário

---

## Sumário

1. [Estrutura do Repositório](#estrutura-do-repositório)
2. [Stack Técnica](#stack-técnica)
3. [Modelo de Domínio](#modelo-de-domínio)
4. [Arquitetura do Sistema](#arquitetura-do-sistema)
5. [Autenticação e RBAC](#autenticação-e-rbac)
6. [Backend — sgf-backend](#backend--sgf-backend)
7. [Frontend — sgf-dashboard](#frontend--sgf-dashboard)
8. [Como Executar o Projeto](#como-executar-o-projeto)
9. [Variáveis de Ambiente](#variáveis-de-ambiente)
10. [Endpoints da API](#endpoints-da-api)
11. [Migrações do Banco](#migrações-do-banco)
12. [Primeiros Passos Após o Deploy](#primeiros-passos-após-o-deploy)
13. [Regras de Negócio](#regras-de-negócio)
14. [Decisões Arquiteturais](#decisões-arquiteturais)

---

## Estrutura do Repositório

```
sgf/
├── sgf-backend/                        # API REST — Java 21 + Spring Boot 3.4.5
│   ├── src/main/java/br/leetjourney/sgf_backend/
│   │   ├── controller/                 # Camada HTTP
│   │   ├── service/                    # Regras de negócio
│   │   ├── repository/                 # Spring Data JPA
│   │   ├── model/                      # Entidades JPA + enums
│   │   ├── dto/request/                # Payloads de entrada (validados)
│   │   ├── dto/response/               # Payloads de saída
│   │   ├── security/                   # JWT filter chain
│   │   └── exception/                  # Handler global de erros
│   ├── src/main/resources/
│   │   ├── db/migration/               # Flyway V1 → V5
│   │   └── application.yaml
│   └── pom.xml
│
├── sgf-dashboard/                      # SPA — React 19 + Vite 8
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js               # Axios com interceptors JWT
│   │   │   └── sgf.js                  # Funções de chamada à API por domínio
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Estado de auth, login, logout, pode()
│   │   │   └── ThemeContext.jsx        # Dark/light com detecção de SO
│   │   ├── components/                 # Layout, Sidebar, Header, ui.jsx
│   │   ├── pages/                      # Login, Obras, ObraDashboard, Vistorias...
│   │   └── App.jsx                     # Roteamento com guarda de autenticação
│   ├── .env
│   └── package.json
│
└── README.md                           # Este arquivo
```

---

## Stack Técnica

### Backend

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem | Java | 21 (LTS) |
| Framework | Spring Boot | 3.4.5 |
| Segurança | Spring Security + JJWT | 6 + 0.12.6 |
| Persistência | Spring Data JPA + Hibernate | — |
| Banco de dados | PostgreSQL | 16 |
| Migrações | Flyway | 10 |
| Validação | Jakarta Bean Validation | — |
| Build | Maven | 3.9 |
| Boilerplate | Lombok | — |

### Frontend

| Categoria | Tecnologia | Versão |
|---|---|---|
| UI Library | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Roteamento | React Router DOM | 7.14 |
| HTTP Client | Axios | 1.15 |
| Gráficos | Recharts | 3.8 |
| Estilo | Tailwind CSS | 3.4 |
| Fontes | Syne · DM Sans · JetBrains Mono | Google Fonts |

---

## Modelo de Domínio

```
Usuario (ADMIN | GESTOR | FISCAL)
    │
    └──── realiza ────► Vistoria
                            │ pertence a
                            ▼
                          Obra ◄──── possui ──── Item
                                                  │
                          Classificacao ──────────┤ classificado por
                          (Classe A | B | C)      │
                                                  │
                          LogFiscalizacao ◄────── ┘ resultado registrado em
                               │
                          OrigemDado (evidência: medição, foto, parecer...)
```

### Fluxo de status — Obra

```
PLANEJADA ──► EM_ANDAMENTO ──► CONCLUIDA
                   │
                   └──► PARALISADA ──► EM_ANDAMENTO
```

### Fluxo de status — Item

```
PENDENTE ──► EM_VISTORIA ──► APROVADO
                  │
                  └──────────► REPROVADO
```

### Classificação de itens (critério de criticidade)

| Classe | Critério |
|---|---|
| **A** | Alto impacto — estrutura ou segurança da obra |
| **B** | Impacto intermediário — funcionalidade sem risco imediato |
| **C** | Baixo impacto — acabamento e itens estéticos |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        sgf-dashboard                            │
│  React 19 + Vite  ·  Tailwind CSS  ·  Recharts  ·  Axios       │
│                                                                 │
│  AuthContext (JWT)  ──►  client.js (interceptor Bearer)         │
│  ThemeContext       ──►  CSS Variables (dark/light)             │
│  sgf.js            ──►  Todas as chamadas à API                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        sgf-backend                              │
│  Spring Boot 3.4.5  ·  Spring Security 6  ·  JJWT 0.12.6       │
│                                                                 │
│  JwtAuthFilter  ──►  SecurityConfig (RBAC por role)             │
│  Controller     ──►  Service  ──►  Repository                   │
│  GlobalExceptionHandler  ──►  Respostas de erro padronizadas    │
└────────────────────────┬────────────────────────────────────────┘
                         │ JPA / JDBC
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL 16                             │
│                                                                 │
│  Flyway V1→V5  ·  Migrations versionadas  ·  Seed data          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Autenticação e RBAC

### Estratégia JWT stateless

O sistema usa JWT sem sessão HTTP. O token é gerado no login (`POST /auth/login`), armazenado no `localStorage` do browser e enviado em toda requisição via header:

```
Authorization: Bearer <token>
```

O `JwtAuthFilter` intercepta todas as requisições no backend, valida o token e popula o `SecurityContext`. O interceptor Axios no frontend injeta o token automaticamente e trata `401` redirecionando para o login.

### Fluxo completo de autenticação

```
Browser                    Frontend                    Backend
   │                          │                           │
   │── acessa a aplicação ──►│                           │
   │                          │── verifica localStorage ─►│
   │                          │◄── token presente ────────│
   │                          │── GET /auth/me ───────────►│
   │                          │◄── dados do usuário ───────│
   │◄── exibe dashboard ──────│                           │
   │                          │                           │
   │── login (email/senha) ──►│                           │
   │                          │── POST /auth/login ───────►│
   │                          │◄── { token, nome, papel } ─│
   │                          │── salva no localStorage    │
   │◄── redireciona ──────────│                           │
```

### Permissões por papel

| Permissão | FISCAL | GESTOR | ADMIN |
|---|:---:|:---:|:---:|
| Ver obras, itens, vistorias | ✅ | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ | ✅ |
| Alterar status (obra/item) | ✅ | ✅ | ✅ |
| Adicionar item | ✅ | ✅ | ✅ |
| Criar e editar obras | ❌ | ✅ | ✅ |
| Editar e deletar itens | ❌ | ✅ | ✅ |
| Ver Analytics | ❌ | ✅ | ✅ |
| Deletar obras | ❌ | ❌ | ✅ |
| Gerenciar usuários (CRUD) | ❌ | ❌ | ✅ |

As permissões são verificadas em dois lugares: **SecurityConfig no backend** (via `hasRole()`) e **`pode()` no frontend** (via `AuthContext`), garantindo que nem a UI nem a API permitem ações indevidas.

---

## Backend — sgf-backend

### Estrutura de pacotes

```
br.leetjourney.sgf_backend
├── controller/        AuthController · ObraController · ItemController
│                      VistoriaController · LogFiscalizacaoController
│                      UsuarioController · ClassificacaoController · OrigemDadoController
├── service/           AuthService · ObraService · ItemService
│                      VistoriaService · LogFiscalizacaoService · UsuarioService
├── repository/        Um repository por entidade (Spring Data JPA)
├── model/             Obra · Item · Vistoria · LogFiscalizacao · Usuario
│                      Classificacao · OrigemDado
│                      StatusObra (enum) · StatusItem (enum) · PapelUsuario (enum)
├── dto/
│   ├── request/       ObraRequestDTO · ItemRequestDTO · AtualizarItemRequestDTO
│   │                  LoginRequestDTO · DefinirSenhaRequestDTO · ...
│   └── response/      ObraResponseDTO · ItemResponseDTO · VistoriaResponseDTO
│                      LoginResponseDTO · UsuarioResponseDTO · ...
├── security/          SecurityConfig · JwtUtil · JwtAuthFilter
└── exception/         GlobalExceptionHandler · RegraDeNegocioException
                       RecursoNaoEncontradoException · RecursoJaExisteException
```

### Padrões aplicados

- **Separação DTO ↔ Entidade** — entidades JPA nunca vazam para a camada HTTP
- **`GlobalExceptionHandler`** — respostas de erro padronizadas em toda a API
- **Validação com `@Valid`** — todos os DTOs de request são validados antes de chegar ao service
- **Transações explícitas** — `@Transactional` e `@Transactional(readOnly = true)` em todos os métodos de service
- **Histórico imutável** — vistorias e logs não têm endpoints de DELETE ou PUT por design

---

## Frontend — sgf-dashboard

### Páginas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Login ou Obras (condicional) | Público / Autenticado |
| `/obras/:id` | Dashboard individual da obra | Autenticado |
| `/relatorios` | Histórico global de vistorias | Autenticado |
| `/analytics` | Gráficos e métricas agregadas | GESTOR + ADMIN |
| `/usuarios` | CRUD de usuários | ADMIN |
| `/configuracoes` | Preferências do usuário | Autenticado |

### Sistema de temas

Controlado inteiramente por **CSS variables** no `index.css`, aplicadas via `data-theme` no `<html>`. Nenhum componente precisa de lógica condicional de cor — a troca de tema é transparente para o JSX.

| Variável | Dark | Light |
|---|---|---|
| `--bg` | `#080C14` | `#F0F4FA` |
| `--card` | `#141B27` | `#FFFFFF` |
| `--text` | `#E8EDF5` | `#0F1520` |
| `--accent` | `#3B82F6` | `#2563EB` |

**Fontes:** Syne (`font-display`) · DM Sans (`font-body`) · JetBrains Mono (`font-mono`)

### Preferências persistidas no `localStorage`

| Chave | Conteúdo |
|---|---|
| `sgf_token` | Token JWT de autenticação |
| `sgf_theme` | `"dark"` ou `"light"` |
| `sgf_prefs` | `{ notificacoes, animacoes, formatoData }` |

---

## Como Executar o Projeto

### Pré-requisitos

- Java 21+
- Maven 3.9+
- Node.js 20+ e npm 10+
- PostgreSQL 16+

### 1. Banco de dados

```bash
docker run -d \
  --name sgf-db \
  -e POSTGRES_DB=sgf_db \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -p 5432:5432 \
  postgres:16
```

### 2. Backend

```bash
cd sgf-backend
./mvnw spring-boot:run
```

As migrações Flyway são aplicadas automaticamente. API disponível em `http://localhost:8080`.

### 3. Frontend

```bash
cd sgf-dashboard
npm install
npm run dev
```

Dashboard disponível em `http://localhost:5173`.

### Execução com script único (opcional)

Crie um `Makefile` na raiz do monorepo:

```makefile
.PHONY: dev backend frontend db

db:
	docker run -d --name sgf-db \
		-e POSTGRES_DB=sgf_db -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
		-p 5432:5432 postgres:16

backend:
	cd sgf-backend && ./mvnw spring-boot:run

frontend:
	cd sgf-dashboard && npm run dev

dev: db
	$(MAKE) backend & $(MAKE) frontend
```

---

## Variáveis de Ambiente

### Backend (`sgf-backend/src/main/resources/application.yaml`)

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `sgf_db` | Nome do banco |
| `DB_USER` | `root` | Usuário do banco |
| `DB_PASSWORD` | `root` | Senha do banco |
| `APP_PORT` | `8080` | Porta da aplicação |
| `JWT_SECRET` | `sgf-default-dev-secret-...` | Segredo HMAC-SHA256 — **mínimo 32 chars em produção** |
| `JWT_EXPIRACAO_MS` | `86400000` | Expiração do token (padrão: 24h) |

### Frontend (`sgf-dashboard/.env`)

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL da API backend |

> ⚠️ **Nunca commite o valor real de `JWT_SECRET`.** Use variáveis de ambiente no servidor ou um serviço de secrets (AWS Secrets Manager, HashiCorp Vault).

---

## Endpoints da API

### Auth — `/auth`

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Autentica e retorna JWT |
| `POST` | `/auth/definir-senha/{id}` | ❌ | Define senha inicial para usuário seed |
| `GET` | `/auth/me` | ✅ | Retorna dados do usuário autenticado |

### Obras — `/obras`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/obras` | FISCAL | Lista todas as obras |
| `GET` | `/obras/buscar?q=&status=` | FISCAL | Busca com filtro |
| `GET` | `/obras/{id}` | FISCAL | Busca por ID |
| `GET` | `/obras/{id}/dashboard` | FISCAL | KPIs da obra |
| `GET` | `/obras/{id}/timeline` | FISCAL | Timeline de vistorias |
| `POST` | `/obras` | GESTOR | Cria nova obra |
| `PUT` | `/obras/{id}` | GESTOR | Atualiza dados da obra |
| `PATCH` | `/obras/{id}/status` | FISCAL | Altera status |
| `DELETE` | `/obras/{id}` | ADMIN | Remove obra |

### Itens — `/itens`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/itens/buscar?obraId=&status=` | FISCAL | Filtra itens |
| `GET` | `/itens/{id}` | FISCAL | Busca por ID |
| `POST` | `/itens` | FISCAL | Cria item |
| `PUT` | `/itens/{id}` | GESTOR | Atualiza classificação e descrição |
| `PATCH` | `/itens/{id}/status` | FISCAL | Atualiza status |
| `DELETE` | `/itens/{id}` | GESTOR | Remove item |

### Vistorias — `/vistorias`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/vistorias` | FISCAL | Lista vistorias |
| `GET` | `/vistorias/{id}` | FISCAL | Busca por ID |
| `POST` | `/vistorias` | FISCAL | Registra vistoria |

> Vistorias são append-only — sem DELETE nem PUT por design (auditoria imutável).

### Logs de Fiscalização — `/logs`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/logs` | FISCAL | Lista logs |
| `POST` | `/logs` | FISCAL | Registra resultado de item |

### Usuários — `/usuarios`

| Método | Endpoint | Role mínima | Descrição |
|---|---|---|---|
| `GET` | `/usuarios` | FISCAL | Lista usuários |
| `GET` | `/usuarios/{id}` | FISCAL | Busca por ID |
| `POST` | `/usuarios` | ADMIN | Cria usuário |
| `PUT` | `/usuarios/{id}` | ADMIN | Atualiza dados |
| `PATCH` | `/usuarios/{id}/papel` | ADMIN | Altera papel |
| `DELETE` | `/usuarios/{id}?forcar=false` | ADMIN | Remove usuário (`forcar=true` desvincula vistorias) |

### Lookups — `/classificacoes` · `/origens-dado`

Endpoints públicos (sem JWT) para popular selects no frontend.

---

## Migrações do Banco

| Versão | Arquivo | Descrição |
|---|---|---|
| V1 | `V1__create_tables.sql` | DDL completo: todas as tabelas, PKs, FKs e constraints |
| V2 | `V2__seed_data.sql` | Dados iniciais: classificações, origens, usuários e obra de exemplo |
| V3 | `V3__add_indexes_and_constraints.sql` | Índices de performance (status, GIN full-text, compostos por obra) |
| V4 | `V4__fix_vistoria_usuario_nullable.sql` | `usuario_id` nullable na vistoria; FK com `ON DELETE SET NULL` |
| V5 | `V5__add_auth_to_usuario.sql` | Coluna `senha_hash` (BCrypt) na tabela `usuario` |

---

## Primeiros Passos Após o Deploy

Os usuários seed não possuem senha definida. Siga o fluxo abaixo para o primeiro acesso:

**Passo 1 — Descubra os UUIDs dos usuários seed**
```bash
GET http://localhost:8080/usuarios
```

**Passo 2 — Defina a senha**
```bash
POST http://localhost:8080/auth/definir-senha/{uuid}
Content-Type: application/json

{ "senha": "suasenha123" }
```

**Passo 3 — Faça login e obtenha o token**
```bash
POST http://localhost:8080/auth/login
Content-Type: application/json

{ "email": "admin@sgf.br", "senha": "suasenha123" }
```

**Usuários seed disponíveis**

| Nome | Email | Papel |
|---|---|---|
| Admin SGF | `admin@sgf.br` | ADMIN |
| Marina Costa | `marina.costa@ucsal.br` | GESTOR |
| Carlos Andrade | `carlos.andrade@ucsal.br` | FISCAL |

---

## Regras de Negócio

**Obras**
- Código único em todo o sistema
- `dataPrevisaoConclusao` não pode ser anterior a `dataInicio`
- Não pode ser deletada se tiver itens vinculados
- Transições de status são unidirecionais e controladas pelo backend

**Usuários**
- Com vistorias registradas, não pode ser removido sem `?forcar=true`
- Com `forcar=true`, vistorias são preservadas com `usuario_id = NULL` — exibidas no frontend como *"Fiscal desvinculado"* com badge visual amigável
- Email único por constraint no banco

**Vistorias e Logs**
- Registros de auditoria imutáveis — sem endpoints de DELETE ou UPDATE
- Um log deve referenciar um item pertencente à mesma obra da vistoria

---

## Decisões Arquiteturais

**Monorepo com pacotes independentes**
Backend e frontend são projetos completamente independentes (builds, dependências, deploys separados), colocados no mesmo repositório para facilitar o versionamento conjunto, PRs cruzados e visibilidade total do sistema por quem revisa o código.

**JWT stateless no backend**
Elimina armazenamento de sessão no servidor, facilitando escalabilidade horizontal. O `JwtAuthFilter` valida a assinatura e extração de claims sem consultar o banco em toda requisição — apenas confirma que o email do token ainda existe.

**Flyway em vez de `ddl-auto: update`**
`ddl-auto: update` é não-determinístico em produção. Flyway garante rastreabilidade, versionamento explícito e execução idempotente de cada mudança de schema — obrigatório para sistemas com dados reais e histórico de auditoria.

**`ON DELETE SET NULL` em `vistoria.usuario_id`**
Fiscais são desligados, mas o histórico de vistorias que realizaram não deve desaparecer. `SET NULL` preserva a integridade do histórico enquanto permite remoção do usuário. O frontend exibe o estado de forma amigável sem strings feias como `[Usuário removido]`.

**CSS Variables para temas no frontend**
Troca de tema via `data-theme` no `<html>` sem lógica condicional no JSX. Qualquer componente usa `var(--card)`, `var(--text)` etc. — a alternância dark/light é completamente transparente para o código dos componentes.

**CSV gerado client-side**
Para o volume atual (uma obra por vez), geração via `Blob` no browser é instantânea e não adiciona carga ao servidor. Inclui BOM UTF-8 para compatibilidade com Excel. Mover para o backend só faria sentido com relatórios multi-obra ou geração de PDF.

**`Promise.allSettled` no carregamento de vistorias**
A página de vistorias agrega dados de múltiplas obras em paralelo. `Promise.all` cancelaria tudo se uma obra falhasse. `Promise.allSettled` exibe as obras que carregaram com sucesso independentemente das que falharam.

---

<div align="center">

`br.leetjourney` · PROVIC · UCSAL · SGF v5.0 + Dashboard v10.0

</div>

