# PRODUCT_BLUEPRINT.md — PromptBridge

## Core User

Developers who think and write in a non-English language and want to use AI coding agents (e.g., GitHub Copilot, Cursor, Claude Code) that work best with English prompts.

## Problem

Non-English developers lose precision when manually translating coding requests into English. Generic translators break code blocks, commands, file paths, and technical terms. The friction slows down AI-assisted coding workflows.

## Solution

A floating desktop overlay that accepts a prompt in any human language and returns a clean English prompt safe for AI coding agents — with code, commands, paths, URLs, and custom terms protected from translation.

## MVP Scope (v0.1.0 — shipped)

| Feature | Status |
|---|---|
| Floating overlay with global shortcut | Shipped |
| System tray (open main window, open overlay, quit) | Shipped |
| BYOK translation providers (DeepL, Google Cloud Translate, Microsoft, OpenAI-compatible, Gemini, LibreTranslate, local model, custom API) | Shipped |
| Provider connection test | Shipped |
| Provider usage estimate + alert threshold | Shipped |
| Prompt protection (code, commands, paths, URLs, placeholders) | Shipped |
| Custom protected terms | Shipped |
| Protection Rules preview | Shipped |
| Privacy guards + optional sensitive-send block | Shipped |
| Prompt optimization profiles (Bug Fix, Refactor, Review, Tests, Docs, Custom) | Shipped |
| Output translation (English agent response → reading language) | Shipped |
| Local translation history with search, restore, delete, retention | Shipped |
| Settings backup / import JSON | Shipped |
| Copy output action | Shipped |
| UI language switcher (13 languages, Arabic RTL) | Shipped |
| Configurable overlay shortcut | Shipped |
| Login autostart | Shipped |

## Out of Scope (Later Phase)

- Cloud sync or team-shared settings
- Subscription or payment handling
- Server-side translation processing
- User accounts or authentication
- macOS production signing and notarization (testing only)
- Mobile or web app versions

## Translation Direction

Source: any human language → Target: English (for AI coding agents).
UI language and output reading language are independent settings.

## Business Model

BYOK (Bring Your Own Key). Users supply their own provider credentials. No platform-managed API credits.
