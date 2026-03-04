# 🧪 Synthetic Users Lab

Simula usuarios reales testeando tus flujos de producto — desde Figma, URL, repo o descripción manual.

Herramienta de testing con usuarios sintéticos powered by Claude API. Permite definir perfiles de usuario (personas), describir flujos de producto, y obtener feedback detallado simulado desde la perspectiva de cada perfil.

## Stack

- **React 19** + TypeScript
- **Vite 6** con HMR
- **Tailwind CSS v4** con `@theme` tokens
- **Plinng Design System** — tokens, componentes y patrones
- **Claude API** (Sonnet 4) — simulación de usuarios

## Quick Start

```bash
# Clonar
git clone https://github.com/tu-usuario/synthetic-users-lab.git
cd synthetic-users-lab

# Instalar
npm install

# Configurar API key (opcional para dev local)
cp .env.example .env.local
# Editar .env.local con tu VITE_ANTHROPIC_API_KEY

# Desarrollo
npm run dev
```

> **Nota**: En Claude.ai artifacts, la API key se gestiona automáticamente. Para desarrollo local necesitas configurar tu propia key.

## Arquitectura

```
src/
├── components/        # UI components (DS-aligned)
│   ├── Avatar.tsx     # Avatar con iniciales + colores por persona
│   ├── Badge.tsx      # Badge con variantes y dot indicator
│   ├── Button.tsx     # BtnPrimary, BtnSecondary, BtnTertiary
│   ├── Modal.tsx      # Modal con focus trap y backdrop blur
│   └── index.ts       # Barrel exports
├── lib/
│   ├── personas.ts    # Preset personas + source types
│   └── simulation.ts  # API call + JSON repair logic
├── styles/
│   ├── globals.css    # Tailwind + Plinng DS tokens (@theme)
│   └── tokens.ts      # TS constants mirror de los CSS tokens
├── types/
│   └── index.ts       # Persona, SimulationResult, etc.
├── App.tsx            # Main app (wizard flow)
└── main.tsx           # Entry point
```

## Design System

Usa los tokens del **Plinng DS** (`plinng-ds`):

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#000000` | Botones principales, texto |
| `secondary` | `#BEFF50` | CTAs secundarios, accent lime |
| `beige-25` | `#FBFBF7` | Background principal |
| `beige-50` | `#F5F5EB` | Badges default, cards |
| `tertiary-border` | `#EBEBEB` | Bordes de inputs y cards |
| `error-1` | `#DC2625` | Issues críticos |
| `warning-1` | `#E89E1B` | Issues warning |
| `accent-700` | `#4D8605` | Success, scores altos |

**Font**: Inter (400, 600, 700, 800)
**Radius**: `rFull` (9999px) para botones pill, `rXl` (16px) para cards
**Shadow**: `shadowSm` para todos los contenedores

## Personas incluidas

| Perfil | Frustración | Nivel técnico | Caso de uso |
|--------|------------|---------------|-------------|
| Early Adopter Tech | Baja | Alto | Validar concepto |
| Manager Ocupado | Alta | Medio | Testear first impression |
| Escéptico Pragmático | Media | Medio | Detectar objeciones |
| Usuario No Técnico | Alta | Bajo | Validar usabilidad |
| Power User | Baja | Alto | Encontrar edge cases |
| Switcher Insatisfecho | Media | Alto | Comparar con competencia |
| Decisor de Compra | Alta | Bajo | Validar propuesta de valor |
| Mobile-First User | Alta | Medio | Testear responsive/perf |

Se pueden crear **personas personalizadas** desde el modal.

## Cómo funciona

1. **Seleccionar personas** — elige qué perfiles van a testear
2. **Definir flujo** — describe los pasos del flujo (URL, Figma, repo o manual)
3. **Simulación** — cada persona recorre el flujo vía Claude API
4. **Resultados** — score, steps, issues por severidad, retención

## Desarrollo en Cursor

El proyecto está preparado para trabajar con Cursor:

- Path aliases (`@/`) configurados en `tsconfig.json`
- Componentes separados para facilitar edición
- Types estrictos para autocompletar
- Tokens centralizados en `styles/tokens.ts`

### Próximos pasos sugeridos

- [ ] Añadir persistencia de resultados (localStorage o Supabase)
- [ ] Exportar resultados a CSV/PDF
- [ ] Integración directa con Figma MCP para leer pantallas
- [ ] Web fetch de URLs para analizar contenido real
- [ ] Comparar resultados entre iteraciones (A/B)
- [ ] Dashboard de histórico de tests

## License

MIT
