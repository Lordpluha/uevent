export interface PaymentConfig {
  currencyCode: string
  currencySymbol: string
  platformFeeCents: number
  platformFeeAmount: number
}

interface GetCurrencySymbolOptions {
  currency?: string | null
  paymentConfig?: Pick<PaymentConfig, 'currencyCode' | 'currencySymbol'> | null
}

export const getCurrencySymbol = ({ currency, paymentConfig }: GetCurrencySymbolOptions): string => {
  const normalizedCurrency = currency?.trim()

  if (!normalizedCurrency) {
    return paymentConfig?.currencySymbol ?? ''
  }

  if (normalizedCurrency.length === 1) {
    return normalizedCurrency
  }

  if (paymentConfig && normalizedCurrency.toLowerCase() === paymentConfig.currencyCode.toLowerCase()) {
    return paymentConfig.currencySymbol
  }

  return normalizedCurrency.toUpperCase()
}
