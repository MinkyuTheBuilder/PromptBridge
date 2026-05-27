import { describe, expect, it } from "vitest";
import {
  createEnglishPromptPreview,
  inspectProtectedTokens,
  parseCustomProtectedTerms,
  protectPrompt
} from "./promptProtection";

describe("protectPrompt", () => {
  it("protects inline code, commands, paths, and URLs", () => {
    const input =
      "Explique `useEffect`, then run npm run build, inspect C:\\repo\\app.tsx and https://example.com/docs.";

    const protectedPrompt = protectPrompt(input);

    expect(protectedPrompt.placeholders).toEqual([
      "`useEffect`",
      "npm run build",
      "C:\\repo\\app.tsx",
      "https://example.com/docs."
    ]);
    expect(protectedPrompt.text).toContain("__PROMPTBRIDGE_KEEP_0__");
    expect(protectedPrompt.text).toContain("__PROMPTBRIDGE_KEEP_1__");
    expect(protectedPrompt.restore(protectedPrompt.text)).toBe(input);
  });

  it("protects fenced code blocks as one span", () => {
    const input = "이 코드 수정해줘:\n```ts\nconst path = 'C:/repo/app.tsx';\n```\n그리고 이유도 설명해줘.";

    const protectedPrompt = protectPrompt(input);

    expect(protectedPrompt.placeholders).toHaveLength(1);
    expect(protectedPrompt.placeholders[0]).toContain("```ts");
    expect(protectedPrompt.text).not.toContain("C:/repo/app.tsx");
    expect(protectedPrompt.restore("Translate " + protectedPrompt.text)).toContain(input);
  });

  it("does not double-protect inline code inside command-like text", () => {
    const input = "Keep `npm run build` unchanged and explain the failing stack trace.";

    const protectedPrompt = protectPrompt(input);

    expect(protectedPrompt.placeholders).toEqual(["`npm run build`"]);
    expect(protectedPrompt.restore(protectedPrompt.text)).toBe(input);
  });

  it("exposes protection token metadata for the UI", () => {
    const tokens = inspectProtectedTokens("Fix `src/App.tsx` and run npm test.");

    expect(tokens).toEqual([
      {
        placeholder: "__PROMPTBRIDGE_KEEP_0__",
        label: "Inline code",
        value: "`src/App.tsx`",
        start: 4,
        end: 17
      },
      {
        placeholder: "__PROMPTBRIDGE_KEEP_1__",
        label: "Command",
        value: "npm test",
        start: 26,
        end: 34
      }
    ]);
  });

  it("protects user-defined exact terms", () => {
    const input = "PromptBridge should keep SalesOps API and SalesOps unchanged.";
    const terms = parseCustomProtectedTerms("SalesOps API\nSalesOps");
    const protectedPrompt = protectPrompt(input, terms);

    expect(protectedPrompt.placeholders).toEqual(["SalesOps API", "SalesOps"]);
    expect(protectedPrompt.restore(protectedPrompt.text)).toBe(input);
    expect(inspectProtectedTokens(input, terms).map((token) => token.label)).toEqual([
      "Custom term",
      "Custom term"
    ]);
  });

  it("parses comma and newline separated custom terms", () => {
    expect(parseCustomProtectedTerms("PromptBridge, SalesOps\nPromptBridge")).toEqual([
      "PromptBridge",
      "SalesOps"
    ]);
  });
});

describe("createEnglishPromptPreview", () => {
  it("keeps the original source text in development preview", () => {
    const preview = createEnglishPromptPreview("Corrige `src/App.tsx`.", "Custom API key");

    expect(preview).toContain("Corrige `src/App.tsx`.");
    expect(preview).toContain("Custom API key BYOK preview");
  });
});
