# Synthetic Users Lab

Herramienta de testing UX/product con usuarios sintéticos. Simula perfiles de usuario y perfiles expertos para evaluar onboarding, fricción y retorno esperado.

## Stack real

- React 19 + TypeScript 5.7
- Vite 6
- Tailwind CSS v4
- shadcn/base-ui para primitives de interfaz
- Google Gemini 2.5 Flash (REST)
- API local con Express (`server.js`) y versión serverless en Vercel (`api/*.ts`)

## Comandos

```bash
npm install
cp .env.example .env.local
# Añade GEMINI_API_KEY en .env.local

npm run dev         # Vite (5173) + API Express (3001)
npm run dev:vercel  # entorno Vercel local
npm run lint
npm run test
npm run build
```

## Estructura actual

```text
api/
├── simulate.ts         # Endpoint Vercel: llama Gemini y normaliza respuesta
├── fetch-content.ts    # Endpoint Vercel: fetch y extracción de texto de URL
└── simulation-core.js  # Lógica compartida (prompts, repair JSON, web fetch)

src/
├── App.tsx             # Wizard 4 pasos + resultados
├── main.tsx            # Entry point React
├── components/ui/      # UI primitives (button, card, dialog, tabs, etc.)
├── lib/
│   ├── personas.ts     # Personas preset + source types
│   ├── simulation.ts   # Cliente API (simulate + fetch-content)
│   └── utils.ts        # helper de clases Tailwind
├── styles/
│   └── globals.css     # Tokens, tema, bridge Tailwind/shadcn
└── types/index.ts      # Tipos de dominio (Persona, Issue, SimulationResult...)

server.js               # API Express para desarrollo local
scripts/test-api-key.js # Smoke check manual de GEMINI_API_KEY
tests/                  # Tests automatizados de contrato/helpers
```

## Flujo principal

1. Selección de personas (usuarios y perfiles pro).
2. Definición del flujo a analizar (URL o repo, con contexto opcional).
3. Carga del contenido remoto de la URL cuando aplica.
4. Simulación secuencial por persona contra Gemini.
5. Resultados agregados + detalle por persona (journey, issues, retorno).

## Notas de arquitectura

- El frontend no usa Redux/Context global; el estado vive en `App.tsx`.
- La lógica duplicada de backend (prompts/JSON repair/fetch) está centralizada en `api/simulation-core.js`.
- Los tokens visuales viven en `src/styles/globals.css`.
- La UI está montada sobre componentes en `src/components/ui` para mantener consistencia visual.
