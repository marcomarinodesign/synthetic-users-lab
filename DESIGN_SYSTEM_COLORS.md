# Synthetic Users Lab — Color system

## Paleta base (5 colores)

| Nombre            | Hex       | Rol en producto |
|-------------------|-----------|-----------------|
| Pomegranate       | `#F9461E` | CTA secundaria (antes “lima”), estados destructivos / error, mezclas “warning” |
| Black Haze        | `#F6F7F9` | Fondo de página (`--color-beige-25`, `--background`) |
| Asfalt            | `#1C1412` | Texto principal, botón primario sólido, neutros derivados |
| Cornflower Blue   | `#5F90F1` | Acento de marca: progreso, éxito/información, anillo de foco (`--ring`) |
| White             | `#FFFFFF` | Superficies, texto sobre Asfalt/Pomegranate/Cornflower |

Fuente tipada: `src/styles/colors.ts` (`palette`). Variables CSS: `src/styles/globals.css` (`--color-palette-*` y alias `--color-*`). Espejo `var(--color-…)` para TS: `src/styles/tokens.ts`.

### Un solo tema claro

La app usa el bloque `@theme` con esta paleta. La clase `.dark` redefine tokens semánticos de Shadcn usando **los mismos** cinco colores (sin nuevos hex).

---

## Tokens semánticos frecuentes

| Token CSS | Uso |
|-----------|-----|
| `--color-primary` / `primary` | Fondo botón default (Asfalt); texto `primary-foreground` (White) |
| `--color-secondary` / `secondary` | Botón secundario (Pomegranate); texto blanco |
| `--color-accent-300` | Acento Cornflower: barra de progreso, chips de éxito, foco |
| `--color-accent-100` … `700` | Tintes de Cornflower (mezclas con White / Asfalt) para badges y avatares |
| `--color-beige-25` | Alias histórico del canvas = Black Haze |
| `--color-beige-50` … `300` | Superficies y rieles neutros (mezclas Asfalt + Black Haze) |
| `--color-error-*` | Derivados de Pomegranate |
| `--color-warning-*` | Pomegranate + Asfalt / White (misma familia que error — revisar si hace falta más contraste) |
| `--color-info-*` | Cornflower + tinte |

---

## Ejemplos

### Correcto

- Botón principal: `variant="default"` → `bg-primary text-primary-foreground` (Asfalt sobre White).
- Progreso: componente `Progress` usa `bg-accent` (Cornflower).
- Texto secundario: `text-muted-foreground` o `var(--color-basics-text-secondary)`.
- Bordes de card: `border-border` o `var(--color-tertiary-border)`.

### Incorrecto

- `#F9461E` o `#5F90F1` en JSX/CSS sueltos: deben pasar por `globals.css` o `color.*` en TS.
- Lima `#BEFF50` o negro puro `#000000`: sustituidos por Pomegranate y Asfalt en tokens.

---

## Reglas rápidas

1. **Texto sobre Pomegranate**: usar White (`--color-basics-white` / `secondary-foreground`).
2. **Texto sobre Asfalt (primario)**: usar White.
3. **Texto sobre Cornflower (acento lleno)**: usar White para contraste; en superficies muy claras (`accent-100`), usar `accent-700` o Asfalt según contraste.
4. **Fondos**: página = Black Haze; tarjetas = White; zonas atenuadas = `beige-50` / `muted`.
5. **Sombras**: `rgba(0,0,0,…)` está permitido como elevación neutra (no es color de marca).

---

## Casos dudosos (revisión manual)

- **Warning vs error**: ambos se apoyan en Pomegranate con distinta mezcla; si en métricas se confunden, valorar un borde o icono adicional, no un hex fuera de paleta.
- **CTA secundaria vs error**: comparten Pomegranate; el contexto (botón vs badge de severidad) debe diferenciarlos.
- **Foco (`--ring`)**: Cornflower; si el contraste falla sobre algún fondo, ajustar grosor u offset, no añadir color nuevo sin consenso.
