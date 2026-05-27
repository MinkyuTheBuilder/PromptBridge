export type SensitiveFinding = {
  label: string;
  value: string;
  redactedValue: string;
  start: number;
  end: number;
  severity: "warning" | "high";
};

type SensitivePattern = {
  label: string;
  pattern: RegExp;
  severity: SensitiveFinding["severity"];
  priority: number;
};

type SensitiveCandidate = SensitiveFinding & {
  priority: number;
};

const sensitivePatterns: SensitivePattern[] = [
  {
    label: "Private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    severity: "high",
    priority: 100
  },
  {
    label: "OpenAI API key",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    severity: "high",
    priority: 90
  },
  {
    label: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g,
    severity: "high",
    priority: 90
  },
  {
    label: "AWS access key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    severity: "high",
    priority: 90
  },
  {
    label: "JWT token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    severity: "warning",
    priority: 80
  },
  {
    label: "Secret assignment",
    pattern:
      /\b(?:api[_-]?key|token|secret|password|passwd|pwd|auth[_-]?key)\s*[:=]\s*["']?[^"'\s,;]{8,}/gi,
    severity: "warning",
    priority: 70
  }
];

export function inspectSensitiveTokens(input: string): SensitiveFinding[] {
  const candidates: SensitiveCandidate[] = [];

  for (const { label, pattern, severity, priority } of sensitivePatterns) {
    for (const match of input.matchAll(pattern)) {
      if (match.index === undefined || !match[0]) continue;
      candidates.push({
        label,
        value: match[0],
        redactedValue: redactSensitiveValue(match[0]),
        start: match.index,
        end: match.index + match[0].length,
        severity,
        priority
      });
    }
  }

  return candidates
    .sort((a, b) => a.start - b.start || b.priority - a.priority)
    .reduce<SensitiveCandidate[]>((accepted, candidate) => {
      const overlaps = accepted.some(
        (finding) => candidate.start < finding.end && candidate.end > finding.start
      );
      if (!overlaps) accepted.push(candidate);
      return accepted;
    }, [])
    .map(({ priority: _priority, ...finding }) => finding);
}

export function redactSensitiveValue(value: string) {
  if (value.length <= 8) return "********";

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactSensitiveText(input: string) {
  return inspectSensitiveTokens(input)
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, finding) =>
        `${text.slice(0, finding.start)}${finding.redactedValue}${text.slice(finding.end)}`,
      input
    );
}
