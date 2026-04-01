export const DEFAULT_PAYMENT_CURRENCY_CODE = import.meta.env.VITE_PAYMENT_CURRENCY ?? 'usd';
export const DEFAULT_PAYMENT_CURRENCY_SYMBOL = import.meta.env.VITE_PAYMENT_CURRENCY_SYMBOL ?? '$';
export const DEMO_PAYMENT_ORDER_ID = import.meta.env.VITE_DEMO_ORDER_ID ?? 'DEMO-0001';

export const PROMO_CODE_DISCOUNTS: Record<string, number> = {
  UEVENT15: 15,
  UEVENT20: 20,
  UEVENT10: 10,
  SUMMER25: 25,
  EARLY30: 30,
};

export const PROMO_CODE_EXAMPLES = [
  { code: 'UEVENT15', discount: 15 },
  { code: 'SUMMER25', discount: 25 },
] as const;

export const getCurrencySymbol = (currency?: string | null): string => {
  const normalizedCurrency = currency?.trim();

  if (!normalizedCurrency) {
    return DEFAULT_PAYMENT_CURRENCY_SYMBOL;
  }

  if (normalizedCurrency.length === 1) {
    return normalizedCurrency;
  }

  return normalizedCurrency.toLowerCase() === DEFAULT_PAYMENT_CURRENCY_CODE
    ? DEFAULT_PAYMENT_CURRENCY_SYMBOL
    : normalizedCurrency.toUpperCase();
};