# PROJECT_STATE.md — PromptBridge

## Current State

**Stage:** Standard  
**Version:** v0.1.0 (beta)  
**Date:** 2026-05-27  

## Status

| Area | State |
|---|---|
| MVP features | SHIPPED |
| Windows installer | BUILT (unsigned) |
| macOS | NOT TESTED |
| Dev environment | READY (GNU toolchain + SAC disabled, build verified) |
| Beta handoff | READY — Windows checklist complete (provider keys pending) |

## Active Feature

**Beta hand-off** — Windows checklist fully verified. Remaining: other provider API keys (DeepL, Google, Microsoft, LibreTranslate, Local, Custom) and macOS.

## Implementation Lock

None. No code-changing slice is currently active.

## Handoff Note

- Rust toolchain: `stable-x86_64-pc-windows-gnu` (MSYS2 MinGW).
- MSYS2 at `C:\msys64`. GCC at `C:\msys64\mingw64\bin`.
- Smart App Control disabled (registry `VerifiedAndReputablePolicyState=0`) — required for Cargo build scripts to execute.
- Build command: set `CARGO_TARGET_DIR=C:\RustBuilds\PromptBridge`, prepend `C:\msys64\mingw64\bin` and `%USERPROFILE%\.cargo\bin` to PATH, then `npm run tauri build`.
- Release build output: `C:\RustBuilds\PromptBridge\release\bundle\`

## Known Risks

- Windows installers are unsigned (SmartScreen warnings expected).
- Paste injection can fail if target app is elevated.
- macOS accessibility permissions not yet tested.
- GNU toolchain build produces a fully working app — verified (overlay, tray, shortcuts, translation all confirmed).

## To Confirm

- [x] Does the GNU toolchain build produce a fully working app (overlay, tray, shortcuts)? YES — verified 2026-05-27.
- [ ] Is macOS build feasible without a Mac runner?

## Pending Decisions

- None at this time.
