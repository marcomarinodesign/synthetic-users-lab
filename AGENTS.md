# Synthetic Users Lab — Contexto para AI Coding Agents

Este documento está pensado para que cualquier herramienta de AI coding (Claude, Cursor, Copilot, etc.) tenga contexto completo del proyecto antes de trabajar en él.

---

## ¿Qué es este proyecto?

**Synthetic Users Lab** es una herramienta web que usa la API de Google Gemini para simular cómo distintos perfiles de usuario interactúan con un flujo de producto. El equipo de producto define una URL, repositorio o descripción de un flow, selecciona personas-tipo (arquetipos de usuario), y la IA genera feedback detallado: score, issues encontrados, journey paso a paso, y probabilidad de retención.

**Idioma principal**: Español (UI y prompts del sistema).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript 5.7, Tailwind CSS v4 |
| Bundler | Vite 6 con HMR |
| Backend | Vercel Functions (`api/simulate.ts`) + Express fallback (`server.js`) |
| IA | Google Gemini 2.5 Flash via REST API |
| Deploy | Vercel |
| Design System | Plinng DS (tokens custom en `src/styles/globals.css` y `src/styles/tokens.ts`) |

---

## Estructura de archivos

```
synthetic-users-lab/
├── api/
│   └── simulate.ts          # Vercel Function: recibe persona + flow, llama a Gemini, devuelve JSON
├── src/
│   ├── components/
│   │   ├── Avatar.tsx        # Avatar circular con iniciales y colores
│   │   ├── Badge.tsx         # Badge con variantes: default, success, warning, error, info
│   │   ├── Button.tsx        # BtnPrimary, BtnSecondary, BtnTertiary (pill-shaped)
│   │   ├── Modal.tsx         # Dialog con focus trap, Escape para cerrar, click-outside
│   │   └── index.ts          # Barrel exports
│   ├── lib/
│   │   ├── personas.ts       # 8 personas predefinidas + SOURCE_TYPES
│   │   └── simulation.ts     # fetch wrapper hacia /api/simulate
│   ├── styles/
│   │   ├── globals.css       # Tailwind @theme con tokens del design system
│   │   └── tokens.ts         # Tokens como constantes TypeScript
│   ├── types/
│   │   └── index.ts          # Interfaces: Persona, FlowStep, Issue, SimulationResult, SourceType
│   ├── App.tsx               # Aplicación principal: wizard de 4 pasos + resultados
│   └── main.tsx              # Entry point React
├── server.js                 # Express server para dev local (puerto 3001)
├── vite.config.ts            # Proxy /api → localhost:3001 en dev
├── vercel.json               # Config de deploy Vercel
├── tsconfig.json             # TypeScript strict, alias @/ → src/
├── package.json
└── .env.local                # GEMINI_API_KEY (no commitear)
```

---

## Flujo de usuario (4 pasos)

### Paso 0 — Selección de personas
- Se muestran 8 personas predefinidas en `src/lib/personas.ts`
- El usuario puede seleccionar múltiples personas
- Hay un modal para crear personas custom (nombre, descripción, traits)
- **Estado**: `selectedPersonas: string[]`, `customPersona: {name, description, traits}`

### Paso 1 — Definir el flow
- El usuario elige el tipo de fuente: `url | figma | repo | description`
- Introduce el flow input (URL, descripción, etc.)
- Campo opcional de contexto del producto
- **Estado**: `flowInput: string`, `sourceType: SourceType`, `productContext: string`

### Paso 2 — Loading
- Muestra progreso: "Simulando X de Y — Nombre de persona"
- Se llama a `/api/simulate` en secuencia para cada persona
- **Estado**: `loading: boolean`, `progress: {current, total, personaName}`

### Paso 3 — Resultados
- 4 métricas resumen: score promedio, total issues, issues críticos, % retención
- Cards expandibles por persona con: summary, steps, issues, verbatim, wouldReturn
- **Estado**: `results: SimulationResult[]`

---

## API

### `POST /api/simulate`

**Request body:**
```typescript
{
  persona: {
    id: string;
    name: string;
    description: string;
    traits: string[];
    frustration: "low" | "medium" | "high";
    techLevel: "low" | "medium" | "high";
  };
  sourceType: "url" | "figma" | "repo" | "description";
  flowInput: string;
  productContext: string;
}
```

**Response (éxito 200):**
```typescript
{
  personaId: string;
  score: number;          // 1-10
  summary: string;        // 2-3 frases
  steps: { action: string; reaction: string; }[];
  issues: { severity: "critical" | "warning" | "info"; description: string; }[];
  wouldReturn: boolean | null;
  verbatim?: string;      // frase textual de la persona
}
```

**Errores:**
- `400`: Faltan campos o API key inválida
- `502`: Gemini falló o devolvió vacío
- `500`: Error interno

**Variables de entorno requeridas:**
- `GEMINI_API_KEY` — obtener en https://aistudio.google.com/app/apikey

---

## TypeScript interfaces clave

```typescript
// src/types/index.ts

interface Persona {
  id: string; name: string; initials: string;
  avatarBg: string; avatarColor: string; avatarPhoto?: string;
  description: string; traits: string[];
  frustration: "low" | "medium" | "high";
  techLevel: "low" | "medium" | "high";
}

interface FlowStep { action: string; reaction: string; }

interface Issue { severity: "critical" | "warning" | "info"; description: string; }

interface SimulationResult {
  personaId: string; score: number; summary: string;
  steps: FlowStep[]; issues: Issue[];
  wouldReturn: boolean | null; verbatim?: string;
}

type SourceType = "url" | "figma" | "repo" | "description";
```

---

## Design System (Plinng DS)

Tokens principales definidos en `src/styles/globals.css` via `@theme`:

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#000000` | Botones primarios, texto principal |
| `--color-secondary` | `#BEFF50` | CTAs secundarios, acento lima |
| `--color-beige-25` | `#FBFBF7` | Fondo principal de la app |
| `--color-beige-50` | `#F5F5EB` | Cards, badges |
| `--color-error-1` | `#DC2625` | Issues críticos |
| `--color-warning-1` | `#E89E1B` | Issues de warning |
| `--color-accent-700` | `#4D8605` | Éxito, early adopter |

Fuente: **Inter** 400/600/700/800 (Google Fonts).

Botones siempre pill-shaped (`border-radius: 9999px`), altura 40px.

---

## Convenciones de código

- **TypeScript strict**: No `any`, interfaces explícitas para todo
- **Alias de paths**: `@/` apunta a `src/` (configurado en `tsconfig.json` y `vite.config.ts`)
- **Estado local en App.tsx**: No hay Redux ni Context API, todo `useState` / `useCallback`
- **Tailwind v4**: Usar clases de utilidad de Tailwind; los colores custom se referencian como `bg-[var(--color-secondary)]` o via los tokens definidos en `@theme`
- **Español**: UI, mensajes de error, comentarios y prompts del sistema en español
- **Sin librerías de UI externas**: Solo componentes propios en `src/components/`

---

## Comandos de desarrollo

```bash
npm install              # Instalar dependencias
cp .env.example .env.local  # Configurar API key

npm run dev              # Frontend (5173) + API Express (3001) en paralelo
npm run dev:vercel       # Alternativa: Vercel dev environment completo
npm run build            # Build de producción (tsc + vite)
npm run lint             # ESLint
```

---

## Mejoras pendientes (backlog priorizado)

Las siguientes funcionalidades están identificadas y listas para implementar. Cada una incluye suficiente contexto técnico para que un agente las implemente sin fricción.

---

### 1. Persistencia de resultados en localStorage ⬆️ Alta prioridad

**Qué hacer:**
- Al completar una simulación, guardar los resultados en `localStorage` bajo una clave única con timestamp
- Mostrar un historial de simulaciones pasadas accesible desde la pantalla de inicio (paso 0)
- Permitir cargar una simulación pasada y ver sus resultados

**Dónde trabajar:**
- `src/App.tsx` — añadir lógica de guardado tras recibir resultados y carga al iniciar
- Crear `src/lib/storage.ts` — helpers: `saveSimulation()`, `loadSimulations()`, `deleteSimulation()`

**Estructura de datos sugerida:**
```typescript
interface SavedSimulation {
  id: string;           // timestamp + random
  date: string;         // ISO string
  flowInput: string;
  sourceType: SourceType;
  productContext: string;
  personas: Persona[];
  results: SimulationResult[];
}
```

**Clave localStorage:** `synthetic-users:history` (array de `SavedSimulation`)

---

### 2. Export de resultados a CSV ⬆️ Alta prioridad

**Qué hacer:**
- Botón "Exportar CSV" en el paso de resultados (paso 3)
- Generar un CSV con una fila por issue encontrado, columnas: persona, score, severity, description, wouldReturn

**Dónde trabajar:**
- `src/App.tsx` — añadir botón en la sección de resultados
- Crear `src/lib/export.ts` — función `exportResultsToCSV(results: SimulationResult[], personas: Persona[])`

**Implementación sugerida:** Generar string CSV en el cliente, crear Blob, disparar descarga via `<a download>`. Sin dependencias externas.

---

### 3. Fetch real del contenido de URLs ⬆️ Alta prioridad

**Qué hacer:**
- Cuando `sourceType === "url"`, antes de llamar a Gemini, hacer fetch del HTML de la URL
- Extraer el texto visible (sin scripts/styles) y pasarlo como contexto adicional a Gemini
- Así la simulación es más precisa al basarse en contenido real

**Dónde trabajar:**
- `api/simulate.ts` — añadir lógica de fetch antes del bloque de llamada a Gemini
- Usar la función nativa `fetch` ya disponible en Vercel Functions

**Consideraciones:**
- Límite de texto: truncar a ~3000 caracteres para no exceder el contexto del modelo
- Timeout: máximo 5s para el fetch de la URL, sino continuar sin contenido
- User-Agent: usar uno de navegador para evitar bloqueos

**Ejemplo de implementación:**
```typescript
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SyntheticUsersBot/1.0)" }
    });
    const html = await res.text();
    // Eliminar tags, scripts, styles
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                     .replace(/<[^>]+>/g, " ")
                     .replace(/\s+/g, " ").trim();
    return text.slice(0, 3000);
  } catch {
    return ""; // Continuar sin contenido si falla
  }
}
```

---

### 4. Modo comparación A/B ➡️ Media prioridad

**Qué hacer:**
- Permitir al usuario definir dos versiones de un flow (Version A y Version B)
- Ejecutar la misma simulación en paralelo para ambas versiones
- Mostrar resultados lado a lado con deltas: Δscore, Δissues, Δretención

**Dónde trabajar:**
- `src/App.tsx` — añadir modo A/B con dos inputs en el paso 1
- `src/types/index.ts` — añadir tipo `ABComparison`
- `src/lib/simulation.ts` — ejecutar dos rondas en paralelo

---

### 5. Streaming de respuestas ➡️ Media prioridad

**Qué hacer:**
- Usar `generateContent` con streaming en Gemini para mostrar resultados progresivamente
- El usuario ve cómo se va construyendo el JSON de cada persona en tiempo real

**Dónde trabajar:**
- `api/simulate.ts` — cambiar a endpoint de streaming de Gemini: `:streamGenerateContent`
- `src/lib/simulation.ts` — procesar `ReadableStream` de la response
- `src/App.tsx` — actualizar UI para mostrar resultados parciales

**Endpoint Gemini para streaming:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent
```

---

### 6. Personas custom persistentes ➡️ Media prioridad

**Qué hacer:**
- Las personas creadas via el modal se pierden al recargar
- Guardar personas custom en `localStorage` bajo `synthetic-users:custom-personas`
- Mostrarlas en la lista de selección junto a las predefinidas

**Dónde trabajar:**
- `src/App.tsx` — cargar personas custom al inicio, guardar al crear una nueva
- Añadir botón de eliminar persona custom en las cards

---

### 7. Integración real con Figma via MCP ⬇️ Baja prioridad

**Qué hacer:**
- Cuando `sourceType === "figma"` y el input es una URL de Figma, usar el MCP de Figma para extraer el diseño real
- Pasar el contexto del diseño (código, screenshot, anotaciones) a Gemini

**Nota:** Requiere que el entorno tenga configurado el MCP `claude.ai Figma`. En el entorno de desarrollo de Claude Code esto ya está disponible.

**Dónde trabajar:**
- `api/simulate.ts` — añadir rama para sourceType "figma"
- Extraer `fileKey` y `nodeId` de la URL de Figma antes de llamar a Gemini

---

### 8. Export a PDF ⬇️ Baja prioridad

**Qué hacer:**
- Botón "Exportar PDF" en resultados
- Generar un reporte visual usando `window.print()` con estilos CSS específicos para impresión (`@media print`)
- O usar `jsPDF` + `html2canvas` para una solución más robusta

---

## Notas para agentes

- **No modificar** `src/styles/globals.css` ni `src/styles/tokens.ts` sin entender el design system — los tokens afectan toda la UI
- **No introducir** nuevas dependencias sin justificación clara — el proyecto es deliberadamente ligero
- **Mantener** TypeScript strict: sin `any`, todas las interfaces explícitas
- **Probar** en modo dev con `npm run dev` antes de considerar una feature completa
- **Variables de entorno**: `GEMINI_API_KEY` debe estar en `.env.local` para que el backend funcione
- **El backend** tiene dos implementaciones: `api/simulate.ts` (Vercel, producción) y `server.js` (Express, dev). Cambios en la lógica de simulación deben reflejarse en ambos si aplica.
