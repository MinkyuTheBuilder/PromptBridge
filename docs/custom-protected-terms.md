# Custom Protected Terms

PromptBridge can protect user-defined exact terms before translation.

## Use Cases

- product names
- internal project names
- API names
- brand terms
- domain-specific words that translation providers should not rewrite

## Input Format

Add terms in Settings under Custom protected terms. Use one term per line or comma-separated values.

```text
PromptBridge
SalesOps API
Project Athena
```

## Behavior

- Terms are matched exactly and case-sensitively.
- Longer terms are protected before shorter terms.
- Custom terms are restored after provider translation.
- Built-in protections for code blocks, inline code, commands, paths, and URLs still take priority.
- The Protection Rules view shows custom matches as Custom term.

## Storage

Custom protected terms are saved locally and included in settings backups.
