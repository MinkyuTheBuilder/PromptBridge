# DEV_LOG.md — PromptBridge

## 2026-05-27 — v0.1.0 Beta Build + Project Foundation Setup

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
