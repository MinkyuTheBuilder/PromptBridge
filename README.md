# PromptBridge

PromptBridge is a Windows/macOS desktop bridge that turns coding requests written in any source language into clear English prompts for AI coding agents.

It is not meant to be a general translator. It protects code blocks, inline code, commands, file paths, URLs, and placeholders before sending text to a translation provider.

## Current MVP

- Floating overlay opened by a global shortcut
- System tray with overlay/main-window actions
- Bring-your-own-key translation providers
- DeepL, Google Translate, Microsoft Translator, OpenAI-compatible, LibreTranslate, local model, and custom API modes
- Manual provider connection test
- One-click clearing for selected provider credentials/settings
- Local monthly provider usage estimates and alert threshold
- Code/command/path/URL protection preview
- Custom protected terms for product, project, API, and brand names
- Local privacy warnings and optional sensitive-send blocking
- Prompt optimization profiles for bug fix, refactor, review, tests, docs, and custom workflows
- English agent output translation into a selected reading language
- Optional local translation history with search, restore, delete, and retention controls
- Settings backup/import JSON with keyless export option
- Output copy and paste injection
- UI language switcher
- Configurable overlay shortcut
- Login autostart switch

## Translation Direction

PromptBridge accepts any source language and targets English prompts for coding agents. The UI language is separate from the source prompt language.

Output Translate can translate English agent responses back into a selected reading language. That output language is also separate from the UI language.

## Development

```bash
npm install
npm run tauri dev
```

## Verification

```bash
npm test -- --run
npm run build
npm run release:smoke
cd src-tauri
cargo check
```

On Windows with Visual Studio Build Tools installed, run Cargo from a Visual Studio Developer Command Prompt.

## Build Installer

```bash
npm run tauri:build
```

Generated bundles are written under:

```text
src-tauri/target/release/bundle
```

## Beta Notes

PromptBridge is BYOK. Users should provide their own translation provider credentials. Do not treat DeepL credits as a permanent free default.

See [docs/beta-test-checklist.md](docs/beta-test-checklist.md) before handing a build to testers.

See [docs/release-notes-v0.1.0.md](docs/release-notes-v0.1.0.md) for the current beta release handoff notes.

See [docs/output-translation.md](docs/output-translation.md) for the v1.1 output translation workflow.

See [docs/prompt-profiles.md](docs/prompt-profiles.md) for the v1.2 prompt profile workflow.

See [docs/translation-history.md](docs/translation-history.md) for the v1.3 local history workflow.

See [docs/privacy-guards.md](docs/privacy-guards.md) for the local sensitive-data warning layer.

See [docs/custom-protected-terms.md](docs/custom-protected-terms.md) for exact-match term protection.

See [docs/provider-connection-test.md](docs/provider-connection-test.md) for the BYOK provider test workflow.

See [docs/settings-backup.md](docs/settings-backup.md) for the settings backup/import workflow.

See [docs/provider-usage.md](docs/provider-usage.md) for the local provider usage estimate.
