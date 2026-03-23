/**
 * Datos del pie de página: ajusta copyright y URLs de perfiles.
 */
export const siteFooter = {
  copyright: `Copyright © ${new Date().getFullYear()} Marco Marino. Todos los derechos reservados.`,
  profiles: [
    { label: "GitHub", href: "https://github.com/marcomarinodesign" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marcomarinodesign/" },
    {
      label: "Notion",
      href: "https://marcomarino.notion.site/Hi-I-m-Marco-2cfb4cb32e27805590d8dfb9f6cfff27",
    },
  ] as const satisfies readonly { label: string; href: string }[],
};
