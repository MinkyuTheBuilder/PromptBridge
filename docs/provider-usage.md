# Provider Usage

PromptBridge keeps a local monthly usage estimate for each translation provider.

## What It Tracks

- successful provider requests
- source characters sent to the provider
- result characters returned by the provider
- current calendar month in `YYYY-MM` format

Provider connection tests are counted because they call the selected provider in the desktop app.

## What It Does Not Track

- provider-side billing adjustments
- token-level LLM usage
- taxes, minimum charges, or plan credits
- browser preview output, because no native provider API call is made

## Reset

The Settings modal can reset the current month estimate. Resetting usage does not affect provider credentials, translation history, or the provider's real billing dashboard.

## Alert Threshold

The Settings modal can set a monthly sent-character alert threshold. Set the threshold to `0` to disable alerts.

When a provider reaches the threshold, PromptBridge highlights the provider usage card and warns before sending more text through that provider. Alerts do not block translation and do not change provider-side billing limits.

## Privacy Note

Usage totals are stored locally with `tauri-plugin-store`, with `localStorage` fallback for browser preview. Prompt text is not stored in the usage meter.
