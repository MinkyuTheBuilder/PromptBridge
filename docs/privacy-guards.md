# Privacy Guards

PromptBridge detects common sensitive values locally before translation.

## Purpose

Translation providers receive the text the user sends. The privacy guard is a local warning layer that helps users notice secrets before they send prompts or agent output to a provider.

## Detected Patterns

- Private key blocks
- OpenAI-style API keys
- GitHub tokens
- AWS access keys
- JWT tokens
- Generic assignments such as `API_KEY=...`, `token: ...`, `password=...`, and `auth_key=...`

## Behavior

- Detection runs locally in the UI.
- Warnings appear in Input Translate. Output Translate is temporarily hidden.
- By default, warnings do not block translation.
- If Block sensitive sends is enabled in Settings, PromptBridge stops provider calls until the detected values are removed or redacted.
- Redact detected values replaces detected sensitive spans locally while keeping surrounding prompt text.
- PromptBridge does not automatically redact or rewrite user text without the user choosing that action.

## Limits

Pattern matching can miss unusual secret formats and can flag false positives. Users should still review prompts before sending them to external providers.
