import { useAppContext } from '@shared/lib';

export const Footer = () => {
  const { t } = useAppContext();

  const footerSections = [
    t.footer.sections.account,
    t.footer.sections.discover,
    t.footer.sections.about,
    t.footer.sections.organizers,
  ];

  return (
    <footer className="mt-10 border-t border-border/60 bg-card text-card-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">uevent</div>
            <p className="max-w-md text-sm text-muted-foreground">{t.footer.description}</p>
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            {t.footer.createGroup}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="transition-colors hover:text-foreground">
              {t.footer.privacyPolicy}
            </button>
            <button type="button" className="transition-colors hover:text-foreground">
              {t.footer.termsOfUse}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
