# VIDA+ — Frontend

Plataforma de acolhimento e escuta emocional. **Somente frontend**, com dados mockados.

## Stack

- React 19 + TypeScript + Vite
- TanStack Router (file-based) + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod
- Lucide Icons
- PWA (manifest + ícones + indicador offline + botão instalar)

## Scripts

```bash
bun install
bun run dev        # desenvolvimento
bun run build      # build de produção
bun run preview    # pré-visualização do build
```

## Estrutura

```
src/
  routes/          # páginas (file-based TanStack Router)
  components/      # UI + comuns + PWA
  layouts/         # PublicLayout, AppShell
  contexts/        # Theme, Profile
  hooks/           # useOnline, useInstallPrompt
  services/        # camada de API (hoje consome mocks)
  mocks/           # dados simulados + handlers (latência/erros)
  types/           # tipos compartilhados
  utils/           # validators (zod), format (intl)
```

## Perfis (demo)

Use o seletor "Demo" no topo do app para alternar entre:

- `usuário` → `/app`
- `voluntário` → `/vol`
- `moderador` → `/mod`
- `administrador` → `/admin`

A escolha persiste em `localStorage`.

## Mocks → API real

Todos os mocks vivem em `src/mocks/`. Os componentes consomem **services** em `src/services/index.ts`, não os mocks diretamente. Para conectar à API real:

1. Implemente `src/services/api/client.ts` (fetch wrapper).
2. Substitua o corpo de cada função em `src/services/index.ts` por chamadas HTTP.
3. Os tipos em `src/types/` já refletem o contrato esperado da API.

## PWA

O manifest (`public/manifest.webmanifest`) e ícones estão configurados. O app é instalável quando o navegador detectar suporte (botão "Instalar aplicativo" aparece automaticamente). Indicador "sem conexão" e página `/offline.html` estão prontos.

> Service Worker para cache offline completo deve ser habilitado **somente em produção** via `vite-plugin-pwa`, evitando interferência com o preview de desenvolvimento. Nunca cacheie mensagens de chat ou dados privados.

## Acessibilidade

- Contraste WCAG AA (tokens em oklch).
- Foco visível, navegação por teclado, áreas de toque ≥44px.
- `prefers-reduced-motion` respeitado.
- `lang="pt-BR"`, único `<main>` por página, labels e mensagens de erro com `role="alert"`.

## Aviso

O VIDA+ oferece **acolhimento e escuta**, não diagnóstico ou tratamento médico. Em emergência: **CVV 188** · **SAMU 192**.
