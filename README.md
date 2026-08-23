# VIDA+ - Frontend

Frontend do projeto VIDA+, conectado ao backend em:

```text
C:\Users\todeb\Desktop\PROJETOS\VIDA+
```

Este app usa React, TypeScript, Vite, TanStack Router, TanStack Query,
Tailwind CSS e shadcn/ui.

## Funcionamento

Leia:

- `docs/COMO_FUNCIONA.md`
- `docs/GUIA_INTEGRACAO_BACKEND.md`

## URLs

Configure em `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

Para testar frontend local com backend online:

```env
VITE_API_BASE_URL=https://vida-server-9khr.onrender.com/api
VITE_APP_URL=http://localhost:5173
```

No Netlify:

```env
VITE_API_BASE_URL=https://vida-server-9khr.onrender.com/api
VITE_APP_URL=https://vida-acolhimento-digital.netlify.app
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Estrutura

```text
src/
  routes/          paginas
  components/      componentes de UI
  layouts/         layouts
  contexts/        estado de perfil/demo
  services/        services usados pelas telas
  services/api/    cliente HTTP configuravel
  mocks/           dados simulados
  types/           tipos TypeScript
```

## Aviso

O VIDA+ oferece acolhimento e escuta emocional, nao diagnostico ou tratamento
medico. Em emergencia: CVV 188 ou SAMU 192.
