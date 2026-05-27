import type { ProviderId } from "./translationProviders";

export type ProviderUsagePeriod = {
  period: string;
  requests: number;
  sourceChars: number;
  resultChars: number;
  updatedAt: string;
};

export type ProviderUsageState = Partial<Record<ProviderId, Record<string, ProviderUsagePeriod>>>;

export function getCurrentUsagePeriod(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function countCharacters(text: string) {
  return Array.from(text).length;
}

export function getProviderUsage(
  usage: ProviderUsageState,
  providerId: ProviderId,
  period = getCurrentUsagePeriod()
): ProviderUsagePeriod {
  return (
    usage[providerId]?.[period] ?? {
      period,
      requests: 0,
      sourceChars: 0,
      resultChars: 0,
      updatedAt: ""
    }
  );
}

export function addProviderUsage(
  usage: ProviderUsageState,
  providerId: ProviderId,
  sourceText: string,
  resultText: string,
  period = getCurrentUsagePeriod()
): ProviderUsageState {
  const current = getProviderUsage(usage, providerId, period);
  const nextPeriod: ProviderUsagePeriod = {
    period,
    requests: current.requests + 1,
    sourceChars: current.sourceChars + countCharacters(sourceText),
    resultChars: current.resultChars + countCharacters(resultText),
    updatedAt: new Date().toISOString()
  };

  return {
    ...usage,
    [providerId]: {
      ...usage[providerId],
      [period]: nextPeriod
    }
  };
}

export function resetUsagePeriod(
  usage: ProviderUsageState,
  period = getCurrentUsagePeriod()
): ProviderUsageState {
  return Object.fromEntries(
    Object.entries(usage).map(([providerId, periods]) => {
      const nextPeriods = { ...periods };
      delete nextPeriods[period];
      return [providerId, nextPeriods];
    })
  ) as ProviderUsageState;
}

export function isUsageAlertReached(usage: ProviderUsagePeriod, alertThreshold: number) {
  return alertThreshold > 0 && usage.sourceChars >= alertThreshold;
}

export function formatUsageNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
