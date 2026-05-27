# Translation History

PromptBridge keeps a local translation history for recent input and output translation work.

## Scope

- Stores recent prompt translations and output translations.
- Keeps the newest items first.
- Caps history at 50 items.
- Saves locally with `tauri-plugin-store`, with `localStorage` fallback for browser preview.
- Can be disabled from Settings with Save local history.
- Can automatically prune entries older than 7, 30, or 90 days.
- Does not sync, upload, or share history.

## Search

History search matches:

- source text
- translated result
- provider
- prompt profile
- target language
- history kind

## Restore

Restoring a prompt history item opens the Input Translate view and restores the source, English prompt, and prompt profile.

Restoring an output history item opens the Output Translate view and restores the English agent output, localized result, and output language.

## Delete

Users can delete individual history items from the History view, or clear the full local history.

## Retention

History retention can be set to Keep until I delete, Keep 7 days, Keep 30 days, or Keep 90 days. PromptBridge prunes old local entries when it loads history or records a new translation.

## Privacy Note

History may contain sensitive prompts or translated output. Users can turn off Save local history from Settings to prevent new entries, set a retention window, delete individual entries, or clear existing local history from the History view.
