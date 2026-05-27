# Output Translation

PromptBridge v1.1 work starts with an Output Translate view.

## Purpose

Input Translate turns any source language into an English coding prompt. Output Translate handles the reverse reading workflow: paste an English response from an AI coding agent and translate it into the user's selected output language.

The UI language and output language are separate settings. A user can keep the app UI in English while translating agent output to Korean, Japanese, Spanish, or another supported language.

## Behavior

- Uses the same BYOK translation provider selected in Engine Settings.
- Preserves code blocks, inline code, commands, file paths, URLs, and placeholders before translation.
- Lets the user copy or inject the localized output.
- Persists the selected output language with `tauri-plugin-store`, with `localStorage` fallback in browser preview.

## Provider Target Mapping

- DeepL receives provider-specific uppercase target language codes.
- Google Translate and LibreTranslate receive standard target language codes.
- Microsoft Translator has any existing `to=` query parameter replaced with the selected target language.
- OpenAI-compatible providers receive a system instruction naming the target language.

## Known Limits

Some providers do not support every UI language listed in PromptBridge. In those cases, the provider API will return its own error. The app surfaces that error instead of silently falling back to a different language.
