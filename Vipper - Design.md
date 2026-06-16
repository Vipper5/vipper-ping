# VipperDev — Sistema de Cores

> Guia oficial de cores da identidade visual.
> Base **ACID** · Regra **60 / 30 / 10** · Logo roxa glitch.
> "Código com bote certeiro."

---

## 1. COR PRINCIPAL — Roxo Glitch

Extraída diretamente da logo glitch. É o destaque do sistema (os **10%**).

| Token | HEX | RGB | Uso |
|---|---|---|---|
| **Roxo Glitch** | `#4A11A2` | `74, 17, 162` | Cor de marca / destaque principal |
| Roxo Hover | `#6B28C4` | `107, 40, 196` | Hover, estado ativo, foco |
| Roxo Escuro | `#350B78` | `53, 11, 120` | Pressionado, sombras de cor |

---

## 2. VARIAÇÕES DO ROXO

Rampa completa para fundos, badges, estados e detalhes.

| Stop | HEX | Uso sugerido |
|---|---|---|
| 50 | `#EDE7FA` | Fundo roxo sutil (light) |
| 100 | `#C9B6F0` | Realces leves, tags |
| 200 | `#9966E0` | Ícones, links secundários |
| 400 | `#6B28C4` | Hover / botões secundários |
| **600 (principal)** | `#4A11A2` | **Cor de marca** |
| 800 | `#350B78` | Texto sobre roxo claro |
| 900 | `#1C004B` | Fundo roxo escuro (dark) — tom da logo |

---

## 3. NEUTROS — Preto (Dark Mode)

Tom levemente frio, combina com o roxo. Evita preto puro `#000`.

| Token | HEX | Uso |
|---|---|---|
| Fundo base | `#0A0A0C` | Background principal (os **60%**) |
| Superfície | `#141417` | Cards, painéis |
| Borda / Hover | `#1F1F24` | Divisores, bordas, hover |
| Texto | `#F5F5F7` | Texto principal (os **30%**) |

---

## 4. NEUTROS — Branco (Light Mode)

Branco quase puro, sem brilho cansativo.

| Token | HEX | Uso |
|---|---|---|
| Fundo base | `#FAFAFB` | Background principal (os **60%**) |
| Superfície | `#FFFFFF` | Cards, painéis |
| Borda / Divisor | `#E8E8EC` | Bordas, divisores |
| Texto | `#1A1A1C` | Texto principal (os **30%**) |

---

## 5. REGRA 60 / 30 / 10

> Proporção de uso das cores em qualquer tela.

| Proporção | Dark Mode | Light Mode |
|---|---|---|
| **60%** | Preto `#0A0A0C` | Branco `#FAFAFB` |
| **30%** | Branco `#F5F5F7` | Preto `#1A1A1C` |
| **10%** | Roxo `#4A11A2` | Roxo `#4A11A2` |

**Resumo:** o roxo aparece **pouco e com força** — botões, links, destaques e detalhes. Nunca como fundo dominante.

---

## 6. TOKENS RÁPIDOS (copiar e colar)

```css
:root {
  /* Marca */
  --roxo: #4A11A2;
  --roxo-hover: #6B28C4;
  --roxo-dark: #350B78;
  --roxo-50: #EDE7FA;
  --roxo-900: #1C004B;

  /* Dark mode */
  --dark-bg: #0A0A0C;
  --dark-surface: #141417;
  --dark-border: #1F1F24;
  --dark-text: #F5F5F7;

  /* Light mode */
  --light-bg: #FAFAFB;
  --light-surface: #FFFFFF;
  --light-border: #E8E8EC;
  --light-text: #1A1A1C;
}
```

---

## 7. GLASSMORPHISM (uso leve)

> Vidro fosco aplicado **só em elementos flutuantes**: navbar, cards de destaque, modais e menus. Nunca em fundos inteiros. Sempre precisa de algo colorido/texturizado atrás para o efeito aparecer.

### Dark Mode — "Smoke" (vidro fumê)

Escuro, elegante, blur forte e detalhe roxo mínimo.

| Propriedade | Valor |
|---|---|
| Fundo | `rgba(20, 20, 26, 0.40)` |
| Borda | `0.5px solid rgba(255, 255, 255, 0.10)` |
| Blur | `blur(20px)` |
| Botão / destaque | `rgba(74, 17, 162, 0.85)` (roxo) |

### Light Mode — "Mono Light" (vidro neutro)

Branco leitoso, sem roxo no vidro. O roxo entra apenas em links e CTAs.

| Propriedade | Valor |
|---|---|
| Fundo | `rgba(255, 255, 255, 0.50)` |
| Borda | `0.5px solid rgba(255, 255, 255, 0.85)` |
| Blur | `blur(16px)` |
| Botão / destaque | `#1A1A1C` (preto) ou `#4A11A2` (roxo) |

### Tokens CSS

```css
/* Glass — Dark (Smoke) */
.glass-dark {
  background: rgba(20, 20, 26, 0.40);
  border: 0.5px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
}

/* Glass — Light (Mono) */
.glass-light {
  background: rgba(255, 255, 255, 0.50);
  border: 0.5px solid rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
}
```

**Regras de ouro:** blur entre 16–20px · borda sempre `0.5px` (é o brilho do vidro) · só em elementos flutuantes · precisa de fundo atrás.

---

## 8. TIPOGRAFIA

Sistema de 4 fontes, cada uma com um papel definido. O contraste vem da **escala** e da **largura** — título pesado e largo vs. labels estreitos e espaçados.

| Papel | Fonte | Peso | Uso |
|---|---|---|---|
| **Título / Hero** | Nimbus Sans | Bold (700) | Títulos grandes, heros, capas. Caixa alta, tracking apertado. |
| **Labels / Texto curto** | Oswald | Medium (500) | Tags, menus, rótulos, overlines. Caixa alta, `letter-spacing` aberto (~0.18em). |
| **Corpo / Leitura** | Geist | Regular (400) / Medium (500) | Parágrafos, descrições, todo texto de leitura. |
| **Código** | JetBrains Mono | Regular (400) | Trechos de código e detalhes técnicos curtos. |

### ⚠️ Licenças

- **Nimbus Sans** — gratuita (URW, open source). Clone métrico da Helvetica. ⚠️ A versão gratuita tem só **Regular e Bold** — o título usa o **Bold (700)**, não há peso Black. Para um Black real: versão paga URW ou trocar por Inter Black (900).
- **Oswald** — gratuita (Google Fonts).
- **Geist** — gratuita, open source (Vercel).
- **JetBrains Mono** — gratuita (Google Fonts).

### Regras de uso

- Título **só** em caixa alta, peso bold — nunca em texto corrido.
- Labels Oswald sempre em maiúsculas com espaçamento entre letras aberto.
- Geist para tudo que for leitura — é a fonte do dia a dia.
- JetBrains Mono restrita a código e pequenos detalhes técnicos (tags de versão, paths, etc).

### Tokens CSS

```css
:root {
  --font-titulo: 'Nimbus Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-label: 'Oswald', sans-serif;
  --font-corpo: 'Geist', sans-serif;
  --font-codigo: 'JetBrains Mono', monospace;
}

.titulo {
  font-family: var(--font-titulo);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
.label {
  font-family: var(--font-label);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}
.corpo { font-family: var(--font-corpo); font-weight: 400; line-height: 1.65; }
.codigo { font-family: var(--font-codigo); font-weight: 400; }
```

---

## 9. ESTILO DE SITE — "Acid"

Estilo definitivo da VipperDev. Um único estilo em dois modos (dark e light), com troca por toggle.

| Elemento | Dark mode | Light mode |
|---|---|---|
| Fundo base (60%) | `#0A0A0C` | `#FAFAFB` |
| Texto (30%) | `#F5F5F7` | `#1A1A1C` |
| Destaque (10%) | Roxo `#4A11A2` | Roxo `#4A11A2` |
| Blob de fundo | `#4A11A2` / `#6B28C4` (blur, baixa opacidade) | `#9966E0` (blur, opacidade ~0.3) |
| Glass | Smoke | Mono Light |

### Características

- Label superior em Oswald maiúsculo espaçado (ex: "Software sob medida").
- Título hero pesado em caixa alta (Nimbus Sans Bold), quebrado em 2 linhas.
- Corpo curto em Geist.
- Botão sólido roxo `#4A11A2` com texto Oswald maiúsculo.
- Blob roxo desfocado ao fundo dá profundidade sem poluir.

> Regra: dark é o modo principal da marca; light é a alternativa clara. O roxo nunca domina — entra só em destaque, botão e blob.

---

## 10. COMPONENTES BASE

### Raio de borda — responsivo

Base de 6px convertida para `rem`, então escala junto com a fonte do usuário (acessível e fluido).

| Token | Valor | Equivale a | Uso |
|---|---|---|---|
| `--radius-sm` | `0.375rem` | ~6px | Botões, inputs, badges |
| `--radius-md` | `0.625rem` | ~10px | Cards menores |
| `--radius-lg` | `0.875rem` | ~14px | Cards de glass, modais |

> Por que `rem` e não `px`: o `px` fica "travado" e não acompanha o zoom/fonte do usuário. Com `rem`, o raio respira junto com o resto da interface.

### Botão — sólido

| Propriedade | Valor |
|---|---|
| Fundo | Roxo `#4A11A2` |
| Texto | Branco `#FFFFFF`, Oswald maiúsculo, `letter-spacing: 0.08em` |
| Raio | `var(--radius-sm)` |
| Padding | `9px 18px` |
| Hover | Fundo `#6B28C4` |

### Input — glass + borda fina

| Propriedade | Valor |
|---|---|
| Fundo | `rgba(255,255,255,0.05)` (dark) |
| Borda | `0.5px solid rgba(255,255,255,0.15)` |
| Raio | `var(--radius-sm)` |
| Foco | Borda `#9966E0` |
| Texto | Geist, placeholder em cinza |

### Card — glass smoke (padrão)

| Propriedade | Valor |
|---|---|
| Fundo | `rgba(20,20,26,0.5)` |
| Borda | `0.5px solid rgba(255,255,255,0.1)` |
| Raio | `var(--radius-lg)` |
| Blur | `blur(12px)` |

### Tokens CSS

```css
:root {
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;
}

.btn {
  background: #4A11A2; color: #fff;
  font-family: 'Oswald', sans-serif;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 9px 18px; border: none;
  border-radius: var(--radius-sm); cursor: pointer;
}
.btn:hover { background: #6B28C4; }

.input {
  background: rgba(255,255,255,0.05);
  border: 0.5px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
  padding: 9px 12px; color: #fff; font-family: 'Geist', sans-serif;
}
.input:focus { outline: none; border-color: #9966E0; }

.card {
  background: rgba(20,20,26,0.5);
  border: 0.5px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 16px;
}
```

---

## 11. VERSÕES DA LOGO

Quatro versões, cada uma com um papel definido. O símbolo é sempre a víbora pronta para o bote.

| Versão | Arquivo | Categoria | Onde usar |
|---|---|---|---|
| **Roxa (glitch)** | `Vipper - ROXA.png` | Primária digital | Site, header, redes sociais, app, banners, perfis. A cara da marca online. Prefere fundo escuro. |
| **Oficial (gradiente)** | `Vipper - OFICIAL.png` | Formal | Documentos, propostas, contratos, apresentações formais, assinatura de e-mail, papelaria. Funciona nos dois fundos. |
| **Mono (P&B)** | `Vipper - MONO.png` | Utilitária | Impressão P&B, marca d'água, carimbo, fundos coloridos ou fotos. Branca no escuro, preta no claro. |
| **Vermelha (glitch)** | `Vipper - VERMELHA.png` | Especial | Campanhas, modo alerta, easter eggs, edições limitadas. Uso raro. |

### Regras

- **Glitch = digital, gradiente = institucional.** A glitch carrega a energia ACID da marca; a oficial transmite seriedade.
- A **vermelha nunca** é logo padrão — perde a identidade roxa.
- A **mono** resolve qualquer fundo difícil (foto, cor forte, impressão).
- Em tamanhos muito pequenos (favicon, ícone de app), a glitch e o gradiente podem não ler bem — nesses casos, considere a mono ou uma versão flat futura.

---

## 12. ESTILO DE ÍCONES

| Item | Definição |
|---|---|
| **Biblioteca** | Phosphor Icons (open source, MIT) |
| **Peso padrão** | Light — fino e minimalista |
| **Estilo** | Outline (traço), não preenchido |
| **Cor padrão** | Branco `#F5F5F7` (dark) / Preto `#1A1A1C` (light) |
| **Cor de destaque** | Roxo `#9966E0` — só em ícone ativo, selecionado ou CTA |

### Regras

- Peso Light é o padrão; use Bold/Fill apenas em casos pontuais de ênfase.
- Ícone segue a cor do texto por padrão — o roxo entra só quando o ícone **é** o destaque.
- Tamanho: 16–20px inline, até 24px decorativo.
- Phosphor: `https://phosphoricons.com` · disponível via CDN, React, Vue, etc.

### Exemplo (web)

```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/light/style.css">

<i class="ph-light ph-terminal-window"></i>
<i class="ph-light ph-cpu"></i>
<i class="ph-light ph-robot" style="color:#9966E0"></i>
```

---

## 13. CORES SEMÂNTICAS

Estados de sistema (feedback, alertas, validação). Cada um tem a cor principal + fundo claro e escuro.

| Estado | Principal | Fundo (light) | Fundo (dark) | Uso |
|---|---|---|---|---|
| **Sucesso** | `#1D9E75` | `#E1F5EE` | `#0F6E56` | Confirmação, deploy ok, envio bem-sucedido |
| **Erro** | `#EF4444` | `#FCEBEB` | `#A32D2D` | Falha, validação inválida, ação destrutiva |
| **Aviso** | `#EF9F27` | `#FAEEDA` | `#854F0B` | Atenção, pendência, ação reversível |
| **Info** | `#378ADD` | `#E6F1FB` | `#185FA5` | Dica, mensagem neutra, notificação |

### Regras

- Texto sobre fundo claro usa a cor **principal** (ou um tom mais escuro dela).
- A cor semântica **nunca** substitui o roxo da marca — elas convivem em papéis diferentes (roxo = ação/marca; semânticas = estado).
- Info é **azul**, não violeta — evita confusão com o roxo `#4A11A2`.

### Tokens CSS

```css
:root {
  --success: #1D9E75;  --success-bg-light: #E1F5EE;  --success-bg-dark: #0F6E56;
  --error:   #EF4444;  --error-bg-light:   #FCEBEB;  --error-bg-dark:   #A32D2D;
  --warning: #EF9F27;  --warning-bg-light: #FAEEDA;  --warning-bg-dark: #854F0B;
  --info:    #378ADD;  --info-bg-light:    #E6F1FB;  --info-bg-dark:    #185FA5;
}
```

---

## 14. ESPAÇAMENTO E GRID

### Escala de espaçamento — Base 8

Todos os espaços (padding, margin, gap) saem desta régua. Consistência vem de seguir a escala.

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | 4px | Gaps mínimos, ícone + texto |
| `--space-2` | 8px | Padding interno pequeno |
| `--space-3` | 16px | Padding padrão de componentes |
| `--space-4` | 24px | Espaço entre blocos |
| `--space-5` | 32px | Separação de seções |
| `--space-6` | 48px | Respiro entre seções grandes |
| `--space-7` | 64px | Topo/base de seções principais |

### Largura máxima de conteúdo

| Item | Valor |
|---|---|
| Container principal | `1280px` |
| Texto de leitura corrido | `~680px` (máx. ~70 caracteres por linha) |

> Mesmo com container de 1280px, blocos de texto puro usam largura menor (~680px) para não cansar a leitura.

### Tokens CSS

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 16px;  --space-4: 24px;
  --space-5: 32px;  --space-6: 48px;  --space-7: 64px;
  --container-max: 1280px;
  --reading-max: 680px;
}

.container { max-width: var(--container-max); margin: 0 auto; padding: 0 var(--space-3); }
.prose { max-width: var(--reading-max); }
```

---

## 15. MOVIMENTO / GLITCH

Animação usada com parcimônia — assinatura discreta, não poluição visual.

| Item | Definição |
|---|---|
| **Efeito** | Tremor roxo sutil (shake + ghost roxo translúcido) |
| **Gatilho** | Hover (passar o mouse) — e poucos pontos pontuais |
| **Onde usar** | Logo no hover, ícones de destaque, micro-interações. **Não** em loop constante. |
| **Duração** | ~0.6s suave (`ease-in-out`), deslocamento de ~1px, só enquanto o hover está ativo |
| **Acessibilidade** | Sempre respeitar `prefers-reduced-motion` (desliga a animação) |

### Por que CSS e não gif/vídeo

O efeito é feito em **CSS sobre a imagem PNG** (`Vipper - ROXA.png`), não com gif nem vídeo:

- **CSS:** responde ao hover (liga/desliga), peso quase zero, nítido. ✅
- **Gif / vídeo:** animam o tempo todo, não respondem ao hover, são pesados e perdem qualidade. ❌

### Código (hover da logo)

```html
<div class="vipper-logo">
  <img src="Vipper - ROXA.png" class="ghost" alt="">
  <img src="Vipper - ROXA.png" class="base" alt="VipperDev">
</div>

<style>
.vipper-logo { position: relative; width: 130px; height: 130px; cursor: pointer; }
.vipper-logo img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.vipper-logo .ghost { opacity: 0; mix-blend-mode: screen; }
.vipper-logo:hover .ghost { animation: vipper-ghost 0.6s ease-in-out infinite; }
.vipper-logo:hover .base  { animation: vipper-shake 0.6s ease-in-out infinite; }
@keyframes vipper-ghost {
  0%,100%{opacity:0;transform:translate(0)}
  50%{opacity:.35;transform:translate(-1px,1px)}
}
@keyframes vipper-shake {
  0%,100%{transform:translate(0)}
  50%{transform:translate(0.5px,-0.5px)}
}
@media (prefers-reduced-motion: reduce) {
  .vipper-logo:hover .ghost, .vipper-logo:hover .base { animation: none; }
}
</style>
```

> Evolução futura: converter a víbora para SVG vetorial permite glitch perfeito em qualquer tamanho e animação de partes individuais.

---

## ✅ SISTEMA COMPLETO

Todos os pontos de identidade visual estão definidos: cores, neutros, regra 60/30/10, glassmorphism, estilo de site, tipografia, componentes, logos, ícones, cores semânticas, espaçamento e movimento.
