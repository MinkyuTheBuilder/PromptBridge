import { describe, expect, it } from "vitest";
import { inspectSensitiveTokens, redactSensitiveText, redactSensitiveValue } from "./privacyGuards";

describe("privacy guards", () => {
  it("detects common provider tokens", () => {
    const openAiKey = "sk-proj-" + "abcdefghijklmnopqrstuvwxyz123456";
    const gitHubToken = "ghp_" + "abcdefghijklmnopqrstuvwxyz123456";
    const findings = inspectSensitiveTokens(
      `Use ${openAiKey} and ${gitHubToken}.`
    );

    expect(findings.map((finding) => finding.label)).toEqual([
      "OpenAI API key",
      "GitHub token"
    ]);
    expect(findings[0].severity).toBe("high");
  });

  it("detects private key blocks before generic assignments", () => {
    const findings = inspectSensitiveTokens(`-----BEGIN PRIVATE KEY-----
abc123secretmaterial
-----END PRIVATE KEY-----`);

    expect(findings).toHaveLength(1);
    expect(findings[0].label).toBe("Private key block");
  });

  it("detects generic secret assignments", () => {
    const findings = inspectSensitiveTokens(
      "API_" + "KEY=super-secret-value " + "TOKEN: abcdefghijk"
    );

    expect(findings.map((finding) => finding.label)).toEqual([
      "Secret assignment",
      "Secret assignment"
    ]);
  });

  it("redacts long sensitive values", () => {
    expect(redactSensitiveValue("sk-" + "abcdefghijklmnopqrstuvwxyz")).toBe("sk-a...wxyz");
  });

  it("redacts detected sensitive text without changing surrounding prompt text", () => {
    const openAiKey = "sk-" + "abcdefghijklmnopqrstuvwxyz";

    expect(
      redactSensitiveText(
        `Please debug with ${"API_" + "KEY=super-secret-value"} and ${openAiKey}.`
      )
    ).toBe("Please debug with API_...alue and sk-a...wxyz.");
  });
});
