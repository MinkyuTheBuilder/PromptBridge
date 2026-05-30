import { describe, expect, it } from "vitest";
import { createSettingsBackup, parseSettingsBackup } from "./settingsBackup";

describe("settings backup", () => {
  it("round-trips PromptBridge settings", () => {
    const backup = createSettingsBackup({
      providerSettings: {
        google: {
          apiKey: "google-key",
          endpoint: "",
          model: ""
        },
        "openai-compatible": {
          apiKey: "openai-key",
          endpoint: "https://api.openai.com/v1/chat/completions",
          model: "gpt-4o-mini"
        }
      },
      selectedProvider: "google",
      shortcut: "ctrl+alt+p",
      uiLanguage: "ja",
      outputLanguage: "ko",
      promptProfile: "review",
      customPromptProfile: "Always summarize risk.",
      customProtectedTerms: "PromptBridge\nSalesOps API",
      historyEnabled: false,
      historyRetentionDays: 30,
      privacyBlockEnabled: true,
      usageAlertThreshold: 1000000
    });

    expect(parseSettingsBackup(backup)).toEqual({
      providerSettings: {
        google: {
          apiKey: "google-key",
          endpoint: "",
          model: ""
        },
        "openai-compatible": {
          apiKey: "openai-key",
          endpoint: "https://api.openai.com/v1/chat/completions",
          model: "gpt-4o-mini"
        }
      },
      selectedProvider: "google",
      shortcut: "ctrl+alt+p",
      uiLanguage: "ja",
      outputLanguage: "ko",
      promptProfile: "review",
      customPromptProfile: "Always summarize risk.",
      customProtectedTerms: "PromptBridge\nSalesOps API",
      historyEnabled: false,
      historyRetentionDays: 30,
      privacyBlockEnabled: true,
      usageAlertThreshold: 1000000
    });
  });

  it("rejects unrelated JSON", () => {
    expect(() => parseSettingsBackup('{"format":"other"}')).toThrow(
      "Invalid PromptBridge settings backup."
    );
  });

  it("can create a backup without provider keys", () => {
    const backup = createSettingsBackup(
      {
        providerSettings: {
          google: {
            apiKey: "google-key",
            endpoint: "https://translation.googleapis.com/language/translate/v2",
            model: ""
          }
        },
        selectedProvider: "google",
        shortcut: "ctrl+alt+p",
        uiLanguage: "en",
        outputLanguage: "ko",
        promptProfile: "agent",
        customPromptProfile: "",
        customProtectedTerms: "",
        historyEnabled: true,
        historyRetentionDays: 0,
        privacyBlockEnabled: false,
        usageAlertThreshold: 0
      },
      { includeProviderKeys: false }
    );

    expect(parseSettingsBackup(backup).providerSettings.google).toEqual({
      apiKey: "",
      endpoint: "https://translation.googleapis.com/language/translate/v2",
      model: ""
    });
  });

  it("normalizes unsupported values", () => {
    const parsed = parseSettingsBackup(
      JSON.stringify({
        format: "promptbridge-settings",
        version: 1,
        providerSettings: {
          missing: {
            apiKey: "ignored"
          },
          local: {
            apiKey: 42,
            endpoint: "http://localhost:8080",
            model: "local-model"
          }
        },
        selectedProvider: "missing",
        uiLanguage: "missing",
        outputLanguage: "ko",
        promptProfile: "missing"
      })
    );

    expect(parsed.providerSettings).toEqual({
      local: {
        apiKey: "",
        endpoint: "http://localhost:8080",
        model: "local-model"
      }
    });
    expect(parsed.selectedProvider).toBe("openai-compatible");
    expect(parsed.uiLanguage).toBe("en");
    expect(parsed.outputLanguage).toBe("ko");
    expect(parsed.promptProfile).toBe("agent");
    expect(parsed.customProtectedTerms).toBe("");
    expect(parsed.historyEnabled).toBe(true);
    expect(parsed.historyRetentionDays).toBe(0);
    expect(parsed.privacyBlockEnabled).toBe(false);
    expect(parsed.usageAlertThreshold).toBe(0);
  });

  it("migrates legacy direct prompt profile backups to the AI agent prompt", () => {
    const parsed = parseSettingsBackup(
      JSON.stringify({
        format: "promptbridge-settings",
        version: 1,
        providerSettings: {},
        selectedProvider: "openai-compatible",
        promptProfile: "direct"
      })
    );

    expect(parsed.promptProfile).toBe("agent");
  });
});
