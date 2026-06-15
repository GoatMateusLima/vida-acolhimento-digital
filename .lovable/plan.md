## VIDA+ — Frontend completo (mockado)

Plataforma de acolhimento e escuta emocional, somente frontend, com dados mockados isolados em `src/mocks/` para futura substituição pela API real.

### Stack

TanStack Router (já no template) + React + TypeScript + Vite + Tailwind + TanStack Query + React Hook Form + Zod + Lucide + PWA (vite-plugin-pwa, ativa só no publicado).

### Paleta (Verde sálvia sereno)

- Fundo: `#F5F7F3` / dark `#0F1411`
- Primária: `#7BA889` (hover `#3F6F5A`)
- Apoio: `#A6B8D6` (lilás/azul suave)
- Tokens em `src/styles.css` (oklch), modo claro/escuro via classe `.dark`, cantos arredondados (radius 0.875rem), sombras suaves, animações leves (fade/slide).

### Estrutura de pastas

```
src/
  routes/                      # TanStack file-based
    __root.tsx                 # shell + ThemeProvider + ProfileProvider + bottom-nav mobile
    index.tsx                  # Landing
    como-funciona.tsx
    sobre.tsx
    seguranca.tsx
    termos.tsx
    privacidade.tsx
    login.tsx
    cadastro.tsx
    recuperar-senha.tsx
    app/                       # área logada (layout app.tsx + Outlet)
      app.tsx                  # AppLayout (sidebar desktop / bottom-nav mobile / topbar)
      app.index.tsx            # Início personalizado
      app.conversar.tsx        # Entrar fila / espera / encontrado
      app.chat.$id.tsx         # Chat
      app.historico.tsx
      app.perfil.tsx
      app.preferencias.tsx
      app.privacidade.tsx      # consentimento LGPD
      app.candidatura.tsx      # virar voluntário
      app.denuncia.tsx
      voluntario/
        voluntario.index.tsx   # resumo + disponibilidade + fila
        voluntario.fila.tsx
        voluntario.chat.$id.tsx
        voluntario.historico.tsx
        voluntario.candidatura.tsx
      moderacao/
        moderacao.index.tsx    # lista denúncias + filtros
        moderacao.$id.tsx      # detalhes + decisão
      admin/
        admin.index.tsx        # dashboard métricas
        admin.candidaturas.tsx
        admin.candidaturas.$id.tsx
        admin.usuarios.tsx
    offline.tsx
  pages/                       # (não usado — TanStack usa routes/)
  components/
    ui/                        # shadcn existente
    layout/ TopBar BottomNav Sidebar ProfileSwitcher
    chat/ MessageBubble MessageList Composer StatusBar EndDialog
    common/ EmptyState ErrorState LoadingSpinner ConfirmDialog Badge PriorityChip
    pwa/ InstallButton OfflineIndicator UpdateToast
    landing/ Hero HowItWorks PrivacySection FAQ EmergencyResources
  layouts/ PublicLayout.tsx AppLayout.tsx PanelLayout.tsx
  contexts/ ThemeContext.tsx ProfileContext.tsx (perfil ativo p/ demo) AuthContext.tsx (mock)
  hooks/ useTheme useProfile useChat useQueue useReports useApplications useMetrics useDebounce useMediaQuery
  services/
    api/ client.ts (wrapper fetch — atualmente chama mocks com delay)
    auth.service.ts users.service.ts chat.service.ts queue.service.ts
    volunteer.service.ts moderation.service.ts admin.service.ts
    (cada service expõe funções tipadas que internamente chamam src/mocks/*; trocar por fetch real no futuro)
  types/ user.ts profile.ts message.ts conversation.ts queue.ts report.ts application.ts metrics.ts api.ts
  mocks/
    db/ users.ts conversations.ts messages.ts queue.ts volunteers.ts
        applications.ts reports.ts metrics.ts
    handlers.ts                # simula latência, erros aleatórios opcionais, paginação
    seed.ts
  utils/ format.ts (data/hora pt-BR) validators.ts (zod schemas) storage.ts a11y.ts cn.ts
  styles.css                   # tokens, dark mode, motion-reduce
  pwa/ register.ts manifest gerado pelo plugin
public/
  icons/ (192, 512, maskable)
  offline.html (fallback)
```

### Perfis e seletor

- `ProfileContext` armazena perfil ativo (`usuario | voluntario | moderador | admin`) em `localStorage`.
- Componente `ProfileSwitcher` (visível no topbar, marcado como "Demo") permite alternar e redireciona para o painel correspondente.
- Guards de rota leves baseados no perfil ativo (sem backend).

### Telas públicas

- Landing com Hero ("Você não está sozinho"), CTAs "Quero conversar" / "Quero ser voluntário", Como funciona (3 passos), Privacidade, FAQ (Accordion), aviso "acolhimento, não diagnóstico", bloco discreto "Em crise? CVV 188 / SAMU 192".
- Como funciona, Sobre, Segurança, Termos, Privacidade (conteúdo institucional).
- Login/Cadastro/Recuperar — RHF + Zod, estados loading/erro mockados.
- 404 via `notFoundComponent` no root.

### Área do usuário

- Início com saudação, CTA "Conversar agora", últimos atendimentos.
- Fluxo fila: entrar → tela de espera (posição/tempo estimado animado) → cancelar → "voluntário encontrado" → abre chat.
- Histórico (lista + estado vazio), Perfil (RHF), Preferências (tema, redução de movimento, notificações), Privacidade/LGPD (toggles + consentimento), Candidatura voluntário (formulário multi-step), Denúncia (form), Logout (confirm).

### Chat

- `MessageList` com auto-scroll + `scroll-anchor`, bolhas por role (user/volunteer/system), horários (`Intl.DateTimeFormat`).
- Composer fixo, envio por Enter/Shift+Enter, estados: enviando/enviado/erro/reenviar.
- StatusBar (status do atendimento + aviso privacidade), botões denunciar/encerrar, `ConfirmDialog` antes de encerrar.
- Mobile: `100dvh`, `safe-area-inset-bottom`, `inputMode`, prevenção de zoom (font-size ≥16px), sem overflow horizontal.
- Mocks de mensagens carregadas via `useChat` (TanStack Query) com latência simulada.

### Painel voluntário

Resumo do dia, toggle disponibilidade (online/ocupado/offline), fila com chips de prioridade (normal/prioritária/crise), botão aceitar, chat ativo, histórico, formulário "ação tomada" (após encerrar), status candidatura. Sem PII real nos mocks (nomes fictícios + iniciais).

### Painel moderação

Lista de denúncias com filtros (status/prioridade/data), detalhes do caso, transições pendente→em análise→resolvido/arquivado, registro de decisão, histórico, confirmações. Nenhuma ação automática.

### Painel admin

Dashboard com cards de métricas + gráfico simples (Recharts já incluído via shadcn/chart), lista de candidaturas com filtros, detalhes, aprovar/suspender com `ConfirmDialog`, gestão de usuários (tabela + alterar papel), toasts de sucesso/erro (sonner).

### Mocks e services

- Cada service expõe `async function getX(): Promise<T>` que chama `handlers.ts` (delay 300–900ms, erro probabilístico desligado por padrão, flag p/ demonstrar estados).
- Tipos compartilhados em `src/types/` representam o contrato futuro da API — quando vier API real, basta trocar a implementação de `services/api/client.ts`.
- Estados cobertos: loading, sucesso, erro, vazio, sessão expirada (redirect /login), acesso negado (403 page), offline (detector `navigator.onLine`).

### PWA

- `vite-plugin-pwa` com `registerType: autoUpdate`, `injectRegister: null`, manifest (name "VIDA+", short_name "VIDA+", theme `#7BA889`, background `#F5F7F3`, display standalone, ícones 192/512/maskable gerados).
- Wrapper `pwa/register.ts` recusa SW em dev/preview/iframe/lovableproject.com (conforme regras do template).
- Estratégia: `NetworkFirst` p/ navegações, `CacheFirst` só p/ assets hashed. **Não** cacheia rotas de chat/mensagens.
- `OfflineIndicator` (banner), `UpdateToast` ("Nova versão disponível — atualizar"), `InstallButton` (captura `beforeinstallprompt`).
- Página `/offline` simples.

### Responsividade

- Mobile-first; `BottomNav` em telas <md com 5 itens conforme perfil, áreas ≥44px, `pb-[env(safe-area-inset-bottom)]`.
- Tablet (md): sidebar compacta + listas/detalhes em 2 colunas.
- Desktop (lg+): sidebar completa, conteúdo `max-w-6xl` centralizado, painéis multi-coluna.
- Grid `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `truncate` nos headers para evitar overflow.

### Acessibilidade

- Tokens semânticos sempre (sem `text-gray-*` arbitrários), foco visível (`focus-visible:ring-2`), labels associados, mensagens de erro com `role="alert"` e `aria-describedby`, `aria-live="polite"` no chat, `prefers-reduced-motion` respeitado, `<main>` único por página, `lang="pt-BR"` no html.

### Detalhes técnicos

- TanStack Query: `QueryClient` por request, `defaultPreloadStaleTime: 0`. Loaders fazem `ensureQueryData`; componentes usam `useSuspenseQuery`.
- Toasts: sonner (já instalado).
- Validação: zod schemas em `utils/validators.ts`.
- Sem chamadas a Supabase/Lovable Cloud/serviços externos. Sem chaves.
- README com: scripts (`bun dev`, `bun run build`), descrição das pastas, como trocar mocks pela API real (apontar `services/api/client.ts`), nota sobre PWA só funcionar publicado.

### Verificações antes de finalizar

- Build limpo.
- Navegação por todos os 4 perfis via ProfileSwitcher.
- Mobile/tablet/desktop sem overflow horizontal (checar com browser--view_preview em 3 viewports).
- Contraste AA nos pares principais.
- PWA: manifest válido, ícones presentes, SW registrado somente em produção.
