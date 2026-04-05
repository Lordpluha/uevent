import { usersApi } from '@entities/User'
import { authApi } from '@shared/api'
import { Button, Dialog, DialogContent, InputOTP, InputOTPGroup, InputOTPSlot } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function GoogleAuthHandler() {
  const { t } = useAppContext()
  const { setAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    if (auth === 'google') {
      setAuthenticated('user')
      params.delete('auth')
      const clean = params.toString()
      const newUrl = window.location.pathname + (clean ? `?${clean}` : '')
      window.history.replaceState({}, '', newUrl)
    } else if (auth === 'google_2fa') {
      const token = params.get('tempToken')
      if (token) {
        setTempToken(token)
        params.delete('auth')
        params.delete('tempToken')
        const clean = params.toString()
        const newUrl = window.location.pathname + (clean ? `?${clean}` : '')
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [setAuthenticated])

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.verify2fa(tempToken as string, code),
    onSuccess: (data) => {
      setAuthenticated(data.accountType)
      queryClient.prefetchQuery({ queryKey: ['me'], queryFn: () => usersApi.getMe() })
      toast.success(t?.authExtra?.loginSuccess ?? 'Logged in successfully')
      setTempToken(null)
      setCode('')
    },
    onError: () => {
      toast.error(t?.authExtra?.invalid2fa ?? 'Invalid 2FA code')
      setCode('')
    },
  })

  if (!tempToken) return null

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) {
          setTempToken(null)
          setCode('')
        }
      }}
    >
      <DialogContent className="w-full max-w-sm rounded-2xl p-8">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t?.authExtra?.twoFaTitle ?? 'Two-factor authentication'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t?.authExtra?.twoFaDesc ?? 'Enter the 6-digit code from your authenticator app.'}
            </p>
          </div>
          <InputOTP maxLength={6} value={code} onChange={setCode} onComplete={() => mutate()}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button onClick={() => mutate()} className="w-full" disabled={isPending || code.length !== 6}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (t?.authExtra?.verify ?? 'Verify')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
