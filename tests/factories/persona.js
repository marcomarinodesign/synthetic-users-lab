/** @typedef {object} Persona */

export function makePersona(overrides = {}) {
  return {
    id: "test-persona-1",
    name: "Usuario Test",
    initials: "UT",
    avatarBg: "var(--color-beige-50)",
    avatarColor: "var(--color-basics-black)",
    category: "simple",
    description: "Descripción de prueba",
    traits: ["trait-a"],
    frustration: "medium",
    techLevel: "medium",
    ...overrides,
  };
}

export function makePersonaWithCategory(id, category) {
  return makePersona({
    id,
    category,
    name: `Persona ${id}`,
  });
}
