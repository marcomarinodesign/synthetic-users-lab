import type { Persona } from "@/types";
import type { Lang } from "@/lib/i18n";

export interface PersonaCopy {
  name: string;
  description: string;
  traits: string[];
}

/** Textos de perfiles predefinidos fuera de `es` (canónico en `personas.ts`). */
export const PRESET_TRANSLATIONS: Record<Exclude<Lang, "es">, Record<string, PersonaCopy>> = {
  en: {
    "early-adopter": {
      name: "Early Adopter Tech",
      description:
        "Technical user who tolerates bugs and looks for innovation. Judges whether the concept is strong even if execution is rough.",
      traits: ["Tolerates bugs", "Seeks innovation", "Gives technical feedback", "Compares alternatives"],
    },
    "ui-designer": {
      name: "UI Designer",
      description:
        "Evaluates visual hierarchy, component consistency, spacing, typography, contrast, and WCAG accessibility.",
      traits: ["Visual hierarchy", "Design system consistency", "WCAG accessibility", "Spacing and rhythm", "Contrast and legibility"],
    },
    "product-strategist": {
      name: "Product Strategist",
      description: "Evaluates value proposition, activation, retention, and monetization.",
      traits: ["Value proposition", "Activation and aha moment", "Retention and churn", "Pricing clarity", "Impact metrics"],
    },
    "busy-manager": {
      name: "Busy Manager",
      description: "Short on time; needs to understand the value in 10 seconds. If it is not clear, they leave.",
      traits: ["Impatient", "Results-oriented", "Delegates tasks", "Looks for clear ROI"],
    },
    skeptic: {
      name: "Pragmatic Skeptic",
      description: "Has seen many tools fail. Needs concrete proof and real use cases.",
      traits: ["Skeptical", "Asks for evidence", "Compares prices", "Looks for success stories"],
    },
    "ux-researcher": {
      name: "UX Researcher",
      description: "Evaluates usability, cognitive load, information flow, and friction at each step.",
      traits: ["Nielsen heuristics", "Cognitive load", "User journey mapping", "Spots drop-off points", "Suggests concrete alternatives"],
    },
    "non-tech": {
      name: "Non-technical User",
      description: "Does not understand jargon. If the UI is not obvious, they get lost. Represents the mainstream.",
      traits: ["Needs visual guidance", "Gets frustrated easily", "Skips instructions", "Asks a lot of questions"],
    },
    "power-user": {
      name: "Power User",
      description: "Uses the product to the max. Finds edge cases, wants shortcuts and customization.",
      traits: ["Explores everything", "Looks for shortcuts", "Reports detailed bugs", "Wants APIs/integrations"],
    },
    switcher: {
      name: "Dissatisfied Switcher",
      description: "Coming from a competitor and looking for something better. Compares every detail with what they already know.",
      traits: ["Compares with competitors", "High expectations", "Wants easy migration", "Sensitive to regressions"],
    },
    "budget-owner": {
      name: "Budget Owner",
      description: "Approves the budget. Does not use the product directly but must understand the value.",
      traits: ["Cost-benefit focus", "Transparent pricing", "Must justify purchase", "Little time"],
    },
    "mobile-first": {
      name: "Mobile-first User",
      description: "Does everything on mobile. If the experience is not responsive, they leave.",
      traits: ["Mobile only", "Performance-sensitive", "Touch gestures", "No horizontal scroll"],
    },
    "latam-founder": {
      name: "LATAM Founder",
      description:
        "Founder in Mexico/Colombia focused on fast growth without sacrificing operational simplicity.",
      traits: ["Watches costs closely", "Decides quickly", "Values Spanish support", "Needs clear flows"],
    },
    "eu-compliance-lead": {
      name: "EU Compliance Lead",
      description:
        "Operations lead in Europe who prioritizes trust, privacy, and traceability at every step.",
      traits: ["Demands legal clarity", "Spots trust risks", "Seeks consistency", "Values explicit confirmations"],
    },
    "fintech-analyst": {
      name: "Fintech Analyst",
      description:
        "Financial product professional evaluating precision, perceived risk, and decision transparency.",
      traits: ["Reads critical microcopy", "Values clear simulations", "Questions defaults", "Looks for advanced controls"],
    },
    "edtech-student": {
      name: "EdTech Student",
      description:
        "Multitasking university student who needs to grasp value quickly and move forward with low friction.",
      traits: ["Low on time", "Prefers visual examples", "Gets lost with jargon", "Low tolerance for long onboarding"],
    },
    "low-vision-advocate": {
      name: "Low-vision User",
      description:
        "Person who relies on high contrast, strong hierarchy, and legible text to complete tasks.",
      traits: ["Sensitive to contrast", "Needs clear typography", "Avoids dense interfaces", "Values visible feedback"],
    },
    "a11y-auditor": {
      name: "Accessibility Auditor",
      description:
        "Specialist reviewing accessibility end to end with WCAG criteria and an inclusive lens.",
      traits: ["Evaluates contrast and focus", "Checks navigation order", "Looks after labels and states", "Suggests actionable fixes"],
    },
  },
  fr: {
    "early-adopter": {
      name: "Early adopter tech",
      description:
        "Utilisateur technique, tolère les bugs, cherche l’innovation. Juge si le concept est puissant même si l’exécution est perfectible.",
      traits: ["Tolère les bugs", "Cherche l’innovation", "Donne un feedback technique", "Compare les alternatives"],
    },
    "ui-designer": {
      name: "Designer UI",
      description:
        "Évalue la hiérarchie visuelle, la cohérence des composants, l’espacement, la typo, le contraste et l’accessibilité WCAG.",
      traits: ["Hiérarchie visuelle", "Cohérence du design system", "Accessibilité WCAG", "Espacement et rythme", "Contraste et lisibilité"],
    },
    "product-strategist": {
      name: "Stratège produit",
      description: "Évalue la proposition de valeur, l’activation, la rétention et la monétisation.",
      traits: ["Proposition de valeur", "Activation et moment aha", "Rétention et churn", "Clarté du pricing", "Métriques d’impact"],
    },
    "busy-manager": {
      name: "Manager très occupé",
      description: "Peu de temps, doit comprendre la valeur en 10 secondes. Sinon, abandon.",
      traits: ["Impatient", "Orienté résultats", "Délègue", "Cherche un ROI clair"],
    },
    skeptic: {
      name: "Sceptique pragmatique",
      description: "A vu beaucoup d’outils échouer. Veut des preuves concrètes et des cas réels.",
      traits: ["Méfiant", "Demande des preuves", "Compare les prix", "Cherche des success stories"],
    },
    "ux-researcher": {
      name: "Chercheur UX",
      description: "Évalue l’utilisabilité, la charge cognitive, le flux d’information et la friction à chaque étape.",
      traits: ["Heuristiques de Nielsen", "Charge cognitive", "Parcours utilisateur", "Repère les abandons", "Propose des alternatives concrètes"],
    },
    "non-tech": {
      name: "Utilisateur non technique",
      description: "Ne comprend pas le jargon. Si l’UI n’est pas évidente, il se perd. Représente le grand public.",
      traits: ["Besoin de guidage visuel", "Se frustre vite", "Ne lit pas les instructions", "Pose beaucoup de questions"],
    },
    "power-user": {
      name: "Utilisateur power",
      description: "Utilise le produit à fond. Trouve les cas limites, veut raccourcis et personnalisation.",
      traits: ["Explore tout", "Cherche des raccourcis", "Remonte des bugs détaillés", "Veut API / intégrations"],
    },
    switcher: {
      name: "Utilisateur insatisfait (switch)",
      description: "Vient d’un concurrent et cherche mieux. Compare chaque détail avec ce qu’il connaît.",
      traits: ["Compare aux concurrents", "Attentes élevées", "Cherche une migration facile", "Sensible aux régressions"],
    },
    "budget-owner": {
      name: "Décideur budget",
      description: "Approuve le budget. N’utilise pas le produit directement mais doit comprendre la valeur.",
      traits: ["Analyse coût-bénéfice", "Pricing transparent", "Doit justifier l’achat", "Peu de temps"],
    },
    "mobile-first": {
      name: "Utilisateur mobile-first",
      description: "Tout fait sur mobile. Si l’expérience n’est pas responsive, abandon.",
      traits: ["Mobile uniquement", "Sensible à la perf", "Gestes tactiles", "Pas de scroll horizontal"],
    },
    "latam-founder": {
      name: "Fondatrice LATAM",
      description:
        "Entrepreneuse au Mexique/Colombie focalisee sur la croissance rapide sans perdre la simplicite operationnelle.",
      traits: ["Surveille les couts", "Decide vite", "Valorise le support en espagnol", "A besoin de parcours clairs"],
    },
    "eu-compliance-lead": {
      name: "Responsable conformite UE",
      description:
        "Responsable operations en Europe qui priorise confiance, confidentialite et tracabilite a chaque etape.",
      traits: ["Exige clarte legale", "Repere les risques de confiance", "Cherche la coherence", "Prefere des confirmations explicites"],
    },
    "fintech-analyst": {
      name: "Analyste Fintech",
      description:
        "Professionnel produit financier qui evalue precision, risque percu et transparence des decisions.",
      traits: ["Lit le microcopy critique", "Valorise les simulations claires", "Questionne les options par defaut", "Cherche des controles avances"],
    },
    "edtech-student": {
      name: "Etudiant EdTech",
      description:
        "Etudiant universitaire multitache qui doit comprendre la valeur vite et avancer sans friction.",
      traits: ["Peu de temps", "Prefere des exemples visuels", "Se perd avec le jargon", "Tolere mal un onboarding long"],
    },
    "low-vision-advocate": {
      name: "Utilisateur basse vision",
      description:
        "Personne qui depend d'un contraste eleve, d'une hierarchie forte et de textes lisibles pour accomplir ses taches.",
      traits: ["Sensible au contraste", "Besoin d'une typo lisible", "Evite les interfaces denses", "Valorise un feedback visible"],
    },
    "a11y-auditor": {
      name: "Auditrice accessibilite",
      description:
        "Specialiste qui examine l'accessibilite de bout en bout avec criteres WCAG et approche inclusive.",
      traits: ["Evalue contraste et focus", "Verifie l'ordre de navigation", "Soigne labels et etats", "Propose des ameliorations actionnables"],
    },
  },
  pt: {
    "early-adopter": {
      name: "Early adopter tech",
      description:
        "Usuário técnico, tolera bugs, busca inovação. Avalia se o conceito é forte mesmo com execução bruta.",
      traits: ["Tolera bugs", "Busca inovação", "Dá feedback técnico", "Compara alternativas"],
    },
    "ui-designer": {
      name: "Designer de UI",
      description:
        "Avalia hierarquia visual, consistência de componentes, espaçamento, tipografia, contraste e acessibilidade WCAG.",
      traits: ["Hierarquia visual", "Consistência do DS", "Acessibilidade WCAG", "Espaçamento e ritmo", "Contraste e legibilidade"],
    },
    "product-strategist": {
      name: "Estrategista de produto",
      description: "Avalia proposta de valor, ativação, retenção e monetização.",
      traits: ["Proposta de valor", "Ativação e momento aha", "Retenção e churn", "Clareza de pricing", "Métricas de impacto"],
    },
    "busy-manager": {
      name: "Gestor ocupado",
      description: "Pouco tempo; precisa entender o valor em 10 segundos. Se não ficar claro, abandona.",
      traits: ["Impaciente", "Orientado a resultados", "Delega tarefas", "Busca ROI claro"],
    },
    skeptic: {
      name: "Cético pragmático",
      description: "Já viu muitas ferramentas falharem. Precisa de provas concretas e casos reais.",
      traits: ["Desconfiado", "Pede evidências", "Compara preços", "Busca cases de sucesso"],
    },
    "ux-researcher": {
      name: "Pesquisador de UX",
      description: "Avalia usabilidade, carga cognitiva, fluxo de informação e fricção em cada passo.",
      traits: ["Heurísticas de Nielsen", "Carga cognitiva", "Jornada do usuário", "Detecta abandono", "Propõe alternativas concretas"],
    },
    "non-tech": {
      name: "Usuário não técnico",
      description: "Não entende jargão. Se a UI não for óbvia, se perde. Representa o mainstream.",
      traits: ["Precisa de guia visual", "Frustra-se fácil", "Não lê instruções", "Faz muitas perguntas"],
    },
    "power-user": {
      name: "Power user",
      description: "Usa o produto ao máximo. Encontra edge cases, quer atalhos e personalização.",
      traits: ["Explora tudo", "Busca atalhos", "Reporta bugs detalhados", "Quer API/integrações"],
    },
    switcher: {
      name: "Usuário insatisfeito (troca)",
      description: "Veio de um concorrente e busca algo melhor. Compara cada detalhe com o que já conhece.",
      traits: ["Compara com concorrentes", "Expectativas altas", "Busca migração fácil", "Sensível a regressões"],
    },
    "budget-owner": {
      name: "Decisor de orçamento",
      description: "Aprova o orçamento. Não usa o produto diretamente, mas precisa entender o valor.",
      traits: ["Custo-benefício", "Pricing transparente", "Precisa justificar compra", "Pouco tempo"],
    },
    "mobile-first": {
      name: "Usuário mobile-first",
      description: "Faz tudo no celular. Se a experiência não for responsiva, abandona.",
      traits: ["Só mobile", "Sensível a performance", "Gestos táteis", "Não tolera scroll horizontal"],
    },
    "latam-founder": {
      name: "Fundadora LATAM",
      description:
        "Empreendedora no Mexico/Colombia focada em crescer rapido sem perder simplicidade operacional.",
      traits: ["Controla custos de perto", "Decide rapido", "Valoriza suporte em espanhol", "Precisa de fluxos claros"],
    },
    "eu-compliance-lead": {
      name: "Responsavel de Compliance UE",
      description:
        "Lider de operacoes na Europa que prioriza confianca, privacidade e rastreabilidade em cada passo.",
      traits: ["Exige clareza legal", "Detecta riscos de confianca", "Busca consistencia", "Valoriza confirmacoes explicitas"],
    },
    "fintech-analyst": {
      name: "Analista Fintech",
      description:
        "Profissional de produto financeiro que avalia precisao, risco percebido e transparencia das decisoes.",
      traits: ["Le microcopy critico", "Valoriza simulacoes claras", "Questiona defaults", "Busca controles avancados"],
    },
    "edtech-student": {
      name: "Estudante EdTech",
      description:
        "Universitario multitarefa que precisa entender o valor rapido e avancar com baixa friccao.",
      traits: ["Pouco tempo", "Prefere exemplos visuais", "Se perde com jargao", "Baixa tolerancia a onboarding longo"],
    },
    "low-vision-advocate": {
      name: "Usuario com baixa visao",
      description:
        "Pessoa que depende de alto contraste, hierarquia forte e textos legiveis para concluir tarefas.",
      traits: ["Sensivel a contraste", "Precisa de tipografia clara", "Evita interfaces densas", "Valoriza feedback visivel"],
    },
    "a11y-auditor": {
      name: "Auditora de Acessibilidade",
      description:
        "Especialista que revisa acessibilidade ponta a ponta com criterio WCAG e abordagem inclusiva.",
      traits: ["Avalia contraste e foco", "Revisa ordem de navegacao", "Cuida de labels e estados", "Sugere melhorias acionaveis"],
    },
  },
  de: {
    "early-adopter": {
      name: "Early-Adopter Tech",
      description:
        "Technisch versierter Nutzer, toleriert Bugs, sucht Innovation. Bewertet, ob das Konzept stark ist – auch wenn die Umsetzung holprig ist.",
      traits: ["Toleriert Bugs", "Sucht Innovation", "Gibt technisches Feedback", "Vergleicht Alternativen"],
    },
    "ui-designer": {
      name: "UI-Designer:in",
      description:
        "Bewertet visuelle Hierarchie, Komponenten-Konsistenz, Abstände, Typografie, Kontrast und WCAG-Barrierefreiheit.",
      traits: ["Visuelle Hierarchie", "Design-System-Konsistenz", "WCAG-Barrierefreiheit", "Abstand und Rhythmus", "Kontrast und Lesbarkeit"],
    },
    "product-strategist": {
      name: "Product Strategist",
      description: "Bewertet Value Proposition, Aktivierung, Retention und Monetarisierung.",
      traits: ["Value Proposition", "Aktivierung und Aha-Moment", "Retention und Churn", "Pricing-Klarheit", "Impact-Metriken"],
    },
    "busy-manager": {
      name: "Vielbeschäftigte:r Manager:in",
      description: "Wenig Zeit – muss den Nutzen in 10 Sekunden verstehen. Sonst Abbruch.",
      traits: ["Ungeduldig", "Ergebnisorientiert", "Delegiert Aufgaben", "Sucht klaren ROI"],
    },
    skeptic: {
      name: "Pragmatische:r Skeptiker:in",
      description: "Hat viele Tools scheitern sehen. Braucht konkrete Belege und echte Use Cases.",
      traits: ["Misstrauisch", "Fordert Belege", "Vergleicht Preise", "Sucht Erfolgsgeschichten"],
    },
    "ux-researcher": {
      name: "UX-Researcher:in",
      description: "Bewertet Usability, kognitive Last, Informationsfluss und Reibung in jedem Schritt.",
      traits: ["Nielsen-Heuristiken", "Kognitive Last", "User Journey", "Erkennt Abbrüche", "Schlägt konkrete Alternativen vor"],
    },
    "non-tech": {
      name: "Nicht-technische:r Nutzer:in",
      description: "Versteht keinen Jargon. Wenn die UI nicht offensichtlich ist, geht verloren. Repräsentiert den Mainstream.",
      traits: ["Braucht visuelle Führung", "Frustriert schnell", "Liest keine Anleitungen", "Stellt viele Fragen"],
    },
    "power-user": {
      name: "Power-User:in",
      description: "Nutzt das Produkt maximal. Findet Edge Cases, will Shortcuts und Personalisierung.",
      traits: ["Erkundet alles", "Sucht Shortcuts", "Meldet detaillierte Bugs", "Will API/Integrationen"],
    },
    switcher: {
      name: "Unzufriedene:r Wechsler:in",
      description: "Kommt von einem Wettbewerber und sucht Besseres. Vergleicht jedes Detail mit dem Bekannten.",
      traits: ["Vergleicht mit Konkurrenz", "Hohe Erwartungen", "Will einfache Migration", "Empfindlich bei Regressionen"],
    },
    "budget-owner": {
      name: "Budget-Entscheider:in",
      description: "Genehmigt das Budget. Nutzt das Produkt nicht direkt, muss aber den Nutzen verstehen.",
      traits: ["Kosten-Nutzen", "Transparentes Pricing", "Muss Kauf rechtfertigen", "Wenig Zeit"],
    },
    "mobile-first": {
      name: "Mobile-first-Nutzer:in",
      description: "Macht alles am Handy. Wenn die Erfahrung nicht responsive ist, Abbruch.",
      traits: ["Nur mobil", "Performance-sensibel", "Touch-Gesten", "Kein horizontales Scrollen"],
    },
    "latam-founder": {
      name: "LATAM-Gruender:in",
      description:
        "Gruender:in in Mexiko/Kolumbien mit Fokus auf schnelles Wachstum ohne operative Komplexitaet.",
      traits: ["Achtet stark auf Kosten", "Trifft schnelle Entscheidungen", "Schaetzt Support auf Spanisch", "Braucht klare Flows"],
    },
    "eu-compliance-lead": {
      name: "EU-Compliance-Lead",
      description:
        "Operations-Lead in Europa, der Vertrauen, Datenschutz und Nachvollziehbarkeit in jedem Schritt priorisiert.",
      traits: ["Fordert rechtliche Klarheit", "Erkennt Vertrauensrisiken", "Sucht Konsistenz", "Will explizite Bestaetigungen"],
    },
    "fintech-analyst": {
      name: "Fintech-Analyst:in",
      description:
        "Fachperson im Finanzproduktbereich, die Praezision, wahrgenommenes Risiko und Entscheidungs-Transparenz bewertet.",
      traits: ["Liest kritisches Microcopy", "Schaetzt klare Simulationen", "Hinterfragt Defaults", "Sucht erweiterte Kontrollen"],
    },
    "edtech-student": {
      name: "EdTech-Student:in",
      description:
        "Multitasking-Studierende:r, die/der den Nutzen schnell erfassen und mit wenig Reibung weitermachen muss.",
      traits: ["Wenig Zeit", "Bevorzugt visuelle Beispiele", "Verliert sich bei Fachjargon", "Geringe Toleranz fuer langes Onboarding"],
    },
    "low-vision-advocate": {
      name: "Nutzer:in mit Sehschwaeche",
      description:
        "Person, die auf hohen Kontrast, starke Hierarchie und gut lesbare Texte angewiesen ist, um Aufgaben abzuschliessen.",
      traits: ["Kontrast-sensibel", "Braucht gut lesbare Typografie", "Meidet dichte Interfaces", "Schaetzt sichtbares Feedback"],
    },
    "a11y-auditor": {
      name: "Accessibility-Auditor:in",
      description:
        "Spezialist:in, die Barrierefreiheit Ende-zu-Ende nach WCAG mit inklusiver Perspektive prueft.",
      traits: ["Bewertet Kontrast und Fokus", "Prueft Navigationsreihenfolge", "Achtet auf Labels und Zustande", "Schlaegt umsetzbare Verbesserungen vor"],
    },
  },
};

export function getLocalizedPersona(persona: Persona, lang: Lang): Persona {
  if (persona.id.startsWith("custom-")) return persona;
  if (lang === "es") return persona;
  const copy = PRESET_TRANSLATIONS[lang][persona.id];
  if (!copy) return persona;
  return {
    ...persona,
    name: copy.name,
    description: copy.description,
    traits: copy.traits,
  };
}
