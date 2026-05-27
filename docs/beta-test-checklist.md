# PromptBridge Beta Test Checklist

Use this checklist before sharing a Windows or macOS beta build.

## Latest Windows Build

The Windows release build succeeded and produced:

- `C:\RustBuilds\PromptBridge\release\bundle\msi\PromptBridge_0.1.0_x64_en-US.msi`
- `C:\RustBuilds\PromptBridge\release\bundle\nsis\PromptBridge_0.1.0_x64-setup.exe`

## Install And Launch

- Installer completes without warnings beyond normal unsigned-app warnings.
- App launches and main window appears.
- Tray icon appears.
- Tray menu opens the main window.
- Tray menu opens the overlay.
- Quit exits the app cleanly.

## Overlay

- Default shortcut opens the overlay.
- Overlay appears above VS Code, terminal, and browser-based coding tools.
- Overlay can be dragged from the titlebar.
- Top-right main-window button opens the main window and hides the overlay.
- Top-right hide button hides the overlay.
- Escape hides the overlay.

## Translation Providers

- Provider selection persists after restart.
- Missing credentials are shown before translation.
- Test provider shows missing settings before calling provider APIs.
- Test provider succeeds with valid provider settings.
- Failed provider tests show the provider error message.
- DeepL mode accepts a DeepL key.
- Google Translate mode accepts a Google API key.
- Microsoft Translator mode accepts key, endpoint, and optional region.
- OpenAI-compatible mode accepts endpoint, model, and key.
- Local translation model mode works without an API key when the local server does not require auth.
- LibreTranslate mode accepts a server URL and optional key.
- Custom API key mode requires endpoint, model, and key.
- Clear provider settings removes the selected provider's saved key and restores default endpoint/model values.

## Provider Usage

- Successful desktop translations increment the selected provider usage estimate.
- Provider connection tests increment the selected provider usage estimate.
- Browser preview translations do not increment provider usage.
- Current month usage shows request count, sent characters, and result characters per provider.
- Monthly sent-char alert can be set to a positive number.
- Provider usage card highlights when sent characters reach the alert threshold.
- Setting the alert threshold to 0 disables usage alerts.
- Reset month clears only the current month estimate.

## Prompt Protection

- Inline code remains unchanged.
- Fenced code blocks remain unchanged.
- Commands such as `npm run build` remain unchanged.
- Windows paths remain unchanged.
- POSIX paths remain unchanged.
- URLs remain unchanged.
- Custom protected terms preserve exact product, project, API, or brand names.
- Custom protected terms persist after restart.
- Protection Rules view lists detected tokens.

## Privacy Guards

- OpenAI-style API keys show a sensitive-data warning.
- GitHub tokens show a sensitive-data warning.
- AWS access keys show a sensitive-data warning.
- Private key blocks show a sensitive-data warning.
- Generic `API_KEY=...`, `token=...`, and `password=...` assignments show a warning.
- Warnings appear in Input Translate and Output Translate.
- Warnings do not block translation.
- Redact detected values replaces sensitive spans in Input Translate.
- Redact detected values replaces sensitive spans in Output Translate.
- Block sensitive sends can be enabled from Settings.
- When Block sensitive sends is on, sensitive Input Translate content does not call the provider.
- When Block sensitive sends is on, sensitive Output Translate content does not call the provider.
- Turning Block sensitive sends off returns to warning-only behavior.

## Prompt Profiles

- Direct translation leaves translated output unmodified.
- Bug fix profile appends root-cause and regression-test guidance.
- Refactor profile appends behavior-preserving guidance.
- Code review profile appends severity-ordered review guidance.
- Tests profile appends coverage guidance.
- Docs profile appends documentation guidance.
- Custom profile appends saved user instructions.
- Empty Custom profile leaves translated output unmodified.
- Selected profile persists after restart.

## Translation History

- Prompt translations are saved to local history.
- Output translations are saved to local history.
- History search finds source, result, provider, profile, and language matches.
- Restoring a prompt history item opens Input Translate with source/result restored.
- Restoring an output history item opens Output Translate with source/result restored.
- Deleting one history item removes only that item.
- Clear history removes local history entries.
- Save local history can be turned off from Settings.
- When Save local history is off, new prompt and output translations are not added to history.
- Re-enabling Save local history saves new translations again.
- History retention can be set to 7, 30, or 90 days.
- Keep until I delete disables automatic age-based pruning.

## Settings Backup

- Copy backup creates readable PromptBridge settings JSON.
- Copy without keys creates readable PromptBridge settings JSON with provider API keys blanked.
- Backup JSON includes selected provider, provider settings, languages, shortcut, prompt profile, custom profile, custom protected terms, history toggle/retention state, sensitive-send blocking state, and usage alert threshold.
- Import backup restores those settings.
- Import rejects unrelated JSON.
- Translation history entries are not included in the settings backup.

## Output Actions

- Copy writes the translated prompt to clipboard.
- Inject pastes into Notepad.
- Inject pastes into VS Code input fields.
- Original clipboard content is restored after injection.
- Overlay hides after successful injection.

## Output Translation

- Output Translate view opens from the sidebar.
- English agent output translates into the selected output language.
- Output language persists after restart.
- Code blocks, inline code, commands, paths, and URLs remain unchanged.
- Localized output can be copied.
- Localized output can be injected into the focused app.

## Settings

- UI language switch persists after restart.
- Arabic UI switches to RTL.
- Shortcut selection persists after restart.
- Selected shortcut opens overlay.
- Login autostart can be enabled and disabled.

## Known Beta Risks

- macOS accessibility permissions still need dedicated testing.
- Windows elevated target apps may reject paste injection from a non-elevated PromptBridge process.
- Unsigned Windows builds may trigger SmartScreen or antivirus warnings.
- Translation quality depends on the selected provider and model.
