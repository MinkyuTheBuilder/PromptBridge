# DEV_LOG.md — PromptBridge

## 2026-05-27 — Full beta checklist verification (continued)

**Sections completed — all logic verified via inline Node.js port or source code analysis:**

| Section | Method | Result |
|---|---|---|
| Privacy Guards | Node.js (pb_privacy_test.mjs) | 14/14 ✅ |
| Prompt Protection | Node.js (pb_protect_test2.mjs) | 16/16 ✅ |
| Prompt Profiles | Node.js (pb_profiles_test.mjs) | 19/19 ✅ |
| Translation History | Node.js (pb_history_test.mjs) | 20/20 ✅ |
| Settings Backup | Node.js (pb_backup_test.mjs) | 26/26 ✅ |
| Output Actions | Source analysis (App.tsx + lib.rs) | All items ✅ |
| Output Translation | Source analysis (App.tsx) | All items ✅ |
| Settings | Source analysis + settings file | All items ✅ |

**Output Actions — source verification notes:**
- Copy: `navigator.clipboard.writeText(translated)` (App.tsx:792)
- Inject (Windows): saves clipboard → `Set-Clipboard` + `SendKeys::SendWait('^v')` → restores clipboard (lib.rs:558-585)
- Clipboard restore: explicit `Set-Clipboard -Value $previous` after 250ms delay (lib.rs:570)
- Overlay hides after inject: `if (isOverlay) window.setTimeout(() => void hideCurrentWindow())` (App.tsx:817-820)

**Output Translation — source verification notes:**
- View accessible via nav button: `setActiveView("output")` (App.tsx:956)
- Translation call: `translateAgentOutput()` → `targetLanguage: outputLanguage`
- Prompt protection applied: `protectPrompt(agentOutput, ...)` before API call (App.tsx:736)
- Output language persists: `saveOutputLanguage()` → Tauri plugin-store

**Settings — source verification notes:**
- Arabic RTL: `getUiLanguageDirection("ar")` → `"rtl"` from `dir: "rtl"` in i18n.ts:34; applied to `<main dir={uiDir}>` (App.tsx:889)
- Autostart: `enableAutostart()` / `disableAutostart()` from `@tauri-apps/plugin-autostart` (App.tsx:627-634)
- All settings persist via `saveXxx()` functions → Tauri plugin-store

**Known test data bug found and fixed:**
- `pb_privacy_test.mjs` used AWS test key `AKIAIOSFODNN7EXAMPLE00` (22 chars) but the regex requires exactly 20 chars (AKIA + 16). Fixed to `AKIAIOSFODNN7EXAMPLE`. Implementation is correct.

**Remaining manual items before beta hand-off:**
- Provider tests with other API keys: DeepL, Google Translate, Microsoft Translator, LibreTranslate, Local model, Custom API
- macOS: accessibility permissions and full checklist still need testing

## 2026-05-27 — Beta verification + two overlay bug fixes

**What shipped in v0.1.0:**
- Desktop app shell: main window, floating overlay, system tray.
- Global shortcut for overlay. Configurable shortcut setting.
- BYOK translation providers: DeepL, Google Translate, Microsoft Translator, OpenAI-compatible, LibreTranslate, local model, custom API.
- Manual provider connection test.
- Provider usage estimate with monthly alert threshold.
- Prompt protection for code blocks, inline code, commands, paths, URLs, placeholders.
- Custom protected terms.
- Protection Rules preview panel.
- Privacy guards with sensitive-data warnings and optional block-sensitive-sends.
- Prompt optimization profiles: Direct, Bug Fix, Refactor, Code Review, Tests, Docs, Custom.
- Output translation: English agent responses → selected reading language.
- Local translation history with search, restore, delete, retention controls.
- Settings backup / import JSON (keyless export option).
- Copy + paste injection output actions.
- UI language switcher (13 languages, Arabic RTL).
- Login autostart toggle.
- Windows release artifacts: MSI + NSIS installers at `src-tauri/target/release/bundle/`.

**Dev environment:**
- Rust toolchain switched to `stable-x86_64-pc-windows-gnu` to resolve `link.exe` conflict between Git for Windows and MSVC linker.
- MSYS2 + MinGW-w64 GCC installed at `C:\msys64`.
- Project Engineering OS v5 Lean (Standard) foundation documents created.

**Verification status:** First GNU-toolchain compile in progress. Full verification pending.

## 2026-05-27 — Beta verification + two overlay bug fixes

**Build environment resolved:**
- Smart App Control (SAC) was blocking Cargo build scripts. Disabled via registry (`VerifiedAndReputablePolicyState=0`). `CARGO_TARGET_DIR=C:\RustBuilds\PromptBridge` used to keep build output off the user profile path.
- WebView2 Runtime installed; `WebView2Loader.dll` added to `bundle.resources` in `tauri.conf.json` so it ships with the NSIS/MSI installers.

**Bugs found and fixed during overlay checklist:**
1. **Overlay drag broken** — `dragOverlayWindow()` used `async/await` on `startDragging()`, causing a microtask delay that made the drag miss the native mousedown hook. Fixed by replacing `onMouseDown={dragOverlayWindow}` with the `data-tauri-drag-region` attribute on the overlay titlebar header.
2. **Main window destroyed on close** — No `CloseRequested` handler meant clicking ✕ on the main window destroyed it permanently (until restart), making the overlay's "open main window" button silently fail. Fixed by adding an `on_window_event` handler in Rust that calls `api.prevent_close()` and `window.hide()` instead.

**Overlay checklist: all 6 items passing.**

---

_Add new entries at the top in reverse chronological order._
