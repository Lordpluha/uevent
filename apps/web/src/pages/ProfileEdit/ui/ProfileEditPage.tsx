import { useMe } from '@entities/User'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, Separator } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { PasswordChangeForm } from './PasswordChangeForm'
import { ProfileEditForm } from './ProfileEditForm'

export function ProfileEditPage() {
  const { t } = useAppContext()
  const { data: user, isLoading, isError } = useMe()

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.profileEdit.loading}</p>
      </main>
    )
  }

  if (isError || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.profileEdit.loadFailed}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className="text-sm text-primary hover:underline">
              {t.common.backToHome}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.common.backToProfile}
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">{t.profileEdit.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t.profileEdit.subtitle}</p>

      <ProfileEditForm user={user} />

      <Separator className="my-8" />

      <PasswordChangeForm />
    </main>
  )
}
