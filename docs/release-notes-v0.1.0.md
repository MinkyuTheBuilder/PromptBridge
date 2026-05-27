# PromptBridge v0.1.0 Release Notes

Date: 2026-05-27

## Build Artifacts

The Windows beta build produced:

- `src-tauri/target/release/bundle/msi/PromptBridge_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/PromptBridge_0.1.0_x64-setup.exe`

Run the release smoke test before sharing either installer:

```powershell
npm run release:smoke
```

## What Shipped

- Desktop app shell with main window, tray menu, and quick overlay window.
- Global shortcut support for opening the overlay.
- Bring-your-own-key translation provider settings.
- Provider options for DeepL, Google Translate, Microsoft Translator, OpenAI-compatible APIs, LibreTranslate, local translation models, and custom API endpoints.
- Translation direction fixed to any source language into English coding prompts.
- Prompt protection for code blocks, inline code, commands, paths, URLs, and placeholders.
- Protected token preview and Protection Rules view.
- Output actions for copy and paste injection.
- UI language switcher with English default plus 12 additional UI languages.
- Arabic RTL UI direction support.
- Configurable overlay shortcut.
- Login autostart setting.

## Product Notes

PromptBridge is BYOK for the beta. Users should provide their own translation provider credentials. DeepL can be used as one provider, but the product should not assume a permanent free DeepL allowance.

The UI language is separate from the prompt source language. PromptBridge should accept prompts written in any supported human language and produce English prompts for AI coding agents.

## Known Risks

- Windows installers are unsigned and may trigger SmartScreen or antivirus warnings.
- Paste injection can fail when the target app is elevated and PromptBridge is not.
- macOS accessibility permission handling still needs dedicated testing.
- Translation quality depends on the selected provider, model, and user credentials.
- Local translation model support assumes an OpenAI-compatible local endpoint.

## Verification

Before beta handoff, run:

```powershell
npm run release:smoke
npm test -- --run
npm run build
```

On Windows, run Cargo checks from a Visual Studio Developer Command Prompt:

```powershell
cd src-tauri
cargo fmt --check
cargo check
```
