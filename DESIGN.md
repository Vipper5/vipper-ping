# Vipper Ping — Documentação de Design

> Sistema de gestão de projetos, atividades e ponto para a VipperDev.
> Aplicação web (SPA) em React + Vite + TypeScript, estilizada com Tailwind CSS, autenticada via Supabase e publicada na Vercel ([vipper-ping.vercel.app](https://vipper-ping.vercel.app)).

---

## 1. Visão geral

O **Vipper Ping** é o painel interno da VipperDev. Ele organiza projetos, atividades (tarefas), agenda, membros e o controle de ponto dos estagiários, com relatórios restritos aos sócios.

A identidade visual combina:

- **Roxo Viper** como cor de marca / ação primária.
- **Verde neon** como acento de destaque / energia.
- **Carvão** (quase preto) para a sidebar e superfícies em modo escuro.
- **Papel** (off-white quente) como fundo do modo claro, dando ao app um ar editorial e menos "frio".

O resultado é um visual **dark-tech com toque editorial**: tipografia geométrica, detalhes em mono, cantos suaves e _glow_ sutil nos elementos interativos.

### Stack de design

| Camada | Tecnologia |
|---|---|
| UI | React 18 + React Router 6 |
| Estilo | Tailwind CSS 3 (`darkMode: 'class'`) + CSS custom properties |
| Ícones | [lucide-react](https://lucide.dev) |
| Tipografia | Geist (texto), JetBrains Mono (mono), Space Grotesk (fallback) |
| Build | Vite 5 |
| Auth / dados | Supabase |

---

## 2. Princípios de design

1. **Hierarquia por superfície, não por sombra pesada.** Cards usam elevação fixa e discreta (`--card-shadow`); a separação vem da cor de fundo (`surface` vs `bg`) e da borda.
2. **Interação sem "pulo".** Cards interativos não transladam nem mudam de profundidade no hover — apenas a **borda vira roxa** e o fundo escurece levemente. Botões ganham um **glow** na própria cor.
3. **Mono para metadados.** Números, status, labels de KPI, timestamps e códigos usam fonte monoespaçada para reforçar o caráter técnico.
4. **Dois temas como cidadãos de primeira classe.** Todas as cores semânticas passam por CSS variables, então claro/escuro alternam apenas a raiz (`.dark`).
5. **Acento com parcimônia.** O verde neon é reservado para destaque (botão `neon`, badge `accent`), nunca como cor de corpo.

---

## 3. Cores

### 3.1 Paleta de marca (Tailwind `theme.extend.colors`)

#### Viper (roxo — marca / primária)

| Token | Hex | Uso |
|---|---|---|
| `viper-50` | `#F7F3FD` | fundo hover claro, badge primary |
| `viper-100` | `#EEE4FD` | active claro |
| `viper-200` | `#E0CDFE` | estados disabled |
| `viper-300` | `#CDABFB` | bordas/badge |
| `viper-400` | `#AD7BEB` | texto/ícone em dark |
| `viper-500` | `#8637CC` | **cor primária / ação** |
| `viper-600` | `#7F3BC1` | hover primário |
| `viper-700` | `#642C9A` | active / avatar |
| `viper-800` | `#472170` | rings, dark disabled |
| `viper-900` | `#2A1547` | tons profundos |

#### Neon (verde — acento / destaque)

| Token | Hex | Uso |
|---|---|---|
| `neon-100` | `#CBFADF` | badge accent (fundo claro) |
| `neon-400` | `#14F59F` | hover do botão neon |
| `neon-500` | `#00FF94` | **botão neon / destaque** |
| `neon-600` | `#00D486` | active |
| `neon-800` | `#007751` | disabled |
| `neon-900` | `#004F38` | badge accent (fundo dark) |

#### Carvão (superfícies escuras)

| Token | Hex | Uso |
|---|---|---|
| `carvao-base` | `#0E0F11` | **sidebar** (fixo nos dois temas) e overlay de modal |
| `carvao-subtle` | `#141517` | — |
| `carvao-surface1` | `#1A1B1E` | hover de itens na sidebar |
| `carvao-surface2` | `#212227` | bordas/divisores da sidebar, disabled dark |
| `carvao-surface3` | `#2A2B30` | scrollbar dark, bordas disabled |

#### Neutros e papel

| Token | Hex | Uso |
|---|---|---|
| `papel` | `#F6F2E9` | fundo base do modo claro |
| `neutral-50…900` | warm grays | textos, fundos, bordas neutras |

### 3.2 Cores semânticas

| Token | Hex |
|---|---|
| `success` | `#15BB77` |
| `warning` | `#F5AE39` |
| `danger` | `#E54056` |
| `info` | `#5294E6` |

### 3.3 Tokens de tema (CSS variables — `src/index.css`)

As superfícies são controladas por variáveis para suportar claro/escuro. A **sidebar é sempre carvão** (`--sidebar-bg: #0E0F11`) independentemente do tema.

| Variável | Claro | Escuro |
|---|---|---|
| `--bg` | `#F6F2E9` | `#161719` |
| `--bg-subtle` | `#FBF9F3` | `#1C1D20` |
| `--surface` | `#FFFFFF` | `#232429` |
| `--surface2` | `#F4F1EA` | `#2C2D34` |
| `--border` | `#E7E1D5` | `#2F3037` |
| `--border-subtle` | `#F0ECE2` | `#212228` |
| `--text-primary` | `#221F1A` | `#ECECEE` |
| `--text-secondary` | `#4A463D` | `#B7B7BD` |
| `--text-muted` | `#6E695A` | `#8A8A92` |

**Classes utilitárias** que consomem esses tokens: `bg-app`, `bg-subtle`, `bg-surface`, `bg-surface2`, `border-base`, `border-subtle`, `text-base-primary`, `text-base-secondary`, `text-base-muted`, `.card`, `.card-interactive`.

Seleção de texto usa roxo translúcido: `::selection { background: #8637CC33 }`.

---

## 4. Tipografia

| Família | Stack | Uso |
|---|---|---|
| **Geist** | `Geist, Space Grotesk, system-ui, sans-serif` | texto e títulos |
| **JetBrains Mono** | `JetBrains Mono, ui-monospace, monospace` | números, status, labels, metadados |

- Fontes carregadas via Google Fonts (`index.html`): Geist `400–800`, JetBrains Mono `400/500/700`.
- `html { font-size: 16px }` com antialiasing ativado.
- Utilitário `.text-display`: Geist com `letter-spacing: -0.02em` para títulos grandes.
- Títulos de página: `text-xl font-bold tracking-tight`. KPIs: `text-3xl font-bold font-display tracking-tight`.
- Labels/uppercase mono: `text-xs font-mono uppercase tracking-wider`.

---

## 5. Tokens de forma

### Border radius (`tailwind.config.js`)

| Token | Valor |
|---|---|
| `rounded-sm` | `5px` |
| `rounded-md` | `7px` — padrão de botões, inputs, cards |
| `rounded-lg` | `10px` — botões grandes |
| `rounded-xl` | `13px` — modais |

### Sombras / elevação

| Token | Uso |
|---|---|
| `shadow-e1` | elevação mínima |
| `shadow-e2` | cards leves |
| `shadow-e3` | popovers |
| `shadow-e4` | **modais** (mais alta) |
| `--card-shadow` | sombra fixa e discreta dos `.card` (adapta ao tema) |

### Espaçamento

Escala padrão do Tailwind. Convenções recorrentes: header de página `h-[73px]`, sidebar `w-56` (224px), conteúdo `px-8 py-6`, cards `p-5`.

---

## 6. Animações (`tailwind.config.js` + `index.css`)

| Nome | Duração | Uso |
|---|---|---|
| `animate-fade-in` | 0.15s | overlay de modal |
| `animate-slide-down` | 0.2s | entrada do conteúdo do modal |
| `animate-task-complete` | 1.2s | feedback de atividade concluída |
| `animate-check-pop` | 0.3s | check ao marcar tarefa |
| `.task-complete-flash` | 1s | flash de conclusão |

Transições padrão: cores e bordas em `0.15–0.2s ease`. O tema alterna com `transition: background-color 0.2s, color 0.2s` no `body`.

---

## 7. Biblioteca de componentes (`src/components/ui`)

### Button — `Button.tsx`

- **Variantes:** `primary` (roxo cheio), `secondary` (contorno roxo), `tertiary` (texto roxo), `destructive` (vermelho), `neon` (verde, texto carvão, `font-semibold`).
- **Tamanhos:** `sm` (`px-3 py-1.5`), `md` (`px-4 py-2`), `lg` (`px-6 py-3`).
- **Hover glow** na cor do próprio botão (`shadow-[0_0_16px_…]`); estados `active` e `disabled` bem definidos por variante e por tema.
- Foco visível: `ring-2 ring-viper-500 ring-offset-1`.

### Badge / StatusBadge — `Badge.tsx`

- Pílula `rounded-full`, `text-xs font-mono`, opcional `dot` colorido.
- **Variantes:** `primary`, `solid`, `accent` (neon), `neutral`, `success`, `warning`, `error`, `info`.
- `StatusBadge` mapeia strings de domínio → variante + label PT-BR: `Ativo`, `Pausado`, `Concluído`, `pendente`, `em_andamento`, `concluida`, `alta`, `media`, `baixa`.

### KpiCard — `KpiCard.tsx`

Card de métrica: label mono em uppercase, ícone opcional em quadro `viper-500/10`, valor grande, e indicador de tendência (`up`/`down`/`neutral`) com ícone Lucide e cor semântica.

### Modal / ConfirmModal — `Modal.tsx`

- Overlay `carvao-base/70` com `backdrop-blur-sm`; painel `rounded-xl`, `shadow-e4`, animação slide-down.
- Tamanhos `sm` / `md` / `lg`; fecha em **Esc** e clique no overlay; header com título/descrição e botão X.
- `ConfirmModal` é uma composição pronta com botões Cancelar (tertiary) + Confirmar (destructive).

### FormField + Input / Textarea / Select — `FormField.tsx`

- `FormField`: label (com `*` opcional em vermelho), slot, mensagem de erro (mono, vermelho) ou hint.
- Inputs compartilham base com foco `ring-2 ring-viper-500`, estado de erro (`border-danger`) e estilos inline ligados às CSS variables para respeitar o tema.

### Loading / ErrorState — `Loading.tsx`

- `Loading`: spinner roxo `Loader2` + label mono.
- `ErrorState`: mensagem de falha em vermelho + detalhe técnico em mono.

---

## 8. Layout e navegação

### Estrutura — `Layout.tsx`

- **Sidebar fixa** à esquerda (`w-56`) + área de conteúdo com `ml-56`.
- **Header de página** sticky, `h-[73px]`, fundo `surface`, com título (`text-xl font-bold`), subtítulo opcional e slot de `action` à direita.
- Conteúdo em `main` com `px-8 py-6`.

### Sidebar — `Sidebar.tsx`

- Fundo **carvão** fixo (`#0E0F11`) nos dois temas; logo SVG da Vipper em quadro roxo, wordmark "Vipper / PING".
- **Item ativo:** fundo `viper-500/10`, texto `viper-400`, e barra de acento de 3px à esquerda. Inativo: cinza com hover branco/`carvao-surface1`.
- Rodapé: toggle de tema (sol/lua), logout (hover vermelho) e card de perfil com avatar (foto ou iniciais em quadro roxo).
- **Navegação por papel:**

| Rota | Item | Visibilidade |
|---|---|---|
| `/dashboard` | Dashboard | todos |
| `/projetos` | Projetos | todos |
| `/atividades` | Atividades | todos |
| `/agenda` | Agenda | todos |
| `/membros` | Membros | todos |
| `/relatorios` | Relatórios | **somente sócio** |
| `/ponto` | Ponto | **somente estagiário** |

---

## 9. Temas (claro / escuro)

- Gerenciado por `ThemeContext.tsx`: alterna a classe `.dark` na raiz e persiste em `localStorage` (`vp-theme`).
- Tailwind em `darkMode: 'class'`; cada cor de superfície tem par claro/escuro via CSS variables.
- A **sidebar e o overlay de modal permanecem escuros** nos dois temas (âncora visual da marca).
- Scrollbar fina (6px) com thumb que vira roxo no hover em dark.

---

## 10. Papéis e fluxo de autenticação

- Auth via Supabase (`AuthContext.tsx`); o perfil vem da tabela `profiles`.
- **Papéis:** `socio` e `estagiario` — determinam navegação e rotas protegidas.
- Guards de rota (`App.tsx`): `RequireAuth`, `RequireSocio`, `RequireEstagiario`, com `FullScreenLoader` (spinner roxo sobre carvão) durante o carregamento da sessão.
- Páginas: Login, Dashboard, Projetos (+detalhe), Atividades (+detalhe), Agenda, Membros (+detalhe), Relatórios (sócio), Ponto (estagiário), Perfil.

---

## 11. Convenções e diretrizes

- **Idioma:** toda a UI é em **PT-BR** (labels, status, mensagens).
- **Mono = dado técnico:** use `font-mono` para números, status, timestamps, códigos e labels de metadados.
- **Cards:** prefira `.card` para conteúdo estático e `.card-interactive` quando for clicável (hover → borda roxa, sem translate).
- **Ações:** `primary` para a ação principal da tela; `neon` apenas para um destaque pontual; `destructive` para remoções (sempre com `ConfirmModal`).
- **Cores:** consuma sempre os tokens semânticos / CSS variables — evite hex fixos em componentes novos (exceção: sidebar/overlay, intencionalmente carvão fixo).
- **Ícones:** `lucide-react`, tamanho `16–18px` na navegação/ações, `12px` em indicadores inline.
- **Acessibilidade:** foco visível com ring roxo em botões e inputs; modais com `role="dialog"`, `aria-modal` e fechamento por Esc.

---

_Documento gerado a partir do código-fonte (`tailwind.config.js`, `src/index.css`, `src/components`, `src/contexts`, `src/App.tsx`). Mantenha-o sincronizado ao alterar tokens ou componentes._
