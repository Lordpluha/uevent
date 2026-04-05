import { useAppContext } from '@shared/lib'
import { useNavigate } from 'react-router'

type Props = {
  status?: number | null
  message?: string
  stack?: string
}

export const ErrorBoundary = ({ status, message, stack }: Props) => {
  const navigate = useNavigate()
  const { t } = useAppContext()
  const displayMessage = message ?? t?.errors?.unexpectedError ?? 'An unexpected error occurred.'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      {/* Icon */}
      <div className="flex size-20 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-9 text-destructive"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 9v4m0 4h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {status
            ? (t?.errors?.error ?? 'Error {{status}}').replace('{{status}}', String(status))
            : (t?.errors?.somethingWrong ?? 'Something went wrong')}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{displayMessage}</p>
      </div>

      {stack && (
        <details className="w-full max-w-2xl rounded-xl border border-border bg-muted/40 text-left">
          <summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            {t?.errors?.stackTrace ?? 'Stack trace'}
          </summary>
          <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-muted-foreground">
            <code>{stack}</code>
          </pre>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t?.common?.goBack ?? 'Go back'}
        </button>
        <a
          href="/"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t?.common?.home ?? 'Home'}
        </a>
      </div>
    </div>
  )
}
