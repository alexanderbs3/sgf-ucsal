# SGF Dashboard — Sistema de Gestão de Fiscalização

> **Versão:** 10.0.0 · **Runtime:** React 19 + Vite 8 · **Estilo:** Tailwind CSS v3 · **Backend:** Spring Boot 3.4.5

Interface web para gestão e fiscalização de obras públicas municipais. Dashboard com autenticação JWT real, controle de acesso por papel, tema claro/escuro, exportação de CSV e visualizações com Recharts.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Técnica](#stack-técnica)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Autenticação e Controle de Acesso](#autenticação-e-controle-de-acesso)
5. [Páginas e Funcionalidades](#páginas-e-funcionalidades)
6. [Componentes Reutilizáveis](#componentes-reutilizáveis)
7. [Camada de API](#camada-de-api)
8. [Sistema de Temas](#sistema-de-temas)
9. [Preferências Persistidas](#preferências-persistidas)
10. [Variáveis de Ambiente](#variáveis-de-ambiente)
11. [Como Executar](#como-executar)
12. [Build para Produção](#build-para-produção)
13. [Decisões Técnicas](#decisões-técnicas)

---

## Visão Geral

O SGF Dashboard consome a API REST do backend SGF e entrega:

- **Login real com JWT** — sem seletor de usuário fake; token armazenado em `localStorage` e injetado automaticamente em todas as requisições via interceptor Axios.
- **RBAC no frontend** — cada botão, ação e seção é condicionado ao papel do usuário autenticado (`ADMIN`, `GESTOR`, `FISCAL`), espelhando as regras do backend.
- **Dashboard por obra** — KPIs em tempo real, linha do tempo de vistorias, tabela de itens com filtros, painel de detalhe e exportação de CSV gerado client-side.
- **Tema claro/escuro** — alternância por CSS variables, persistida no `localStorage`, com detecção automática da preferência do sistema operacional.
- **Preferências persistidas** — notificações, animações e formato de data são salvas em `localStorage` e sobrevivem ao reload.

---

## Stack Técnica

| Categoria | Tecnologia | Versão |
|---|---|---|
| UI Library | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Roteamento | React Router DOM | 7.14 |
| HTTP Client | Axios | 1.15 |
| Gráficos | Recharts | 3.8 |
| Estilo | Tailwind CSS | 3.4 |
| Fontes | Syne · DM Sans · JetBrains Mono | Google Fonts |
| Linting | ESLint 9 | — |

---

## Estrutura de Arquivos

```
src/
├── api/
│   ├── client.js          # Instância Axios com interceptors JWT e tratamento de 401
│   └── sgf.js             # Todas as chamadas à API organizadas por domínio
│
├── context/
│   ├── AuthContext.jsx    # Estado de autenticação, login, logout, função pode()
│   └── ThemeContext.jsx   # Alternância dark/light, persistência em localStorage
│
├── components/
│   ├── Layout.jsx         # Wrapper com Sidebar + área de conteúdo
│   ├── Sidebar.jsx        # Navegação lateral com dados dinâmicos do usuário + logout
│   ├── Header.jsx         # Barra superior com busca, relógio, notificações e perfil
│   ├── AdicionarItemModal.jsx  # Modal para criação de itens em uma obra
│   └── ui.jsx             # Biblioteca de componentes atômicos compartilhados
│
├── pages/
│   ├── Login.jsx          # Tela de autenticação com email/senha
│   ├── Obras.jsx          # Listagem de obras com filtros e busca
│   ├── ObraDashboard.jsx  # Dashboard individual de uma obra
│   ├── Vistorias.jsx      # Histórico global de vistorias
│   ├── Analytics.jsx      # Gráficos e métricas agregadas
│   ├── Usuarios.jsx       # CRUD de usuários (Admin only)
│   └── Configuracoes.jsx  # Preferências do usuário com persistência real
│
├── App.jsx                # Roteamento principal com guarda de autenticação
├── main.jsx               # Entry point — monta os providers na árvore
└── index.css              # CSS variables de tema, animações e classes utilitárias
```

---

## Autenticação e Controle de Acesso

### Fluxo de autenticação

```
1. Usuário acessa qualquer rota
        │
        ▼
2. AuthProvider verifica localStorage['sgf_token']
        │
        ├── Token encontrado → GET /auth/me para validar e popular estado
        │         ├── Válido   → exibe a aplicação normalmente
        │         └── Inválido → limpa token, exibe Login
        │
        └── Sem token → exibe Login
                │
                ▼
3. Usuário preenche email + senha → POST /auth/login
        │
        ├── Sucesso → salva token em localStorage, popula AuthContext, redireciona
        └── Falha   → exibe mensagem de erro na tela de login
```

### Guarda de rota

A guarda é implementada diretamente no `App.jsx` — não há componente `ProtectedRoute` separado. Se `usuario === null` após o carregamento inicial, renderiza `<Login />` no lugar de qualquer rota:

```jsx
if (!usuario) return <Login />
```

O interceptor Axios em `client.js` lida com tokens expirados em tempo real: qualquer resposta `401` limpa o `localStorage` e redireciona para `/` automaticamente, sem necessidade de verificação manual em cada chamada.

### Permissões por papel — `pode(permissao)`

O `AuthContext` expõe a função `pode()`, usada em todo o frontend para condicionar rendering:

```jsx
const { pode } = useAuth()

// Condicionar botão
{pode('criar_obra') && <button>Nova Obra</button>}

// Condicionar seção inteira
{pode('gerenciar_usuarios') && <Usuarios />}
```

**Mapa de permissões por papel:**

| Permissão | FISCAL | GESTOR | ADMIN |
|---|:---:|:---:|:---:|
| `ver_dashboard` | ✅ | ✅ | ✅ |
| `ver_relatorios` | ❌ | ✅ | ✅ |
| `ver_analytics` | ❌ | ✅ | ✅ |
| `exportar` | ✅ | ✅ | ✅ |
| `alterar_status_obra` | ✅ | ✅ | ✅ |
| `adicionar_item` | ✅ | ✅ | ✅ |
| `criar_obra` | ❌ | ✅ | ✅ |
| `editar_obra` | ❌ | ✅ | ✅ |
| `deletar_obra` | ❌ | ❌ | ✅ |
| `editar_item` | ❌ | ✅ | ✅ |
| `deletar_item` | ❌ | ✅ | ✅ |
| `gerenciar_usuarios` | ❌ | ❌ | ✅ |

---

## Páginas e Funcionalidades

### Login (`/`)

Exibida quando não há usuário autenticado. Contém:

- Campos de email e senha com validação HTML5
- Toggle para mostrar/ocultar senha
- Spinner durante autenticação
- Exibição de erros retornados pelo backend (`401`, `422`, etc.)
- Redireciona automaticamente para Obras após login bem-sucedido

---

### Obras (`/`)

Listagem completa das obras com:

- **Busca em tempo real** por código ou descrição (debounced)
- **Filtros por status:** PLANEJADA, EM_ANDAMENTO, PARALISADA, CONCLUIDA
- **Cards responsivos** com código, descrição, status badge e data de início
- **Botão "Nova Obra"** visível apenas para `GESTOR` e `ADMIN`
- Navegação para o dashboard individual ao clicar na obra

---

### Dashboard da Obra (`/obras/:id`)

Página mais completa do sistema. Dividida em abas:

**Aba — Visão Geral**
- Cards de KPIs: total de itens, aprovados, reprovados, em vistoria, pendentes
- Percentual de aprovação com barra de progresso
- Distribuição por classe (A, B, C)
- Informações da obra: código, datas, status atual

**Aba — Itens**
- Tabela filtrável por status e classificação
- Busca por descrição
- `ClasseBadge` (A/B/C) e `StatusBadge` por item
- Botão **Detalhe** abre painel expansível inline com informações do item e link para a aba Vistorias
- Botão **"Adicionar Item"** via `AdicionarItemModal` (restrito por permissão)
- Atualização de status via PATCH (restrito por permissão)

**Aba — Vistorias**
- Histórico cronológico de todas as vistorias da obra
- Avatar com inicial do fiscal; fiscal removido exibido como *"Fiscal desvinculado"* com ícone tracejado e badge `removido`
- Data/hora e observações de cada vistoria

**Aba — Timeline**
- Linha do tempo visual das vistorias agrupadas por data

**Exportar CSV**
- Geração client-side via `Blob` — sem chamada ao backend
- Arquivo inclui: resumo da obra, KPIs, tabela de itens e histórico de vistorias
- Nome do arquivo: `sgf_{codigo}_{data}.csv`
- BOM UTF-8 (`\uFEFF`) para compatibilidade com Excel
- Botão visível para quem tem permissão `exportar`

**Alterar Status da Obra**
- Modal com as transições permitidas a partir do status atual
- Restrito a quem tem permissão `alterar_status_obra`

---

### Histórico de Vistorias (`/relatorios`)

- Agrega vistorias de **todas** as obras em uma única tabela
- Filtro por obra via dropdown
- Busca por código de obra ou nome do fiscal
- Contador de resultados em tempo real
- Fiscal removido exibido de forma amigável (ícone + texto *"Fiscal desvinculado"* + badge)
- Carregamento paralelo com `Promise.allSettled` — falha de uma obra não impede as outras

---

### Analytics (`/analytics`)

- Gráficos agregados de todas as obras via Recharts
- Visível apenas para `GESTOR` e `ADMIN`

---

### Usuários (`/usuarios`)

- Listagem de todos os usuários com papel, email e data de criação
- **Criar usuário** — modal com nome, email e papel (ADMIN only)
- **Editar usuário** — modal de edição (ADMIN only)
- **Remover usuário:**
  - Tentativa normal: bloqueia se o usuário tiver vistorias vinculadas
  - Após erro: exibe bloco explicativo e botão **"Forçar remoção (Admin)"**
  - Remoção forçada envia `?forcar=true` → backend desvincula vistorias e deleta
- Filtro por papel na listagem
- Visível apenas para `ADMIN` (guarda via `pode('gerenciar_usuarios')`)

---

### Configurações (`/configuracoes`)

- **Seção Conta** — exibe nome, email e papel do usuário logado (somente leitura)
- **Seção Interface:**
  - Tema claro/escuro (toggle — persiste automaticamente via `ThemeContext`)
  - Animações — ativa/desativa transições globais via CSS variable `--animation-duration`
  - Notificações — ativa/desativa o badge do sino no Header
  - Formato de data — `pt-BR`, `en-US` ou `ISO 8601`
- **Seção Sistema** — versão, stack e tecnologias
- **Botão "Salvar preferências"** — persiste animações, notificações e formato de data em `localStorage['sgf_prefs']`; exibe confirmação visual por 2,5 segundos

---

## Componentes Reutilizáveis

Todos definidos em `src/components/ui.jsx` e importados onde necessário.

| Componente | Descrição |
|---|---|
| `ClasseBadge` | Badge colorido para classes A (vermelho), B (amarelo), C (azul) |
| `StatusBadge` | Badge com cor e label para status de obra e item |
| `Card` | Container com animação `fade-up`, suporte a `hover` e `onClick` |
| `MetricCard` | Card de KPI com label, valor, subtítulo, cor, ícone e tendência |
| `Loading` | Spinner centralizado com animação |
| `Empty` | Estado vazio com ícone e texto configurável |
| `ErrorMsg` | Alerta de erro com ícone e mensagem |
| `SectionHeader` | Cabeçalho de seção com título, subtítulo e slot de ações |
| `FilterBtn` | Botão de filtro com estado ativo/inativo |
| `ChartTooltip` | Tooltip customizado para gráficos Recharts |

---

## Camada de API

### `src/api/client.js`

Instância Axios central com dois interceptors:

**Request interceptor** — injeta o JWT em toda requisição:
```javascript
config.headers.Authorization = `Bearer ${localStorage.getItem('sgf_token')}`
```

**Response interceptor** — trata erros globalmente:
- `401` → limpa `localStorage` e redireciona para `/` (token expirado ou inválido)
- Qualquer erro → extrai `mensagem` ou `message` do corpo da resposta e rejeita com `Error(msg)` legível

### `src/api/sgf.js`

Todas as funções organizadas por domínio. Cada uma retorna a `data` diretamente (sem o envelope Axios):

**Auth**

| Função | Método | Endpoint |
|---|---|---|
| `login(email, senha)` | POST | `/auth/login` |
| `me()` | GET | `/auth/me` |
| `definirSenha(id, senha)` | POST | `/auth/definir-senha/{id}` |

**Obras**

| Função | Método | Endpoint |
|---|---|---|
| `getObras()` | GET | `/obras` |
| `buscarObras(q, status)` | GET | `/obras/buscar` |
| `getObra(id)` | GET | `/obras/{id}` |
| `getDashboard(id)` | GET | `/obras/{id}/dashboard` |
| `getTimelineVistorias(id)` | GET | `/obras/{id}/timeline` |
| `criarObra(dto)` | POST | `/obras` |
| `atualizarObra(id, dto)` | PUT | `/obras/{id}` |
| `atualizarStatusObra(id, status)` | PATCH | `/obras/{id}/status` |
| `deletarObra(id)` | DELETE | `/obras/{id}` |

**Itens**

| Função | Método | Endpoint |
|---|---|---|
| `getItens(obraId, classificacao)` | GET | `/itens` |
| `buscarItens(obraId, filtros)` | GET | `/itens/buscar` |
| `getItem(id)` | GET | `/itens/{id}` |
| `criarItem(dto)` | POST | `/itens` |
| `atualizarItem(id, dto)` | PUT | `/itens/{id}` |
| `atualizarStatusItem(id, status)` | PATCH | `/itens/{id}/status` |
| `deletarItem(id)` | DELETE | `/itens/{id}` |

**Vistorias**

| Função | Método | Endpoint |
|---|---|---|
| `getVistorias(obraId)` | GET | `/vistorias` |
| `getVistoria(id)` | GET | `/vistorias/{id}` |
| `criarVistoria(dto)` | POST | `/vistorias` |

**Logs**

| Função | Método | Endpoint |
|---|---|---|
| `getLogs(vistoriaId)` | GET | `/logs` |
| `getLogsPorItem(itemId)` | GET | `/logs` |
| `criarLog(dto)` | POST | `/logs` |

**Usuários**

| Função | Método | Endpoint |
|---|---|---|
| `getUsuarios()` | GET | `/usuarios` |
| `getUsuario(id)` | GET | `/usuarios/{id}` |
| `getPapeis()` | GET | `/usuarios/papeis` |
| `criarUsuario(dto)` | POST | `/usuarios` |
| `atualizarUsuario(id, dto)` | PUT | `/usuarios/{id}` |
| `atualizarPapelUsuario(id, papel)` | PATCH | `/usuarios/{id}/papel` |
| `deletarUsuario(id, forcar)` | DELETE | `/usuarios/{id}?forcar=` |

**Lookups**

| Função | Método | Endpoint |
|---|---|---|
| `getClassificacoes()` | GET | `/classificacoes` |
| `getOrigensDado()` | GET | `/origens-dado` |

---

## Sistema de Temas

O tema é controlado por **CSS variables** definidas em `index.css` e aplicadas via atributo `data-theme` no `<html>`. Não há classes condicionais no JSX — toda a troca é feita na raiz do CSS.

**Variáveis de tema:**

| Variável | Dark (padrão) | Light |
|---|---|---|
| `--bg` | `#080C14` | `#F0F4FA` |
| `--surface` | `#0F1520` | `#FFFFFF` |
| `--card` | `#141B27` | `#FFFFFF` |
| `--border` | `#1C2840` | `#D1DCF0` |
| `--text` | `#E8EDF5` | `#0F1520` |
| `--subtle` | `#8B97AF` | `#4A5568` |
| `--muted` | `#3D4F6B` | `#94A3B8` |
| `--accent` | `#3B82F6` | `#2563EB` |

**Fontes (Tailwind config):**

| Família | Uso | Classe Tailwind |
|---|---|---|
| Syne | Títulos e labels de destaque | `font-display` |
| DM Sans | Corpo de texto e interfaces | `font-body` |
| JetBrains Mono | Códigos, badges e timestamps | `font-mono` |

**Persistência:** o tema é salvo em `localStorage['sgf_theme']`. Na inicialização, `ThemeContext` lê essa chave; se ausente, detecta `prefers-color-scheme` do sistema operacional.

---

## Preferências Persistidas

O sistema persiste três fontes de dados independentes no `localStorage`:

| Chave | Conteúdo | Responsável |
|---|---|---|
| `sgf_token` | JWT de autenticação | `AuthContext` + `client.js` |
| `sgf_theme` | `"dark"` ou `"light"` | `ThemeContext` |
| `sgf_prefs` | `{ notificacoes, animacoes, formatoData }` | `Configuracoes.jsx` |

As preferências em `sgf_prefs` são lidas por `Header.jsx` (para o badge de notificações) e aplicadas globalmente (animações via CSS variable) no momento em que `Configuracoes.jsx` é montado.

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL da API backend |

Crie um arquivo `.env` na raiz do projeto (já presente com o valor padrão):

```bash
VITE_API_URL=http://localhost:8080
```

Em produção, substitua pelo endereço público do backend:

```bash
VITE_API_URL=https://api.sgf.seudominio.gov.br
```

> O proxy do Vite em `vite.config.js` redireciona `/obras`, `/itens`, `/vistorias` e `/logs` para `localhost:8080` **apenas em desenvolvimento** (`npm run dev`). Em produção, o build estático não usa proxy — `VITE_API_URL` deve apontar para o backend diretamente.

---

## Como Executar

### Pré-requisitos

- Node.js 20+ (LTS)
- npm 10+
- Backend SGF rodando em `http://localhost:8080`

### Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Primeiro acesso

O backend SGF precisa ter os usuários seed com senha definida. Caso ainda não tenha feito isso, consulte a seção **"Primeiros Passos Após o Deploy"** no README do backend.

Credenciais padrão dos usuários seed:

| Email | Papel | Senha (após definir) |
|---|---|---|
| `admin@sgf.br` | ADMIN | A que você definiu via `/auth/definir-senha` |
| `marina.costa@ucsal.br` | GESTOR | A que você definiu via `/auth/definir-senha` |
| `carlos.andrade@ucsal.br` | FISCAL | A que você definiu via `/auth/definir-senha` |

---

## Build para Produção

```bash
# Gera os arquivos otimizados em /dist
npm run build

# Pré-visualizar o build localmente antes de fazer deploy
npm run preview
```

O build gera arquivos estáticos em `dist/` prontos para servir em qualquer CDN, NGINX ou serviço estático (Vercel, Netlify, S3, etc.).

**Exemplo de configuração NGINX para SPA (React Router):**

```nginx
server {
    listen 80;
    root /var/www/sgf-dashboard;
    index index.html;

    # Redireciona todas as rotas para o index.html (necessário para React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache agressivo para assets com hash no nome
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Decisões Técnicas

**Por que JWT no `localStorage` e não em cookie `HttpOnly`?**
Cookies `HttpOnly` são mais seguros contra XSS, mas exigem configuração de CORS com `credentials: true` e `SameSite` no backend — aumentando a complexidade de deploy. Para o escopo deste sistema (intranet municipal), `localStorage` foi escolhido pela simplicidade. Em sistemas expostos à internet com dados sensíveis, a migração para cookies `HttpOnly` seria a decisão correta.

**Por que interceptor de 401 no Axios e não verificação de expiração local?**
Verificar a expiração do JWT no frontend exigiria decodificar o token e comparar timestamps — mas o relógio do cliente pode estar desajustado. Deixar o backend rejeitar com `401` e tratar no interceptor é mais confiável e centraliza o comportamento em um único lugar.

**Por que geração de CSV no frontend (client-side)?**
Para o volume de dados atual (uma obra por vez), gerar o CSV no browser via `Blob` é instantâneo e não adiciona carga ao servidor. Mover para o backend só faria sentido em cenários de relatórios multi-obra, geração de PDF ou dados que o frontend não tem acesso direto.

**Por que CSS variables e não classes condicionais do Tailwind para o tema?**
Classes condicionais do Tailwind para dark mode (`dark:bg-gray-900`) precisam do compilador para gerar as classes correspondentes — e qualquer propriedade não prevista no Tailwind precisaria de extensão do config. CSS variables permitem alterar o tema trocando um único atributo no `<html>` sem impactar o JSX dos componentes.

**Por que `Promise.allSettled` no carregamento de vistorias?**
A página de Vistorias carrega os dados de todas as obras em paralelo. Com `Promise.all`, uma única obra com erro de rede cancela tudo. Com `Promise.allSettled`, as obras que carregaram com sucesso são exibidas normalmente, e a falha de uma não afeta as demais.

---

## Namespace

`br.leetjourney` · PROVIC · UCSAL · SGF Dashboard v10.0