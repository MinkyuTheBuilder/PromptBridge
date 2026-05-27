# Provider Connection Test

PromptBridge includes a manual provider test in Engine Settings.

## Purpose

BYOK users need a quick way to verify that the selected provider, key, endpoint, and model are usable before translating a real prompt.

## Behavior

- The test runs only when the user clicks **Test provider**.
- Missing required settings are shown before any provider call.
- In the Tauri app, the test sends a short sample text to the selected provider.
- Browser preview does not call native provider APIs and only confirms that settings look complete.
- Test calls are not saved to translation history.

## Cost Note

The test uses a small provider request. Depending on the selected provider and account, that request may count toward usage or billing.
