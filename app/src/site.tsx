import React, { useState } from 'react';
import {
  Divider,
  IconButton,
  PRESSABLE,
  Sheet,
  SheetContent,
  SheetTitle,
  Text,
  cx,
} from '@tugen/uikit/web';
import { MenuIcon } from './icons';

// Каркас страниц сайта: шапка с разделами «Для бизнеса», «Для разработчиков», «Для издателей» и подвал.
// Страницы — обычные адреса (/developers); бэкенд отдаёт на них тот же index.html, переходы — полной загрузкой

/** Профиль разработчика в Discord: связь с лендинга и из разделов-заглушек */
export const DEVELOPER = 'https://discordapp.com/users/884652865187115038';

export interface NavItem {
  path: string;
  label: string;
  /** Страницы внутри раздела: на них пункт тоже подсвечен */
  children?: string[];
}

export const NAV: NavItem[] = [
  { path: '/business', label: 'Для бизнеса' },
  {
    path: '/developers',
    label: 'Для разработчиков',
    children: ['/uikit', '/docs'],
  },
  { path: '/publishers', label: 'Для издателей' },
];

/** Адрес страницы без хвостового слеша: «/docs/» и «/docs» — одно и то же */
export const currentPath = () =>
  window.location.pathname.replace(/\/+$/, '') || '/';

const isActive = (item: NavItem, path: string) =>
  item.path === path || !!item.children?.includes(path);

// Пункт меню — ссылка, а не кнопка: страница открывается по адресу, работает «открыть в новой вкладке»
const LINK = cx(
  PRESSABLE,
  'rounded-lg px-3 py-1.5 text-sm whitespace-nowrap hover:bg-mist-950/5 active:bg-mist-950/10 dark:hover:bg-mist-50/5 dark:active:bg-mist-50/10',
);
const LINK_ACTIVE = 'font-medium text-blue-700 dark:text-blue-300';
const LINK_IDLE = 'text-mist-700 dark:text-mist-300';

const NavLinks: React.FC<{ path: string; column?: boolean }> = ({
  path,
  column,
}) => (
  <ul className={cx('flex gap-1', column ? 'flex-col' : 'flex-row')}>
    {NAV.map(item => {
      const active = isActive(item, path);
      return (
        <li key={item.path} className="flex flex-col">
          <a
            href={item.path}
            aria-current={item.path === path ? 'page' : undefined}
            className={cx(
              LINK,
              column && 'justify-start',
              active ? LINK_ACTIVE : LINK_IDLE,
            )}
          >
            {item.label}
          </a>
        </li>
      );
    })}
  </ul>
);

/**
 * Шапка сайта. На широком экране разделы — в ряд, на узком — в боковой панели по кнопке меню.
 * Для документации — docs: не прилипает (прилипает её собственная шапка под этой) и выровнена
 * по её ширине и отступам
 */
export const SiteHeader: React.FC<{ docs?: boolean }> = ({ docs = false }) => {
  const path = currentPath();
  const [menu, setMenu] = useState(false);
  return (
    <header
      className={cx(
        'z-30 border-b border-mist-200 bg-mist-50/90 backdrop-blur dark:border-mist-800 dark:bg-mist-950/90',
        !docs && 'sticky top-0 px-5',
      )}
    >
      <div
        className={cx(
          'mx-auto flex h-14 flex-row items-center gap-4',
          docs ? 'max-w-7xl px-4' : 'max-w-6xl',
        )}
      >
        <a
          href="/"
          className="rounded-sm text-base font-bold tracking-widest text-mist-950 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-mist-50"
        >
          TUGEN
        </a>
        <div className="flex-1" />
        <nav aria-label="Разделы сайта" className="hidden md:flex">
          <NavLinks path={path} />
        </nav>
        <div className="md:hidden">
          <IconButton
            icon={MenuIcon}
            aria-label="Разделы сайта"
            onClick={() => setMenu(true)}
          />
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="right" className="w-72">
          <SheetTitle>Разделы</SheetTitle>
          <nav aria-label="Разделы сайта" className="mt-4 flex flex-col">
            <NavLinks path={path} column />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export const SiteFooter: React.FC = () => (
  <footer className="flex flex-col gap-4">
    <Divider />
    <Text size="xs" tone="muted">
      © 2026 TUGEN. Не является официальным продуктом Minecraft и не связан с
      Mojang или Microsoft.
    </Text>
  </footer>
);

/** Страница сайта: шапка, содержимое по ширине лендинга и подвал */
export const SitePage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <SiteHeader />
    <main className="flex flex-col items-center px-5">
      <div className="flex w-full max-w-6xl flex-col gap-12 pt-12 pb-10 sm:pt-16">
        {children}
        <SiteFooter />
      </div>
    </main>
  </>
);
