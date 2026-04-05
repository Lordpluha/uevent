import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  Switch,
} from '@shared/components'
import { useAppContext } from '@shared/lib'
import { Eye, EyeOff, Save, Shield, ShieldCheck } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

export function PasswordChangeForm() {
  const { t } = useAppContext()
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const setPass = (field: keyof typeof passwordForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleShow = (field: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!passwordForm.current) errs.current = t.profileEdit.currentPasswordRequired
    if (passwordForm.next.length < 8) errs.next = t.profileEdit.passwordMinChars
    if (passwordForm.next !== passwordForm.confirm) errs.confirm = t.profileEdit.passwordMismatch
    setPasswordErrors(errs)
    if (Object.keys(errs).length === 0) {
      toast.info(t.profileEdit.passwordNotAvailable)
      setPasswordForm({ current: '', next: '', confirm: '' })
    }
  }

  const passwordField = (id: string, label: string, field: 'current' | 'next' | 'confirm', placeholder: string) => (
    <Field data-invalid={!!passwordErrors[field] || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={showPassword[field] ? 'text' : 'password'}
          value={passwordForm[field]}
          onChange={setPass(field)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => toggleShow(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={t.profileEdit.togglePasswordVisibility}
        >
          {showPassword[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError errors={passwordErrors[field] ? [{ message: passwordErrors[field] }] : []} />
    </Field>
  )

  return (
    <section id="password">
      <h2 className="mb-1 text-base font-semibold">{t.profileEdit.security}</h2>
      <p className="mb-6 text-xs text-muted-foreground">{t.profileEdit.securityDesc}</p>

      <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle className="gap-1.5">
              {twoFaEnabled ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              {t.profileEdit.twoFa}
            </FieldTitle>
            <FieldDescription className="mt-0.5">
              {twoFaEnabled ? t.profileEdit.twoFaEnabledDesc : t.profileEdit.twoFaDisabledDesc}
            </FieldDescription>
          </div>
          <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} aria-label={t.profileEdit.toggleTwoFa} />
        </Field>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <FieldGroup>
          {passwordField(
            'current-password',
            t.profileEdit.currentPassword,
            'current',
            t.profileEdit.currentPasswordPlaceholder,
          )}
          <FieldSeparator />
          {passwordField('new-password', t.profileEdit.newPassword, 'next', t.profileEdit.newPasswordPlaceholder)}
          {passwordField(
            'confirm-password',
            t.profileEdit.confirmPassword,
            'confirm',
            t.profileEdit.confirmPasswordPlaceholder,
          )}
        </FieldGroup>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {t.profileEdit.updatePassword}
          </Button>
        </div>
      </form>
    </section>
  )
}
