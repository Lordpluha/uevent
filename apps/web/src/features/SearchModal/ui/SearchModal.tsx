import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarDays, Search, Users } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@shared/components';
import { useAppContext } from '@shared/lib';
import { MOCK_EVENTS, MOCK_ORGS } from '@shared/mocks';

const SEARCH_EVENTS = MOCK_EVENTS.map((e) => ({
  id: e.id,
  title: e.title,
  href: `/events/${e.id}`,
}));

/* ──────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ──────────────────────────────────────────────────────────── */

type Props = {
  /** 'pill'  – rounded-full trigger button (desktop header)
   *  'block' – full-width rounded-md trigger button (mobile menu) */
  variant?: 'pill' | 'block';
};

export const SearchModal = ({ variant = 'pill' }: Props) => {
  const { t } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Ctrl+K / ⌘+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const triggerClassName =
    variant === 'block'
      ? 'inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent'
      : 'inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent';

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
        {t.header.actions.searchEvents}
        {variant === 'pill' && (
          <kbd className="ml-2 hidden select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title={t.header.actions.searchEvents}>
        <Command>
          <CommandInput placeholder={t.header.search.placeholder} autoFocus />
          <CommandList>
            <CommandEmpty>{t.header.search.empty}</CommandEmpty>

            <CommandGroup heading={t.header.search.groups.events}>
              {SEARCH_EVENTS.map((event) => (
                <CommandItem key={event.id} value={event.title} onSelect={() => handleSelect(event.href)}>
                  <CalendarDays className="text-muted-foreground" />
                  {event.title}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading={t.header.search.groups.organizations}>
              {MOCK_ORGS.map((org) => (
                <CommandItem key={org.id} value={org.title} onSelect={() => handleSelect(org.href)}>
                  <Users className="text-muted-foreground" />
                  {org.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
