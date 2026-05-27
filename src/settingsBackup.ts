import { defaultUiLanguage, getUiLanguage, type UiLanguage } from "./i18n";
import { defaultPromptProfile, getPromptProfile, type PromptProfileId } from "./promptProfiles";
import { defaultShortcut, type StoredSettings } from "./settingsStore";
import type { HistoryRetentionDays } from "./translationHistory";
import {
  getDefaultProviderSettings,
  providerConfigs,
  type ProviderId,
  type ProviderSettings
} from "./translationProviders";

const backupFormat = "promptbridge-settings";
const backupVersion = 1;

export type SettingsBackupData = {
  providerSettings: StoredSettings;
  selectedProvider: ProviderId;
  shortcut: string;
  uiLanguage: UiLanguage;
  outputLanguage: UiLanguage;
  promptProfile: PromptProfileId;
  customPromptProfile: string;
  customProtectedTerms: string;
  historyEnabled: boolean;
  historyRetentionDays: HistoryRetentionDays;
  privacyBlockEnabled: boolean;
  usageAlertThreshold: number;
};

export type SettingsBackupPayload = SettingsBackupData & {
  format: typeof backupFormat;
  version: typeof backupVersion;
  exportedAt: string;
};

type CreateSettingsBackupOptions = {
  includeProviderKeys?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getProviderId(value: unknown): ProviderId {
  return providerConfigs.some((provider) => provider.id === value)
    ? (value as ProviderId)
    : "openai-compatible";
}

function normalizeProviderSettings(value: unknown): StoredSettings {
  if (!isRecord(value)) return {};

  return providerConfigs.reduce<StoredSettings>((settings, provider) => {
    const rawSettings = value[provider.id];

    if (!isRecord(rawSettings)) return settings;

    const defaults = getDefaultProviderSettings(provider);
    settings[provider.id] = {
      apiKey: typeof rawSettings.apiKey === "string" ? rawSettings.apiKey : defaults.apiKey,
      endpoint:
        typeof rawSettings.endpoint === "string" ? rawSettings.endpoint : defaults.endpoint,
      model: typeof rawSettings.model === "string" ? rawSettings.model : defaults.model
    } satisfies ProviderSettings;

    return settings;
  }, {});
}

function prepareProviderSettings(
  providerSettings: StoredSettings,
  includeProviderKeys: boolean
): StoredSettings {
  return Object.fromEntries(
    Object.entries(providerSettings).map(([providerId, settings]) => [
      providerId,
      {
        ...settings,
        apiKey: includeProviderKeys ? settings?.apiKey ?? "" : ""
      }
    ])
  ) as StoredSettings;
}

export function createSettingsBackup(
  data: SettingsBackupData,
  options: CreateSettingsBackupOptions = {}
) {
  const includeProviderKeys = options.includeProviderKeys ?? true;
  const payload: SettingsBackupPayload = {
    format: backupFormat,
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    providerSettings: prepareProviderSettings(data.providerSettings, includeProviderKeys),
    selectedProvider: data.selectedProvider,
    shortcut: data.shortcut,
    uiLanguage: data.uiLanguage,
    outputLanguage: data.outputLanguage,
    promptProfile: data.promptProfile,
    customPromptProfile: data.customPromptProfile,
    customProtectedTerms: data.customProtectedTerms,
    historyEnabled: data.historyEnabled,
    historyRetentionDays: data.historyRetentionDays,
    privacyBlockEnabled: data.privacyBlockEnabled,
    usageAlertThreshold: data.usageAlertThreshold
  };

  return JSON.stringify(payload, null, 2);
}

export function parseSettingsBackup(rawBackup: string): SettingsBackupData {
  const parsed = JSON.parse(rawBackup) as unknown;

  if (!isRecord(parsed) || parsed.format !== backupFormat || parsed.version !== backupVersion) {
    throw new Error("Invalid PromptBridge settings backup.");
  }

  return {
    providerSettings: normalizeProviderSettings(parsed.providerSettings),
    selectedProvider: getProviderId(parsed.selectedProvider),
    shortcut: typeof parsed.shortcut === "string" ? parsed.shortcut : defaultShortcut,
    uiLanguage: getUiLanguage(typeof parsed.uiLanguage === "string" ? parsed.uiLanguage : null),
    outputLanguage: getUiLanguage(
      typeof parsed.outputLanguage === "string" ? parsed.outputLanguage : defaultUiLanguage
    ),
    promptProfile: getPromptProfile(
      typeof parsed.promptProfile === "string" ? parsed.promptProfile : defaultPromptProfile
    ).id,
    customPromptProfile:
      typeof parsed.customPromptProfile === "string" ? parsed.customPromptProfile : "",
    customProtectedTerms:
      typeof parsed.customProtectedTerms === "string" ? parsed.customProtectedTerms : "",
    historyEnabled:
      typeof parsed.historyEnabled === "boolean" ? parsed.historyEnabled : true,
    historyRetentionDays:
      parsed.historyRetentionDays === 7 ||
      parsed.historyRetentionDays === 30 ||
      parsed.historyRetentionDays === 90
        ? parsed.historyRetentionDays
        : 0,
    privacyBlockEnabled:
      typeof parsed.privacyBlockEnabled === "boolean" ? parsed.privacyBlockEnabled : false,
    usageAlertThreshold:
      typeof parsed.usageAlertThreshold === "number" &&
      Number.isFinite(parsed.usageAlertThreshold) &&
      parsed.usageAlertThreshold > 0
        ? Math.floor(parsed.usageAlertThreshold)
        : 0
  };
}
