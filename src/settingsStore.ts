import { Store } from "@tauri-apps/plugin-store";
import { defaultUiLanguage, getUiLanguage, type UiLanguage } from "./i18n";
import { defaultPromptProfile, getPromptProfile, type PromptProfileId } from "./promptProfiles";
import type { ProviderUsageState } from "./providerUsage";
import type { HistoryRetentionDays, TranslationHistoryEntry } from "./translationHistory";
import type { ProviderId, ProviderSettings } from "./translationProviders";

export type StoredSettings = Partial<Record<ProviderId, ProviderSettings>>;

export const defaultShortcut = "ctrl+shift+space";

const storePath = "promptbridge-settings.json";
const settingsKey = "providerSettings";
const selectedProviderKey = "selectedProvider";
const shortcutKey = "shortcut";
const uiLanguageKey = "uiLanguage";
const outputLanguageKey = "outputLanguage";
const promptProfileKey = "promptProfile";
const customPromptProfileKey = "customPromptProfile";
const customProtectedTermsKey = "customProtectedTerms";
const translationHistoryKey = "translationHistory";
const historyEnabledKey = "historyEnabled";
const historyRetentionDaysKey = "historyRetentionDays";
const privacyBlockEnabledKey = "privacyBlockEnabled";
const providerUsageKey = "providerUsage";
const usageAlertThresholdKey = "usageAlertThreshold";
const legacySettingsStorageKey = "promptbridge.providerSettings";
const legacySelectedProviderStorageKey = "promptbridge.selectedProvider";
const legacyShortcutStorageKey = "promptbridge.shortcut";
const legacyUiLanguageStorageKey = "promptbridge.uiLanguage";
const legacyOutputLanguageStorageKey = "promptbridge.outputLanguage";
const legacyPromptProfileStorageKey = "promptbridge.promptProfile";
const legacyCustomPromptProfileStorageKey = "promptbridge.customPromptProfile";
const legacyCustomProtectedTermsStorageKey = "promptbridge.customProtectedTerms";
const legacyTranslationHistoryStorageKey = "promptbridge.translationHistory";
const legacyHistoryEnabledStorageKey = "promptbridge.historyEnabled";
const legacyHistoryRetentionDaysStorageKey = "promptbridge.historyRetentionDays";
const legacyPrivacyBlockEnabledStorageKey = "promptbridge.privacyBlockEnabled";
const legacyProviderUsageStorageKey = "promptbridge.providerUsage";
const legacyUsageAlertThresholdStorageKey = "promptbridge.usageAlertThreshold";

function isTauriRuntime() {
  return Boolean(window.__TAURI_INTERNALS__);
}

async function loadTauriStore() {
  return Store.load(storePath, {
    defaults: {
      [settingsKey]: {},
      [selectedProviderKey]: "openai-compatible",
      [shortcutKey]: defaultShortcut,
      [uiLanguageKey]: defaultUiLanguage,
      [outputLanguageKey]: defaultUiLanguage,
      [promptProfileKey]: defaultPromptProfile,
      [customPromptProfileKey]: "",
      [customProtectedTermsKey]: "",
      [translationHistoryKey]: [],
      [historyEnabledKey]: true,
      [historyRetentionDaysKey]: 0,
      [privacyBlockEnabledKey]: false,
      [providerUsageKey]: {},
      [usageAlertThresholdKey]: 0
    },
    autoSave: true
  });
}

function loadLegacyHistory(): TranslationHistoryEntry[] {
  try {
    return JSON.parse(
      localStorage.getItem(legacyTranslationHistoryStorageKey) ?? "[]"
    ) as TranslationHistoryEntry[];
  } catch {
    return [];
  }
}

function loadLegacySettings(): StoredSettings {
  try {
    return JSON.parse(localStorage.getItem(legacySettingsStorageKey) ?? "{}") as StoredSettings;
  } catch {
    return {};
  }
}

export async function loadAppSettings() {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    return {
      providerSettings: (await store.get<StoredSettings>(settingsKey)) ?? {},
      selectedProvider: (await store.get<ProviderId>(selectedProviderKey)) ?? "openai-compatible",
      shortcut: (await store.get<string>(shortcutKey)) ?? defaultShortcut,
      uiLanguage: getUiLanguage(await store.get<string>(uiLanguageKey)),
      outputLanguage: getUiLanguage(await store.get<string>(outputLanguageKey)),
      promptProfile: getPromptProfile(await store.get<string>(promptProfileKey)).id,
      customPromptProfile: (await store.get<string>(customPromptProfileKey)) ?? "",
      customProtectedTerms: (await store.get<string>(customProtectedTermsKey)) ?? "",
      historyEnabled: (await store.get<boolean>(historyEnabledKey)) ?? true,
      historyRetentionDays: getHistoryRetentionDays(
        await store.get<number>(historyRetentionDaysKey)
      ),
      privacyBlockEnabled: (await store.get<boolean>(privacyBlockEnabledKey)) ?? false,
      providerUsage: (await store.get<ProviderUsageState>(providerUsageKey)) ?? {},
      usageAlertThreshold: getUsageAlertThreshold(
        await store.get<number>(usageAlertThresholdKey)
      )
    };
  }

  return {
    providerSettings: loadLegacySettings(),
    selectedProvider:
      (localStorage.getItem(legacySelectedProviderStorageKey) as ProviderId | null) ??
      "openai-compatible",
    shortcut: localStorage.getItem(legacyShortcutStorageKey) ?? defaultShortcut,
    uiLanguage: getUiLanguage(localStorage.getItem(legacyUiLanguageStorageKey)),
    outputLanguage: getUiLanguage(localStorage.getItem(legacyOutputLanguageStorageKey)),
    promptProfile: getPromptProfile(localStorage.getItem(legacyPromptProfileStorageKey)).id,
    customPromptProfile: localStorage.getItem(legacyCustomPromptProfileStorageKey) ?? "",
    customProtectedTerms: localStorage.getItem(legacyCustomProtectedTermsStorageKey) ?? "",
    historyEnabled: localStorage.getItem(legacyHistoryEnabledStorageKey) !== "false",
    historyRetentionDays: getHistoryRetentionDays(
      Number(localStorage.getItem(legacyHistoryRetentionDaysStorageKey) ?? 0)
    ),
    privacyBlockEnabled: localStorage.getItem(legacyPrivacyBlockEnabledStorageKey) === "true",
    providerUsage: loadProviderUsage(),
    usageAlertThreshold: getUsageAlertThreshold(
      Number(localStorage.getItem(legacyUsageAlertThresholdStorageKey) ?? 0)
    )
  };
}

function getHistoryRetentionDays(value: number | null | undefined): HistoryRetentionDays {
  return value === 7 || value === 30 || value === 90 ? value : 0;
}

function getUsageAlertThreshold(value: number | null | undefined) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 0;
}

function loadProviderUsage(): ProviderUsageState {
  try {
    return JSON.parse(
      localStorage.getItem(legacyProviderUsageStorageKey) ?? "{}"
    ) as ProviderUsageState;
  } catch {
    return {};
  }
}

export async function saveProviderSettings(providerSettings: StoredSettings) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(settingsKey, providerSettings);
    await store.save();
    return;
  }

  localStorage.setItem(legacySettingsStorageKey, JSON.stringify(providerSettings));
}

export async function saveSelectedProvider(selectedProvider: ProviderId) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(selectedProviderKey, selectedProvider);
    await store.save();
    return;
  }

  localStorage.setItem(legacySelectedProviderStorageKey, selectedProvider);
}

export async function saveShortcut(shortcut: string) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(shortcutKey, shortcut);
    await store.save();
    return;
  }

  localStorage.setItem(legacyShortcutStorageKey, shortcut);
}

export async function saveUiLanguage(uiLanguage: UiLanguage) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(uiLanguageKey, uiLanguage);
    await store.save();
    return;
  }

  localStorage.setItem(legacyUiLanguageStorageKey, uiLanguage);
}

export async function saveOutputLanguage(outputLanguage: UiLanguage) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(outputLanguageKey, outputLanguage);
    await store.save();
    return;
  }

  localStorage.setItem(legacyOutputLanguageStorageKey, outputLanguage);
}

export async function savePromptProfile(promptProfile: PromptProfileId) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(promptProfileKey, promptProfile);
    await store.save();
    return;
  }

  localStorage.setItem(legacyPromptProfileStorageKey, promptProfile);
}

export async function saveCustomPromptProfile(customPromptProfile: string) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(customPromptProfileKey, customPromptProfile);
    await store.save();
    return;
  }

  localStorage.setItem(legacyCustomPromptProfileStorageKey, customPromptProfile);
}

export async function saveCustomProtectedTerms(customProtectedTerms: string) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(customProtectedTermsKey, customProtectedTerms);
    await store.save();
    return;
  }

  localStorage.setItem(legacyCustomProtectedTermsStorageKey, customProtectedTerms);
}

export async function saveHistoryEnabled(historyEnabled: boolean) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(historyEnabledKey, historyEnabled);
    await store.save();
    return;
  }

  localStorage.setItem(legacyHistoryEnabledStorageKey, String(historyEnabled));
}

export async function saveHistoryRetentionDays(historyRetentionDays: HistoryRetentionDays) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(historyRetentionDaysKey, historyRetentionDays);
    await store.save();
    return;
  }

  localStorage.setItem(legacyHistoryRetentionDaysStorageKey, String(historyRetentionDays));
}

export async function savePrivacyBlockEnabled(privacyBlockEnabled: boolean) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(privacyBlockEnabledKey, privacyBlockEnabled);
    await store.save();
    return;
  }

  localStorage.setItem(legacyPrivacyBlockEnabledStorageKey, String(privacyBlockEnabled));
}

export async function saveProviderUsage(providerUsage: ProviderUsageState) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(providerUsageKey, providerUsage);
    await store.save();
    return;
  }

  localStorage.setItem(legacyProviderUsageStorageKey, JSON.stringify(providerUsage));
}

export async function saveUsageAlertThreshold(usageAlertThreshold: number) {
  const normalizedThreshold = getUsageAlertThreshold(usageAlertThreshold);

  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(usageAlertThresholdKey, normalizedThreshold);
    await store.save();
    return;
  }

  localStorage.setItem(legacyUsageAlertThresholdStorageKey, String(normalizedThreshold));
}

export async function loadTranslationHistory() {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    return (await store.get<TranslationHistoryEntry[]>(translationHistoryKey)) ?? [];
  }

  return loadLegacyHistory();
}

export async function saveTranslationHistory(history: TranslationHistoryEntry[]) {
  if (isTauriRuntime()) {
    const store = await loadTauriStore();
    await store.set(translationHistoryKey, history);
    await store.save();
    return;
  }

  localStorage.setItem(legacyTranslationHistoryStorageKey, JSON.stringify(history));
}
