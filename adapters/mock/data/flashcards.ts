import type { FlashcardStackDto } from "@/core/models";

export const mockFlashcardStack: FlashcardStackDto = {
  id: "flashcards-phrasal-verbs-daily-life",
  title: "Phrasal verbs for everyday life",
  level: "B1",
  taxonomyNodeId: "phrasal-verbs.general",
  cards: [
    { id: "card-get-up", front: "get up", back: "levantarse" },
    { id: "card-look-for", front: "look for", back: "buscar" },
    { id: "card-give-up", front: "give up", back: "rendirse / dejar algo" },
    {
      id: "card-run-out-of",
      front: "run out of",
      back: "quedarse sin algo",
    },
    { id: "card-turn-off", front: "turn off", back: "apagar" },
    { id: "card-find-out", front: "find out", back: "descubrir, averiguar" },
  ],
};
