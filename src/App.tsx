import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { disable as disableAutostart, enable as enableAutostart, isEnabled as isAutostartEnabled } from "@tauri-apps/plugin-autostart";
import {
  BarChart3,
  Clipboard,
  Download,
  GripHorizontal,
  History,
  KeyRound,
  Languages,
  Loader2,
  Maximize2,
  MessageSquareText,
  Minus,
  Play,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  getDefaultProviderSettings,
  getProviderConfig,
  type ProviderId,
  type ProviderSettings,
  providerConfigs,
  validateProviderSettings
} from "./translationProviders";
import {
  defaultShortcut,
  loadAppSettings,
  loadTranslationHistory,
  saveCustomPromptProfile,
  saveCustomProtectedTerms,
  saveHistoryEnabled,
  saveHistoryRetentionDays,
  saveOutputLanguage,
  savePrivacyBlockEnabled,
  savePromptProfile,
  saveProviderSettings,
  saveProviderUsage,
  saveShortcut,
  saveSelectedProvider,
  saveTranslationHistory,
  saveUiLanguage,
  saveUsageAlertThreshold,
  type StoredSettings
} from "./settingsStore";
import {
  defaultUiLanguage,
  getUiLanguage,
  getUiLanguageDirection,
  getUiLanguageName,
  t,
  uiLanguages,
  type UiLanguage
} from "./i18n";
import {
  createEnglishPromptPreview,
  inspectProtectedTokens,
  parseCustomProtectedTerms,
  protectPrompt
} from "./promptProtection";
import {
  addProviderUsage,
  formatUsageNumber,
  getCurrentUsagePeriod,
  getProviderUsage,
  isUsageAlertReached,
  resetUsagePeriod,
  type ProviderUsageState
} from "./providerUsage";
import {
  applyPromptProfile,
  defaultPromptProfile,
  getPromptProfile,
  promptProfiles,
  type PromptProfileId
} from "./promptProfiles";
import { inspectSensitiveTokens, redactSensitiveText } from "./privacyGuards";
import { createSettingsBackup, parseSettingsBackup } from "./settingsBackup";
import {
  addTranslationHistoryEntry,
  createTranslationHistoryEntry,
  filterTranslationHistory,
  pruneTranslationHistory,
  removeTranslationHistoryEntry,
  type HistoryRetentionDays,
  type TranslationHistoryEntry,
  type TranslationHistoryInput
} from "./translationHistory";

type BridgeStatus = "idle" | "translating" | "ready" | "error";
type ProviderTestStatus = "idle" | "testing" | "success" | "error";
type AppView = "translate" | "output" | "history" | "protection";

type TranslateResult = {
  text: string;
  detectedSourceLanguage?: string;
  provider: string;
};

type InjectionResult = {
  strategy: string;
  success: boolean;
  message: string;
};

const shortcutOptions = [
  { value: "ctrl+shift+space", label: "Ctrl Shift Space" },
  { value: "ctrl+alt+space", label: "Ctrl Alt Space" },
  { value: "ctrl+alt+p", label: "Ctrl Alt P" }
];

const historyRetentionOptions: Array<{ value: HistoryRetentionDays; labelKey: "historyKeepForever" | "historyKeep7Days" | "historyKeep30Days" | "historyKeep90Days" }> = [
  { value: 0, labelKey: "historyKeepForever" },
  { value: 7, labelKey: "historyKeep7Days" },
  { value: 30, labelKey: "historyKeep30Days" },
  { value: 90, labelKey: "historyKeep90Days" }
];

const enablePasteInjection = false;
const enableOutputTranslate = false;

function isTauriRuntime() {
  return Boolean(window.__TAURI_INTERNALS__);
}

export function App() {
  const sourceInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [windowLabel, setWindowLabel] = useState("main");
  const [source, setSource] = useState("");
  const [translated, setTranslated] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [localizedOutput, setLocalizedOutput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("openai-compatible");
  const [providerSettings, setProviderSettings] = useState<StoredSettings>({});
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [providerTestStatus, setProviderTestStatus] = useState<ProviderTestStatus>("idle");
  const [providerTestMessage, setProviderTestMessage] = useState("");
  const [notice, setNotice] = useState(t(defaultUiLanguage, "defaultNotice"));
  const [detectedLanguage, setDetectedLanguage] = useState<string | undefined>();
  const [shortcut, setShortcut] = useState(defaultShortcut);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("translate");
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(defaultUiLanguage);
  const [outputLanguage, setOutputLanguage] = useState<UiLanguage>(defaultUiLanguage);
  const [promptProfile, setPromptProfile] = useState<PromptProfileId>(defaultPromptProfile);
  const [customPromptProfile, setCustomPromptProfile] = useState("");
  const [customProtectedTerms, setCustomProtectedTerms] = useState("");
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [historyRetentionDays, setHistoryRetentionDays] = useState<HistoryRetentionDays>(0);
  const [privacyBlockEnabled, setPrivacyBlockEnabled] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [settingsBackupInput, setSettingsBackupInput] = useState("");
  const [providerUsage, setProviderUsage] = useState<ProviderUsageState>({});
  const [usageAlertThreshold, setUsageAlertThreshold] = useState(0);

  const currentProvider = getProviderConfig(selectedProvider);
  const currentSettings =
    providerSettings[selectedProvider] ?? getDefaultProviderSettings(currentProvider);
  const parsedCustomProtectedTerms = useMemo(
    () => parseCustomProtectedTerms(customProtectedTerms),
    [customProtectedTerms]
  );
  const protectedPreview = useMemo(
    () => protectPrompt(source, parsedCustomProtectedTerms).text,
    [source, parsedCustomProtectedTerms]
  );
  const protectedTokens = useMemo(
    () => inspectProtectedTokens(source, parsedCustomProtectedTerms),
    [source, parsedCustomProtectedTerms]
  );
  const sourceSensitiveFindings = useMemo(() => inspectSensitiveTokens(source), [source]);
  const agentOutputSensitiveFindings = useMemo(
    () => inspectSensitiveTokens(agentOutput),
    [agentOutput]
  );
  const missingProviderSettings = useMemo(
    () => validateProviderSettings(currentProvider, currentSettings),
    [currentProvider, currentSettings]
  );
  const canTranslate = source.trim().length > 0 && status !== "translating";
  const canUseOutput = translated.trim().length > 0;
  const canTranslateAgentOutput = agentOutput.trim().length > 0 && status !== "translating";
  const canUseLocalizedOutput = localizedOutput.trim().length > 0;
  const SelectedIcon = currentProvider.icon;
  const currentPromptProfile = getPromptProfile(promptProfile);
  const currentUsagePeriod = getCurrentUsagePeriod();
  const currentProviderUsage = getProviderUsage(
    providerUsage,
    selectedProvider,
    currentUsagePeriod
  );
  const selectedProviderUsageAlertReached = isUsageAlertReached(
    currentProviderUsage,
    usageAlertThreshold
  );
  const visibleHistory = useMemo(
    () => filterTranslationHistory(translationHistory, historySearch),
    [translationHistory, historySearch]
  );
  const isOverlay = windowLabel === "overlay";
  const uiDir = getUiLanguageDirection(uiLanguage);
  const tt = (key: Parameters<typeof t>[1], values?: Parameters<typeof t>[2]) =>
    t(uiLanguage, key, values);

  useEffect(() => {
    if (isTauriRuntime()) {
      setWindowLabel(getCurrentWindow().label);
    } else if (new URLSearchParams(window.location.search).get("overlay") === "1") {
      setWindowLabel("overlay");
    }

    void loadAppSettings().then((settings) => {
      if (providerConfigs.some((provider) => provider.id === settings.selectedProvider)) {
        setSelectedProvider(settings.selectedProvider);
      }
      setProviderSettings(settings.providerSettings);
      setShortcut(settings.shortcut);
      setUiLanguage(settings.uiLanguage);
      setOutputLanguage(settings.outputLanguage);
      setPromptProfile(settings.promptProfile);
      setCustomPromptProfile(settings.customPromptProfile);
      setCustomProtectedTerms(settings.customProtectedTerms);
      setHistoryEnabled(settings.historyEnabled);
      setHistoryRetentionDays(settings.historyRetentionDays);
      setPrivacyBlockEnabled(settings.privacyBlockEnabled);
      setProviderUsage(settings.providerUsage);
      setUsageAlertThreshold(settings.usageAlertThreshold);
      setNotice(t(settings.uiLanguage, "defaultNotice"));
      void applyShortcut(settings.shortcut);
      void refreshAutoStart();
    });

    void loadTranslationHistory().then(setTranslationHistory);
  }, []);

  useEffect(() => {
    if (historyRetentionDays === 0) return;

    setTranslationHistory((currentHistory) => {
      const prunedHistory = pruneTranslationHistory(currentHistory, historyRetentionDays);

      if (prunedHistory.length !== currentHistory.length) {
        void saveTranslationHistory(prunedHistory);
      }

      return prunedHistory;
    });
  }, [historyRetentionDays]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let unlisten: (() => void) | undefined;
    void listen("promptbridge-shortcut", () => {
      sourceInputRef.current?.focus();
      setNotice(t(uiLanguage, "shortcutNotice"));
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [uiLanguage]);

  function persistSettings(nextSettings: StoredSettings) {
    setProviderSettings(nextSettings);
    void saveProviderSettings(nextSettings);
  }

  function updateProviderSetting(key: keyof ProviderSettings, value: string) {
    setProviderTestStatus("idle");
    setProviderTestMessage("");
    persistSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentSettings,
        [key]: value
      }
    });
  }

  function clearSelectedProviderSettings() {
    persistSettings({
      ...providerSettings,
      [selectedProvider]: getDefaultProviderSettings(currentProvider)
    });
    setProviderTestStatus("idle");
    setProviderTestMessage("");
    setNotice(tt("providerSettingsCleared", { provider: currentProvider.name }));
  }

  function chooseProvider(providerId: ProviderId) {
    setSelectedProvider(providerId);
    setProviderTestStatus("idle");
    setProviderTestMessage("");
    void saveSelectedProvider(providerId);
    const provider = getProviderConfig(providerId);
    setNotice(
      provider.status === "available"
        ? tt("providerSwitched", { provider: provider.name })
        : tt("providerPlanned", { provider: provider.name })
    );
  }

  async function testProviderConnection() {
    const missingSettings = validateProviderSettings(currentProvider, currentSettings);

    if (missingSettings.length > 0) {
      const message = tt("settingsNeeded", { settings: missingSettings.join(", ") });
      setProviderTestStatus("error");
      setProviderTestMessage(message);
      setNotice(message);
      return;
    }

    if (!isTauriRuntime()) {
      const message = tt("providerTestBrowser");
      setProviderTestStatus("success");
      setProviderTestMessage(message);
      setNotice(message);
      return;
    }

    setProviderTestStatus("testing");
    setProviderTestMessage(tt("providerTesting"));

    try {
      const result = await invoke<TranslateResult>("translate_prompt", {
        request: {
          providerId: currentProvider.id,
          text: "Hello from PromptBridge.",
          targetLanguage: "en",
          apiKey: currentSettings.apiKey.trim(),
          endpoint: currentSettings.endpoint.trim(),
          model: currentSettings.model.trim()
        }
      });
      const message = tt("providerTestSuccess", { provider: result.provider });

      recordProviderUsage(currentProvider.id, "Hello from PromptBridge.", result.text);
      setProviderTestStatus("success");
      setProviderTestMessage(message);
      setNotice(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setProviderTestStatus("error");
      setProviderTestMessage(message);
      setNotice(message);
    }
  }

  async function applyShortcut(nextShortcut: string) {
    if (!isTauriRuntime()) return;

    try {
      const message = await invoke<string>("configure_promptbridge_shortcut", {
        shortcut: nextShortcut
      });
      setNotice(message || tt("shortcutSet", { shortcut: nextShortcut }));
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  function chooseShortcut(nextShortcut: string) {
    setShortcut(nextShortcut);
    void saveShortcut(nextShortcut);
    void applyShortcut(nextShortcut);
  }

  function chooseUiLanguage(nextLanguage: UiLanguage) {
    setUiLanguage(nextLanguage);
    void saveUiLanguage(nextLanguage);
    setNotice(t(nextLanguage, "languageChanged", { language: getUiLanguageName(nextLanguage) }));
  }

  function chooseOutputLanguage(nextLanguage: UiLanguage) {
    setOutputLanguage(nextLanguage);
    void saveOutputLanguage(nextLanguage);
    setNotice(tt("outputLanguageChanged", { language: getUiLanguageName(nextLanguage) }));
  }

  function choosePromptProfile(nextProfile: PromptProfileId) {
    const profile = getPromptProfile(nextProfile);
    setPromptProfile(profile.id);
    void savePromptProfile(profile.id);
    setNotice(tt("promptProfileChanged", { profile: profile.name }));
  }

  function updateCustomPromptProfile(nextInstructions: string) {
    setCustomPromptProfile(nextInstructions);
    void saveCustomPromptProfile(nextInstructions);
  }

  function updateCustomProtectedTerms(nextTerms: string) {
    setCustomProtectedTerms(nextTerms);
    void saveCustomProtectedTerms(nextTerms);
  }

  function toggleHistoryEnabled() {
    const nextEnabled = !historyEnabled;

    setHistoryEnabled(nextEnabled);
    void saveHistoryEnabled(nextEnabled);
    setNotice(nextEnabled ? tt("historyEnabled") : tt("historyDisabled"));
  }

  function chooseHistoryRetentionDays(nextRetentionDays: HistoryRetentionDays) {
    const prunedHistory = pruneTranslationHistory(translationHistory, nextRetentionDays);

    setHistoryRetentionDays(nextRetentionDays);
    setTranslationHistory(prunedHistory);
    void saveHistoryRetentionDays(nextRetentionDays);
    void saveTranslationHistory(prunedHistory);
    setNotice(tt("historyRetentionChanged"));
  }

  function togglePrivacyBlockEnabled() {
    const nextEnabled = !privacyBlockEnabled;

    setPrivacyBlockEnabled(nextEnabled);
    void savePrivacyBlockEnabled(nextEnabled);
    setNotice(nextEnabled ? tt("privacyBlockEnabled") : tt("privacyBlockDisabled"));
  }

  function getSettingsBackupData() {
    return {
      providerSettings,
      selectedProvider,
      shortcut,
      uiLanguage,
      outputLanguage,
      promptProfile,
      customPromptProfile,
      customProtectedTerms,
      historyEnabled,
      historyRetentionDays,
      privacyBlockEnabled,
      usageAlertThreshold
    };
  }

  async function copySettingsBackup(includeProviderKeys: boolean) {
    const backup = createSettingsBackup(getSettingsBackupData(), { includeProviderKeys });

    setSettingsBackupInput(backup);

    try {
      await navigator.clipboard.writeText(backup);
      setNotice(includeProviderKeys ? tt("settingsBackupCopied") : tt("safeSettingsBackupCopied"));
    } catch {
      setNotice(tt("settingsBackupReady"));
    }
  }

  function importSettingsBackup() {
    try {
      const backup = parseSettingsBackup(settingsBackupInput);

      setProviderSettings(backup.providerSettings);
      setSelectedProvider(backup.selectedProvider);
      setShortcut(backup.shortcut);
      setUiLanguage(backup.uiLanguage);
      setOutputLanguage(backup.outputLanguage);
      setPromptProfile(backup.promptProfile);
      setCustomPromptProfile(backup.customPromptProfile);
      setCustomProtectedTerms(backup.customProtectedTerms);
      setHistoryEnabled(backup.historyEnabled);
      setHistoryRetentionDays(backup.historyRetentionDays);
      setPrivacyBlockEnabled(backup.privacyBlockEnabled);
      setUsageAlertThreshold(backup.usageAlertThreshold);

      void saveProviderSettings(backup.providerSettings);
      void saveSelectedProvider(backup.selectedProvider);
      void saveShortcut(backup.shortcut);
      void saveUiLanguage(backup.uiLanguage);
      void saveOutputLanguage(backup.outputLanguage);
      void savePromptProfile(backup.promptProfile);
      void saveCustomPromptProfile(backup.customPromptProfile);
      void saveCustomProtectedTerms(backup.customProtectedTerms);
      void saveHistoryEnabled(backup.historyEnabled);
      void saveHistoryRetentionDays(backup.historyRetentionDays);
      void savePrivacyBlockEnabled(backup.privacyBlockEnabled);
      void saveUsageAlertThreshold(backup.usageAlertThreshold);
      void applyShortcut(backup.shortcut);

      setProviderTestStatus("idle");
      setProviderTestMessage("");
      setNotice(t(backup.uiLanguage, "settingsBackupImported"));
    } catch {
      setNotice(tt("settingsBackupInvalid"));
    }
  }

  function recordProviderUsage(providerId: ProviderId, sourceText: string, resultText: string) {
    setProviderUsage((currentUsage) => {
      const nextUsage = addProviderUsage(currentUsage, providerId, sourceText, resultText);
      void saveProviderUsage(nextUsage);
      return nextUsage;
    });
  }

  function resetCurrentUsagePeriod() {
    const nextUsage = resetUsagePeriod(providerUsage, currentUsagePeriod);

    setProviderUsage(nextUsage);
    void saveProviderUsage(nextUsage);
    setNotice(tt("usageReset"));
  }

  function updateUsageAlertThreshold(nextThreshold: string) {
    const normalizedThreshold = Math.max(0, Math.floor(Number(nextThreshold) || 0));

    setUsageAlertThreshold(normalizedThreshold);
    void saveUsageAlertThreshold(normalizedThreshold);
    setNotice(
      normalizedThreshold > 0
        ? tt("usageAlertThresholdSet", { count: formatUsageNumber(normalizedThreshold) })
        : tt("usageAlertThresholdDisabled")
    );
  }

  function maybeNoticeUsageAlert() {
    if (!selectedProviderUsageAlertReached) return false;

    setNotice(
      tt("usageAlertReached", {
        provider: currentProvider.name,
        count: formatUsageNumber(currentProviderUsage.sourceChars),
        threshold: formatUsageNumber(usageAlertThreshold)
      })
    );
    return true;
  }

  function formatSensitiveLabels(findings: Array<{ label: string }>) {
    return Array.from(new Set(findings.map((finding) => finding.label))).join(", ");
  }

  function redactSourceSensitiveText() {
    setSource(redactSensitiveText(source));
    setStatus("idle");
    setNotice(tt("sensitiveValuesRedacted"));
  }

  function redactAgentOutputSensitiveText() {
    setAgentOutput(redactSensitiveText(agentOutput));
    setStatus("idle");
    setNotice(tt("sensitiveValuesRedacted"));
  }

  function recordTranslationHistory(input: TranslationHistoryInput) {
    if (!historyEnabled) return;

    const entry = createTranslationHistoryEntry(input);
    const nextHistory = pruneTranslationHistory(
      addTranslationHistoryEntry(translationHistory, entry),
      historyRetentionDays
    );

    setTranslationHistory(nextHistory);
    void saveTranslationHistory(nextHistory);
  }

  function clearTranslationHistory() {
    setTranslationHistory([]);
    void saveTranslationHistory([]);
    setNotice(tt("historyCleared"));
  }

  function deleteHistoryEntry(entryId: string) {
    const nextHistory = removeTranslationHistoryEntry(translationHistory, entryId);

    setTranslationHistory(nextHistory);
    void saveTranslationHistory(nextHistory);
    setNotice(tt("historyDeleted"));
  }

  function restoreHistoryEntry(entry: TranslationHistoryEntry) {
    if (entry.kind === "prompt") {
      setSource(entry.sourceText);
      setTranslated(entry.resultText);
      if (entry.promptProfile) {
        setPromptProfile(entry.promptProfile);
        void savePromptProfile(entry.promptProfile);
      }
      setActiveView("translate");
    } else {
      if (!enableOutputTranslate) {
        setNotice(tt("outputTranslateDisabled"));
        return;
      }

      setAgentOutput(entry.sourceText);
      setLocalizedOutput(entry.resultText);
      setOutputLanguage(getUiLanguage(entry.targetLanguage));
      setActiveView("output");
    }

    setNotice(tt("historyRestored"));
  }

  async function refreshAutoStart() {
    if (!isTauriRuntime()) return;

    try {
      setAutoStartEnabled(await isAutostartEnabled());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function toggleAutoStart() {
    if (!isTauriRuntime()) {
      setAutoStartEnabled((enabled) => !enabled);
      setNotice(tt("browserAutostart"));
      return;
    }

    try {
      if (autoStartEnabled) {
        await disableAutostart();
        setAutoStartEnabled(false);
        setNotice(tt("autostartDisabled"));
      } else {
        await enableAutostart();
        setAutoStartEnabled(true);
        setNotice(tt("autostartEnabled"));
      }
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : String(error));
      void refreshAutoStart();
    }
  }

  async function translate() {
    if (!canTranslate) return;

    if (privacyBlockEnabled && sourceSensitiveFindings.length > 0) {
      setStatus("error");
      setNotice(tt("privacyBlocked", { items: formatSensitiveLabels(sourceSensitiveFindings) }));
      return;
    }

    setStatus("translating");
    if (!maybeNoticeUsageAlert()) {
      setNotice(tt("translatingNotice"));
    }

    const protectedPrompt = protectPrompt(source, parsedCustomProtectedTerms);
    const missingSettings = validateProviderSettings(currentProvider, currentSettings);

    try {
      if (isTauriRuntime() && currentProvider.status === "available" && missingSettings.length === 0) {
        const result = await invoke<TranslateResult>("translate_prompt", {
          request: {
            providerId: currentProvider.id,
            text: protectedPrompt.text,
            targetLanguage: "en",
            apiKey: currentSettings.apiKey.trim(),
            endpoint: currentSettings.endpoint.trim(),
            model: currentSettings.model.trim()
          }
        });
        const finalText = applyPromptProfile(
          protectedPrompt.restore(result.text),
          promptProfile,
          customPromptProfile
        );

        setTranslated(finalText);
        setDetectedLanguage(result.detectedSourceLanguage);
        setNotice(tt("translationReady", { provider: result.provider }));
        recordProviderUsage(currentProvider.id, protectedPrompt.text, result.text);
        recordTranslationHistory({
          kind: "prompt",
          provider: result.provider,
          sourceText: source,
          resultText: finalText,
          targetLanguage: "en",
          promptProfile
        });
      } else {
        const finalText = applyPromptProfile(
          createEnglishPromptPreview(source, currentProvider.name),
          promptProfile,
          customPromptProfile
        );

        setTranslated(finalText);
        setDetectedLanguage("Auto");
        setNotice(
          currentProvider.status === "planned"
            ? tt("plannedPreview", { provider: currentProvider.name })
            : missingSettings.length > 0
              ? tt("settingsNeeded", { settings: missingSettings.join(", ") })
              : tt("browserPreview")
        );
        recordTranslationHistory({
          kind: "prompt",
          provider: currentProvider.name,
          sourceText: source,
          resultText: finalText,
          targetLanguage: "en",
          promptProfile
        });
      }
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function translateAgentOutput() {
    if (!canTranslateAgentOutput) return;

    if (privacyBlockEnabled && agentOutputSensitiveFindings.length > 0) {
      setStatus("error");
      setNotice(tt("privacyBlocked", { items: formatSensitiveLabels(agentOutputSensitiveFindings) }));
      return;
    }

    setStatus("translating");
    if (!maybeNoticeUsageAlert()) {
      setNotice(tt("translatingNotice"));
    }

    const protectedText = protectPrompt(agentOutput, parsedCustomProtectedTerms);
    const missingSettings = validateProviderSettings(currentProvider, currentSettings);

    try {
      if (isTauriRuntime() && currentProvider.status === "available" && missingSettings.length === 0) {
        const result = await invoke<TranslateResult>("translate_prompt", {
          request: {
            providerId: currentProvider.id,
            text: protectedText.text,
            targetLanguage: outputLanguage,
            apiKey: currentSettings.apiKey.trim(),
            endpoint: currentSettings.endpoint.trim(),
            model: currentSettings.model.trim()
          }
        });
        const finalText = protectedText.restore(result.text);

        setLocalizedOutput(finalText);
        setNotice(tt("outputReady", { provider: result.provider }));
        recordProviderUsage(currentProvider.id, protectedText.text, result.text);
        recordTranslationHistory({
          kind: "output",
          provider: result.provider,
          sourceText: agentOutput,
          resultText: finalText,
          targetLanguage: outputLanguage
        });
      } else {
        const finalText = `[${currentProvider.name} BYOK preview -> ${getUiLanguageName(outputLanguage)}]\n\n${agentOutput}`;

        setLocalizedOutput(finalText);
        setNotice(
          currentProvider.status === "planned"
            ? tt("plannedPreview", { provider: currentProvider.name })
            : missingSettings.length > 0
              ? tt("settingsNeeded", { settings: missingSettings.join(", ") })
              : tt("browserPreview")
        );
        recordTranslationHistory({
          kind: "output",
          provider: currentProvider.name,
          sourceText: agentOutput,
          resultText: finalText,
          targetLanguage: outputLanguage
        });
      }
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function copyOutput() {
    if (!canUseOutput) return;

    await navigator.clipboard.writeText(translated);
    setNotice(tt("copied"));
  }

  async function copyLocalizedOutput() {
    if (!canUseLocalizedOutput) return;

    await navigator.clipboard.writeText(localizedOutput);
    setNotice(tt("outputCopied"));
  }

  async function injectOutput() {
    if (!canUseOutput) return;

    if (!isTauriRuntime()) {
      await copyOutput();
      setNotice(tt("browserCopyOnly"));
      return;
    }

    try {
      const result = await invoke<InjectionResult>("paste_text_spike", {
        text: translated
      });
      setNotice(result.message || tt("injectionAttempted", { strategy: result.strategy }));
      if (isOverlay) {
        window.setTimeout(() => {
          void hideCurrentWindow();
        }, 320);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  }

  async function injectLocalizedOutput() {
    if (!canUseLocalizedOutput) return;

    if (!isTauriRuntime()) {
      await copyLocalizedOutput();
      setNotice(tt("browserCopyOnly"));
      return;
    }

    try {
      const result = await invoke<InjectionResult>("paste_text_spike", {
        text: localizedOutput
      });
      setNotice(tt("outputInjected", { strategy: result.strategy }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  }

  async function hideCurrentWindow() {
    if (!isTauriRuntime()) return;
    if (isOverlay) {
      await invoke("hide_overlay_window");
      return;
    }
    await getCurrentWindow().hide();
  }

  async function focusMainWindow() {
    if (!isTauriRuntime()) return;
    await invoke("show_main_window");
  }


  function handleWorkspaceKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && isOverlay) {
      event.preventDefault();
      void hideCurrentWindow();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (enableOutputTranslate && activeView === "output" && !isOverlay) {
        if (event.shiftKey && canUseLocalizedOutput) {
          if (enablePasteInjection) void injectLocalizedOutput();
        } else {
          void translateAgentOutput();
        }
      } else if (enablePasteInjection && event.shiftKey && canUseOutput) {
        void injectOutput();
      } else {
        void translate();
      }
    }
  }

  return (
    <main
      className={`app-shell ${isOverlay ? "overlay-mode" : ""}`}
      dir={uiDir}
      lang={uiLanguage}
      onKeyDown={handleWorkspaceKeyDown}
    >
      {isOverlay ? (
        <header className="overlay-titlebar" data-tauri-drag-region>
          <div>
            <GripHorizontal size={16} aria-hidden="true" />
            <strong>PromptBridge</strong>
            <span>{currentProvider.name}</span>
          </div>
          <div
            className="topbar-actions"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button"
              type="button"
              title={tt("mainWindow")}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                void focusMainWindow();
              }}
            >
              <Maximize2 size={16} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              type="button"
              title={tt("hide")}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                void hideCurrentWindow();
              }}
            >
              <Minus size={16} aria-hidden="true" />
            </button>
          </div>
        </header>
      ) : null}

      {!isOverlay ? <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Languages size={20} aria-hidden="true" />
          </div>
          <div>
            <h1>PromptBridge</h1>
            <p>{tt("appSubtitle")}</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="PromptBridge sections">
          <button
            className={`nav-item ${activeView === "translate" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("translate")}
          >
            <Wand2 size={18} aria-hidden="true" />
            {tt("navTranslate")}
          </button>
          {enableOutputTranslate ? (
            <button
              className={`nav-item ${activeView === "output" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("output")}
            >
              <MessageSquareText size={18} aria-hidden="true" />
              {tt("navOutput")}
            </button>
          ) : null}
          <button className="nav-item" type="button" onClick={() => setShowSettings(true)}>
            <KeyRound size={18} aria-hidden="true" />
            {tt("navEngine")}
          </button>
          <button
            className={`nav-item ${activeView === "history" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("history")}
          >
            <History size={18} aria-hidden="true" />
            {tt("navHistory")}
          </button>
          <button
            className={`nav-item ${activeView === "protection" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("protection")}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            {tt("navProtection")}
          </button>
        </nav>

        <div className="provider-card">
          <div className="provider-card-title">
            <SelectedIcon size={18} aria-hidden="true" />
            <strong>{currentProvider.name}</strong>
          </div>
          <p>{currentProvider.description}</p>
          <small className={missingProviderSettings.length > 0 ? "provider-warning" : "provider-ready"}>
            {missingProviderSettings.length > 0
              ? tt("needSettings", { settings: missingProviderSettings.join(", ") })
              : tt("readyToTranslate")}
          </small>
          <button className="ghost-button full-width" type="button" onClick={() => setShowSettings(true)}>
            {tt("changeEngine")}
          </button>
        </div>

        <div className="status-panel">
          <span className={`status-dot ${status}`} />
          <div>
            <strong>
              {status === "translating"
                ? tt("statusTranslating")
                : status === "error"
                  ? tt("statusError")
                  : tt("statusIdle")}
            </strong>
            <p>{notice}</p>
          </div>
        </div>
      </aside> : null}

      <section className="workspace" aria-label="Translation workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isOverlay ? tt("quickOverlay") : tt("weekLabel")}</p>
            <h2>
              {isOverlay
                ? tt("quickHeading")
                : activeView === "protection"
                  ? tt("protectionHeading")
                  : activeView === "output"
                    ? tt("outputHeading")
                    : activeView === "history"
                      ? tt("historyHeading")
                  : tt("translateHeading")}
            </h2>
          </div>
          <div className="topbar-actions">
            <button className="provider-pill" type="button" onClick={() => setShowSettings(true)}>
              <SelectedIcon size={16} aria-hidden="true" />
              {currentProvider.name}
            </button>
            <button className="icon-button" type="button" title={tt("navEngine")} onClick={() => setShowSettings(true)}>
              <Settings size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {activeView === "translate" || isOverlay ? (
          <>
            <div className="prompt-grid">
              <section className="editor-pane" aria-label="Source prompt input">
                <div className="pane-header">
                  <div>
                    <span>{tt("sourceInput")}</span>
                    <small>{tt("chars", { count: source.length })}</small>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => setSource("")}>
                    {tt("clear")}
                  </button>
                </div>
                <textarea
                  ref={sourceInputRef}
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("sourcePlaceholder")}
                />
              </section>

              <section className="editor-pane output-pane" aria-label="English prompt output">
                <div className="pane-header">
                  <div>
                    <span>{tt("englishPrompt")}</span>
                    <small>
                      {detectedLanguage ? tt("detected", { language: detectedLanguage }) : currentProvider.name}
                    </small>
                  </div>
                  <div className="button-row">
                    <button className="icon-button" type="button" title={tt("copy")} disabled={!canUseOutput} onClick={copyOutput}>
                      <Clipboard size={18} aria-hidden="true" />
                    </button>
                    {enablePasteInjection ? (
                      <button className="icon-button" type="button" title={tt("inject")} disabled={!canUseOutput} onClick={injectOutput}>
                        <Play size={18} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  value={translated}
                  onChange={(event) => setTranslated(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("outputPlaceholder")}
                />
              </section>
            </div>

            <div className="action-strip output-action-strip">
              <label className="compact-select">
                <span>{tt("promptProfileHeading")}</span>
                <select
                  value={promptProfile}
                  onChange={(event) => choosePromptProfile(event.target.value as PromptProfileId)}
                >
                  {promptProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <strong>{tt("protectedPreview")}</strong>
                <p>{protectedPreview || currentPromptProfile.description || tt("protectedPreviewEmpty")}</p>
                {sourceSensitiveFindings.length > 0 ? (
                  <div className="privacy-warning">
                    <ShieldAlert size={16} aria-hidden="true" />
                    <div>
                      <strong>{tt("privacyWarningTitle")}</strong>
                      <p>
                        {tt("privacyWarningBody", {
                          items: formatSensitiveLabels(sourceSensitiveFindings)
                        })}
                      </p>
                      {privacyBlockEnabled ? <p>{tt("privacyBlockActive")}</p> : null}
                      <button className="inline-action" type="button" onClick={redactSourceSensitiveText}>
                        {tt("redactDetected")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <button className="primary-button" type="button" disabled={!canTranslate} onClick={translate}>
                {status === "translating" ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                {tt("translate")}
              </button>
            </div>
          </>
        ) : enableOutputTranslate && activeView === "output" ? (
          <>
            <div className="prompt-grid">
              <section className="editor-pane" aria-label="English agent output input">
                <div className="pane-header">
                  <div>
                    <span>{tt("englishAgentOutput")}</span>
                    <small>{tt("chars", { count: agentOutput.length })}</small>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => setAgentOutput("")}>
                    {tt("clear")}
                  </button>
                </div>
                <textarea
                  value={agentOutput}
                  onChange={(event) => setAgentOutput(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("agentOutputPlaceholder")}
                />
              </section>

              <section className="editor-pane output-pane" aria-label="Localized agent output">
                <div className="pane-header">
                  <div>
                    <span>{tt("localizedOutput")}</span>
                    <small>{getUiLanguageName(outputLanguage)}</small>
                  </div>
                  <div className="button-row">
                    <button className="icon-button" type="button" title={tt("copy")} disabled={!canUseLocalizedOutput} onClick={copyLocalizedOutput}>
                      <Clipboard size={18} aria-hidden="true" />
                    </button>
                    {enablePasteInjection ? (
                      <button className="icon-button" type="button" title={tt("inject")} disabled={!canUseLocalizedOutput} onClick={injectLocalizedOutput}>
                        <Play size={18} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  value={localizedOutput}
                  onChange={(event) => setLocalizedOutput(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("localizedOutputPlaceholder")}
                />
              </section>
            </div>

            <div className="action-strip output-action-strip">
              <label className="compact-select">
                <span>{tt("outputLanguageHeading")}</span>
                <select
                  value={outputLanguage}
                  onChange={(event) => chooseOutputLanguage(event.target.value as UiLanguage)}
                >
                  {uiLanguages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.nativeLabel} - {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <strong>{tt("protectedPreview")}</strong>
                <p>{tt("outputLanguageDescription")}</p>
                {agentOutputSensitiveFindings.length > 0 ? (
                  <div className="privacy-warning">
                    <ShieldAlert size={16} aria-hidden="true" />
                    <div>
                      <strong>{tt("privacyWarningTitle")}</strong>
                      <p>
                        {tt("privacyWarningBody", {
                          items: formatSensitiveLabels(agentOutputSensitiveFindings)
                        })}
                      </p>
                      {privacyBlockEnabled ? <p>{tt("privacyBlockActive")}</p> : null}
                      <button
                        className="inline-action"
                        type="button"
                        onClick={redactAgentOutputSensitiveText}
                      >
                        {tt("redactDetected")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <button className="primary-button" type="button" disabled={!canTranslateAgentOutput} onClick={translateAgentOutput}>
                {status === "translating" ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                {tt("translateOutput")}
              </button>
            </div>
          </>
        ) : activeView === "history" ? (
          <div className="history-layout">
            <div className="history-toolbar">
              <label className="field inline-field">
                <span>{tt("historySearch")}</span>
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  type="search"
                  placeholder={tt("historySearchPlaceholder")}
                />
              </label>
              <button
                className="ghost-button"
                type="button"
                disabled={translationHistory.length === 0}
                onClick={clearTranslationHistory}
              >
                {tt("clearHistory")}
              </button>
            </div>

            <section className="history-panel" aria-label="Translation history">
              {!historyEnabled ? (
                <p className="history-note">{tt("historyDisabled")}</p>
              ) : null}
              {visibleHistory.length > 0 ? (
                visibleHistory.map((entry) => (
                  <article className="history-item" key={entry.id}>
                    <div className="history-meta">
                      <strong>{entry.kind === "prompt" ? tt("promptHistory") : tt("outputHistory")}</strong>
                      <span>{entry.provider}</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="history-columns">
                      <p>{entry.sourceText}</p>
                      <p>{entry.resultText}</p>
                    </div>
                    <div className="history-actions">
                      <small>
                        {entry.kind === "prompt"
                          ? getPromptProfile(entry.promptProfile).name
                          : getUiLanguageName(getUiLanguage(entry.targetLanguage))}
                      </small>
                      <div className="history-action-buttons">
                        {entry.kind === "prompt" || enableOutputTranslate ? (
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => restoreHistoryEntry(entry)}
                          >
                            {tt("restore")}
                          </button>
                        ) : null}
                        <button
                          className="icon-button"
                          type="button"
                          title={tt("deleteHistoryItem")}
                          onClick={() => deleteHistoryEntry(entry.id)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-state">
                  {translationHistory.length === 0 ? tt("historyEmpty") : tt("historyNoResults")}
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="protection-layout">
            <section className="editor-pane" aria-label="Protection source input">
              <div className="pane-header">
                <div>
                  <span>{tt("protectionSource")}</span>
                  <small>{tt("protectedCount", { count: protectedTokens.length })}</small>
                </div>
                <button className="ghost-button" type="button" onClick={() => setSource("")}>
                  {tt("clear")}
                </button>
              </div>
              <textarea
                ref={sourceInputRef}
                value={source}
                onChange={(event) => setSource(event.target.value)}
                spellCheck={false}
                placeholder={tt("protectionPlaceholder")}
              />
            </section>

            <section className="protection-panel" aria-label="Protected token inspector">
              <div className="pane-header">
                <div>
                  <span>{tt("protectedTokens")}</span>
                  <small>{protectedTokens.length > 0 ? tt("tokensWillReplace") : tt("noTokensDetected")}</small>
                </div>
              </div>
              <div className="token-list">
                {protectedTokens.length > 0 ? (
                  protectedTokens.map((token) => (
                    <div className="token-row" key={`${token.placeholder}-${token.start}`}>
                      <div>
                        <strong>{token.label}</strong>
                        <small>{token.placeholder}</small>
                      </div>
                      <code>{token.value}</code>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">{tt("noTokensBody")}</p>
                )}
              </div>
            </section>

            <div className="action-strip">
              <div>
                <strong>{tt("replacementPreview")}</strong>
                <p>{protectedPreview || tt("replacementPreviewEmpty")}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {showSettings ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowSettings(false)}>
          <section className="settings-modal wide" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="pane-header">
              <div>
                <h2 id="settings-title">{tt("settingsTitle")}</h2>
              <small>{tt("settingsSubtitle")}</small>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowSettings(false)}>
                {tt("close")}
              </button>
            </div>

            <div className="provider-grid">
              {providerConfigs.map((provider) => {
                const ProviderIcon = provider.icon;
                return (
                  <button
                    className={`provider-option ${provider.id === selectedProvider ? "selected" : ""}`}
                    type="button"
                    key={provider.id}
                    onClick={() => chooseProvider(provider.id)}
                  >
                    <ProviderIcon size={18} aria-hidden="true" />
                    <span>
                      <strong>{provider.name}</strong>
                      <small>{provider.status === "available" ? tt("available") : tt("planned")}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="field">
              <span>{currentProvider.authLabel}</span>
              <input
                value={currentSettings.apiKey}
                onChange={(event) => updateProviderSetting("apiKey", event.target.value)}
                type="password"
                autoComplete="off"
                placeholder={tt("apiKeyPlaceholder")}
              />
            </label>

            {currentProvider.endpointLabel ? (
              <label className="field">
                <span>{currentProvider.endpointLabel}</span>
                <input
                  value={currentSettings.endpoint}
                  onChange={(event) => updateProviderSetting("endpoint", event.target.value)}
                  type="url"
                  autoComplete="off"
                  placeholder={currentProvider.defaultEndpoint ?? "https://..."}
                />
              </label>
            ) : null}

            {currentProvider.modelLabel ? (
              <label className="field">
                <span>{currentProvider.modelLabel}</span>
                <input
                  value={currentSettings.model}
                  onChange={(event) => updateProviderSetting("model", event.target.value)}
                  type="text"
                  autoComplete="off"
                  placeholder={currentProvider.defaultModel ?? "model"}
                />
              </label>
            ) : null}

            <p className="fine-print">
              {currentProvider.helpText} {tt("providerFinePrint")}
            </p>

            <div className="provider-test-row">
              <button
                className="ghost-button"
                type="button"
                disabled={providerTestStatus === "testing"}
                onClick={testProviderConnection}
              >
                {providerTestStatus === "testing" ? (
                  <Loader2 className="spin" size={16} aria-hidden="true" />
                ) : null}
                {tt("testProvider")}
              </button>
              {providerTestMessage ? (
                <p className={`provider-test-message ${providerTestStatus}`}>
                  {providerTestMessage}
                </p>
              ) : null}
            </div>

            <div className="provider-test-row">
              <button
                className="ghost-button danger"
                type="button"
                onClick={clearSelectedProviderSettings}
              >
                {tt("clearProviderSettings")}
              </button>
              <p className="provider-test-message idle">{tt("clearProviderSettingsDescription")}</p>
            </div>

            <div className="settings-section">
              <div className="usage-heading">
                <div>
                  <h3>{tt("usageHeading")}</h3>
                  <p>{tt("usageDescription", { period: currentUsagePeriod })}</p>
                </div>
                <button className="ghost-button" type="button" onClick={resetCurrentUsagePeriod}>
                  {tt("resetUsage")}
                </button>
              </div>
              <div className="usage-grid">
                {providerConfigs.map((provider) => {
                  const usage = getProviderUsage(providerUsage, provider.id, currentUsagePeriod);
                  const usageAlertReached = isUsageAlertReached(usage, usageAlertThreshold);

                  return (
                    <div className={`usage-card ${usageAlertReached ? "warning" : ""}`} key={provider.id}>
                      <div>
                        <BarChart3 size={16} aria-hidden="true" />
                        <strong>{provider.name}</strong>
                      </div>
                      <dl>
                        <div>
                          <dt>{tt("usageRequests")}</dt>
                          <dd>{formatUsageNumber(usage.requests)}</dd>
                        </div>
                        <div>
                          <dt>{tt("usageSourceChars")}</dt>
                          <dd>{formatUsageNumber(usage.sourceChars)}</dd>
                        </div>
                        <div>
                          <dt>{tt("usageResultChars")}</dt>
                          <dd>{formatUsageNumber(usage.resultChars)}</dd>
                        </div>
                      </dl>
                      {usageAlertReached ? (
                        <p>{tt("usageAlertCard", { threshold: formatUsageNumber(usageAlertThreshold) })}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <label className="field inline-field usage-alert-field">
                <span>{tt("usageAlertThresholdHeading")}</span>
                <input
                  value={usageAlertThreshold}
                  min={0}
                  step={1000}
                  onChange={(event) => updateUsageAlertThreshold(event.target.value)}
                  type="number"
                />
              </label>
              <p>{tt("usageAlertThresholdDescription")}</p>
            </div>

            <div className="settings-section">
              <label className="field inline-field">
                <span>{tt("uiLanguageHeading")}</span>
                <select
                  value={uiLanguage}
                  onChange={(event) => chooseUiLanguage(event.target.value as UiLanguage)}
                >
                  {uiLanguages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.nativeLabel} - {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <p>{tt("uiLanguageDescription")}</p>
            </div>

            <div className="settings-section">
              <label className="field inline-field">
                <span>{tt("outputLanguageHeading")}</span>
                <select
                  value={outputLanguage}
                  onChange={(event) => chooseOutputLanguage(event.target.value as UiLanguage)}
                >
                  {uiLanguages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.nativeLabel} - {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <p>{tt("outputLanguageDescription")}</p>
            </div>

            <div className="settings-section">
              <label className="field inline-field">
                <span>{tt("promptProfileHeading")}</span>
                <select
                  value={promptProfile}
                  onChange={(event) => choosePromptProfile(event.target.value as PromptProfileId)}
                >
                  {promptProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <p>{currentPromptProfile.description || tt("promptProfileDescription")}</p>
            </div>

            {promptProfile === "custom" ? (
              <div className="settings-section">
                <label className="field inline-field">
                  <span>{tt("customProfileHeading")}</span>
                  <textarea
                    className="profile-textarea"
                    value={customPromptProfile}
                    onChange={(event) => updateCustomPromptProfile(event.target.value)}
                    spellCheck={false}
                    placeholder={tt("customProfilePlaceholder")}
                  />
                </label>
                <p>{tt("customProfileSaved")}</p>
              </div>
            ) : null}

            <div className="settings-section">
              <label className="field inline-field">
                <span>{tt("customProtectedTermsHeading")}</span>
                <textarea
                  className="profile-textarea protected-terms-textarea"
                  value={customProtectedTerms}
                  onChange={(event) => updateCustomProtectedTerms(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("customProtectedTermsPlaceholder")}
                />
              </label>
              <p>
                {tt("customProtectedTermsDescription", {
                  count: parsedCustomProtectedTerms.length
                })}
              </p>
            </div>

            <div className="settings-section">
              <div>
                <h3>{tt("shortcutHeading")}</h3>
                <p>{tt("shortcutDescription")}</p>
              </div>
              <div className="shortcut-grid" role="group" aria-label="Overlay shortcut">
                {shortcutOptions.map((option) => (
                  <button
                    className={`shortcut-option ${shortcut === option.value ? "selected" : ""}`}
                    key={option.value}
                    type="button"
                    onClick={() => chooseShortcut(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section compact-row">
              <div>
                <h3>{tt("historySettingHeading")}</h3>
                <p>{tt("historySettingDescription")}</p>
              </div>
              <button
                className={`switch-button ${historyEnabled ? "enabled" : ""}`}
                type="button"
                role="switch"
                aria-checked={historyEnabled}
                onClick={toggleHistoryEnabled}
              >
                <span />
              </button>
            </div>

            <div className="settings-section">
              <label className="field inline-field">
                <span>{tt("historyRetentionHeading")}</span>
                <select
                  value={historyRetentionDays}
                  onChange={(event) =>
                    chooseHistoryRetentionDays(Number(event.target.value) as HistoryRetentionDays)
                  }
                >
                  {historyRetentionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {tt(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
              <p>{tt("historyRetentionDescription")}</p>
            </div>

            <div className="settings-section compact-row">
              <div>
                <h3>{tt("privacyBlockHeading")}</h3>
                <p>{tt("privacyBlockDescription")}</p>
              </div>
              <button
                className={`switch-button ${privacyBlockEnabled ? "enabled" : ""}`}
                type="button"
                role="switch"
                aria-checked={privacyBlockEnabled}
                onClick={togglePrivacyBlockEnabled}
              >
                <span />
              </button>
            </div>

            <div className="settings-section">
              <div>
                <h3>{tt("settingsBackupHeading")}</h3>
                <p>{tt("settingsBackupDescription")}</p>
              </div>
              <div className="backup-actions">
                <button className="ghost-button" type="button" onClick={() => copySettingsBackup(true)}>
                  <Download size={16} aria-hidden="true" />
                  {tt("copySettingsBackup")}
                </button>
                <button className="ghost-button" type="button" onClick={() => copySettingsBackup(false)}>
                  <Download size={16} aria-hidden="true" />
                  {tt("copySafeSettingsBackup")}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={settingsBackupInput.trim().length === 0}
                  onClick={importSettingsBackup}
                >
                  <Upload size={16} aria-hidden="true" />
                  {tt("importSettingsBackup")}
                </button>
              </div>
              <label className="field">
                <span>{tt("settingsBackupJson")}</span>
                <textarea
                  className="profile-textarea backup-textarea"
                  value={settingsBackupInput}
                  onChange={(event) => setSettingsBackupInput(event.target.value)}
                  spellCheck={false}
                  placeholder={tt("settingsBackupPlaceholder")}
                />
              </label>
              <p>{tt("settingsBackupWarning")}</p>
            </div>

            <div className="settings-section compact-row">
              <div>
                <h3>{tt("autostartHeading")}</h3>
                <p>{autoStartEnabled ? tt("on") : tt("off")}</p>
              </div>
              <button
                className={`switch-button ${autoStartEnabled ? "enabled" : ""}`}
                type="button"
                role="switch"
                aria-checked={autoStartEnabled}
                onClick={toggleAutoStart}
              >
                <span />
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
