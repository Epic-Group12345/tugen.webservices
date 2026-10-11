import React, { useState } from 'react';
import { Button, Text, setTheme, type WebTheme } from '@tugen/uikit/web';
// Разделы витрины — из пакета kit (example/src в tugen.uikit): витрина на сайте та же, что yarn gallery
import * as Sections from '@uikit-gallery/sections';
import { DocsIcon } from './icons';
import { SiteFooter, SiteHeader } from './site';

// Страница UI-kit: короткое вступление, ссылки на документацию и исходники, ниже — все элементы веб-слоя
// живыми примерами. Тему можно переключить, чтобы посмотреть элементы в обеих

const REPO = 'https://github.com/Epic-Group12345/tugen.uikit';

const THEMES: { value: WebTheme; label: string }[] = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

const go = (url: string) => () => {
  window.location.href = url;
};

export const UiKit: React.FC = () => {
  const [theme, setValue] = useState<WebTheme>('system');
  const pick = (next: WebTheme) => {
    setTheme(next);
    setValue(next);
  };
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col items-center px-5">
        <div className="flex w-full max-w-3xl flex-col gap-10 pt-12 pb-10 sm:pt-16">
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-mist-950 sm:text-5xl dark:text-mist-50">
              UI-kit TUGEN
            </h1>
            <Text size="lg" tone="muted">
              Элементы лаунчера для React Native и веба: общие токены, правило
              скругления, те же варианты и размеры. Ниже — веб-слой на React
              DOM, Radix и Tailwind.
            </Text>
            <div className="flex flex-row flex-wrap gap-2">
              <Button icon={DocsIcon} onClick={go('/docs')}>
                Документация
              </Button>
              <Button variant="secondary" onClick={go(REPO)}>
                GitHub
              </Button>
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-center justify-between gap-3">
            <Text as="h2" size="xl" weight="bold">
              Все элементы
            </Text>
            <div className="flex flex-row gap-1" role="group" aria-label="Тема">
              {THEMES.map(t => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={theme === t.value ? 'secondary' : 'ghost'}
                  aria-pressed={theme === t.value}
                  onClick={() => pick(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          {Object.entries(Sections).map(([name, Section]) => (
            <Section key={name} />
          ))}
          <SiteFooter />
        </div>
      </main>
    </>
  );
};
