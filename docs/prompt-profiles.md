# Prompt Profiles

Prompt profiles are the v1.2 prompt-optimization layer.

## Purpose

PromptBridge first translates the user's source request into English. The default profile then shapes it into a simple, clear prompt for an AI coding agent.

This keeps translation provider choice independent from prompt optimization. DeepL, Google Cloud Translate, Microsoft Translator, LibreTranslate, OpenAI-compatible APIs, Gemini, local models, and custom endpoints all produce the base English prompt; PromptBridge applies the selected profile afterward. LLM-based providers are also instructed during translation to avoid literal translation and return an agent-ready English prompt.

## Profiles

- AI agent prompt: default mode; makes the request actionable, simple, and clear for coding agents.
- Bug fix: root cause, narrow fix, regression tests.
- Refactor: preserve behavior, avoid broad rewrites, call out cross-module risk.
- Code review: prioritize bugs, regressions, security, and tests.
- Tests: add focused coverage for behavior, edge cases, and failure paths.
- Docs: produce clear user-facing documentation and examples.
- Custom: append a user-authored reusable instruction block.

## Storage

The selected profile and custom profile text are saved with `tauri-plugin-store`, with `localStorage` fallback for browser preview.

## Guardrail

Profiles should not rewrite or paraphrase protected code-like spans. Protection still happens before translation, and profile shaping is applied after protected tokens are restored.

## Custom Profile

The Custom profile is a single saved instruction block. It is intended for personal coding-agent preferences such as:

- response format
- required verification commands
- risk notes
- file summary expectations
- team conventions

If the Custom profile is selected with no custom instructions, PromptBridge uses the default AI agent prompt shape.
