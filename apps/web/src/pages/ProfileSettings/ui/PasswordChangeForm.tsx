import { usersApi } from '@entities/User'
import { Button, Field, FieldError, FieldGroup, FieldLabel, FieldSeparator, Input } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Save } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

export function PasswordChangeForm() {
  const { t } = useAppContext()
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' })
  const [showPass, setShowPass] = useState({ next: false, confirm: false })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const passwordMutation = useMutation({
    mutationFn: (password: string) => usersApi.updateMe({ password }),
    onSuccess: () => {
      setPasswordForm({ next: '', confirm: '' })
      toast.success(t.profileSettings.password.updated)
    },
    onError: () => toast.error(t.profileSettings.password.updateFailed),
  })

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (passwordForm.next.length < 8) errs.next = t.profileSettings.password.minChars
    if (passwordForm.next !== passwordForm.confirm) errs.confirm = t.profileSettings.password.mismatch
    setPasswordErrors(errs)
    if (Object.keys(errs).length === 0) passwordMutation.mutate(passwordForm.next)
  }

  return (
    <>
      <p className="mb-4 text-sm font-medium">{t.profileSettings.password.title}</p>
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <FieldGroup>
          <Field data-invalid={!!passwordErrors.next || undefined}>
            <FieldLabel htmlFor="new-password">{t.profileSettings.password.newPassword}</FieldLabel>
            <div className="relative">
              <Input
                id="new-password"
                type={showPass.next ? 'text' : 'password'}
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                placeholder={t.profileSettings.password.newPasswordPlaceholder}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, next: !p.next }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={t.profileSettings.password.togglePasswordVisibility}
              >
                {showPass.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError errors={passwordErrors.next ? [{ message: passwordErrors.next }] : []} />
          </Field>

          <FieldSeparator />

          <Field data-invalid={!!passwordErrors.confirm || undefined}>
            <FieldLabel htmlFor="confirm-password">{t.profileSettings.password.confirmPassword}</FieldLabel>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPass.confirm ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder={t.profileSettings.password.confirmPlaceholder}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={t.profileSettings.password.togglePasswordVisibility}
              >
                {showPass.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError errors={passwordErrors.confirm ? [{ message: passwordErrors.confirm }] : []} />
          </Field>
        </FieldGroup>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="gap-1.5" disabled={passwordMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            {passwordMutation.isPending ? t.common.updating : t.profileSettings.password.updatePassword}
          </Button>
        </div>
      </form>
    </>
  )
}
