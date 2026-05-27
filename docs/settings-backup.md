# Settings Backup

PromptBridge can copy and import a JSON backup of user settings from the Settings modal.

## Backup Types

- Copy backup includes provider settings and saved provider API keys.
- Copy without keys includes provider settings but blanks provider API keys.

## Included

- selected translation provider
- provider settings, including API keys
- overlay shortcut
- UI language
- output translation language
- prompt profile
- custom prompt profile text
- custom protected terms
- local history enabled/disabled setting
- local history retention setting
- sensitive-send blocking setting
- local provider usage alert threshold

## Not Included

- local translation history entries
- local provider usage estimates
- app window position
- operating system autostart state

## Privacy Note

Full settings backups can contain provider credentials. Treat full backup JSON like a password file. Use Copy without keys for tickets, chats, public issue reports, or sharing configuration examples.

## Import Behavior

PromptBridge only imports backups with the `promptbridge-settings` format and the supported backup version. Unknown providers and unsupported values are ignored or normalized to safe defaults.
