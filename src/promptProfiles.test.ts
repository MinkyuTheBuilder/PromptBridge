import { describe, expect, it } from "vitest";
import { applyPromptProfile, getPromptProfile, promptProfiles } from "./promptProfiles";

describe("prompt profiles", () => {
  it("keeps direct translation unchanged", () => {
    expect(applyPromptProfile("Fix `src/App.tsx`.", "direct")).toBe("Fix `src/App.tsx`.");
  });

  it("adds focused coding-agent guidance for bugfix prompts", () => {
    const result = applyPromptProfile("Fix the state update loop.", "bugfix");

    expect(result).toContain("PromptBridge profile: Bug fix");
    expect(result).toContain("Identify the most likely root cause");
    expect(result).toContain("Fix the state update loop.");
  });

  it("falls back to direct translation for unknown ids", () => {
    expect(getPromptProfile("unknown").id).toBe("direct");
  });

  it("exposes the planned v1.2 profile set", () => {
    expect(promptProfiles.map((profile) => profile.id)).toEqual([
      "direct",
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

    expect(result).toContain("PromptBridge custom profile");
    expect(result).toContain("Always include a migration note.");
  });

  it("leaves custom profile output unchanged when custom instructions are empty", () => {
    expect(applyPromptProfile("Fix `src/App.tsx`.", "custom", "")).toBe("Fix `src/App.tsx`.");
  });
});
