/**
 * Espejo tipado de tokens definidos en `src/styles/globals.css` (@theme + semántica).
 * Hex canónicos: `src/styles/colors.ts` (`palette`).
 * En `className` de Tailwind suele ser más legible `bg-[var(--color-…)]`;
 * aquí `var(--…)` sirve para `style={{}}`, lógica TS y contratos compartidos.
 */
export { palette, semanticRoles, cssVar } from "./colors";
export type { PaletteHex, PaletteName } from "./colors";

export const color = {
  primary: "var(--color-primary)",
  primaryText: "var(--color-primary-text)",
  secondary: "var(--color-secondary)",
  secondaryText: "var(--color-secondary-text)",
  tertiary: "var(--color-tertiary)",
  tertiaryText: "var(--color-tertiary-text)",
  tertiaryBorder: "var(--color-tertiary-border)",
  disabled: "var(--color-disabled)",
  accent100: "var(--color-accent-100)",
  accent200: "var(--color-accent-200)",
  accent300: "var(--color-accent-300)",
  accent500: "var(--color-accent-500)",
  accent700: "var(--color-accent-700)",
  basicsBlack: "var(--color-basics-black)",
  basicsWhite: "var(--color-basics-white)",
  /** Texto secundario; contraste AA sobre beige-25 en `globals.css`. */
  basicsTextSecondary: "var(--color-basics-text-secondary)",
  beige25: "var(--color-beige-25)",
  beige50: "var(--color-beige-50)",
  beige100: "var(--color-beige-100)",
  beige200: "var(--color-beige-200)",
  beige300: "var(--color-beige-300)",
  greySoft: "var(--color-grey-soft)",
  greySoftMiddle: "var(--color-grey-soft-middle)",
  greyMiddle: "var(--color-grey-middle)",
  greyDark: "var(--color-grey-dark)",
  error1: "var(--color-error-1)",
  error2: "var(--color-error-2)",
  error3: "var(--color-error-3)",
  warning1: "var(--color-warning-1)",
  warning2: "var(--color-warning-2)",
  info1: "var(--color-info-1)",
  info2: "var(--color-info-2)",
} as const;

export const space = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  8: "var(--space-8)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  16: "var(--space-16)",
} as const;

export const radius = {
  none: "var(--radius-none)",
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  full: "var(--radius-full)",
} as const;

export const shadow = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

export type ColorToken = (typeof color)[keyof typeof color];
export type SpaceToken = (typeof space)[keyof typeof space];
export type RadiusToken = (typeof radius)[keyof typeof radius];
export type ShadowToken = (typeof shadow)[keyof typeof shadow];
