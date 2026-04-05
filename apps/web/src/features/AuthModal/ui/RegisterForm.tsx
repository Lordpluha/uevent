import { usersApi } from '@entities/User'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@shared/api/auth.api'
import { Button, Input, Label } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Divider, FieldError, GoogleButton, SwitchPrompt } from './shared'

const registerUserSchema = z
  .object({
    username: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterUserValues = z.infer<typeof registerUserSchema>

type RegisterDict = {
  subtitle: string
  name: string
  namePlaceholder: string
  email: string
  emailPlaceholder: string
  password: string
  passwordPlaceholder: string
  confirmPassword: string
  confirmPasswordPlaceholder: string
  submit: string
  hasAccount: string
  switchToLogin: string
  continueWithGoogle: string
  orDivider: string
}

export const RegisterForm = ({
  t,
  onSwitch,
  onSuccess,
}: {
  t: RegisterDict
  onSwitch: () => void
  onSuccess: () => void
}) => {
  const { setAuthenticated } = useAuth()
  const { t: appT } = useAppContext()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUserValues>({
    resolver: zodResolver(registerUserSchema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (v: RegisterUserValues) =>
      authApi.registerUser({ username: v.username, email: v.email, password: v.password }),
    onSuccess: (data) => {
      setAuthenticated(data.accountType)
      queryClient.prefetchQuery({ queryKey: ['me'], queryFn: () => usersApi.getMe() })
      toast.success(appT.authExtra.accountCreated)
      onSuccess()
    },
    onError: () => toast.error(appT.authExtra.registerFailed),
  })

  return (
    <form onSubmit={handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
      <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-name">{t.name}</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder={t.namePlaceholder}
          autoComplete="username"
          {...register('username')}
        />
        <FieldError message={errors.username?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email">{t.email}</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password">{t.password}</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder={t.passwordPlaceholder}
          autoComplete="new-password"
          minLength={8}
          {...register('password')}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
        <Input
          id="reg-confirm"
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
      <Divider label={t.orDivider} />
      <GoogleButton label={t.continueWithGoogle} />
      <SwitchPrompt text={t.hasAccount} action={t.switchToLogin} onAction={onSwitch} />
    </form>
  )
}
