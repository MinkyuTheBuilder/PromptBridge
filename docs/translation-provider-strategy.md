# Translation Provider Strategy

## Decision

PromptBridge must not depend on DeepL as a free default engine. Translation is a replaceable provider layer, and beta users should bring their own API key.

## MVP Provider Policy

- Development/testing: use DeepL credits carefully.
- Beta usage: BYOK only.
- Product direction: charge for PromptBridge workflow value, not bundled translation usage.

## Provider Registry

Current provider candidates:

- DeepL API
- Google Cloud Translate
- Microsoft Translator
- OpenAI / low-cost LLM chat completions
- Gemini
- LibreTranslate
- Local OpenAI-compatible model/server
- Custom API key

The frontend registry lives in `src/translationProviders.ts`.

## Implementation Notes

- Coding-sensitive spans are protected before provider calls and restored after translation.
- UI stores per-provider settings with `tauri-plugin-store`, with `localStorage` fallback for browser preview.
- `translate_prompt` receives `providerId`, `apiKey`, `endpoint`, and `model`.
- DeepL, Google Cloud Translate, Microsoft Translator, OpenAI / low-cost LLM, Gemini, LibreTranslate, Local translation model, and Custom API key are wired as selectable providers.
- Gemini uses Google's OpenAI-compatible Chat Completions endpoint, not the Google Cloud Translation API endpoint.
- Local translation model uses an OpenAI-compatible Chat Completions endpoint. API token is optional for local servers that do not require auth.
- Provider settings are validated in `src/translationProviders.ts` before the app attempts a real Tauri translation request.
- The UI surfaces missing settings such as API key, endpoint, model, or planned connector status.
- PromptBridge does not assume Korean as the source language. Provider calls target English and let the provider or LLM infer the input language.

## Business Model Guardrail

PromptBridge should monetize:

- coding prompt optimization
- code, command, path, and URL protection
- input/output overlay workflows
- custom profiles
- history and search
- multi-agent support
- team policy controls

PromptBridge should avoid absorbing user translation volume costs unless a future paid plan explicitly prices that usage.
