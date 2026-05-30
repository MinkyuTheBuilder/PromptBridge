import { describe, expect, it } from "vitest";
import {
  getDefaultProviderSettings,
  getProviderConfig,
  providerConfigs,
  validateProviderSettings
} from "./translationProviders";

describe("translation provider registry", () => {
  it("includes all planned product provider options", () => {
    expect(providerConfigs.map((provider) => provider.id)).toEqual([
      "deepl",
      "google",
      "microsoft",
      "openai-compatible",
      "gemini",
      "libretranslate",
      "local",
      "custom-api"
    ]);
  });

  it("requires credentials for hosted paid providers", () => {
    for (const providerId of ["deepl", "google", "microsoft", "openai-compatible", "gemini"] as const) {
      const provider = getProviderConfig(providerId);
      const missing = validateProviderSettings(provider, getDefaultProviderSettings(provider));

      expect(missing).toContain(provider.authLabel);
    }
  });

  it("configures Gemini with the Google AI OpenAI-compatible endpoint", () => {
    const provider = getProviderConfig("gemini");
    const defaults = getDefaultProviderSettings(provider);

    expect(provider.authLabel).toBe("Gemini API key");
    expect(defaults.endpoint).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
    expect(defaults.model).toBe("gemini-2.5-flash");
  });

  it("requires endpoint and model for custom API mode", () => {
    const provider = getProviderConfig("custom-api");
    const missing = validateProviderSettings(provider, {
      apiKey: "",
      endpoint: "",
      model: ""
    });

    expect(missing).toEqual([
      "Custom API key",
      "Custom Chat Completions endpoint",
      "Model"
    ]);
  });

  it("allows local model mode without an API key", () => {
    const provider = getProviderConfig("local");
    const missing = validateProviderSettings(provider, getDefaultProviderSettings(provider));

    expect(provider.status).toBe("available");
    expect(provider.authRequired).toBeFalsy();
    expect(missing).toEqual([]);
  });
});
