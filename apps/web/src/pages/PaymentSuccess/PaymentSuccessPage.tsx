import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components';
import { api } from '@shared/api';
import { getCurrencySymbol } from '@shared/config/payment';
import { useAppContext } from '@shared/lib';
import { toast } from 'sonner';

interface PaymentStatus {
  status: string;
  amount: number;
  currency: string;
}

export function PaymentSuccessPage() {
  const { t } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get('paymentIntentId');

  const { data: payment, isLoading, isError } = useQuery<PaymentStatus>({
    queryKey: ['payment-status', paymentIntentId],
    queryFn: async () => {
      const res = await api.get<PaymentStatus>(`/payments/${paymentIntentId}`);
      return res.data;
    },
    enabled: !!paymentIntentId,
    retry: 3,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeeded' || status === 'canceled') return false;
      return 3000;
    },
  });

  useEffect(() => {
    if(!paymentIntentId) {
      toast.error(t.paymentSuccess.invalidLink);
      navigate('/');
    }
  }, [paymentIntentId, navigate, t.paymentSuccess.invalidLink]);

  const isConfirmed = payment?.status === 'succeeded';
  const isProcessing = isLoading || payment?.status === 'processing';
  const isFailed = isError || payment?.status === 'canceled';

  const currencySymbol = getCurrencySymbol(payment?.currency);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Status Icon */}
        <div className="mb-6">
          {isProcessing ? (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : isFailed ? (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>

        {/* Title */}
        {isProcessing ? (
          <>
            <h1 className="text-3xl font-bold mb-2">{t.paymentSuccess.confirming}</h1>
            <p className="text-muted-foreground mb-6">
              {t.paymentSuccess.confirmingDesc}
            </p>
          </>
        ) : isFailed ? (
          <>
            <h1 className="text-3xl font-bold mb-2">{t.paymentSuccess.failed}</h1>
            <p className="text-muted-foreground mb-6">
              {t.paymentSuccess.failedDesc}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">{t.paymentSuccess.success}</h1>
            <p className="text-muted-foreground mb-6">
              {t.paymentSuccess.successDesc}
            </p>
          </>
        )}

        {/* Details Card */}
        <div className="mb-8 p-4 bg-card rounded-lg border border-border">
          {isConfirmed && payment && (
            <div className="mb-3 flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
              <span>{currencySymbol}{payment.amount.toFixed(2)}</span>
              <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400">{t.paymentSuccess.paid}</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground mb-1">{t.paymentSuccess.paymentIntentId}</div>
          <code className="block text-xs bg-muted p-2 rounded mb-2 break-all font-mono">
            {paymentIntentId}
          </code>
          {isConfirmed && (
            <p className="text-xs text-muted-foreground">
              {t.paymentSuccess.keepRecords}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/profile')}
            className="w-full"
            disabled={isProcessing}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {t.paymentSuccess.viewTickets}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
            className="w-full"
          >
            {t.paymentSuccess.browseMore}
          </Button>
        </div>
      </div>
    </div>
  );
}