import type { ComponentProps } from 'react';

import { useAppContext } from '@shared/lib';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  const { t } = useAppContext();

  return (
    <nav
      role="navigation"
      aria-label={t.pagination.navigation}
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

function PaginationItem({ ...props }: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ComponentProps<typeof Button>, 'size'> &
  ComponentProps<'a'>;

function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a aria-current={isActive ? 'page' : undefined} data-slot="pagination-link" data-active={isActive} {...props} />
      }
    />
  );
}

function PaginationPrevious({
  className,
  text,
  ...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) {
  const { t } = useAppContext();

  return (
    <PaginationLink aria-label={t.pagination.previousPage} size="default" className={cn('pl-2!', className)} {...props}>
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text ?? t.pagination.previous}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text,
  ...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) {
  const { t } = useAppContext();

  return (
    <PaginationLink aria-label={t.pagination.nextPage} size="default" className={cn('pr-2!', className)} {...props}>
      <span className="hidden sm:block">{text ?? t.pagination.next}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  const { t } = useAppContext();

  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-7 items-center justify-center [&_svg:not([class*='size-'])]:size-3.5", className)}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">{t.pagination.morePages}</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
