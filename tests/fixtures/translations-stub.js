/** Subconjunto mínimo de `Translations` para tests de `app-lab`. */
export const translationsStubEs = {
  selectAtLeastOne: "Selecciona al menos un perfil",
  formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
    const parts = [];
    if (simpleCount > 0) parts.push(`${simpleCount} usuario${simpleCount !== 1 ? "s" : ""}`);
    if (proCount > 0) parts.push(`${proCount} pro`);
    return parts.join(" + ") + " seleccionado" + (totalSelected !== 1 ? "s" : "");
  },
  validationNameRequired: "Nombre requerido",
  validationDescriptionRequired: "Descripción requerida",
};
