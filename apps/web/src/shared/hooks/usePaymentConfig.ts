import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/api';
import type { PaymentConfig } from '@shared/config/payment';

export function usePaymentConfig() {
  return useQuery({
    queryKey: ['payment-config'],
    queryFn: async () => {
      const response = await api.get<PaymentConfig>('/payments/config');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
