export type PromptProfileId =
  | "direct"
  | "bugfix"
  | "refactor"
  | "review"
  | "tests"
  | "docs"
  | "custom";

export type PromptProfile = {
  id: PromptProfileId;
  name: string;
  description: string;
  focus: string[];
  expectedOutput: string;
};

export const defaultPromptProfile: PromptProfileId = "direct";

export const promptProfiles: PromptProfile[] = [
  {
    id: "direct",
    name: "Direct translation",
    description: "Translate only, without adding extra coding-agent instructions.",
    focus: [],
    expectedOutput: ""
  },
  {
    id: "bugfix",
    name: "Bug fix",
    description: "Shape the prompt for diagnosing and fixing a defect.",
    focus: [
      "Identify the most likely root cause before changing code.",
      "Keep the fix narrowly scoped.",
      "Mention any regression tests that should be added or updated."
    ],
    expectedOutput: "A concise fix plan, changed files, and verification steps."
  },
  {
    id: "refactor",
    name: "Refactor",
    description: "Shape the prompt for behavior-preserving cleanup.",
    focus: [
      "Preserve existing behavior and public contracts.",
      "Prefer local simplification over broad rewrites.",
      "Call out risk if the refactor crosses module boundaries."
    ],
    expectedOutput: "A scoped refactor with behavior-preserving verification."
  },
  {
    id: "review",
    name: "Code review",
    description: "Shape the prompt for finding risks and regressions.",
    focus: [
      "Prioritize bugs, security issues, regressions, and missing tests.",
      "Reference exact files or code areas when possible.",
      "Keep style-only comments secondary."
    ],
    expectedOutput: "Findings ordered by severity, followed by open questions."
  },
  {
    id: "tests",
    name: "Tests",
    description: "Shape the prompt for adding or improving tests.",
    focus: [
      "Cover the behavior that can break, not just implementation details.",
      "Include edge cases and failure paths.",
      "Keep fixtures small and readable."
    ],
    expectedOutput: "Focused tests plus the command used to run them."
  },
  {
    id: "docs",
    name: "Docs",
    description: "Shape the prompt for documentation work.",
    focus: [
      "Explain the user-facing workflow first.",
      "Document constraints, setup, and failure modes.",
      "Keep examples concrete and copy-paste friendly."
    ],
    expectedOutput: "Updated documentation with clear examples."
  },
  {
    id: "custom",
    name: "Custom",
    description: "Append your own reusable coding-agent instructions.",
    focus: [],
    expectedOutput: ""
  }
];

export function getPromptProfile(id: string | null | undefined) {
  return promptProfiles.find((profile) => profile.id === id) ?? promptProfiles[0];
}

export function applyPromptProfile(
  prompt: string,
  profileId: PromptProfileId,
  customInstructions = ""
) {
  const profile = getPromptProfile(profileId);
  const trimmedPrompt = prompt.trim();

  if (profile.id === "direct" || !trimmedPrompt) {
    return prompt;
  }

  if (profile.id === "custom") {
    const trimmedInstructions = customInstructions.trim();
    if (!trimmedInstructions) return prompt;

    return `${trimmedPrompt}

PromptBridge custom profile:

${trimmedInstructions}`;
  }

  const focusLines = profile.focus.map((item) => `- ${item}`).join("\n");

  return `${trimmedPrompt}

PromptBridge profile: ${profile.name}

Focus:
${focusLines}

Expected output:
- ${profile.expectedOutput}`;
}
