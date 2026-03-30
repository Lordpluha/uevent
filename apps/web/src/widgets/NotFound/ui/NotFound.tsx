import { useNavigate } from 'react-router';
import { useAppContext } from '@shared/lib';

export const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useAppContext();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      {/* Glowing number */}
      <div className="relative select-none">
        <span className="pointer-events-none absolute inset-0 text-[10rem] font-black leading-none text-primary opacity-20 blur-3xl">
          404
        </span>
        <span className="relative text-[8rem] font-black leading-none tracking-tighter text-foreground/10 sm:text-[10rem]">
          404
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{t.errors.pageNotFound}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t.errors.pageNotFoundDesc}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t.common.goBack}
        </button>
        <a
          href="/"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t.common.home}
        </a>
      </div>
    </div>
  );
};
