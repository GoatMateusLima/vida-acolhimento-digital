# O que o Backend precisa implementar

> Cole este documento no projeto backend.
> Gerado a partir do código-fonte do frontend após integração completa.

---

## DENÚNCIAS — Prioridade alta

### 1. `GET /api/reports/my` — denúncias do usuário logado

**Por que:** O usuário que faz a denúncia precisa ver o que enviou e acompanhar
o status. Hoje o frontend usa cache local como fallback, mas sem esse endpoint
o status nunca atualiza (o usuário vê sempre "pendente").

**Autenticação:** `Bearer <token>` — qualquer usuário autenticado.

**Resposta esperada:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "reason": "Conduta inadequada",
      "description": "Detalhes do ocorrido.",
      "status": "em_analise",
      "priority": "media",
      "created_at": "2026-01-01T00:00:00Z",
      "history": [
        { "at": "2026-01-01T00:00:00Z", "action": "Denúncia registrada", "by": "Sistema" },
        { "at": "2026-01-01T02:00:00Z", "action": "Em análise", "by": "Sistema" }
      ]
    }
  ]
}
```

**Atenção:** NÃO expor nome do moderador, decisão interna, nem dados do denunciado
ao usuário comum. Apenas `id`, `reason`, `description`, `status`, `priority`,
`created_at` e histórico de ações públicas.

---

### 2. `GET /api/reports/admin/reports/:id` — incluir `history[]`

**Por que:** A tela de detalhe da denúncia para o moderador exibe uma timeline
de ações. Sem `history`, ela fica vazia.

**Campo a adicionar na resposta:**
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

---

### 3. `PATCH /api/reports/admin/reports/:id` — já funciona ✅

O frontend envia `{ status, decision }`. Apenas confirmar que os valores aceitos são:
- `status`: `"pendente"` | `"em_analise"` | `"resolvido"` | `"arquivado"`
- `decision`: string com no mínimo 5 caracteres

---

## CHAT / CONVERSAS — Prioridade crítica

### 4. SSE — `GET /api/conversations/:id/events`

**Por que:** O chat em tempo real depende disso. O frontend conecta via `fetch`
com header `Authorization: Bearer` — não usa `EventSource` nativo justamente
para poder enviar o token.

**O backend DEVE aceitar autenticação via header:**
```
Authorization: Bearer <access_token>
```

**Formato dos eventos esperados:**
```
event: message
data: {"id":"uuid","conversation_id":"uuid","sender_id":"uuid","body_encrypted":"texto","type":"text","created_at":"..."}

event: heartbeat
data: {"at":"2026-01-01T00:00:00Z"}

event: error
data: {"message":"Canal encerrado."}
```

**Headers de resposta obrigatórios:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

---

### 5. `sender_id` em todas as mensagens — CRÍTICO

**Por que:** O frontend usa `sender_id` para saber se a mensagem é do usuário
atual ou do outro lado. Sem isso, todas as mensagens aparecem como "do voluntário".

- Mensagens de texto: `sender_id` = UUID do remetente
- Mensagens de sistema: `sender_id: null` e `type: "system"`

```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "sender_id": "uuid-do-remetente",
  "body_encrypted": "texto da mensagem",
  "type": "text",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### 6. `POST /api/conversations` — retornar posição na fila

**Por que:** A tela de espera mostra posição e tempo estimado.
Hoje mostra `1 / 4 min` fixo.

**Adicionar na resposta:**
```json
{
  "data": {
    "id": "uuid",
    "status": "aguardando",
    "priority": "normal",
    "position": 3,
    "estimated_wait_minutes": 8,
    "created_at": "..."
  }
}
```

---

### 7. `GET /api/conversations/:id` — incluir nome do voluntário

**Por que:** O chat exibe "Voluntário disponível" genérico porque o backend
só retorna `volunteer_id`.

**Adicionar na resposta:**
```json
{
  "data": {
    "id": "uuid",
    "volunteer_id": "uuid",
    "volunteer_display_name": "Nome ou apelido do voluntário",
    ...
  }
}
```

---

### 8. `GET /api/conversations/volunteer/dashboard` — campos completos

**Por que:** O dashboard admin exibe cards com métricas, mas a maioria
aparece como `0` porque o backend retorna só `{ total, ativas, encerradas }`.

**Adicionar na resposta:**
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

---

## AUTENTICAÇÃO

### 9. `POST /api/auth/register` — retornar `session` junto com `user`

**Por que:** Hoje o cadastro faz dois requests (register + login). Se retornar
a session direto, o usuário entra sem precisar do segundo request.

```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "cadastrado", "display_name": "..." },
    "session": { "access_token": "jwt...", "refresh_token": "..." }
  }
}
```

---

### 10. `PASSWORD_RESET_REDIRECT_URL` — mudar para `/nova-senha`

O frontend agora tem a tela `/nova-senha` que recebe o token e permite
definir a nova senha. A URL do redirect de reset precisa apontar para ela.

**Atualizar no Render (variável de ambiente):**
```env
PASSWORD_RESET_REDIRECT_URL=https://vidafrontend.netlify.app/nova-senha
```

Em desenvolvimento local:
```env
PASSWORD_RESET_REDIRECT_URL=http://localhost:5173/nova-senha
```

O frontend lê o `access_token` do hash da URL (`#access_token=...`) ou
do query param (`?token=...`) — aceitar os dois formatos.

---

## COMUNIDADES

### 11. `GET /api/communities` — incluir `my_alias`

**Por que:** O apelido do usuário no grupo não aparece porque o backend não
retorna esse campo.

**Quando `is_member: true`, incluir:**
```json
{
  "id": "uuid",
  "name": "Conversas leves",
  "is_member": true,
  "my_alias": "Girassol Calmo 27",
  ...
}
```

---

### 12. `POST /api/communities/messages/:messageId/reveal-identity`

**Por que:** O frontend espera campos específicos que o backend não retorna.

**Resposta atual do backend:** `{ real_user_id, display_name }`

**Resposta que o frontend espera:**
```json
{
  "data": {
    "message_id": "uuid",
    "alias": "Girassol Calmo 27",
    "display_name": "Nome Real do Usuário",
    "email": "email@exemplo.com"
  }
}
```

---

## VOLUNTÁRIOS

### 13. `GET /api/admin/volunteers/applications` — acessível pelo voluntário

**Por que:** O voluntário acessa `/vol/candidatura` para ver o status da própria
candidatura. Esse endpoint hoje é `admin only`.

**Opção A:** Quando chamado por voluntário (não admin), retornar apenas
a candidatura do usuário logado.

**Opção B:** Criar endpoint dedicado:
```
GET /api/admin/volunteers/applications/me
Authorization: Bearer <token>  (qualquer usuário autenticado)
```

O frontend tenta `applicationService.list()` e pega `data[0]` como a
candidatura mais recente.

---

## RESUMO POR PRIORIDADE

| # | Endpoint | Por quê é importante | Esforço |
|---|----------|----------------------|---------|
| 1 | `sender_id` em todas as mensagens | Chat não funciona sem | 🔴 Crítico |
| 2 | SSE aceitar `Authorization` header | Chat tempo real não funciona | 🔴 Crítico |
| 3 | `GET /reports/my` | Usuário não vê suas denúncias | 🔴 Alto |
| 4 | `history[]` em `/reports/admin/reports/:id` | Timeline de denúncia vazia | 🟡 Médio |
| 5 | `POST /auth/register` retornar `session` | Cadastro faz 2 requests | 🟡 Médio |
| 6 | `PASSWORD_RESET_REDIRECT_URL` para `/nova-senha` | Reset de senha não funciona | 🟡 Médio |
| 7 | Dashboard com campos completos | Métricas admin zeradas | 🟡 Médio |
| 8 | `POST /conversations` com `position` | Fila mostra posição fixa | 🟢 Baixo |
| 9 | `GET /conversations/:id` com `volunteer_display_name` | Nome genérico no chat | 🟢 Baixo |
| 10 | `GET /communities` com `my_alias` | Apelido não aparece no grupo | 🟢 Baixo |
| 11 | `reveal-identity` retornar campos corretos | Revelar identidade quebra | 🟢 Baixo |
| 12 | `applications` acessível pelo voluntário | Status da candidatura não carrega | 🟢 Baixo |
