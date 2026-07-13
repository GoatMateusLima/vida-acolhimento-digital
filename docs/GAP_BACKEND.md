# Relatório de Gaps — O que o Backend precisa adaptar para o Frontend

> Gerado a partir da análise cruzada entre `src/services/index.ts` (frontend)
> e o contrato documentado pelo backend.
> Cole este arquivo no projeto backend.

---

## Legenda

- ✅ Compatível — frontend e backend já conversam
- ⚠️ Divergência — endpoint existe mas resposta tem campos diferentes do esperado
- ❌ Faltando — frontend chama, backend não tem ou não documenta
- 💡 Opcional — frontend suporta, backend pode implementar quando quiser

---

## 1. AUTENTICAÇÃO

### ✅ `POST /auth/register`
Compatível. Frontend envia `{ displayName, email, password }` e espera
`{ data: { user, session: { access_token, refresh_token } } }`.

### ✅ `POST /auth/login`
Compatível. Mesma estrutura acima.

### ✅ `POST /auth/anonymous`
Compatível.

### ✅ `POST /auth/logout`
Compatível. Frontend ignora o corpo da resposta.

### ✅ `POST /auth/password/reset`
Compatível. Frontend ignora o corpo da resposta.

### ⚠️ `POST /auth/register` — login automático após cadastro
**Problema:** O backend retorna status 201 mas o contrato mostra que
`data` contém `{ user: { id, email, displayName } }` sem `session`.
O frontend espera `session.access_token` dentro de `data` para fazer
login direto sem chamar `POST /auth/login` em seguida.

**Adaptação necessária:**
```json
// backend deve retornar isso em POST /auth/register:
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "cadastrado", "display_name": "..." },
    "session": { "access_token": "jwt...", "refresh_token": "..." }
  }
}
```

---

## 2. USUÁRIO

### ✅ `GET /users/me`
Compatível. Frontend lê: `id`, `display_name`, `role`, `email`, `created_at`.

### ✅ `PATCH /users/me/preferences`
Compatível. Frontend envia `{ nickname }`.

### ✅ `POST /users/me/consent`
Compatível. Frontend envia `{ type, version }`.

### ✅ `GET /users/admin`
Compatível.

### ✅ `PATCH /users/admin/:id/role`
Compatível. Frontend envia `{ role: "cadastrado" | "voluntario" | "moderador" | "administrador" }`.

---

## 3. CONVERSAS / CHAT

### ✅ `POST /conversations`
Compatível. Frontend usa `data.id` como `conversationId`.

### ⚠️ `POST /conversations` — campos de posição na fila
**Problema:** O frontend exibe `position` e `estimatedWait` na tela de espera,
mas o backend não retorna esses campos — apenas `{ id, status, priority, created_at }`.

**Adaptação necessária:** Adicionar à resposta:
```json
{
  "data": {
    "id": "uuid",
    "status": "aguardando",
    "priority": "normal",
    "position": 3,
    "estimated_wait_minutes": 4,
    "created_at": "..."
  }
}
```

### ⚠️ `GET /conversations` — formato da resposta
**Problema:** O contrato do backend mostra `data: [ ... ]` (array direto).
O frontend já trata os dois casos (`Array.isArray(data) ? data : data.items ?? []`),
então funciona de qualquer forma. Mas para consistência, padronizar como array direto.

### ✅ `GET /conversations/:id`
Compatível. Frontend lê: `id`, `anonymous_name`, `volunteer_id`, `status`,
`started_at`, `ended_at`, `closed_reason`, `priority`, `last_message`, `messages[]`.

### ⚠️ `GET /conversations/:id` — alias do voluntário
**Problema:** O frontend exibe `volunteerAlias` na conversa e na tela de
"Voluntário encontrado". O mapper atual usa `"Voluntario"` hardcoded quando
`volunteer_id` existe, pois o backend não retorna o nome do voluntário no
objeto da conversa.

**Adaptação necessária:** Incluir o nome/alias do voluntário na resposta:
```json
{
  "data": {
    "id": "uuid",
    "volunteer_id": "uuid",
    "volunteer_display_name": "Nome do Voluntário",
    ...
  }
}
```

### ✅ `POST /conversations/:id/messages`
Compatível. Frontend envia `{ text }`, espera objeto de mensagem com
`id`, `conversation_id`, `sender_id`, `body_encrypted`, `type`, `created_at`.

### ✅ `POST /conversations/:id/close`
Compatível. Frontend envia `{ reason: "usuario_encerrou" }`.

### ✅ `GET /conversations/volunteer/queue`
Compatível. Frontend lê `id`, `anonymous_name`, `priority`, `created_at`.

### ✅ `POST /conversations/:id/accept`
Compatível. Frontend usa `data.id` como `conversationId`.

### ✅ `POST /conversations/:id/risk-flags`
Compatível. Frontend envia `{ level, reason }`.

### ⚠️ `GET /conversations/volunteer/dashboard` — campos insuficientes
**Problema:** O backend retorna `{ total, ativas, encerradas }` mas o frontend
espera campos adicionais para o painel admin:

```
totalUsers        → não retornado (frontend deixa 0)
totalVolunteers   → não retornado (frontend lê onlineVolunteers, que não existe)
satisfactionRate  → não retornado (frontend deixa 0)
weekly            → não retornado (frontend deixa [])
```

**Adaptação necessária:**
```json
{
  "data": {
    "total": 10,
    "ativas": 2,
    "encerradas": 8,
    "onlineVolunteers": 5,
    "pendingChats": 3,
    "totalUsersAllTime": 12438,
    "satisfactionRate": 96,
    "weeklyConversations": [
      { "day": "Seg", "conversations": 142 },
      { "day": "Ter", "conversations": 168 },
      { "day": "Qua", "conversations": 155 },
      { "day": "Qui", "conversations": 191 },
      { "day": "Sex", "conversations": 184 },
      { "day": "Sáb", "conversations": 220 },
      { "day": "Dom", "conversations": 204 }
    ]
  }
}
```

O frontend mapeia assim:
```
data.onlineVolunteers  → totalVolunteers
data.ativas            → activeConversations
data.total             → conversationsToday
data.totalUsersAllTime → totalUsers
data.satisfactionRate  → satisfactionRate
data.weeklyConversations → weekly (com campos day + conversations)
```

### ❌ `GET /conversations/:id/events` — SSE
**Problema:** O frontend conecta via `fetch + ReadableStream` com header
`Authorization: Bearer`. O backend **deve** aceitar esse header no endpoint SSE,
pois `EventSource` nativo não suporta headers customizados.

**Adaptação necessária:** Garantir que o endpoint SSE aceita autenticação via
header `Authorization: Bearer <token>` (não só via query param).

Formato dos eventos esperados pelo frontend:
```
event: message
data: {"id":"uuid","conversation_id":"uuid","sender_id":"uuid","body_encrypted":"texto","type":"text","created_at":"..."}

event: heartbeat
data: {"at":"2026-01-01T00:00:00Z"}

event: error
data: {"message":"Canal encerrado."}
```

---

## 4. VOLUNTÁRIOS

### ✅ `GET /admin/volunteers`
Compatível. Frontend lê `user_id`/`id`, `display_name`, `users.display_name`,
`status`, `availability_status`, `total_chats`.

### ✅ `PATCH /admin/volunteers/availability`
Compatível. Frontend envia `{ status: "online" | "ocupado" | "offline" }`.

---

## 5. CANDIDATURAS

### ✅ `POST /admin/volunteers/apply`
Compatível. Frontend envia `{ motivation, experience }` (experience já inclui
disponibilidade concatenada).

### ⚠️ `GET /admin/volunteers/applications` — acesso pelo voluntário
**Problema:** O frontend chama esse endpoint tanto do admin (para listar todas)
quanto do próprio voluntário (para ver sua candidatura em `/vol/candidatura`).

O backend documenta esse endpoint como **admin only**. O voluntário precisa
acessar sua própria candidatura.

**Adaptação necessária:** Ou tornar `GET /admin/volunteers/applications`
acessível para o próprio voluntário retornando só a dele, ou criar um endpoint
dedicado:
```
GET /admin/volunteers/applications/me   → retorna candidatura do usuário logado
```

### ✅ `GET /admin/volunteers/applications/:id`
Compatível.

### ✅ `POST /admin/volunteers/:id/approve`
Compatível.

### ✅ `POST /admin/volunteers/:id/reject`
Compatível. Frontend envia `{ decision: "..." }`.

---

## 6. DENÚNCIAS

### ✅ `POST /reports`
Compatível. Frontend envia dois formatos:
- por UUID: `{ targetType, targetId, reason, description }`
- por alias: `{ targetType, reportedAlias, reason, description }`

### ✅ `GET /reports/admin/reports`
Compatível.

### ✅ `GET /reports/admin/reports/:id`
Compatível. Frontend lê: `id`, `target_id`, `reason`, `description`, `status`,
`priority`, `created_at`, `history[]`.

### ⚠️ `GET /reports/admin/reports/:id` — campo `history`
**Problema:** O frontend exibe `history` como uma timeline de ações.
O contrato não documenta esse campo na resposta individual.

**Adaptação necessária:** Incluir `history` na resposta de detalhe:
```json
{
  "data": {
    "id": "uuid",
    "reason": "...",
    "status": "pendente",
    "history": [
      { "at": "2026-01-01T00:00:00Z", "action": "Denúncia registrada", "by": "Sistema" },
      { "at": "2026-01-01T01:00:00Z", "action": "Atribuída a moderador", "by": "Marina S." }
    ]
  }
}
```

### ✅ `PATCH /reports/admin/reports/:id`
Compatível. Frontend envia `{ status, decision }`.

---

## 7. COMUNIDADES

### ⚠️ `GET /communities` — campo `is_member` vs `joined`
**Problema:** O contrato do backend usa `is_member` mas o frontend espera
`joined`. O mapper já trata os dois: `Boolean(input.joined ?? input.is_member)`,
então funciona. Mas para consistência, o backend deveria padronizar um dos dois.

**Recomendação:** Retornar `is_member` (snake_case consistente com o resto).
O frontend já aceita.

### ⚠️ `GET /communities` — campo `my_alias`
**Problema:** O contrato do backend mostra a estrutura de comunidade mas não
documenta `my_alias`. O frontend exibe o apelido do usuário naquele grupo.

**Adaptação necessária:** Incluir `my_alias` quando o usuário já é membro:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Conversas leves",
      "is_member": true,
      "my_alias": "Girassol Calmo 27",
      ...
    }
  ]
}
```

### ✅ `POST /communities/:id/join`
Compatível.

### ✅ `POST /communities/:id/leave`
Compatível.

### ⚠️ `GET /communities/:id/messages` — campo `body_encrypted`
**Problema:** O contrato documenta `body_encrypted` nas mensagens de chat
individual, mas nas mensagens de comunidade documenta `body_encrypted` também.
O mapper de comunidade lê `input.body ?? input.text` (sem `body_encrypted`).

**Adaptação necessária:** Manter consistência — usar `body_encrypted` em
mensagens de comunidade também, ou `body` sem criptografia para comunidades.
O frontend mapper aceita os dois se o backend mandar `body_encrypted` ou `body`.

### ✅ `POST /communities/:id/messages`
Compatível.

### ⚠️ `POST /communities/messages/:messageId/reveal-identity` — campos da resposta
**Problema:** O contrato do backend retorna `{ real_user_id, display_name, ... }`
mas o frontend espera `{ message_id, alias, display_name, email }`.

**Adaptação necessária:**
```json
{
  "data": {
    "message_id": "uuid",
    "alias": "Girassol Calmo 27",
    "display_name": "Nome Real",
    "email": "email@exemplo.com"
  }
}
```

### ✅ Endpoints admin de comunidades
`GET/POST /communities/admin`, `GET/PATCH /communities/admin/:id`,
`PATCH /communities/admin/:id/members/:userId`, `DELETE /communities/admin/messages/:messageId`
— todos compatíveis.

---

## 8. NOTIFICAÇÕES

### ✅ `GET /notifications`
Compatível. Frontend lê `id`, `user_id`, `title`, `body`, `read_at`, `created_at`.

### ✅ `PATCH /notifications/:id/read`
Compatível.

---

## 9. CAMPOS CRÍTICOS NAS RESPOSTAS

### Mensagens — `sender_id` obrigatório
O frontend determina se uma mensagem é do usuário ou do voluntário comparando
`sender_id` com o ID salvo em localStorage (`vidaplus:user_id`).
**O backend DEVE sempre retornar `sender_id` em todas as mensagens.**
Mensagens de sistema devem ter `sender_id: null` ou `type: "system"`.

### Conversas — `anonymous_name`
O frontend exibe o alias do usuário nas conversas. O backend deve sempre
retornar `anonymous_name` em objetos de conversa.

### Conversas — status em português
O frontend espera: `aguardando`, `ativa`, `sinalizada`, `encerrada`, `arquivada`.
Qualquer outro valor é tratado como `waiting`.

### Candidaturas — status em português
O frontend espera: `pendente`, `em_analise`, `aprovada`, `rejeitada`.

---

## 10. NOVO ENDPOINT NECESSÁRIO — Minhas denúncias (usuário)

O frontend agora tem uma tela `/app/denuncias` onde o usuário vê as denúncias
que ele próprio enviou e acompanha o status.

**Endpoint necessário:**
```
GET /api/reports/my
Authorization: Bearer <token>  (qualquer usuário autenticado)
```

**Resposta esperada** (`data`): array das denúncias do usuário logado:
```json
[
  {
    "id": "uuid",
    "target_id": "alias-ou-uuid-do-alvo",
    "reason": "Conduta inadequada",
    "description": "Detalhes da ocorrência.",
    "status": "pendente",
    "priority": "media",
    "created_at": "2026-01-01T00:00:00Z",
    "history": [
      { "at": "2026-01-01T00:00:00Z", "action": "Denúncia registrada", "by": "Sistema" }
    ]
  }
]
```

> Atenção: não expor dados do moderador nem decisões internas ao usuário comum.
> Expor apenas: `id`, `reason`, `description`, `status`, `priority`,
> `created_at`, `history` (somente ações públicas como "registrada" e
> "em análise" — nunca o nome do moderador).

**Impacto se não implementado:** O frontend exibe uma mensagem de fallback
informando que o acompanhamento está sendo implementado, sem quebrar a tela.

---

## 11. RESUMO EXECUTIVO — PRIORIDADE (ATUALIZADO)

| # | Gap | Impacto | Esforço |
|---|-----|---------|---------|
| 1 | `POST /auth/register` retornar `session` | Cadastro faz dois requests | Baixo |
| 2 | `POST /conversations` retornar `position` + `estimated_wait_minutes` | Tela de fila mostra valores fixos | Baixo |
| 3 | `GET /conversations/:id` incluir `volunteer_display_name` | Nome do voluntário hardcoded | Baixo |
| 4 | `GET /conversations/volunteer/dashboard` — campos completos | Dashboard admin incompleto | Médio |
| 5 | SSE aceitar `Authorization` header | Chat em tempo real não funciona sem isso | Médio |
| 6 | `GET /admin/volunteers/applications` acessível pelo voluntário | Voluntário não vê própria candidatura | Baixo |
| 7 | `GET /reports/admin/reports/:id` incluir `history[]` | Timeline de denúncia vazia | Baixo |
| 8 | `GET /communities` incluir `my_alias` | Apelido do usuário não aparece nos grupos | Baixo |
| 9 | `POST /communities/messages/:id/reveal-identity` — campos corretos | Revelar identidade quebra | Baixo |
| 10 | `sender_id` em todas as mensagens | Mensagens aparecem como do voluntário errado | Crítico |
| 11 | `GET /reports/my` — denúncias do usuário logado | Usuário não vê suas denúncias | Baixo |

---

## 12. O QUE JÁ ESTÁ 100% PRONTO (não precisa mudar nada)

- `POST /auth/login`
- `POST /auth/anonymous`
- `POST /auth/logout`
- `POST /auth/password/reset`
- `GET /users/me`
- `PATCH /users/me/preferences`
- `POST /users/me/consent`
- `GET /users/admin` e `PATCH /users/admin/:id/role`
- `POST /conversations/:id/messages`
- `POST /conversations/:id/close`
- `GET /conversations/volunteer/queue`
- `POST /conversations/:id/accept`
- `POST /conversations/:id/risk-flags`
- `GET /admin/volunteers`
- `PATCH /admin/volunteers/availability`
- `POST /admin/volunteers/apply`
- `GET /admin/volunteers/applications/:id`
- `POST /admin/volunteers/:id/approve`
- `POST /admin/volunteers/:id/reject`
- `POST /reports`
- `GET /reports/admin/reports`
- `PATCH /reports/admin/reports/:id`
- `POST /communities/:id/join`
- `POST /communities/:id/leave`
- `POST /communities/:id/messages`
- Todos os endpoints admin de comunidades
- `GET /notifications`
- `PATCH /notifications/:id/read`
