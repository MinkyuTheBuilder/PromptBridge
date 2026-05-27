import { describe, expect, it } from "vitest";
import {
  addTranslationHistoryEntry,
  createTranslationHistoryEntry,
  filterTranslationHistory,
  pruneTranslationHistory,
  removeTranslationHistoryEntry,
  type TranslationHistoryEntry
} from "./translationHistory";

describe("translation history", () => {
  it("creates searchable history entries", () => {
    const entry = createTranslationHistoryEntry({
      kind: "prompt",
      provider: "Google Translate",
      sourceText: "Corrige `src/App.tsx`.",
      resultText: "Fix `src/App.tsx`.",
      targetLanguage: "en",
      promptProfile: "bugfix"
    });

    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeTruthy();
    expect(filterTranslationHistory([entry], "bugfix")).toEqual([entry]);
    expect(filterTranslationHistory([entry], "missing")).toEqual([]);
  });

  it("keeps newest history entries first and caps the list", () => {
    const entries: TranslationHistoryEntry[] = Array.from({ length: 55 }, (_, index) => ({
      id: String(index),
      kind: "output",
      createdAt: new Date(index).toISOString(),
      provider: "DeepL",
      sourceText: `source ${index}`,
      resultText: `result ${index}`,
      targetLanguage: "ko"
    }));

    const history = entries.reduce<TranslationHistoryEntry[]>(
      (current, entry) => addTranslationHistoryEntry(current, entry),
      []
    );

    expect(history).toHaveLength(50);
    expect(history[0].id).toBe("54");
  });

  it("removes one history entry by id", () => {
    const history: TranslationHistoryEntry[] = [
      {
        id: "keep",
        kind: "prompt",
        createdAt: new Date(0).toISOString(),
        provider: "Google",
        sourceText: "source",
        resultText: "result",
        targetLanguage: "en"
      },
      {
        id: "delete",
        kind: "output",
        createdAt: new Date(1).toISOString(),
        provider: "DeepL",
        sourceText: "source 2",
        resultText: "result 2",
        targetLanguage: "ko"
      }
    ];

    expect(removeTranslationHistoryEntry(history, "delete").map((entry) => entry.id)).toEqual([
      "keep"
    ]);
  });

  it("prunes history entries older than the retention period", () => {
    const history: TranslationHistoryEntry[] = [
      {
        id: "fresh",
        kind: "prompt",
        createdAt: "2026-05-25T12:00:00.000Z",
        provider: "Google",
        sourceText: "source",
        resultText: "result",
        targetLanguage: "en"
      },
      {
        id: "old",
        kind: "output",
        createdAt: "2026-04-01T12:00:00.000Z",
        provider: "DeepL",
        sourceText: "source 2",
        resultText: "result 2",
        targetLanguage: "ko"
      }
    ];

    expect(
      pruneTranslationHistory(history, 30, new Date("2026-05-27T12:00:00.000Z")).map(
        (entry) => entry.id
      )
    ).toEqual(["fresh"]);
    expect(pruneTranslationHistory(history, 0)).toEqual(history);
  });
});
