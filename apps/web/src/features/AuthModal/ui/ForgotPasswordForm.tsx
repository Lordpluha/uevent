import { authApi } from '@shared/api/auth.api'
import { Button, Input, Label } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const ForgotPasswordForm = ({
  onCodeSent,
  onBack,
}: {
  onCodeSent: (email: string) => void
  onBack: () => void
}) => {
  const [email, setEmail] = useState('')
  const { t } = useAppContext()

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success(t.authExtra.resetCodeSent)
      onCodeSent(email)
    },
    onError: () => toast.error(t.authExtra.resetCodeFailed),
  })

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t.authExtra.backToLogin}
      </button>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.authExtra.forgotTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.authExtra.forgotDesc}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">{t.authExtra.email}</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder={t.authExtra.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <Button onClick={() => mutate()} className="w-full" disabled={isPending || !email}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.authExtra.sendResetCode}
      </Button>
    </div>
  )
}
