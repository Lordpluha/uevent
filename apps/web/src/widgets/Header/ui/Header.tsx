import { LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import { useMe } from '@entities/User';
import { useMyOrg } from '@entities/Organization';
import { AuthModal } from '@features/AuthModal';
import { LocaleSwitcher } from '@features/LocaleSwitcher';
import { ThemeSwitcher } from '@features/ThemeSwitcher';
import { SearchModal } from '@features/SearchModal';
import { NotificationsBell } from './NotificationsBell';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useAppContext();
  const { isAuthenticated, accountType, logout } = useAuth();
  const { data: me } = useMe();
  const { data: myOrg } = useMyOrg();
  const currentAccount = accountType === 'organization' ? myOrg : me;
  const displayName = accountType === 'organization' ? myOrg?.title : me?.name;
  const displayAvatar = currentAccount?.avatarUrl;

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    try {
      if (accountType === 'organization') await authApi.logoutOrg();
      else await authApi.logoutUser();
    } catch {
      // ignore — token may be expired; logout locally regardless
    }
    logout();
  };

  const navigationLinks = [
    { label: t.header.nav.events, href: '/events' },
    { label: t.header.nav.organizations, href: '/organizations' },
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
          {isAuthenticated && <NotificationsBell enabled />}
          {isAuthenticated && currentAccount ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full transition-opacity hover:opacity-80 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback>{displayName?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link to={accountType === 'organization' ? `/organizations/${myOrg?.id}` : '/profile'} />}>
                  <User className="h-4 w-4" />
                  {displayName}
                </DropdownMenuItem>
                {accountType === 'user' && (
                  <DropdownMenuItem render={<Link to="/profile/settings" />}>
                    <Settings className="h-4 w-4" />
                    {t.header.actions.profileSettings}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  variant="destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t.header.actions.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthModal variant="pill" />
          )}
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
              {isAuthenticated && (
                <div className="self-start">
                  <NotificationsBell enabled />
                </div>
              )}
              {isAuthenticated && currentAccount && (
                <>
                  <Link
                    to={accountType === 'organization' ? `/organizations/${myOrg?.id}` : '/profile'}
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={displayAvatar} alt={displayName} />
                      <AvatarFallback>{displayName?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                    </Avatar>
                    {displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { closeMenu(); handleLogout(); }}
                    className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-3 text-base font-medium text-destructive transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.header.actions.logout}
                  </button>
                </>
              )}
              {!isAuthenticated && <AuthModal variant="block" />}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
