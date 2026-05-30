export type PromptProfileId =
  | "agent"
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

export const defaultPromptProfile: PromptProfileId = "agent";

export const promptProfiles: PromptProfile[] = [
  {
    id: "agent",
    name: "AI agent prompt",
    description: "Rewrite the request as a simple, clear prompt for an AI coding agent.",
    focus: [
      "Make the task clear and actionable for an AI coding agent.",
      "Use simple English and remove unnecessary ambiguity.",
      "Preserve code, commands, file paths, URLs, placeholders, and product names exactly."
    ],
    expectedOutput: "A concise implementation response with relevant verification steps."
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
  if (id === "direct") return promptProfiles[0];

  return promptProfiles.find((profile) => profile.id === id) ?? promptProfiles[0];
}

export function applyPromptProfile(
  prompt: string,
  profileId: PromptProfileId,
  customInstructions = ""
) {
  const profile = getPromptProfile(profileId);
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    return prompt;
  }

  if (profile.id === "agent") {
    return formatAgentPrompt(trimmedPrompt);
  }

  if (profile.id === "custom") {
    const trimmedInstructions = customInstructions.trim();
    if (!trimmedInstructions) return formatAgentPrompt(trimmedPrompt);

    return `${formatAgentPrompt(trimmedPrompt)}

Additional instructions:

${trimmedInstructions}`;
  }

  const focusLines = profile.focus.map((item) => `- ${item}`).join("\n");

  return `${formatAgentPrompt(trimmedPrompt)}

Focus:
${focusLines}

Expected output:
- ${profile.expectedOutput}`;
}

function formatAgentPrompt(prompt: string) {
  return `Please help me with this coding task.

Task:
${prompt}

Guidance:
- Make reasonable engineering assumptions when details are missing.
- Keep the solution simple, clear, and scoped to the task.
- Preserve code, commands, file paths, URLs, placeholders, and exact names unchanged.
- Include verification steps when they are relevant.`;
}
