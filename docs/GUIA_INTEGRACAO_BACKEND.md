# Guia de Integracao com o Backend VIDA+

Este documento explica como o frontend `vida-acolhimento-digital` deve se
conectar ao backend `VIDA+`.

## Projetos

```text
Frontend: C:\Users\todeb\Desktop\PROJETOS\vida-acolhimento-digital
Backend:  C:\Users\todeb\Desktop\PROJETOS\VIDA+
```

## URLs de Ambiente

Frontend local com backend local:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

Frontend local com backend online:

```env
VITE_API_BASE_URL=https://vida-43t9.onrender.com/api
VITE_APP_URL=http://localhost:5173
```

Frontend Netlify com backend Render:

```env
VITE_API_BASE_URL=https://vida-43t9.onrender.com/api
VITE_APP_URL=https://vidafrontend.netlify.app
```

Backend Render:

```env
CORS_ORIGINS=https://vidafrontend.netlify.app,http://localhost:5173
PASSWORD_RESET_REDIRECT_URL=https://vidafrontend.netlify.app/nova-senha
NODE_ENV=production
TRUST_PROXY=1
```

## Onde as URLs Ficam

Frontend:

- `.env.local` para desenvolvimento local.
- `.env.example` como modelo.
- Variaveis de ambiente no Netlify para producao.

Backend:

- `.env` para desenvolvimento local.
- `.env.example` como modelo.
- Variaveis de ambiente no Render para producao.

No codigo do frontend, a URL e lida em:

```text
src/services/api/client.ts
```

Nao coloque URLs fixas dentro de paginas, componentes ou services.

## Camada de API do Frontend

Arquivo pronto para usar:

```text
src/services/api/client.ts
```

Ele:

- le `VITE_API_BASE_URL`
- le `VITE_APP_URL`
- monta chamadas `fetch`
- adiciona `Authorization: Bearer <token>` quando houver token
- salva token em `vidaplus:access_token`
- trata erros com `message`

## Services Ainda Mockados

As telas consomem:

```text
src/services/index.ts
```

Esse arquivo ainda usa:

```text
src/mocks/db.ts
src/mocks/handlers.ts
```

Para conectar a API real, substitua as funcoes mockadas por chamadas usando:

```ts
import { http, setAccessToken } from "@/services/api/client";
```

## Ordem Recomendada de Integracao

1. Autenticacao.
2. Usuario logado e perfil.
3. Atendimentos, fila e mensagens.
4. Comunidades.
5. Candidaturas, admin e moderacao.
6. Notificacoes.

## Autenticacao

Backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/anonymous`
- `POST /api/auth/logout`
- `POST /api/auth/password/reset`
- `POST /api/auth/password/update`

Frontend:

- `src/routes/login.tsx`
- `src/routes/cadastro.tsx`
- `src/routes/recuperar-senha.tsx`
- `src/services/index.ts`

Exemplo:

```ts
async login(email: string, password: string) {
  const response = await http<{
    user: User;
    session: { access_token: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAccessToken(response.session.access_token);
  return response.user;
}
```

Antes de implementar, confira o formato exato retornado por
`src/controllers/UserController.ts` no backend.

## Usuario e Perfil

Backend:

- `GET /api/users/me`
- `PATCH /api/users/me/preferences`
- `POST /api/users/me/consent`

Frontend:

- `src/routes/app.perfil.tsx`
- `src/routes/app.preferencias.tsx`
- `src/routes/app.privacidade.tsx`
- `src/services/index.ts`

O contexto de perfil fica em:

```text
src/contexts/ProfileContext.tsx
```

Quando a autenticacao real for integrada, o contexto deve refletir o usuario
retornado pelo backend, nao apenas o seletor demo.

## Atendimentos e Chat

Backend:

- `POST /api/conversations`
- `GET /api/conversations?page=1&limit=20`
- `GET /api/conversations/:id`
- `GET /api/conversations/:id/events`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/close`
- `GET /api/conversations/volunteer/queue`
- `GET /api/conversations/volunteer/dashboard`
- `POST /api/conversations/:id/accept`
- `POST /api/conversations/:id/risk-flags`

Frontend:

- `src/routes/app.conversar.tsx`
- `src/routes/app.chat.$id.tsx`
- `src/routes/app.historico.tsx`
- `src/routes/vol.index.tsx`
- `src/routes/vol.chat.$id.tsx`
- `src/routes/vol.historico.tsx`
- `src/services/index.ts`

Ajustes de contrato:

- Backend usa `aguardando`, `ativa`, `sinalizada`, `encerrada`.
- Frontend usa `waiting`, `active`, `ended`.
- Crie mappers para nao espalhar conversao nas telas.

## Comunidades

Backend:

- `GET /api/communities`
- `POST /api/communities/:id/join`
- `POST /api/communities/:id/leave`
- `GET /api/communities/:id/messages`
- `POST /api/communities/:id/messages`
- `POST /api/communities/messages/:messageId/reveal-identity`
- `GET /api/communities/admin`
- `POST /api/communities/admin`
- `GET /api/communities/admin/:id`
- `PATCH /api/communities/admin/:id`
- `PATCH /api/communities/admin/:id/members/:userId`
- `DELETE /api/communities/admin/messages/:messageId`

Frontend:

- `src/routes/app.comunidades.index.tsx`
- `src/routes/app.comunidades.$id.tsx`
- `src/routes/admin.comunidades.index.tsx`
- `src/routes/admin.comunidades.$id.tsx`
- `src/routes/mod.$id.tsx`
- `src/services/index.ts`

## Notificacoes

Backend:

- `GET /api/notifications?page=1&limit=20`
- `PATCH /api/notifications/:id/read`

Frontend recomendado:

- criar `notificationService` em `src/services/index.ts`
- criar componente em `src/components/common`
- exibir indicador em `src/layouts/AppShell.tsx`

## Candidaturas, Admin e Moderacao

Backend:

- `POST /api/admin/volunteers/apply`
- `PATCH /api/admin/volunteers/availability`
- `GET /api/admin/volunteers/applications`
- `POST /api/admin/volunteers/:id/approve`
- `POST /api/admin/volunteers/:id/suspend`
- `POST /api/reports`
- `GET /api/reports/admin/reports`
- `PATCH /api/reports/admin/reports/:id`

Frontend:

- `src/routes/app.candidatura.tsx`
- `src/routes/admin.candidaturas.index.tsx`
- `src/routes/admin.candidaturas.$id.tsx`
- `src/routes/app.denuncia.tsx`
- `src/routes/mod.index.tsx`
- `src/routes/mod.$id.tsx`
- `src/services/index.ts`

## Testes Apos Integrar

Backend:

```bash
npm run build
npm test
```

Frontend:

```bash
npm run build
npm run lint
```

Fluxos manuais:

- cadastro
- login
- recuperar senha
- perfil
- entrar na fila
- enviar mensagem
- listar comunidades
- entrar/sair de comunidade
- enviar mensagem em comunidade
- candidatura de voluntario
- denuncia
- moderacao/admin
