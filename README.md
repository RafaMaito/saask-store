# Saask Store AI

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-4db33d)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)](https://docs.docker.com/compose/)

> Plataforma SaaS Multi-tenant com isolamento lógico de dados, RBAC com Superadmin e Agente de IA Conversacional com Tool Calling para consulta ao banco em tempo real. Suporte a múltiplos provedores de LLM (OpenAI, DeepSeek, Claude, Qwen, OpenRouter, Ollama) selecionáveis via painel do Superadmin.

---

## Setup

### Pré-requisitos

- **Node.js** ≥ 18 LTS
- **Docker** + Docker Compose (recomendado) **ou** MongoDB rodando localmente
- **Chave de API OpenAI** (ou compatível)

### Docker Compose (2 minutos)

```bash
git clone saask-store-ai && cd saask-store-ai
cp backend/.env.example backend/.env   # preencha OPENAI_API_KEY
npm run up                             # sobe MongoDB + Backend + Frontend
```

| Serviço  | URL                            |
| -------- | ------------------------------ |
| Frontend | `http://localhost:3000`        |
| Backend  | `http://localhost:5000`        |
| Health   | `http://localhost:5000/health` |

### Desenvolvimento Local (Hot-Reload)

```bash
npm run setup          # instala dependências
npm run seed:local     # popula banco com dados de teste
npm run dev            # hot-reload frontend + backend
```

### Credenciais de Teste

| Papel                               | E-mail                 | Senha         |
| ----------------------------------- | ---------------------- | ------------- |
| **Superadmin** (dono da plataforma) | `superadmin@admin.com` | `password123` |
| Admin — AutoMotors Brasil           | `admin@automotors.com` | `password123` |
| User — AutoMotors Brasil            | `user@automotors.com`  | `password123` |
| Admin — HospiTech Equipamentos      | `admin@hospitech.com`  | `password123` |
| User — HospiTech Equipamentos       | `user@hospitech.com`   | `password123` |

> Use os botões de **Acesso Rápido** na tela de login para preencher credenciais automaticamente.

### Scripts

| Comando              | Descrição                                                |
| -------------------- | -------------------------------------------------------- |
| `npm run up`         | Docker Compose (`--build -d`) + exibe URLs e credenciais |
| `npm run down`       | Derruba todos os contêineres                             |
| `npm run dev`        | Hot-reload Frontend + Backend                            |
| `npm run build`      | Compila TypeScript (Backend) + build Vite (Frontend)     |
| `npm run start`      | Modo produção                                            |
| `npm run seed`       | Popula banco via Docker                                  |
| `npm run seed:local` | Popula banco diretamente                                 |
| `npm run test`       | Suíte de testes unitários (Vitest)                       |

---

## Roles & Permissions

Três níveis hierárquicos com responsabilidades e restrições bem definidas:

```
Superadmin (Plataforma)
  ├── Admin (Empresa A)          Admin (Empresa B)
  │     ├── User                   ├── User
  │     └── User                   └── User
  └── Admin (Empresa C) ...
```

### Superadmin

Cria, ativa, desativa e remove empresas. Escolhe o provedor de IA global, edita o System Prompt do agente e gerencia a chave de API.

### Admin

CRUD completo de produtos da **sua** empresa. Acessa Analytics (cliques, buscas, estoque) e o Chat com IA.

### User

Lista produtos da **sua** empresa e usa o Chat com IA. Sem acesso a criação, edição, exclusão ou analytics.

### Isolamento Multi-Tenant

O `company_id` **jamais** trafega no body ou query param. O fluxo é:

```
1. Login → JWT assinado com { userId, companyId, role }
2. Requisição → middleware authenticateJWT extrai e valida o token
3. enforceTenantContext → define req.companyId a partir do JWT
4. Repository → toda query MongoDB inclui { company_id: req.companyId }
5. Tool Calling → companyId injetado server-side (LLM nunca o vê)
```

Se um usuário da Empresa A tentar acessar produtos da Empresa B, o middleware de tenant + o repository garantem que a query retorne vazio.

---

## Agente de IA & Multi-LLM Factory

### Fluxo de Tool Calling

1. Usuário envia: _"Tem cadeira de rodas?"_
2. Backend extrai `companyId` do JWT (modelo de IA **nunca** recebe esse dado)
3. LLM decide chamar a tool `search_products({ query: "cadeira" })`
4. Backend executa a busca no MongoDB com filtro obrigatório de `company_id`
5. Resultados retornam ao LLM, que formula resposta natural
6. Resposta + cards de produto enviados ao frontend via SSE streaming

### Factory Pattern Multi-Provedor

```
AIFactory.getActiveProvider()
  ├── Lê SystemConfig do MongoDB
  │     ├── aiProvider: openai | deepseek | claude | qwen | openrouter | ollama
  │     ├── model: gpt-4o-mini | deepseek-chat | claude-3-opus | ...
  │     └── apiKey + baseURL
  └── Retorna ILLMProvider
        └── OpenAIProvider (compatível com OpenAI SDK — cobre 6+ provedores)
```

Um adaptador único cobre todos os provedores compatíveis com o formato OpenAI (`/v1/chat/completions`). Para APIs incompatíveis, basta implementar a interface `ILLMProvider`.

### System Prompt Customizável

O Superadmin edita o System Prompt via painel Settings, ajustando tom e regras de negócio para todos os tenants simultaneamente, sem deploy.

---

## Arquitetura e Stack Tecnológica

A arquitetura prioriza isolamento de dados, baixa latência na comunicação com IA e manutenibilidade.

- **Node.js + Express (TypeScript strict):** I/O não-bloqueante ideal para streaming SSE com provedores de IA. TypeScript garante contratos tipados entre camadas. Zod para validação type-safe de entrada sem dependências externas.
- **MongoDB + Mongoose ODM:** Schemaless permite catálogos com atributos dinâmicos por produto (ex: `Ano`, `Combustível` para veículos; `RegistroAnvisa` para hospitalares) sem migrações de schema.
- **Clean Architecture + Repository Pattern:** Camadas estritas — `controllers/` (HTTP), `services/` (negócio), `middlewares/` (cross-cutting). O `ProductService` atua como Repository que **sempre** injeta `company_id` na query, eliminando risco humano de vazamento entre tenants.
- **`company_id` via JWT:** O tenant trafega como claim do token assinado criptograficamente, nunca como parâmetro de URL ou body. O middleware `enforceTenantContext` fixa o escopo a partir do JWT, sem possibilidade de sobrescrita pelo cliente.
- **SSE (Server-Sent Events):** Streaming de tokens nativo do HTTP, reconexão automática no browser, sem overhead de WebSockets. Cada mensagem do usuário é uma nova requisição POST — canal unidirecional é suficiente.
- **Zustand + React Query:** Zustand gerencia estado síncrono (auth, tema) com API mínima e persistência em `localStorage`. React Query cuida do cache e sincronização de dados assíncronos do backend.
- **Tailwind CSS + CSS Variables:** Dark Mode via classe `dark:` combinado com variáveis CSS para alternância instantânea. Design System centralizado em `tailwind.config.js`. PurgeCSS remove estilos não utilizados no build.
- **Docker Compose:** Ambiente reprodutível com MongoDB, Backend e Frontend orquestrados em rede isolada.
- **Vitest:** Testes unitários com foco em segurança (JWT, bcrypt, tenant isolation). Mais rápido que Jest e nativo ESM.

---

## Estrutura do Projeto

```
saask-store-ai/
├── docker-compose.yml
├── package.json                     # Scripts monorepo
├── backend/
│   ├── src/
│   │   ├── controllers/             # auth, chat, company, product, system, user
│   │   ├── middlewares/             # auth (JWT), tenant (isolamento), rbac (roles), error
│   │   ├── models/                  # User, Company, Product, SystemConfig
│   │   ├── services/
│   │   │   ├── product.service.ts   # Repository com filtro obrigatório company_id
│   │   │   └── ai/                  # Factory + OpenAIProvider + interface ILLMProvider
│   │   ├── routes/                  # Agregador /api/* + módulos por domínio
│   │   └── utils/seed.ts            # Popula 2 empresas, 10+ produtos cada
│   └── tests/                       # auth, product, tenant isolation
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios client + endpoints (auth, chat SSE, products...)
│   │   ├── components/              # ThemeToggle, AppLayout, ProductModal, PageHeader
│   │   ├── pages/                   # Login, Dashboard, Chat, Analytics, Companies, Settings
│   │   ├── store/                   # Zustand: authStore, themeStore
│   │   └── types/                   # IUser, IProduct, IChatMessage...
│   └── tailwind.config.js           # Paleta brand + dark mode
└── scripts/                         # info.js (pós-deploy), postbuild.js
```

---

## Testes

Foco nos **comportamentos críticos de segurança**:

| Arquivo                 | O que testa                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `tests/auth.test.ts`    | JWT sign/verify, rejeição de tokens inválidos, bcrypt hash/compare       |
| `tests/product.test.ts` | Validação de preço promocional < original, atributos dinâmicos flexíveis |
| `tests/tenant.test.ts`  | Filtro `company_id` obrigatório, prevenção de vazamento entre tenants    |

```bash
npm run test                              # todos
npx vitest run tests/tenant.test.ts       # apenas tenant isolation
```

---

## Interface (UI/UX)

Design com Dark Mode, responsividade mobile-first e micro-interações.

| Página        | Destaques UX                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Login**     | Acesso Rápido (preenche credenciais). Toggle dark/light.                                                  |
| **Dashboard** | Cards com tooltip. Admin: CRUD. User: somente leitura. Filtros por busca, categoria e promoção.           |
| **Chat**      | Streaming SSE com indicador de digitação. Cards de produto renderizados via tool call. Scroll automático. |
| **Analytics** | Tabela ordenável com cliques, buscas e estoque. Admin apenas.                                             |
| **Companies** | Gestão de tenants (Superadmin). Modal com senha para ativar/desativar/deletar.                            |
| **Settings**  | Seleção de provedor IA (6 opções), API key, editor de System Prompt. Superadmin apenas.                   |

---

## Visão de Produção

Evoluções planejadas para ambientes de missão crítica:

- **Isolamento de Carga e Custos (BYOK):** Chaves de API individuais por tenant, isolando quotas e permitindo tarifação por uso real.
- **Segurança de Sessão:** Migração do JWT de `localStorage` para **HttpOnly Cookies**, mitigando vetores de ataque XSS.
- **Otimização de Banco:** Índices compostos (`{ company_id: 1, category: 1 }`) em todas as coleções para queries O(log N) com crescimento de tenants.
- **Rate Limiting Distribuído:** Redis para limitar requisições por tenant, prevenindo que picos no chat de uma empresa degradem a plataforma.
- **Cache de LLM:** Redis com TTL de 5min (`hash(company_id + query)`) reduzindo ~40% das chamadas à API de IA.
- **Fila Assíncrona:** BullMQ para jobs pesados (seed, relatórios, exportação).
- **CDN + Read Replicas:** CloudFront/Cloudflare para assets React. Réplicas de leitura MongoDB separando carga transacional da analítica.
- **Observabilidade:** OpenTelemetry com spans por rota + atributo `company_id`. Prometheus para métricas de negócio (`chat_messages_total`, `tool_calls_total`). Alertmanager para latência p95 > 2s e erro rate > 5%.
- **Segurança Adicional:** Helmet.js (CSP, HSTS), CORS com allowlist por tenant, Vault para rotação de secrets, audit logging estruturado de ações admin/superadmin, Zod em todos os endpoints.
- **CI/CD:** Lint + Type Check → Testes → Build Docker → Registry → Deploy Staging → Testes Integração → Deploy Produção.
- **Kubernetes:** HPA por CPU/memória nos pods do backend com Helm Charts.

---

