# Prompt Profiles

Prompt profiles are the v1.2 prompt-optimization layer.

## Purpose

PromptBridge first translates the user's source request into English. A prompt profile can then append focused coding-agent guidance to the translated prompt.

This keeps translation provider choice independent from prompt optimization. DeepL, Google Translate, Microsoft Translator, LibreTranslate, OpenAI-compatible APIs, local models, and custom endpoints all produce the base English prompt; PromptBridge applies the selected profile afterward.

## Profiles

- Direct translation: no extra instructions.
- Bug fix: root cause, narrow fix, regression tests.
- Refactor: preserve behavior, avoid broad rewrites, call out cross-module risk.
- Code review: prioritize bugs, regressions, security, and tests.
- Tests: add focused coverage for behavior, edge cases, and failure paths.
- Docs: produce clear user-facing documentation and examples.
- Custom: append a user-authored reusable instruction block.

## Storage

The selected profile and custom profile text are saved with `tauri-plugin-store`, with `localStorage` fallback for browser preview.

## Guardrail

Profiles should not rewrite or paraphrase protected code-like spans. Protection still happens before translation, and the profile text is appended after protected tokens are restored.

## Custom Profile

The Custom profile is a single saved instruction block. It is intended for personal coding-agent preferences such as:

- response format
- required verification commands
- risk notes
- file summary expectations
- team conventions

If the Custom profile is selected with no custom instructions, PromptBridge leaves the translated prompt unchanged.
