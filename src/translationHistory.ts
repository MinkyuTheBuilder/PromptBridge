import type { PromptProfileId } from "./promptProfiles";

export type TranslationHistoryKind = "prompt" | "output";

export type TranslationHistoryEntry = {
  id: string;
  kind: TranslationHistoryKind;
  createdAt: string;
  provider: string;
  sourceText: string;
  resultText: string;
  targetLanguage: string;
  promptProfile?: PromptProfileId;
};

export type TranslationHistoryInput = Omit<TranslationHistoryEntry, "id" | "createdAt">;
export type HistoryRetentionDays = 0 | 7 | 30 | 90;

const historyLimit = 50;

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `history-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTranslationHistoryEntry(
  input: TranslationHistoryInput
): TranslationHistoryEntry {
  return {
    id: createHistoryId(),
    createdAt: new Date().toISOString(),
    ...input
  };
}

export function addTranslationHistoryEntry(
  history: TranslationHistoryEntry[],
  entry: TranslationHistoryEntry
) {
  return [
    entry,
    ...history.filter((item) => item.id !== entry.id)
  ].slice(0, historyLimit);
}

export function removeTranslationHistoryEntry(
  history: TranslationHistoryEntry[],
  entryId: string
) {
  return history.filter((item) => item.id !== entryId);
}

export function pruneTranslationHistory(
  history: TranslationHistoryEntry[],
  retentionDays: HistoryRetentionDays,
  now = new Date()
) {
  if (retentionDays === 0) return history;

  const cutoff = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;

  return history.filter((entry) => {
    const createdAt = new Date(entry.createdAt).getTime();

    return Number.isNaN(createdAt) || createdAt >= cutoff;
  });
}

export function filterTranslationHistory(
  history: TranslationHistoryEntry[],
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return history;
  }

  return history.filter((entry) =>
    [
      entry.kind,
      entry.provider,
      entry.sourceText,
      entry.resultText,
      entry.targetLanguage,
      entry.promptProfile ?? ""
    ]
      .join("\n")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}
