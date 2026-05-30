# PROJECT_SCOPE.md — PromptBridge

## In Scope (MVP / v0.x)

- Floating overlay window opened by global shortcut.
- System tray integration (open window, open overlay, quit).
- BYOK translation provider support (DeepL, Google Cloud Translate, Microsoft, OpenAI-compatible, Gemini, LibreTranslate, local, custom).
- Provider connection testing and usage estimation.
- Prompt protection (code, commands, paths, URLs, placeholders, custom terms).
- Privacy guards and optional sensitive-send blocking.
- Prompt optimization profiles.
- Output translation (English → reading language).
- Local translation history with retention controls.
- Settings backup and import.
- Copy output action. Paste injection is temporarily hidden.
- UI localization (13 languages, RTL support).
- Configurable overlay shortcut and login autostart.
- Windows and macOS desktop targets.

## Out of Scope (Later Phase — do not implement without explicit approval)

- Cloud or server-side translation processing.
- User accounts, authentication, or session management.
- Team or organization shared settings.
- Subscription, billing, or payment handling.
- Push notifications or background translation.
- Mobile or web app versions.
- macOS production signing and notarization (testing only in current phase).
- Analytics, telemetry, or crash reporting.
- Translation memory or glossary sync with external services.

## MVP vs. Later Phase Boundary

| Capability | MVP | Later |
|---|---|---|
| Local state persistence | MVP | — |
| Cloud state sync | — | Later |
| BYOK provider keys | MVP | — |
| Platform-managed API credits | — | Later |
| Local history | MVP | — |
| Shared team history | — | Later |
| Manual copy/paste | MVP | Paste injection temporarily hidden |
| Background / scheduled translation | — | Later |
