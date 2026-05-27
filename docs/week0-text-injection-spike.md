# Week 0 Text Injection Spike

## Goal

Decide whether PromptBridge can safely inject translated text into the currently focused coding agent input.

## Current Prototype

- Windows: `Set-Clipboard` plus `System.Windows.Forms.SendKeys("^v")`, then restore the previous clipboard text.
- macOS: `pbcopy` plus `osascript` Command+V, then restore the previous clipboard text.
- Browser preview: clipboard copy only

The command is exposed as `paste_text_spike` in `src-tauri/src/lib.rs`.

## Current Build Status

- Rust toolchain installed and verified.
- Visual Studio C++ Build Tools installed and verified.
- `cargo check` passes.
- `npm run tauri -- dev` launches `target/debug/promptbridge.exe`.
- Global shortcut registered: `Ctrl+Shift+Space`, opening the overlay window.
- System tray registered with Show, Open Overlay, and Quit menu items.

## Local Spike Script

Run this on Windows to test the two paste strategies in Notepad:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\week0-paste-spike.ps1
```

Latest run: the script completed successfully and reported that direct SendKeys plus clipboard paste were executed, with clipboard restore afterward.

## Manual Test Matrix

| Platform | Target app | Expected result |
| --- | --- | --- |
| Windows | VS Code terminal | Translated text appears in the focused prompt |
| Windows | PowerShell / Windows Terminal | Translated text appears without IME corruption |
| Windows | Claude Code or other agent terminal | Translated text appears in the active input |
| macOS | iTerm2 | Translated text appears after Accessibility permission is granted |
| macOS | VS Code terminal | Translated text appears in the active input |

## Decision Criteria

- Keep the clipboard-paste strategy if it works across the target apps with ordinary user permissions.
- Move to a native accessibility or UI Automation layer if focus is unreliable.
- Keep clipboard restore if it does not race with target app paste handling.
