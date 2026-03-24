import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@shared/components';
import { toast } from 'sonner';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get('paymentIntentId');

  useEffect(() => {
    
    if(!paymentIntentId) {
      toast.error('Invalid success link');
      navigate('/');
    }
  }, [paymentIntentId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your ticket has been successfully purchased. You can now access your ticket details.
        </p>

        {/* Details Card */}
        <div className="mb-8 p-4 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground mb-1">Payment Intent ID</div>
          <code className="block text-xs bg-muted p-2 rounded mb-2 break-all font-mono">
            {paymentIntentId}
          </code>
          <p className="text-xs text-muted-foreground">
            Keep this for your records. A confirmation email has been sent.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/profile')}
            className="w-full"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            View My Tickets
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
            className="w-full"
          >
            Browse More Events
          </Button>
        </div>
      </div>
    </div>
  );
}