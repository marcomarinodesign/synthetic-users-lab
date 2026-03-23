# Synthetic Users Lab — Design System (Plinng DS)

## Principios

- **Una fuente de verdad para UI**: colores, radios, espaciado y sombras salen de tokens CSS en `src/styles/globals.css` (capa foundation + semántica shadcn).
- **Inter** como tipografía única de producto (UI + “heading” semántico); sin mezclar familias salvo decisión explícita de marca.
- **Componentes pequeños**: primitivos en `src/components/ui/` (shadcn/base-ui); piezas de producto reutilizables en `src/components/ds/`.
- **Incremental**: nuevas pantallas componen con tokens + DS; evitar hex y px mágicos repetidos.

## Arquitectura de tokens

| Capa | Dónde | Qué define |
|------|--------|------------|
| **Foundation** | Bloque `@theme { ... }` en `globals.css` | Paleta (`--color-accent-*`, `--color-beige-*`, errores/warning/info), escala `--space-*`, radios `--radius-*`, sombras `--shadow-*`. |
| **TS mirror (opcional)** | `src/styles/tokens.ts` | Mismos nombres como `var(--token)` para `style={{}}` o tipos (`ColorToken`, etc.). Mantener alineado con `globals.css`. |
| **Semantic (shadcn)** | `:root` / `.dark` + `@theme inline` | `--background`, `--primary`, `--ring`, `--font-sans`, mapeo a colores Plinng. |
| **Usage** | Componentes / utilidades Tailwind | `bg-[var(--color-beige-25)]`, `rounded-[var(--radius-xl)]`, helpers en `src/lib/ui-status.ts` para variantes de estado. |

**Nota:** `--radius` en `:root` (≈7px) es la base shadcn; la escala en px (`--radius-md`, `--radius-xl`, …) es la del producto Plinng. No duplicar otra escala `calc(var(--radius)*…)` salvo necesidad documentada.

## Convenciones de naming

- **Colores**: `--color-<ámbito>-<tono>` (ej. `--color-accent-700`, `--color-beige-25`).
- **Espaciado**: `--space-<n>` en múltiplos de 4px.
- **Radios**: `--radius-<tamaño>` con `full` para píldoras.
- **Estados de badge / score**: usar `scoreToTier`, `getStatusVariantBadgeClass` y `getIssueSeverityBadgeClass` en `src/lib/ui-status.ts`.

## Componentes core

| Tipo | Ubicación | Rol |
|------|-----------|-----|
| **Primitives** | `src/components/ui/*` | Button, Badge, Card, Dialog, Input, `FieldError`, `FieldHint`, etc. (variantes CVA, foco accesible). |
| **DS / composites** | `src/components/ds/*` | `Avatar`, `PersonaCard`, `ResultCard`, `MetricCard` — API estable, poca lógica de negocio. |
| **App / flujo** | `src/App.tsx` | Orquestación, estado, i18n (`src/lib/i18n.ts`). |

## Reglas de uso (Do / Don’t)

**Do**

- Usar tokens CSS (`var(--color-…)`, `var(--space-…)`, `var(--radius-…)`) para color, gap y bordes redondeados repetidos.
- Centralizar clases de severidad/tier en `ui-status.ts` y componer con `<Badge variant="outline" className={…} />`.
- Mantener foco visible: confiar en `:focus-visible` global y estilos de componentes UI.

**Don’t**

- Añadir otra familia tipográfica sin actualizar `globals.css` y este documento.
- Duplicar strings largos de clases para success/warning/error en cada pantalla.
- Inyectar `<link>` a fuentes en React; la carga vive en `globals.css`.

## Accesibilidad

- **Foco**: anillo `outline` con `--ring` en `:focus-visible` (base).
- **Contraste**: primario negro sobre lima/acentos según token; textos secundarios con `--color-basics-text-secondary`.
- **Motion**: `@media (prefers-reduced-motion: reduce)` reduce animaciones/transiciones en base.

## Cómo añadir un componente nuevo

1. Si es genérico (botón, input): extender o componer sobre `src/components/ui/`.
2. Si es específico de producto pero reutilizable: `src/components/ds/<Nombre>.tsx`, props tipadas, estilos con tokens.
3. Si repites el mismo trío de colores de estado, extiende `ui-status.ts` en lugar de copiar clases.
4. Exportar en `src/components/ds/index.ts` si forma parte del kit compartido.

## Checklist de PR (UI / DS)

- [ ] Sin colores hex nuevos fuera de `globals.css` (salvo excepción justificada).
- [ ] Radios y espaciado alineados con `--radius-*` / `--space-*`.
- [ ] Estados interactivos con foco visible y `aria-*` donde aplique.
- [ ] Texto de UI en strings i18n si la pantalla ya está traducida.
- [ ] `npm run lint` y `npm run build` sin errores.
