/** Minimal `Translations` subset for `app-lab` tests. */
export const translationsStubEn = {
  selectAtLeastOne: "Select at least one profile",
  formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
    const parts = [];
    if (simpleCount > 0) parts.push(`${simpleCount} user${simpleCount !== 1 ? "s" : ""}`);
    if (proCount > 0) parts.push(`${proCount} pro`);
    return parts.join(" + ") + " selected";
  },
  validationNameRequired: "Name required",
  validationDescriptionRequired: "Description required",
};
