# QA_CHECKLIST.md — PromptBridge

The primary manual QA checklist for beta builds is:

→ **[docs/beta-test-checklist.md](beta-test-checklist.md)**

That file covers: install/launch, overlay, translation providers, provider usage, prompt protection, privacy guards, prompt profiles, translation history, settings backup, output actions, output translation, and settings.

## Automated Checks

See [docs/VERIFICATION.md](VERIFICATION.md) for commands:

- `npm test -- --run` — unit/integration tests
- `npm run build` — frontend build
- `cargo check` — Rust compilation check
- `cargo fmt --check` — Rust formatting
- `npm run release:smoke` — Windows release smoke test

## Definition of Done (per slice)

- [ ] Automated verification commands pass (see VERIFICATION.md).
- [ ] Relevant sections of beta-test-checklist.md manually verified.
- [ ] No regression in existing working flows.
- [ ] PROJECT_STATE.md updated.
- [ ] DEV_LOG.md entry added.
