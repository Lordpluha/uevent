import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '@shared/lib';

type Props = {
  /** 'pill'  – compact rounded button (desktop header)
   *  'block' – full-width rounded-md button (mobile menu) */
  variant?: 'pill' | 'block';
};

export const ThemeSwitcher = ({ variant = 'pill' }: Props) => {
  const { isLightTheme, applyTheme, t } = useAppContext();

  const label = isLightTheme ? t.header.actions.darkTheme : t.header.actions.lightTheme;
  const icon = isLightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  if (variant === 'block') {
    return (
      <button
        type="button"
        onClick={() => applyTheme(!isLightTheme)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => applyTheme(!isLightTheme)}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      {icon}
      {isLightTheme ? t.header.actions.dark : t.header.actions.light}
    </button>
  );
};
