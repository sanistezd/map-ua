import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LocaleSwitcher } from '@/features/switch-locale';
import { ThemeToggle } from '@/features/toggle-theme';
import { UpgradeBanner } from '@/shared/ui';
import { ArchitectureSchematic } from '@/widgets/architecture-schematic';
import { IntegrationTestsPanel } from '@/widgets/integration-tests';
import { UsersDashboard } from '@/widgets/users-dashboard';

const STACK = [
  'Next.js 16',
  'NestJS 11',
  'Drizzle ORM',
  'PostgreSQL',
  'Tailwind CSS 4',
  'Turborepo',
];

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <main>
      <div className="mb-12 flex items-center justify-between">
        <span className="font-mono text-xs tracking-wide text-graphite uppercase">
          {t('wordmark')}
        </span>
        <div className="flex gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <header>
        <span className="eyebrow">{t('eyebrow')}</span>
        <h1>{t('title')}</h1>
        <p className="lede">{t('description')}</p>
      </header>

      <div className="mt-8">
        <UpgradeBanner />
      </div>

      <div className="mt-10">
        <ArchitectureSchematic />
      </div>

      <div className="mt-6">
        <UsersDashboard />
      </div>

      <div className="mt-6">
        <IntegrationTestsPanel />
      </div>

      <footer className="mt-16 border-t border-border pt-6">
        <div className="mb-3 font-mono text-xs tracking-wide text-graphite uppercase">
          {t('stackLabel')}
        </div>
        <ul className="flex flex-wrap gap-2">
          {STACK.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border px-3 py-1 font-mono text-xs text-graphite"
            >
              {item}
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
