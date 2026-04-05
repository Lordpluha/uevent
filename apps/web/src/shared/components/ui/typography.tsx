import { cn } from '@shared/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ElementType, HTMLAttributes } from 'react'

/* ── variants ─────────────────────────────────────────────── */

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      p: 'leading-7',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
      blockquote: 'mt-6 border-l-2 border-border pl-6 italic text-muted-foreground',
      code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    },
  },
  defaultVariants: {
    variant: 'p',
  },
})

/* ── default tag map ──────────────────────────────────────── */

const DEFAULT_TAG: Record<NonNullable<TypographyVariant>, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  lead: 'p',
  large: 'p',
  small: 'small',
  muted: 'p',
  blockquote: 'blockquote',
  code: 'code',
  label: 'span',
}

/* ── types ────────────────────────────────────────────────── */

type TypographyVariant = VariantProps<typeof typographyVariants>['variant']

export type TypographyProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    /** Override the rendered HTML element */
    as?: ElementType
  }

/* ── component ────────────────────────────────────────────── */

export function Typography({ variant = 'p', as, className, ...props }: TypographyProps) {
  const Tag = as ?? DEFAULT_TAG[variant ?? 'p']
  return <Tag className={cn(typographyVariants({ variant }), className)} {...props} />
}
