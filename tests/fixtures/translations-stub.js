/** Minimal `Translations` subset for `app-lab` tests. */
export const translationsStubEn = {
  selectAtLeastOne: "Select at least one profile",
  selectionLimitReachedTitle: "Max profiles",
  selectionLimitHintAddCard: "Deselect to add",
  formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
    const parts = [];
    if (simpleCount > 0) parts.push(`${simpleCount} user${simpleCount !== 1 ? "s" : ""}`);
    if (proCount > 0) parts.push(`${proCount} pro`);
    const base = parts.join(" + ") + " selected";
    return totalSelected != null ? `${base} (${totalSelected}/3)` : base;
  },
  validationNameRequired: "Name required",
  validationDescriptionRequired: "Description required",
};
