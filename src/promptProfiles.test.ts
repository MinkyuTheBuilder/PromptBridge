import { describe, expect, it } from "vitest";
import { applyPromptProfile, getPromptProfile, promptProfiles } from "./promptProfiles";

describe("prompt profiles", () => {
  it("wraps the default profile as an AI coding-agent prompt", () => {
    const result = applyPromptProfile("Fix `src/App.tsx`.", "agent");

    expect(result).toContain("Please help me with this coding task.");
    expect(result).toContain("Task:\nFix `src/App.tsx`.");
    expect(result).toContain("Keep the solution simple, clear, and scoped");
  });

  it("adds focused coding-agent guidance for bugfix prompts", () => {
    const result = applyPromptProfile("Fix the state update loop.", "bugfix");

    expect(result).toContain("Please help me with this coding task.");
    expect(result).toContain("Identify the most likely root cause");
    expect(result).toContain("Fix the state update loop.");
  });

  it("falls back to the AI agent prompt for unknown and legacy direct ids", () => {
    expect(getPromptProfile("unknown").id).toBe("agent");
    expect(getPromptProfile("direct").id).toBe("agent");
  });

  it("exposes the planned v1.2 profile set", () => {
    expect(promptProfiles.map((profile) => profile.id)).toEqual([
      "agent",
      "bugfix",
      "refactor",
      "review",
      "tests",
      "docs",
      "custom"
    ]);
  });

  it("appends custom instructions when the custom profile is selected", () => {
    const result = applyPromptProfile(
      "Fix `src/App.tsx`.",
      "custom",
      "Always include a migration note."
    );

    expect(result).toContain("Please help me with this coding task.");
    expect(result).toContain("Additional instructions:");
    expect(result).toContain("Always include a migration note.");
  });

  it("uses the default AI agent prompt when custom instructions are empty", () => {
    const result = applyPromptProfile("Fix `src/App.tsx`.", "custom", "");

    expect(result).toContain("Please help me with this coding task.");
    expect(result).toContain("Task:\nFix `src/App.tsx`.");
    expect(result).not.toContain("Additional instructions:");
  });
});
