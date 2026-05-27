const tokenPrefix = "__PROMPTBRIDGE_KEEP_";

type ProtectedSpan = {
  start: number;
  end: number;
  value: string;
  label: string;
  priority: number;
};

export type ProtectedToken = {
  placeholder: string;
  label: string;
  value: string;
  start: number;
  end: number;
};

export type ProtectedPrompt = {
  text: string;
  placeholders: string[];
  restore: (translated: string) => string;
};

const protectionPatterns: Array<{ label: string; pattern: RegExp; priority: number }> = [
  { label: "Code block", pattern: /```[\s\S]*?```/g, priority: 100 },
  { label: "Inline code", pattern: /`[^`\n]+`/g, priority: 90 },
  { label: "URL", pattern: /\b(?:https?:\/\/|www\.)[^\s)]+/g, priority: 80 },
  { label: "Windows path", pattern: /\b[A-Za-z]:\\[^\s"'<>|,;]+/g, priority: 70 },
  { label: "POSIX path", pattern: /(?<!\w)(?:\.{1,2}\/|\/)[^\s"'<>]+/g, priority: 70 },
  {
    label: "Command",
    pattern:
      /\b(?:git|npm|pnpm|yarn|bun|cargo|npx|node|python|python3|pip|uv|docker|kubectl)\s+[^,.;\n\r]+/g,
    priority: 60
  }
];

export function protectPrompt(input: string, customTerms: string[] = []): ProtectedPrompt {
  const spans = collectProtectedSpans(input, customTerms);
  const placeholders: string[] = [];
  let cursor = 0;
  let protectedText = "";

  for (const span of spans) {
    protectedText += input.slice(cursor, span.start);
    const token = `${tokenPrefix}${placeholders.length}__`;
    placeholders.push(span.value);
    protectedText += token;
    cursor = span.end;
  }

  protectedText += input.slice(cursor);

  return {
    text: protectedText,
    placeholders,
    restore: (translated: string) =>
      placeholders.reduce(
        (current, placeholder, index) =>
          current.replaceAll(`${tokenPrefix}${index}__`, placeholder),
        translated
      )
  };
}

export function inspectProtectedTokens(input: string, customTerms: string[] = []): ProtectedToken[] {
  return collectProtectedSpans(input, customTerms).map((span, index) => ({
    placeholder: `${tokenPrefix}${index}__`,
    label: span.label,
    value: span.value,
    start: span.start,
    end: span.end
  }));
}

export function createEnglishPromptPreview(input: string, providerName: string) {
  if (!input.trim()) return "";

  return `Please help me with the following coding task:\n\n${input.trim()}\n\nKeep code, commands, file paths, URLs, and protected placeholders unchanged.\n\nProvider mode: ${providerName} BYOK preview.`;
}

export function parseCustomProtectedTerms(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\n,]/)
        .map((term) => term.trim())
        .filter((term) => term.length > 0)
    )
  ).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function collectCustomTermSpans(input: string, customTerms: string[]) {
  const spans: ProtectedSpan[] = [];

  customTerms.forEach((term) => {
    let start = input.indexOf(term);

    while (start !== -1) {
      spans.push({
        start,
        end: start + term.length,
        value: term,
        label: "Custom term",
        priority: 50
      });
      start = input.indexOf(term, start + term.length);
    }
  });

  return spans;
}

function collectProtectedSpans(input: string, customTerms: string[] = []) {
  const candidates: ProtectedSpan[] = [];

  protectionPatterns.forEach(({ label, pattern, priority }) => {
    for (const match of input.matchAll(pattern)) {
      if (match.index === undefined || !match[0]) continue;
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        label,
        priority
      });
    }
  });

  candidates.push(...collectCustomTermSpans(input, customTerms));

  return candidates
    .sort((a, b) => a.start - b.start || b.priority - a.priority || b.end - a.end)
    .reduce<ProtectedSpan[]>((accepted, candidate) => {
      const overlaps = accepted.some(
        (span) => candidate.start < span.end && candidate.end > span.start
      );
      if (!overlaps) accepted.push(candidate);
      return accepted;
    }, [])
    .sort((a, b) => a.start - b.start);
}
