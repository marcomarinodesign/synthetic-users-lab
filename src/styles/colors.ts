/**
 * Paleta base del Synthetic Users Lab (única fuente de verdad en hex para tipos y documentación).
 * Los valores efectivos en runtime salen de `src/styles/globals.css` (`--color-*`); deben mantenerse alineados.
 */
export const palette = {
  pomegranate: "#F9461E",
  blackHaze: "#F6F7F9",
  asfalt: "#1C1412",
  cornflowerBlue: "#5F90F1",
  white: "#FFFFFF",
} as const;

export type PaletteName = keyof typeof palette;
export type PaletteHex = (typeof palette)[PaletteName];

/**
 * Roles semánticos (referencia para TS y copy); en CSS se exponen como `--color-primary`, `--color-beige-25`, etc.
 */
export const semanticRoles = {
  /** Botón primario sólido, texto principal, anillos de énfasis neutros */
  primaryBg: "asfalt",
  primaryOnPrimary: "white",
  /** CTA secundaria (antes “lima”), alertas destructivas, score bajo */
  secondaryBrand: "pomegranate",
  onPomegranate: "white",
  /** Fondo de página / canvas */
  pageBackground: "blackHaze",
  /** Tarjetas, inputs sobre fondo */
  surface: "white",
  /** Texto sobre fondos claros */
  bodyText: "asfalt",
  /** Progreso, info, acento de producto, foco accesible */
  accentBrand: "cornflowerBlue",
} as const;

/** Referencias `var(--color-*)` alineadas con `tokens.ts` para uso en lógica o tests. */
export const cssVar = {
  primary: "var(--color-primary)",
  primaryText: "var(--color-primary-text)",
  secondary: "var(--color-secondary)",
  secondaryText: "var(--color-secondary-text)",
  accent300: "var(--color-accent-300)",
  beige25: "var(--color-beige-25)",
  basicsBlack: "var(--color-basics-black)",
  basicsWhite: "var(--color-basics-white)",
} as const;
