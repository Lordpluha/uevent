import { authApi } from '@shared/api/auth.api'
import { Button, Input, InputOTP, InputOTPGroup, InputOTPSlot, Label } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const ResetPasswordForm = ({
  email,
  onSuccess,
  onBack,
}: {
  email: string
  onSuccess: () => void
  onBack: () => void
}) => {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { t } = useAppContext()

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.resetPassword(email, code, password),
    onSuccess: () => {
      toast.success(t.authExtra.resetSuccess)
      onSuccess()
    },
    onError: () => toast.error(t.authExtra.resetFailed),
  })

  const canSubmit = code.length === 6 && password.length >= 8 && password === confirmPassword

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t.common.back}
      </button>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.authExtra.resetTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.authExtra.resetDesc.replace('{{email}}', email)}</p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Label>{t.authExtra.verificationCode}</Label>
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">{t.authExtra.newPassword}</Label>
        <Input
          id="reset-password"
          type="password"
          placeholder={t.authExtra.newPasswordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm">{t.authExtra.confirmPassword}</Label>
        <Input
          id="reset-confirm"
          type="password"
          placeholder={t.authExtra.confirmPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-destructive">{t.authExtra.passwordsMismatch}</p>
        )}
      </div>
      <Button onClick={() => mutate()} className="w-full" disabled={isPending || !canSubmit}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.authExtra.resetPassword}
      </Button>
    </div>
  )
}
