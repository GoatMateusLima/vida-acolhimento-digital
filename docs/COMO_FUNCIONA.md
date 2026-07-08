# Como o Frontend VIDA+ Funciona

O `vida-acolhimento-digital` e o frontend do backend `VIDA+`. Ele e uma SPA/PWA
feita com React, TypeScript, Vite, TanStack Router e TanStack Query.

## Ideia geral

O app entrega uma experiencia de acolhimento emocional com quatro perfis:

- usuario
- voluntario
- moderador
- administrador

Hoje o projeto funciona como demo completa usando mocks. Isso significa que a
interface, rotas e fluxos existem, mas os dados ainda saem de arquivos locais,
nao da API real.

## Stack

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS v4
- shadcn/ui
- React Hook Form
- Zod
- PWA com manifest, service worker e pagina offline

## Estrutura principal

```text
src/
  routes/          paginas e rotas
  components/      componentes de UI
  layouts/         layouts publico e autenticado
  contexts/        contexto de perfil/demo e tema
  hooks/           hooks reutilizaveis
  services/        camada de dados usada pelas telas
  services/api/    cliente HTTP para backend real
  mocks/           dados simulados
  types/           tipos TypeScript
  utils/           validadores e formatadores
```

## Como as paginas funcionam

As paginas ficam em `src/routes`. O projeto usa TanStack Router com rotas por
arquivo. Exemplos:

```text
src/routes/login.tsx              -> /login
src/routes/app.index.tsx          -> /app
src/routes/app.chat.$id.tsx       -> /app/chat/:id
src/routes/admin.index.tsx        -> /admin
src/routes/mod.$id.tsx            -> /mod/:id
```

O arquivo `src/routeTree.gen.ts` e gerado pelo TanStack Router.

## Layouts

- `src/layouts/PublicLayout.tsx`
  - usado nas telas publicas, como inicio, login, cadastro e paginas
    institucionais.

- `src/layouts/AppShell.tsx`
  - usado na area logada.
  - monta navegacao, topo, seletor de perfil demo e conteudo principal.

## Estado de usuario/demo

O arquivo `src/contexts/ProfileContext.tsx` controla:

- perfil atual: `usuario`, `voluntario`, `moderador`, `administrador`
- estado simples de autenticacao demo
- persistencia em `localStorage`

Chaves usadas:

```text
vidaplus:role
vidaplus:auth
```

Quando a API real for integrada, esse contexto deve passar a refletir o usuario
retornado por `/api/users/me` e o token do login.

## Camada de dados

As telas nao acessam mocks diretamente. Elas chamam services em:

```text
src/services/index.ts
```

Hoje esse arquivo usa:

```text
src/mocks/db.ts
src/mocks/handlers.ts
```

Isso deixa a demo funcionando sem backend.

Para usar o backend real, a troca deve acontecer principalmente em
`src/services/index.ts`, usando o cliente:

```text
src/services/api/client.ts
```

## Configuracao de URLs

As URLs ficam em `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

Para producao, use as URLs reais:

```env
VITE_API_BASE_URL=https://sua-api.com/api
VITE_APP_URL=https://seu-frontend.com
```

No Vite, variaveis expostas ao frontend precisam comecar com `VITE_`.

## Comunicacao com o backend

O cliente HTTP fica em:

```text
src/services/api/client.ts
```

Ele faz:

- montagem da URL base
- envio de `Content-Type: application/json`
- envio automatico de `Authorization: Bearer <token>` quando houver token
- leitura de erro no formato do backend

Token usado:

```text
vidaplus:access_token
```

## Fluxo esperado com API real

```text
usuario abre /login
  -> authService.login chama POST /api/auth/login
  -> frontend salva access_token
  -> userService.me chama GET /api/users/me
  -> app libera /app, /vol, /mod ou /admin conforme role
```

## Fluxos implementados em demo

- Login, cadastro e entrada anonima
- Recuperacao de senha
- Dashboard do usuario
- Entrada em fila de acolhimento
- Chat do usuario
- Historico de conversas
- Perfil e preferencias
- Denuncia
- Candidatura para voluntario
- Painel/fila do voluntario
- Chat do voluntario
- Moderacao de denuncias
- Comunidades pseudonimas
- Administracao de usuarios, candidaturas e comunidades

## PWA

Arquivos principais:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `src/components/pwa/PwaManager.tsx`
- `src/components/pwa/OfflineIndicator.tsx`
- `src/components/pwa/InstallButton.tsx`

O service worker evita cachear `/api/` para nao guardar dados privados de chat
ou usuario.

## Ambientes

Desenvolvimento local com backend local:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

Desenvolvimento local com backend online:

```env
VITE_API_BASE_URL=https://vida-43t9.onrender.com/api
VITE_APP_URL=http://localhost:5173
```

Producao Netlify com backend Render:

```env
VITE_API_BASE_URL=https://vida-43t9.onrender.com/api
VITE_APP_URL=https://vidafrontend.netlify.app
```

## Deploy

O deploy esta preparado para Netlify:

```text
netlify.toml
```

Config atual:

- comando: `npm run build`
- pasta publicada: `dist`
- redirect SPA: `/* -> /index.html`
- cache para assets e icones

No deploy, configure:

```env
VITE_API_BASE_URL=https://vida-43t9.onrender.com/api
VITE_APP_URL=https://vidafrontend.netlify.app
```

## Como desenvolver

Instalar dependencias:

```bash
npm install
```

Rodar local:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Proximo passo recomendado

O melhor caminho agora e integrar por etapas:

1. Autenticacao real.
2. `/users/me`.
3. Conversas e mensagens.
4. Comunidades.
5. Admin/moderacao.
6. Notificacoes.

Assim fica mais facil testar cada parte sem quebrar a demo inteira de uma vez.
