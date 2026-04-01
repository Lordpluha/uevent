import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { toast } from 'sonner';

export function PaymentFailedPage() {
  const { t } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get('paymentIntentId');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if(!paymentIntentId) {
      toast.error(t.paymentFailed.invalidLink);
      navigate('/');
    }
  }, [paymentIntentId, navigate, t.paymentFailed.invalidLink]);

  const handleRetry = () => {
    localStorage.removeItem('pendingPayment');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Failed */}
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">{t.paymentFailed.title}</h1>
        <p className="text-muted-foreground mb-6">
          {t.paymentFailed.description}
        </p>

        {/* Error Details */}
        {reason && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>{t.paymentFailed.reason}</strong> {reason}
            </p>
          </div>
        )}

        {/* Details Card */}
        <div className="mb-8 p-4 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground mb-1">{t.paymentFailed.paymentIntentId}</div>
          <code className="block text-xs bg-muted p-2 rounded mb-2 break-all font-mono">
            {paymentIntentId}
          </code>
          <p className="text-xs text-muted-foreground">
            {t.paymentFailed.keepRecords}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.paymentFailed.tryAgain}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.paymentFailed.backToEvents}
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            {t.paymentFailed.helpText}
          </p>
        </div>
      </div>
    </div>
  );
}