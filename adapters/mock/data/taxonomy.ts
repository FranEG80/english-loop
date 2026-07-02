import type { TaxonomyNodeDto } from "@/core/models";

/**
 * Árbol mock de taxonomía: categoría > tema > subtema > skill.
 * No todas las ramas necesitan los cuatro niveles: una skill puede colgar
 * directamente de una categoría cuando el tema no requiere más granularidad.
 */
export const mockTaxonomyTree: TaxonomyNodeDto[] = [
  {
    id: "grammar",
    type: "category",
    label: { es: "Gramática", en: "Grammar" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "grammar.verb-tenses",
        type: "topic",
        label: { es: "Tiempos verbales", en: "Verb tenses" },
        levels: ["B1", "B2"],
        children: [
          {
            id: "grammar.verb-tenses.present",
            type: "subtopic",
            label: { es: "Presente", en: "Present" },
            levels: ["B1"],
            children: [
              {
                id: "grammar.verb-tenses.present.simple",
                type: "skill",
                label: { es: "Present simple", en: "Present simple" },
                levels: ["B1"],
                children: [],
              },
              {
                id: "grammar.verb-tenses.present.continuous",
                type: "skill",
                label: {
                  es: "Present continuous",
                  en: "Present continuous",
                },
                levels: ["B1"],
                children: [],
              },
            ],
          },
          {
            id: "grammar.verb-tenses.past",
            type: "subtopic",
            label: { es: "Pasado", en: "Past" },
            levels: ["B1"],
            children: [
              {
                id: "grammar.verb-tenses.past.simple",
                type: "skill",
                label: { es: "Past simple", en: "Past simple" },
                levels: ["B1"],
                children: [],
              },
              {
                id: "grammar.verb-tenses.past.continuous",
                type: "skill",
                label: { es: "Past continuous", en: "Past continuous" },
                levels: ["B1"],
                children: [],
              },
            ],
          },
          {
            id: "grammar.verb-tenses.future",
            type: "subtopic",
            label: { es: "Futuro", en: "Future" },
            levels: ["B1"],
            children: [
              {
                id: "grammar.verb-tenses.future.will-vs-going-to",
                type: "skill",
                label: {
                  es: "Will vs going to",
                  en: "Will vs going to",
                },
                levels: ["B1"],
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "grammar.conditionals",
        type: "topic",
        label: { es: "Condicionales", en: "Conditionals" },
        levels: ["B1", "B2"],
        children: [
          {
            id: "grammar.conditionals.first",
            type: "skill",
            label: { es: "Primer condicional", en: "First conditional" },
            levels: ["B1"],
            children: [],
          },
          {
            id: "grammar.conditionals.second",
            type: "skill",
            label: { es: "Segundo condicional", en: "Second conditional" },
            levels: ["B2"],
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "vocabulary",
    type: "category",
    label: { es: "Vocabulario", en: "Vocabulary" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "vocabulary.lexical-fields",
        type: "topic",
        label: { es: "Campos léxicos", en: "Lexical fields" },
        levels: ["B1", "B2"],
        children: [
          {
            id: "vocabulary.lexical-fields.travel",
            type: "skill",
            label: { es: "Viajes", en: "Travel" },
            levels: ["B1"],
            children: [],
          },
          {
            id: "vocabulary.lexical-fields.work",
            type: "skill",
            label: { es: "Trabajo", en: "Work" },
            levels: ["B1", "B2"],
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "use-of-english",
    type: "category",
    label: { es: "Use of English", en: "Use of English" },
    levels: ["B2"],
    children: [
      {
        id: "use-of-english.open-cloze",
        type: "skill",
        label: { es: "Open cloze", en: "Open cloze" },
        levels: ["B2"],
        children: [],
      },
      {
        id: "use-of-english.key-word-transformation",
        type: "skill",
        label: {
          es: "Key word transformation",
          en: "Key word transformation",
        },
        levels: ["B2"],
        children: [],
      },
    ],
  },
  {
    id: "phrasal-verbs",
    type: "category",
    label: { es: "Phrasal verbs", en: "Phrasal verbs" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "phrasal-verbs.general",
        type: "skill",
        label: { es: "Phrasal verbs generales", en: "General phrasal verbs" },
        levels: ["B1", "B2"],
        children: [],
      },
    ],
  },
  {
    id: "collocations",
    type: "category",
    label: { es: "Collocations", en: "Collocations" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "collocations.general",
        type: "skill",
        label: { es: "Collocations generales", en: "General collocations" },
        levels: ["B1", "B2"],
        children: [],
      },
    ],
  },
  {
    id: "prepositions",
    type: "category",
    label: { es: "Preposiciones", en: "Prepositions" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "prepositions.general",
        type: "skill",
        label: { es: "Preposiciones generales", en: "General prepositions" },
        levels: ["B1", "B2"],
        children: [],
      },
    ],
  },
  {
    id: "word-formation",
    type: "category",
    label: { es: "Word formation", en: "Word formation" },
    levels: ["B2"],
    children: [
      {
        id: "word-formation.general",
        type: "skill",
        label: { es: "Word formation general", en: "General word formation" },
        levels: ["B2"],
        children: [],
      },
    ],
  },
  {
    id: "writing",
    type: "category",
    label: { es: "Writing", en: "Writing" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "writing.general",
        type: "skill",
        label: { es: "Writing guiado", en: "Guided writing" },
        levels: ["B1", "B2"],
        children: [],
      },
    ],
  },
  {
    id: "reading",
    type: "category",
    label: { es: "Reading", en: "Reading" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "reading.general",
        type: "skill",
        label: { es: "Comprensión lectora", en: "Reading comprehension" },
        levels: ["B1", "B2"],
        children: [],
      },
    ],
  },
];

export function findTaxonomyNode(
  nodeId: string,
  nodes: TaxonomyNodeDto[] = mockTaxonomyTree,
): TaxonomyNodeDto | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const match = findTaxonomyNode(nodeId, node.children);
    if (match) return match;
  }
  return null;
}

/** Devuelve los IDs del propio nodo y de todos sus descendientes. */
export function collectDescendantIds(node: TaxonomyNodeDto): string[] {
  return [node.id, ...node.children.flatMap(collectDescendantIds)];
}

/** Devuelve el camino de IDs desde la raíz hasta el nodo (incluido). */
export function findTaxonomyPath(
  nodeId: string,
  nodes: TaxonomyNodeDto[] = mockTaxonomyTree,
  trail: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node.id];
    if (node.id === nodeId) return nextTrail;
    const match = findTaxonomyPath(nodeId, node.children, nextTrail);
    if (match) return match;
  }
  return null;
}
