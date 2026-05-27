import { describe, expect, it } from "vitest";
import {
  addProviderUsage,
  getCurrentUsagePeriod,
  getProviderUsage,
  isUsageAlertReached,
  resetUsagePeriod
} from "./providerUsage";

describe("provider usage", () => {
  it("creates monthly usage periods", () => {
    expect(getCurrentUsagePeriod(new Date("2026-05-27T12:00:00Z"))).toBe("2026-05");
  });

  it("tracks requests and character counts by provider", () => {
    const usage = addProviderUsage({}, "deepl", "안녕 `src/App.tsx`", "Hello `src/App.tsx`", "2026-05");
    const nextUsage = addProviderUsage(usage, "deepl", "Fix bug", "Fix bug", "2026-05");

    expect(getProviderUsage(nextUsage, "deepl", "2026-05")).toMatchObject({
      period: "2026-05",
      requests: 2,
      sourceChars: 23,
      resultChars: 26
    });
    expect(getProviderUsage(nextUsage, "google", "2026-05")).toMatchObject({
      requests: 0,
      sourceChars: 0,
      resultChars: 0
    });
  });

  it("resets only the requested period", () => {
    const usage = addProviderUsage(
      addProviderUsage({}, "google", "one", "two", "2026-05"),
      "google",
      "three",
      "four",
      "2026-06"
    );

    const reset = resetUsagePeriod(usage, "2026-05");

    expect(getProviderUsage(reset, "google", "2026-05").requests).toBe(0);
    expect(getProviderUsage(reset, "google", "2026-06").requests).toBe(1);
  });

  it("reports when a sent-character alert threshold is reached", () => {
    const usage = getProviderUsage(
      addProviderUsage({}, "microsoft", "12345", "result", "2026-05"),
      "microsoft",
      "2026-05"
    );

    expect(isUsageAlertReached(usage, 5)).toBe(true);
    expect(isUsageAlertReached(usage, 6)).toBe(false);
    expect(isUsageAlertReached(usage, 0)).toBe(false);
  });
});
