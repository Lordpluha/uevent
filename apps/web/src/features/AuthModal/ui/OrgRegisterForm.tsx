import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@shared/api/auth.api'
import { Button, Input, Label } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FieldError, SwitchPrompt } from './shared'

const registerOrgSchema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterOrgValues = z.infer<typeof registerOrgSchema>

type OrgRegisterDict = {
  subtitle: string
  orgName: string
  orgNamePlaceholder: string
  email: string
  emailPlaceholder: string
  password: string
  passwordPlaceholder: string
  confirmPassword: string
  confirmPasswordPlaceholder: string
  submit: string
  hasAccount: string
  switchToLogin: string
  orDivider: string
}

export const OrgRegisterForm = ({
  t,
  onSwitch,
  onSuccess,
}: {
  t: OrgRegisterDict
  onSwitch: () => void
  onSuccess: () => void
}) => {
  const { setAuthenticated } = useAuth()
  const { t: appT } = useAppContext()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrgValues>({
    resolver: zodResolver(registerOrgSchema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (v: RegisterOrgValues) => authApi.registerOrg({ name: v.name, email: v.email, password: v.password }),
    onSuccess: (data) => {
      setAuthenticated(data.accountType)
      toast.success(appT.authExtra.orgRegistered)
      onSuccess()
    },
    onError: () => toast.error(appT.authExtra.orgRegisterFailed),
  })

  return (
    <form onSubmit={handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
      <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">{t.orgName}</Label>
        <Input
          id="org-name"
          type="text"
          placeholder={t.orgNamePlaceholder}
          autoComplete="organization"
          {...register('name')}
        />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-reg-email">{t.email}</Label>
        <Input
          id="org-reg-email"
          type="email"
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-reg-password">{t.password}</Label>
        <Input
          id="org-reg-password"
          type="password"
          placeholder={t.passwordPlaceholder}
          autoComplete="new-password"
          minLength={8}
          {...register('password')}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-reg-confirm">{t.confirmPassword}</Label>
        <Input
          id="org-reg-confirm"
          type="password"
          placeholder={t.confirmPasswordPlaceholder}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
      </Button>
      <SwitchPrompt text={t.hasAccount} action={t.switchToLogin} onAction={onSwitch} />
    </form>
  )
}
