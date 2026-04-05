import { useAppContext } from '@shared/lib'
import { cn } from '@shared/lib/utils'
import { Loader2Icon } from 'lucide-react'
import type { ComponentProps } from 'react'

function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  const { t } = useAppContext()
  return (
    <Loader2Icon
      role="status"
      aria-label={t.common.loadingLabel}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
