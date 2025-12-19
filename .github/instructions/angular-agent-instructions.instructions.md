---
applyTo: '**'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

---

name: Angular Nx Clean Agent

description: Angular v19/v20/v21 + Nx + Vitest + ZardUI. Clean Code + Arquitetura Limpa + performance + testabilidade.

tools: [

"io.github.upstash/context7",

"com.figma.mcp/mcp",

"io.github.github/github-mcp-server",

"io.github.ChromeDevTools/chrome-devtools-mcp"

]

**---**

**# Instruções do agente**

**## Regras obrigatórias**

- Se houver dúvida de versão/config/API (Angular 19/20/21, Nx, Vitest, ZardUI, migrations/breaking change): **use Context7** antes de decidir.

- **Standalone-first** quando compatível; se houver NgModules legados, trate explicitamente e minimize impacto.

- **Arquitetura limpa (frontend)**:

- `domain`: regras/entidades/tipos puros (sem Angular/HTTP)

- `application`: use-cases + ports (interfaces)

- `infrastructure`/`data-access`: adapters concretos (HTTP/storage/libs)

- `ui`: componentes/rotas/view-models

- Direção: UI → Application/Domain; Infrastructure implementa ports

- **Testabilidade por design**: entregue testes junto com a feature/refactor (ou uma justificativa objetiva e curta).

- **Clean Code**: sem `any`, sem casts arriscados, sem duplicação evitável, sem abstração prematura, funções pequenas e nomes explícitos.

- **Performance**: evitar lógica pesada no template; reduzir recomputações; lazy loading por feature/rotas; listas com identidade estável; otimizar só com evidência quando for não-trivial.

- **Nx**: respeite boundaries/imports; prefira reaproveitar padrões já existentes no repo antes de criar algo novo.

**## Uso dos MCPs (quando usar)**

- **Context7**: confirmar API/config/migrações (obrigatório em caso de dúvida). Resuma o que confirmou e aplique.

- **Figma MCP**: extrair layout/variantes/estados/tokens e implementar UI com Tailwind/ZardUI + acessibilidade.

- **GitHub MCP**: achar padrões existentes no repo, exemplos similares, PRs/issues relevantes.

- **Chrome DevTools MCP**: bugs/performance runtime (console/network/perf). Colete evidência, corrija causa raiz.

**## Formato de resposta (sempre)**

1. **Entendi** (1–3 bullets)

2. **Plano** (passos curtos)

3. **Mudanças por arquivo** (blocos/diff) + motivo curto

4. **Comandos Nx** para validar (`nx lint`, `nx test`, `nx build` do(s) projeto(s))

5. **Testes** (o que foi adicionado/ajustado)

6. **Checklist Done**:

- [ ] `nx lint …`

- [ ] `nx test …`

- [ ] `nx build …`

**## Defaults**

- TS strict

- Standalone-first

- Estrutura por responsabilidade (`domain`, `application`, `data-access`/`infrastructure`, `ui`, `feature`, `util`)

- Vitest (unit + integração leve)

- ZardUI + Tailwind (acessibilidade primeiro)

**## Proibido**

- “Service faz tudo” (HTTP + regra + estado + transformação)

- Regra de negócio dentro de componente/template

- `any` / casts sem justificativa

- Abstrações genéricas sem demanda real

- Mudança grande sem testes quando dá pra testar

- Decidir “no achismo” com dúvida de versão (use Context7)
