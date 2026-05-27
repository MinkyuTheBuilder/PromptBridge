# VERIFICATION.md — PromptBridge

## When to Run

Run the relevant commands after any code change. Run the full suite before beta handoff or release.

## Commands

### Frontend tests
```powershell
npm test -- --run
```
Pass: all tests green, no failures.

### Frontend build
```powershell
npm run build
```
Pass: `dist/` produced with no TypeScript or Vite errors.

### Rust check
```powershell
# Run from a shell where MinGW64 is in PATH
# PATH must include C:\msys64\mingw64\bin and %USERPROFILE%\.cargo\bin
cd src-tauri
cargo check
```
Pass: no errors. Warnings are acceptable if pre-existing.

### Rust format check
```powershell
cd src-tauri
cargo fmt --check
```
Pass: no output (no formatting violations).

### Full dev run
```powershell
# Ensure PATH includes MinGW64 and Cargo bin
npm run tauri dev
```
Pass: overlay opens, main window opens, tray appears, shortcut works.

### Release smoke test (Windows)
```powershell
npm run release:smoke
```
Pass: smoke test script exits without errors.

## Pre-Beta-Handoff Checklist

Run in order:

1. `npm test -- --run` — green
2. `npm run build` — no errors
3. `cargo fmt --check` — no violations
4. `cargo check` — no errors
5. `npm run release:smoke` — pass
6. Manual: work through `docs/beta-test-checklist.md` on a clean machine

## Pass/Fail Criteria

| Command | Pass | Fail |
|---|---|---|
| `npm test -- --run` | All tests pass | Any test fails |
| `npm run build` | dist/ produced, no TS errors | Build error or TS error |
| `cargo check` | No errors | Any error |
| `cargo fmt --check` | No output | Formatting violation printed |
| `npm run release:smoke` | Exit 0 | Non-zero exit or error output |

## Notes

- Do not run `cargo` from a plain PowerShell session without MinGW64 in PATH — `link.exe` conflict with Git for Windows will cause build failure.
- Browser preview translations do not count toward provider usage estimates; only desktop translations and connection tests do.
