import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { AuthModal } from '@features/AuthModal';
import { LocaleSwitcher } from '@features/LocaleSwitcher';
import { ThemeSwitcher } from '@features/ThemeSwitcher';
import { SearchModal } from '@features/SearchModal';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { locale, t } = useAppContext();

  const closeMenu = () => setIsMenuOpen(false);

  const navigationLinks = [
    { label: t.header.nav.events, href: '/events' },
    { label: t.header.nav.organizations, href: '/organizations' },
    { label: t.header.nav.tickets, href: '/tickets' },
  ];

  return (
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-lg font-bold tracking-tight text-foreground">
          uevent
        </a>

        <NavigationMenu className="hidden [@media(min-width:768px)]:flex">
          <NavigationMenuList className="gap-2">
            {navigationLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden items-center gap-3 [@media(min-width:768px)]:flex">
          <LocaleSwitcher />
          <ThemeSwitcher variant="pill" />
          <SearchModal variant="pill" />
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t.header.actions.startGroup}
          </button>
          <AuthModal variant="pill" />
        </div>

        <button
          type="button"
          aria-label={t.header.menu.open}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-accent [@media(min-width:768px)]:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 [@media(min-width:768px)]:hidden" aria-hidden={!isMenuOpen}>
          <aside className="absolute inset-0 h-dvh w-full overflow-y-auto bg-background p-6">
            <div className="mb-8 flex items-center justify-between border-b border-border/60 pb-4">
              <span className="text-lg font-bold text-foreground">uevent</span>
              <button
                type="button"
                aria-label={t.header.menu.close}
                onClick={closeMenu}
                className="rounded-md p-2 text-foreground transition-colors hover:bg-accent"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="mb-8 flex flex-col gap-3">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-md border border-border px-3 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              <LocaleSwitcher />
              <ThemeSwitcher variant="block" />
              <SearchModal variant="block" />
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t.header.actions.startGroup}
              </button>
              <AuthModal variant="block" />
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
