# Vipper Ping

> Painel interno da **VipperDev** para gestão de projetos, atividades, agenda, membros e controle de ponto.

Aplicação web (SPA) em **React + Vite + TypeScript**, estilizada com **Tailwind CSS** e autenticada via **Supabase**.

---

## ✨ Funcionalidades

- **Dashboard** — visão geral com KPIs e atividades recentes.
- **Projetos** — criação, edição, notas, documentos e acompanhamento de progresso.
- **Atividades** — tarefas com status, prioridade e subtarefas.
- **Agenda** — eventos e compromissos da equipe.
- **Membros** — diretório da equipe com perfis detalhados.
- **Relatórios** — métricas restritas aos **sócios**.
- **Ponto** — registro de horas para **estagiários**.
- **Temas claro/escuro** — alternância persistente, com sidebar sempre em tom carvão (âncora da marca).
- **UI em PT-BR** — toda a interface, status e mensagens em português.

## 👥 Papéis

A navegação e o acesso às rotas são definidos por papel:

| Papel | Acesso adicional |
|---|---|
| `socio` | Relatórios |
| `estagiario` | Ponto |

Rotas protegidas por guards (`RequireAuth`, `RequireSocio`, `RequireEstagiario`), com perfil carregado da tabela `profiles` no Supabase.

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + React Router 6 |
| Estilo | Tailwind CSS 3 (`darkMode: 'class'`) + CSS custom properties |
| Ícones | [lucide-react](https://lucide.dev) |
| Tipografia | Geist (texto) + JetBrains Mono (metadados) |
| Build | Vite 5 |
| Auth / dados | Supabase |

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Um projeto Supabase (URL e chave anônima)

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (ver abaixo)
cp .env.example .env   # e preencher os valores

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

> ⚠️ O arquivo `.env` está no `.gitignore` e **não** deve ser commitado.

---

## 📜 Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Pré-visualização do build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |

---

## 📁 Estrutura

```
src/
├── components/
│   ├── layout/      # Layout, Sidebar
│   └── ui/          # Button, Badge, Modal, FormField, KpiCard, ...
├── contexts/        # Auth, Theme, Toast
├── lib/             # api, supabase, hooks, types
├── pages/           # Dashboard, Projetos, Atividades, Agenda, Membros, ...
└── mocks/           # dados de exemplo
```

---

## 🎨 Design

A identidade visual combina **roxo Viper** (marca), **verde neon** (acento), **carvão** (superfícies escuras) e **papel** off-white (modo claro) — um visual *dark-tech com toque editorial*.

Tokens, componentes e diretrizes completas estão documentados em [DESIGN.md](DESIGN.md).

---

## ☁️ Deploy

O build de produção é gerado com `npm run build` e servido a partir de `dist/` (build estático). Garanta que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam configuradas no ambiente de deploy.

---

_Projeto interno da VipperDev._
