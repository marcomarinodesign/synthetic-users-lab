/** Plinng Design System — Token constants */
export const tokens = {
  /* Core */
  primary: "#000000",
  primaryText: "#FFFFFF",
  secondary: "#BEFF50",
  secondaryText: "#000000",
  tertiary: "#FFFFFF",
  tertiaryBorder: "#EBEBEB",
  disabled: "#949494",

  /* Accent */
  accent100: "#EEFFC7",
  accent200: "#DBFF95",
  accent300: "#BEFF50",
  accent500: "#86DD05",
  accent700: "#4D8605",

  /* Beige */
  beige25: "#FBFBF7",
  beige50: "#F5F5EB",
  beige100: "#DCDCCB",
  beige200: "#D0CFB8",
  beige300: "#B4B290",

  /* Grey */
  greySoft: "#EBEBEB",
  greySoftMiddle: "#D8D8D8",
  greyMiddle: "#C3C3C3",
  greyDark: "#949494",

  /* Basics */
  textSecondary: "#95958F",
  white: "#FFFFFF",
  black: "#000000",

  /* Status */
  error1: "#DC2625",
  error2: "#FECACA",
  error3: "#FFE0E0",
  warning1: "#E89E1B",
  warning2: "#FFEBC6",
  info1: "#1447E6",
  info2: "#DBEAFE",

  /* Radius */
  rSm: "4px",
  rMd: "8px",
  rLg: "12px",
  rXl: "16px",
  r2xl: "24px",
  rFull: "9999px",

  /* Shadow */
  shadowSm: "0 1px 2px 0 rgba(0,0,0,0.05)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)",
  shadowLg: "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)",

  /* Font */
  font: "'Inter', sans-serif",
} as const;

export type Tokens = typeof tokens;
