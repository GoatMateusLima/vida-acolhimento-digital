# Contrato de Integração — Frontend VIDA+ → Backend

> Cole este documento no backend. Ele descreve tudo que o frontend espera
> para funcionar: URLs, headers, envelopes de resposta, campos exatos e
> mapeamentos de status.

---

## 1. Configuração Geral

### URL base

O frontend lê a URL base de `VITE_API_BASE_URL` (`.env.local`).
Todos os endpoints devem estar sob esse prefixo.

```
Desenvolvimento local : http://localhost:3000/api
Produção (Render)     : https://vida-43t9.onrender.com/api
```

### CORS — obrigatório

O backend deve aceitar requisições das origens abaixo:

```
http://localhost:5173
https://vidafrontend.netlify.app
```

Variável de ambiente sugerida no backend:

```env
CORS_ORIGINS=https://vidafrontend.netlify.app,http://localhost:5173
```

Métodos permitidos: `GET POST PATCH DELETE OPTIONS`
Headers permitidos: `Content-Type Authorization`

### Content-Type

O frontend envia e espera receber sempre `application/json`.

---

## 2. Autenticação

### Como funciona

O frontend armazena o JWT em `localStorage` com a chave `vidaplus:access_token`.
Em toda requisição autenticada, ele envia automaticamente:

```
Authorization: Bearer <token>
```

### Chaves de localStorage usadas pelo frontend

| Chave                    | Valor              |
|--------------------------|--------------------|
| `vidaplus:access_token`  | JWT de sessão      |
| `vidaplus:user_id`       | ID do usuário      |
| `vidaplus:role`          | Role atual         |
| `vidaplus:auth`          | `"1"` se logado    |

O frontend **nunca envia cookies** para autenticação — somente o header `Authorization`.

---

## 3. Envelope padrão de resposta

**Todas as respostas de sucesso** devem seguir este formato:

```json
{
  "status": "success",
  "message": "Operação concluída",
  "data": { ... }
}
```

O frontend acessa sempre `response.data`.
Se `data` for uma lista paginada, use:

```json
{
  "status": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Erros

Em caso de erro HTTP (`4xx`, `5xx`), o frontend lê o campo `message`:

```json
{
  "status": "error",
  "message": "Descrição legível do erro"
}
```

O campo `requestId` é opcional mas útil para debug.

---

## 4. Mapeamentos de Status

O frontend usa seus próprios termos internos. Os mappers estão em `services/index.ts`.
O backend deve usar os valores da coluna "Backend envia".

### Roles de usuário

| Frontend usa      | Backend envia     |
|-------------------|-------------------|
| `"usuario"`       | `"cadastrado"` ou `"anonimo"` |
| `"voluntario"`    | `"voluntario"`    |
| `"moderador"`     | `"moderador"`     |
| `"administrador"` | `"administrador"` |

Quando o frontend envia role para o backend (ex: `PATCH /users/admin/:id/role`),
ele converte `"usuario"` → `"cadastrado"` automaticamente.

### Status de conversa

| Frontend usa  | Backend envia / aceita                 |
|---------------|----------------------------------------|
| `"waiting"`   | `"aguardando"`                         |
| `"active"`    | `"ativa"` ou `"sinalizada"`            |
| `"ended"`     | `"encerrada"` ou `"arquivada"`         |

### Status de candidatura

| Frontend usa    | Backend envia / aceita |
|-----------------|------------------------|
| `"pendente"`    | `"pendente"`           |
| `"em_analise"`  | `"em_analise"`         |
| `"aprovado"`    | `"aprovada"`           |
| `"recusado"`    | `"rejeitada"`          |

### Status de voluntário (disponibilidade)

O backend deve aceitar e retornar os mesmos valores:
`"online"` | `"ocupado"` | `"offline"`

### Prioridade de conversa / fila

Mesmo valor nos dois lados: `"normal"` | `"prioritaria"` | `"crise"`

### Status de denúncia

Mesmo valor nos dois lados: `"pendente"` | `"em_analise"` | `"resolvido"` | `"arquivado"`

### Status de comunidade (admin)

Mesmo valor nos dois lados: `"ativo"` | `"pausado"` | `"arquivado"`

---

## 5. Endpoints de Autenticação

### `POST /auth/register`

**Body enviado pelo frontend:**
```json
{
  "displayName": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "SenhaForte123"
}
```

**Resposta esperada** (`data`):
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "display_name": "Nome do Usuário",
    "role": "cadastrado",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt.token.aqui"
  }
}
```

Se `session.access_token` estiver presente, o frontend já faz login direto.
Se não estiver, o frontend tenta `POST /auth/login` na sequência.

---

### `POST /auth/login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "SenhaForte123"
}
```

**Resposta esperada** (`data`):
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "display_name": "Nome",
    "role": "cadastrado",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt.token.aqui"
  }
}
```

Após receber o token, o frontend chama `GET /users/me` para confirmar o perfil.

---

### `POST /auth/anonymous`

Sem body.

**Resposta esperada** (`data`): mesmo formato de `POST /auth/login`.
O usuário anônimo recebe role `"anonimo"`.

---

### `POST /auth/password/reset`

**Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta esperada** (`data`): qualquer objeto (o frontend ignora).

---

### `POST /auth/logout`

Sem body. Autenticado com Bearer token.
**Resposta:** qualquer objeto.

---

## 6. Endpoints de Usuário

### `GET /users/me`

Autenticado. Sem body.

**Resposta esperada** (`data`) — campos lidos pelo frontend:
```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "display_name": "Nome do Usuário",
  "role": "cadastrado",
  "created_at": "2026-01-01T00:00:00Z"
}
```

Campos alternativos aceitos pelo mapper:
- `user_metadata.display_name` (fallback de `display_name`)
- `profile.nickname` (segundo fallback)
- `app_metadata.role` (fallback de `role`)
- `user_id` (fallback de `id`)

### `GET /users/admin`

Autenticado (admin). Sem body.

**Resposta esperada** (`data`): array de objetos no mesmo formato de `GET /users/me`.

### `PATCH /users/admin/:id/role`

Autenticado (admin).

**Body:**
```json
{
  "role": "voluntario"
}
```

Valores possíveis de role: `"cadastrado"` | `"voluntario"` | `"moderador"` | `"administrador"`

**Resposta esperada** (`data`): objeto do usuário atualizado (mesmo formato de `GET /users/me`).

---

## 7. Endpoints de Conversa / Chat

### `POST /conversations`

Autenticado (usuário). Sem body obrigatório.
Cria uma nova conversa e coloca o usuário na fila.

**Resposta esperada** (`data`):
```json
{
  "id": "uuid",
  "status": "aguardando",
  "priority": "normal",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### `GET /conversations`

Autenticado. Lista conversas do usuário logado.

**Resposta esperada** (`data`):
```json
{
  "items": [
    {
      "id": "uuid",
      "anonymous_name": "Pessoa acolhida",
      "volunteer_id": null,
      "status": "encerrada",
      "started_at": "2026-01-01T14:00:00Z",
      "ended_at": "2026-01-01T15:00:00Z",
      "closed_reason": "Ansiedade",
      "priority": "normal",
      "last_message": "Obrigada."
    }
  ]
}
```

Campos lidos pelo mapper `mapConversation`:
- `id`
- `anonymous_name` → exibido como alias do usuário
- `volunteer_id` → se presente, `volunteerAlias` é preenchido como "Voluntario"
- `status` → mapeado conforme tabela da seção 4
- `started_at` ou `created_at`
- `ended_at`
- `closed_reason` → exibido como `topic`
- `priority`
- `last_message`

### `GET /conversations/:id`

Autenticado. Retorna conversa + mensagens.

**Resposta esperada** (`data`):
```json
{
  "id": "uuid",
  "anonymous_name": "Pessoa acolhida",
  "status": "ativa",
  "started_at": "2026-01-01T14:00:00Z",
  "priority": "normal",
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid-do-remetente",
      "type": "user",
      "body": "Olá, preciso conversar.",
      "created_at": "2026-01-01T14:01:00Z"
    }
  ]
}
```

Campos lidos pelo mapper `mapMessage`:
- `id`
- `conversation_id`
- `sender_id` → comparado com `vidaplus:user_id` no localStorage para definir se é `"user"` ou `"volunteer"`
- `type` → se `"system"`, o author é `"system"`
- `body` ou `text`
- `created_at`

### `POST /conversations/:id/messages`

Autenticado.

**Body:**
```json
{
  "text": "Texto da mensagem"
}
```

**Resposta esperada** (`data`): objeto de mensagem (mesmo formato acima).

### `POST /conversations/:id/close`

Autenticado.

**Body:**
```json
{
  "reason": "usuario_encerrou"
}
```

**Resposta:** qualquer objeto.

### `GET /conversations/volunteer/queue`

Autenticado (voluntário). Lista fila de espera.

**Resposta esperada** (`data`): array de objetos:
```json
[
  {
    "id": "uuid",
    "anonymous_name": "Pessoa aguardando",
    "priority": "normal",
    "created_at": "2026-01-01T13:55:00Z"
  }
]
```

Campos lidos pelo mapper `mapQueueEntry`:
- `id`
- `anonymous_name` → alias exibido
- `priority`
- `created_at` → usado para calcular `waitingSince` e `estimatedWait`

### `POST /conversations/:id/accept`

Autenticado (voluntário). Voluntário aceita atendimento.

**Resposta esperada** (`data`):
```json
{
  "id": "uuid"
}
```

O frontend usa `data.id` como `conversationId`.

### `GET /conversations/volunteer/dashboard`

Autenticado (voluntário/admin). Retorna métricas de dashboard.

**Resposta esperada** (`data`):
```json
{
  "onlineVolunteers": 8,
  "activeChats": 27,
  "pendingChats": 5
}
```

### `POST /conversations/:id/risk-flags`

Autenticado (voluntário). Sinaliza risco numa conversa.
Body e resposta livres — o frontend apenas dispara o POST.

---

## 8. Endpoints de Voluntários

### `GET /admin/volunteers`

Autenticado (admin). Lista voluntários.

**Resposta esperada** (`data`): array de objetos:
```json
[
  {
    "user_id": "uuid",
    "availability_status": "online",
    "total_chats": 42,
    "users": {
      "display_name": "Nome do Voluntário"
    }
  }
]
```

Campos lidos pelo mapper `mapVolunteer`:
- `user_id` ou `id`
- `availability_status` → exibido como status
- `total_chats` → exibido como totalSessions
- `users.display_name` ou `display_name` → alias exibido

### `PATCH /admin/volunteers/availability`

Autenticado (voluntário). Atualiza status de disponibilidade.

**Body:**
```json
{
  "status": "online"
}
```

Valores: `"online"` | `"ocupado"` | `"offline"`
**Resposta:** qualquer objeto.

---

## 9. Endpoints de Candidaturas

### `POST /admin/volunteers/apply`

Autenticado (usuário). Submete candidatura para voluntário.

**Body:**
```json
{
  "motivation": "Quero ajudar pessoas.",
  "experience": "Tenho experiência em escuta ativa.\nDisponibilidade: Noites e fins de semana"
}
```

Nota: o frontend concatena `experience` + `"\\nDisponibilidade: "` + `availability` num único campo.

**Resposta esperada** (`data`): objeto de candidatura (mesmo formato de `GET /admin/volunteers/applications/:id`).

### `GET /admin/volunteers/applications`

Autenticado (admin). Lista todas as candidaturas.

**Resposta esperada** (`data`): array de objetos:
```json
[
  {
    "id": "uuid",
    "status": "pendente",
    "motivation": "...",
    "availability": "Noites",
    "experience": "...",
    "created_at": "2026-01-01T00:00:00Z",
    "users": {
      "display_name": "Nome do Candidato"
    }
  }
]
```

Campos lidos pelo mapper `mapApplication`:
- `id`
- `status` → mapeado conforme tabela da seção 4
- `motivation`
- `availability`
- `experience`
- `created_at` ou `submittedAt`
- `users.display_name` ou `display_name` ou `candidateAlias` → alias exibido

### `GET /admin/volunteers/applications/:id`

Mesmo formato que o item acima, objeto único.

### `POST /admin/volunteers/:id/approve`

Autenticado (admin). Aprova candidatura. Sem body obrigatório.
**Resposta:** qualquer objeto.

### `POST /admin/volunteers/:id/reject`

Autenticado (admin).

**Body:**
```json
{
  "decision": "Candidatura rejeitada pela administracao."
}
```

**Resposta:** qualquer objeto.

---

## 10. Endpoints de Denúncias

### `POST /reports`

Autenticado. Cria uma denúncia.

**Body — quando `reportedAlias` é um UUID:**
```json
{
  "targetType": "usuario",
  "targetId": "uuid-do-alvo",
  "reason": "Conduta inadequada",
  "description": "Detalhes da ocorrência."
}
```

**Body — quando `reportedAlias` é texto (apelido):**
```json
{
  "targetType": "usuario",
  "reportedAlias": "Nome ou apelido",
  "reason": "Conduta inadequada",
  "description": "Detalhes da ocorrência."
}
```

**Resposta esperada** (`data`): objeto de denúncia (mesmo formato abaixo).

### `GET /reports/admin/reports`

Autenticado (moderador/admin). Lista denúncias.

**Resposta esperada** (`data`): array de objetos:
```json
[
  {
    "id": "uuid",
    "target_id": "uuid-ou-alias",
    "reason": "Conduta inadequada",
    "description": "Detalhes.",
    "status": "pendente",
    "priority": "alta",
    "created_at": "2026-01-01T00:00:00Z",
    "history": [
      { "at": "2026-01-01T00:00:00Z", "action": "Denúncia registrada", "by": "Sistema" }
    ]
  }
]
```

Campos lidos pelo mapper `mapReport`:
- `id`
- `target_id` → exibido como `reportedAlias`
- `reason`
- `description` ou `details`
- `status`
- `priority`
- `created_at` ou `createdAt`
- `history[]` → exibido na timeline

### `GET /reports/admin/reports/:id`

Mesmo formato, objeto único.

### `PATCH /reports/admin/reports/:id`

Autenticado (moderador/admin). Atualiza status de denúncia.

**Body:**
```json
{
  "status": "resolvido",
  "decision": "Nota do moderador."
}
```

Valores de status: `"pendente"` | `"em_analise"` | `"resolvido"` | `"arquivado"`
**Resposta:** qualquer objeto.

---

## 11. Endpoints de Comunidades

### `GET /communities`

Autenticado. Lista comunidades disponíveis.

**Resposta esperada** (`data`): array de objetos:
```json
[
  {
    "id": "uuid",
    "name": "Conversas leves",
    "description": "Um espaço acolhedor...",
    "topic": "Convivência",
    "member_count": 148,
    "online_count": 12,
    "joined": true,
    "my_alias": "Girassol Calmo 27",
    "rules_json": [
      "Respeite o tempo de cada pessoa.",
      "Não compartilhe dados pessoais."
    ]
  }
]
```

Campos lidos pelo mapper `mapCommunity`:
- `id`
- `name`
- `description`
- `topic`
- `member_count` ou `memberCount`
- `online_count` ou `onlineCount`
- `joined` (boolean)
- `my_alias` ou `myAlias` → alias do usuário nessa comunidade
- `rules_json` ou `rules` → array de strings

### `POST /communities/:id/join`

Autenticado. Entra em uma comunidade. Sem body obrigatório.
Após o join, o frontend chama `GET /communities` novamente para atualizar.
**Resposta:** qualquer objeto.

### `POST /communities/:id/leave`

Autenticado. Sai de uma comunidade. Sem body obrigatório.
**Resposta:** qualquer objeto.

### `GET /communities/:id/messages`

Autenticado. Lista mensagens de uma comunidade.

**Resposta esperada** (`data`):
```json
{
  "items": [
    {
      "id": "uuid",
      "community_id": "uuid",
      "alias_snapshot": "Girassol Calmo 27",
      "body": "Texto da mensagem",
      "created_at": "2026-01-01T10:00:00Z",
      "is_mine": false,
      "reported": false
    }
  ]
}
```

Campos lidos pelo mapper `mapCommunityMessage`:
- `id`
- `community_id`
- `alias_snapshot` ou `alias` → apelido do autor
- `body` ou `text`
- `created_at`
- `is_mine` ou `isMine`
- `reported`

### `POST /communities/:id/messages`

Autenticado.

**Body:**
```json
{
  "text": "Texto da mensagem"
}
```

**Resposta esperada** (`data`): objeto de mensagem (mesmo formato acima).

### `POST /communities/messages/:messageId/reveal-identity`

Autenticado (moderador/admin). Revela identidade real de um autor.

**Body:**
```json
{
  "reason": "Investigação de denúncia."
}
```

**Resposta esperada** (`data`):
```json
{
  "message_id": "uuid",
  "alias": "Girassol Calmo 27",
  "display_name": "Nome Real do Usuário",
  "email": "email@exemplo.com"
}
```

---

## 12. Endpoints de Comunidades (Admin)

### `GET /communities/admin`

Autenticado (admin). Lista comunidades com dados administrativos.

**Resposta esperada** (`data`): array com os campos de comunidade + extras:
```json
[
  {
    "id": "uuid",
    "name": "Conversas leves",
    "description": "...",
    "topic": "Convivência",
    "member_count": 148,
    "online_count": 12,
    "joined": false,
    "rules_json": [],
    "status": "ativo",
    "message_count": 320,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

### `POST /communities/admin`

Autenticado (admin). Cria comunidade.

**Body:**
```json
{
  "name": "Nome do Grupo",
  "description": "Descrição do grupo.",
  "rules": []
}
```

**Resposta esperada** (`data`): objeto de comunidade admin (formato acima).

### `GET /communities/admin/:id`

Autenticado (admin). Retorna comunidade com membros e mensagens.

**Resposta esperada** (`data`):
```json
{
  "id": "uuid",
  "name": "...",
  "status": "ativo",
  "members": [
    {
      "user_id": "uuid",
      "display_name": "Nome do Membro",
      "email": "email@exemplo.com",
      "alias": "Apelido Pseudonimo",
      "platform_role": "cadastrado",
      "status": "ativo",
      "joined_at": "2026-01-01T00:00:00Z",
      "messageCount": 18
    }
  ],
  "messages": [
    {
      "id": "uuid",
      "community_id": "uuid",
      "alias_snapshot": "Apelido",
      "body": "Texto",
      "created_at": "2026-01-01T10:00:00Z"
    }
  ]
}
```

### `PATCH /communities/admin/:id`

Autenticado (admin). Atualiza status ou dados da comunidade.

**Body (atualizar status):**
```json
{
  "status": "pausado"
}
```

**Body (atualizar dados):**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição."
}
```

**Resposta esperada** (`data`): objeto de comunidade admin atualizado.

### `PATCH /communities/admin/:id/members/:userId`

Autenticado (admin). Atualiza status de um membro.

**Body:**
```json
{
  "status": "removido"
}
```

Valores: `"ativo"` | `"removido"`
**Resposta:** qualquer objeto.

### `DELETE /communities/admin/messages/:messageId`

Autenticado (admin/moderador). Remove mensagem.

**Body:**
```json
{
  "reason": "Removido pela moderacao do VIDA+."
}
```

**Resposta:** qualquer objeto.

---

## 13. Resumo Completo de Endpoints

| Método   | Endpoint                                          | Auth        | Usado por                   |
|----------|---------------------------------------------------|-------------|-----------------------------|
| POST     | `/auth/register`                                  | Público     | Cadastro                    |
| POST     | `/auth/login`                                     | Público     | Login                       |
| POST     | `/auth/anonymous`                                 | Público     | Acesso anônimo              |
| POST     | `/auth/password/reset`                            | Público     | Recuperar senha             |
| POST     | `/auth/logout`                                    | Bearer      | Logout                      |
| GET      | `/users/me`                                       | Bearer      | Perfil do usuário           |
| GET      | `/users/admin`                                    | Admin       | Gerenciar usuários          |
| PATCH    | `/users/admin/:id/role`                           | Admin       | Alterar role de usuário     |
| POST     | `/conversations`                                  | Bearer      | Entrar na fila              |
| GET      | `/conversations`                                  | Bearer      | Histórico de conversas      |
| GET      | `/conversations/:id`                              | Bearer      | Chat individual             |
| POST     | `/conversations/:id/messages`                     | Bearer      | Enviar mensagem             |
| POST     | `/conversations/:id/close`                        | Bearer      | Encerrar conversa           |
| POST     | `/conversations/:id/accept`                       | Voluntário  | Aceitar atendimento         |
| POST     | `/conversations/:id/risk-flags`                   | Voluntário  | Sinalizar risco             |
| GET      | `/conversations/volunteer/queue`                  | Voluntário  | Ver fila de espera          |
| GET      | `/conversations/volunteer/dashboard`              | Voluntário  | Métricas do painel          |
| GET      | `/admin/volunteers`                               | Admin       | Listar voluntários          |
| PATCH    | `/admin/volunteers/availability`                  | Voluntário  | Atualizar disponibilidade   |
| POST     | `/admin/volunteers/apply`                         | Bearer      | Candidatar-se               |
| GET      | `/admin/volunteers/applications`                  | Admin       | Listar candidaturas         |
| GET      | `/admin/volunteers/applications/:id`              | Admin       | Detalhe de candidatura      |
| POST     | `/admin/volunteers/:id/approve`                   | Admin       | Aprovar candidato           |
| POST     | `/admin/volunteers/:id/reject`                    | Admin       | Rejeitar candidato          |
| POST     | `/reports`                                        | Bearer      | Criar denúncia              |
| GET      | `/reports/admin/reports`                          | Mod/Admin   | Listar denúncias            |
| GET      | `/reports/admin/reports/:id`                      | Mod/Admin   | Detalhe de denúncia         |
| PATCH    | `/reports/admin/reports/:id`                      | Mod/Admin   | Atualizar status            |
| GET      | `/communities`                                    | Bearer      | Listar comunidades          |
| POST     | `/communities/:id/join`                           | Bearer      | Entrar em comunidade        |
| POST     | `/communities/:id/leave`                          | Bearer      | Sair de comunidade          |
| GET      | `/communities/:id/messages`                       | Bearer      | Mensagens de comunidade     |
| POST     | `/communities/:id/messages`                       | Bearer      | Enviar mensagem             |
| POST     | `/communities/messages/:messageId/reveal-identity`| Mod/Admin   | Revelar identidade          |
| GET      | `/communities/admin`                              | Admin       | Comunidades (admin)         |
| POST     | `/communities/admin`                              | Admin       | Criar comunidade            |
| GET      | `/communities/admin/:id`                          | Admin       | Detalhe comunidade (admin)  |
| PATCH    | `/communities/admin/:id`                          | Admin       | Editar comunidade           |
| PATCH    | `/communities/admin/:id/members/:userId`          | Admin       | Gerenciar membro            |
| DELETE   | `/communities/admin/messages/:messageId`          | Admin       | Remover mensagem            |

---

## 14. Validações de Formulário (Zod)

O frontend valida os dados antes de enviar. Estas são as regras aplicadas:

### Login
- `email`: string, formato de e-mail válido
- `password`: string, mínimo 6 caracteres

### Cadastro
- `name`: string, mínimo 2 caracteres
- `email`: string, formato de e-mail válido
- `password`: string, mínimo 10 caracteres, deve conter letra minúscula, maiúscula e número
- `accept`: deve ser `true` (aceite dos termos)

### Denúncia
- `reportedAlias`: string, mínimo 1 caractere
- `reason`: string, mínimo 3 caracteres
- `details`: string, mínimo 10, máximo 1000 caracteres

### Candidatura
- `candidateAlias`: string, mínimo 2 caracteres
- `motivation`: string, mínimo 20 caracteres
- `availability`: string, mínimo 3 caracteres
- `experience`: string, mínimo 3 caracteres

---

## 15. Variáveis de Ambiente do Backend

Configure no Render (ou `.env` local):

```env
# Origens aceitas pelo CORS
CORS_ORIGINS=https://vidafrontend.netlify.app,http://localhost:5173

# URL para redirect de reset de senha (abre no frontend)
PASSWORD_RESET_REDIRECT_URL=https://vidafrontend.netlify.app/recuperar-senha

# Necessário para trust proxy (Render, Heroku, etc.)
TRUST_PROXY=1

NODE_ENV=production
```

---

## 16. Notas Finais

- O frontend **não usa cookies** — autenticação é 100% via header `Authorization: Bearer`.
- O ID do usuário logado fica em `localStorage` (`vidaplus:user_id`). O mapper de mensagem
  usa esse ID para determinar se uma mensagem é `"user"` ou `"volunteer"` comparando com
  `sender_id`. Retorne sempre `sender_id` nas mensagens.
- O frontend **não implementa guard de rotas** ainda — qualquer URL é acessível.
  O backend deve proteger todos os endpoints autenticados com verificação de JWT.
- `staleTime` do TanStack Query é 30 segundos. Respostas são cacheadas por esse período.
  Para dados em tempo real (fila, chat), considere SSE ou polling no frontend.
- O service worker (`public/sw.js`) **não cacheia** rotas que começam com `/api/`.
  Chamadas de API sempre chegam na rede.
