import {
  Bot,
  Building2,
  Cloud,
  Globe2,
  KeyRound,
  Languages,
  Server,
  Sparkles,
  type LucideIcon
} from "lucide-react";

export type ProviderId =
  | "deepl"
  | "google"
  | "microsoft"
  | "openai-compatible"
  | "gemini"
  | "libretranslate"
  | "local"
  | "custom-api";

export type ProviderStatus = "available" | "planned";

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  description: string;
  status: ProviderStatus;
  authLabel: string;
  authRequired?: boolean;
  endpointLabel?: string;
  endpointRequired?: boolean;
  modelLabel?: string;
  modelRequired?: boolean;
  defaultEndpoint?: string;
  defaultModel?: string;
  helpText: string;
  icon: LucideIcon;
};

export type ProviderSettings = {
  apiKey: string;
  endpoint: string;
  model: string;
};

export const providerConfigs: ProviderConfig[] = [
  {
    id: "deepl",
    name: "DeepL",
    description: "Translate supported source languages to English with your DeepL API key.",
    status: "available",
    authLabel: "DeepL auth key",
    authRequired: true,
    defaultEndpoint: "https://api-free.deepl.com/v2/translate",
    helpText: "Uses a DeepL API Free or Pro auth key. DeepL auto-detects the source language.",
    icon: Languages
  },
  {
    id: "google",
    name: "Google Cloud Translate",
    description: "Translate with Google Cloud Translation API.",
    status: "available",
    authLabel: "Google Cloud Translation API key",
    authRequired: true,
    endpointLabel: "Cloud Translation endpoint",
    defaultEndpoint: "https://translation.googleapis.com/language/translate/v2",
    helpText: "Uses the Google Cloud Translation Basic v2 endpoint and API key. Gemini API keys should use the Gemini provider instead.",
    icon: Globe2
  },
  {
    id: "microsoft",
    name: "Microsoft Translator",
    description: "Translate with an Azure Translator key and optional region.",
    status: "available",
    authLabel: "Azure Translator key",
    authRequired: true,
    endpointLabel: "Translator endpoint",
    modelLabel: "Azure region",
    defaultEndpoint: "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en",
    helpText: "Azure region may be required depending on your resource configuration. Example: eastus.",
    icon: Cloud
  },
  {
    id: "openai-compatible",
    name: "OpenAI / low-cost LLM",
    description: "Connect OpenAI or a low-cost LLM gateway through Chat Completions.",
    status: "available",
    authLabel: "API key",
    authRequired: true,
    endpointLabel: "Chat Completions endpoint",
    modelLabel: "Model",
    defaultEndpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4.1-mini",
    helpText: "Uses OpenAI or compatible Chat Completions APIs.",
    icon: Bot
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Use a Gemini API key through Google's OpenAI-compatible Chat Completions endpoint.",
    status: "available",
    authLabel: "Gemini API key",
    authRequired: true,
    endpointLabel: "Gemini OpenAI-compatible endpoint",
    modelLabel: "Gemini model",
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.5-flash",
    helpText: "Uses a Gemini API key from Google AI Studio. Do not use the Google Cloud Translation endpoint for Gemini keys.",
    icon: Sparkles
  },
  {
    id: "libretranslate",
    name: "LibreTranslate",
    description: "Translate with a LibreTranslate server URL and optional API key.",
    status: "available",
    authLabel: "API key",
    endpointLabel: "Server URL",
    endpointRequired: true,
    defaultEndpoint: "http://localhost:5000/translate",
    helpText: "Uses the LibreTranslate /translate endpoint. Some servers may require an API key.",
    icon: Server
  },
  {
    id: "local",
    name: "Local translation model",
    description: "Connect an OpenAI-compatible local server or internal model.",
    status: "available",
    authLabel: "Optional local token",
    endpointLabel: "Local Chat Completions endpoint",
    endpointRequired: true,
    modelLabel: "Local model",
    modelRequired: true,
    defaultEndpoint: "http://localhost:11434/v1/chat/completions",
    defaultModel: "qwen2.5-coder:7b",
    helpText: "Uses local servers that expose OpenAI-compatible Chat Completions, such as Ollama, LM Studio, or vLLM. Enter a token only if your server requires one.",
    icon: Building2
  },
  {
    id: "custom-api",
    name: "Custom API key",
    description: "Use a custom endpoint, model, and API key entered by the user.",
    status: "available",
    authLabel: "Custom API key",
    authRequired: true,
    endpointLabel: "Custom Chat Completions endpoint",
    endpointRequired: true,
    modelLabel: "Model",
    modelRequired: true,
    defaultEndpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4.1-mini",
    helpText: "Directly targets an OpenAI-compatible Chat Completions API.",
    icon: KeyRound
  }
];

export function getProviderConfig(id: ProviderId) {
  return providerConfigs.find((provider) => provider.id === id) ?? providerConfigs[0];
}

export function getDefaultProviderSettings(provider: ProviderConfig): ProviderSettings {
  return {
    apiKey: "",
    endpoint: provider.defaultEndpoint ?? "",
    model: provider.defaultModel ?? ""
  };
}

export function validateProviderSettings(
  provider: ProviderConfig,
  settings: ProviderSettings
) {
  const missing: string[] = [];

  if (provider.status === "planned") {
    missing.push(`${provider.name} is not connected yet`);
  }

  if (provider.authRequired && !settings.apiKey.trim()) {
    missing.push(provider.authLabel);
  }

  if (provider.endpointRequired && !settings.endpoint.trim()) {
    missing.push(provider.endpointLabel ?? "endpoint");
  }

  if (provider.modelRequired && !settings.model.trim()) {
    missing.push(provider.modelLabel ?? "model");
  }

  return missing;
}
