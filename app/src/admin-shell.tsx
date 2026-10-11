import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  PRESSABLE,
  cx,
  type IconComponent,
} from '@tugen/uikit/web';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CrashIcon,
  LogoutIcon,
  MoreIcon,
  RoadmapIcon,
  SidebarIcon,
  SiteIcon,
} from './icons';

// Каркас админки — как окно лаунчера (tugen.launcher, src/app.tsx и components/page): слева боковая
// панель цвета окна с кнопками шапки и разделами по группам, справа область страницы со скруглённым
// левым верхним углом и панелью «назад / вперёд» сверху. Панель сворачивается до иконок кнопкой в шапке,
// на узком экране она свёрнута всегда — как compact-режим лаунчера

export type AdminSection = 'roadmap' | 'crashes';

interface SectionItem {
  id: AdminSection;
  label: string;
  icon: IconComponent;
}

// Группы панели — как «Игры» и «Сервисы» у лаунчера: что относится к сайту и что к лаунчеру
const GROUPS: { title: string; items: SectionItem[] }[] = [
  {
    title: 'Сайт',
    items: [{ id: 'roadmap', label: 'Роадмап', icon: RoadmapIcon }],
  },
  {
    title: 'Лаунчер',
    items: [{ id: 'crashes', label: 'Сбои', icon: CrashIcon }],
  },
];

/** Адрес раздела: роадмап — сама /admin, остальные — по хешу (/admin#crashes), его можно сохранить в закладки */
export const sectionHref = (section: AdminSection) =>
  section === 'roadmap' ? '/admin' : `/admin#${section}`;

export const sectionFromHash = (): AdminSection =>
  window.location.hash === '#crashes' ? 'crashes' : 'roadmap';

const COLLAPSED_KEY = 'tugen.admin.sidebarCollapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

const writeCollapsed = (collapsed: boolean) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // Хранилище закрыто — панель просто развернётся после перезагрузки
  }
};

// Узкий экран — уже 768 px (md Tailwind; у лаунчера граница compact — 720): развернуть панель некуда
const NARROW = '(max-width: 767px)';

const useNarrow = () => {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia?.(NARROW).matches ?? false,
  );
  useEffect(() => {
    const query = window.matchMedia?.(NARROW);
    if (!query) return;
    const update = () => setNarrow(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return narrow;
};

// Подпись группы; в свёрнутой панели подписи не помещаются — группы разделены чертой, как в лаунчере
const SidebarLabel: React.FC<{ title: string; compact: boolean }> = ({
  title,
  compact,
}) =>
  compact ? (
    <div
      role="separator"
      className="mx-2 my-1.5 h-px bg-mist-200 dark:bg-mist-800"
    />
  ) : (
    <div className="truncate px-2 pt-3 pb-1 text-xs text-mist-500 uppercase dark:text-mist-400">
      {title}
    </div>
  );

/**
 * Вкладка панели — как Tab лаунчера: фон при наведении и у выбранной, иконка на плашке 24×24, синей
 * у выбранной. Ссылка, а не кнопка: раздел открывается в новой вкладке, а в своей — без перезагрузки
 */
const SidebarTab: React.FC<{
  item: SectionItem;
  active: boolean;
  compact: boolean;
  onSelect: (section: AdminSection) => void;
}> = ({ item, active, compact, onSelect }) => {
  const Icon = item.icon;
  return (
    <a
      href={sectionHref(item.id)}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? item.label : undefined}
      title={compact ? item.label : undefined}
      onClick={e => {
        // Своя вкладка — без перезагрузки; с Ctrl или средней кнопкой — как обычная ссылка
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        onSelect(item.id);
      }}
      className={cx(
        PRESSABLE,
        'group flex-row justify-start gap-1 rounded-lg p-2 hover:bg-mist-200 active:bg-mist-300 dark:hover:bg-mist-800 dark:active:bg-mist-800',
        active && 'bg-mist-200 dark:bg-mist-800',
      )}
    >
      <span
        className={cx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition-colors duration-150',
          active
            ? 'bg-blue-500 text-mist-50'
            : 'bg-mist-300 text-mist-600 group-hover:bg-mist-300 group-hover:text-mist-600 dark:bg-mist-800 dark:text-mist-400 dark:group-hover:bg-mist-700 dark:group-hover:text-mist-50',
        )}
      >
        <Icon size={16} />
      </span>
      {!compact && (
        <span
          className={cx(
            'min-w-0 flex-1 truncate text-start text-sm',
            active
              ? 'text-mist-950 dark:text-mist-50'
              : 'text-mist-500 group-hover:text-mist-950 dark:text-mist-400 dark:group-hover:text-mist-50',
          )}
        >
          {item.label}
        </span>
      )}
    </a>
  );
};

export interface AdminShellProps {
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  onLogout: () => void;
  /** Кнопки раздела справа в панели над страницей (например, «Сохранить» у роадмапа) */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  section,
  onSection,
  onLogout,
  actions,
  children,
}) => {
  const narrow = useNarrow();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const compact = narrow || collapsed;

  const toggle = () => {
    writeCollapsed(!collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-svh flex-row bg-mist-100 dark:bg-mist-900">
      <nav
        aria-label="Разделы админки"
        className={cx(
          'flex shrink-0 flex-col gap-1 overflow-y-auto p-2',
          compact ? 'w-14' : 'w-56 xl:w-64',
        )}
      >
        {/* Шапка панели: в развёрнутой кнопки в ряд у правого края, в свёрнутой — столбиком по центру */}
        <div
          className={cx(
            'flex gap-1',
            compact
              ? 'flex-col items-center'
              : 'flex-row items-center justify-end',
          )}
        >
          <DropdownMenu>
            {/* IconButton отдаёт ref и пропсы своей <button> — по ним Radix ставит меню у кнопки */}
            <DropdownMenuTrigger asChild>
              <IconButton icon={MoreIcon} aria-label="Меню" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                icon={SiteIcon}
                onSelect={() => {
                  window.location.href = '/';
                }}
              >
                На сайт
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={LogoutIcon} onSelect={onLogout}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* На узком экране разворачивать панель некуда */}
          {!narrow && (
            <IconButton
              icon={SidebarIcon}
              onClick={toggle}
              aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
              aria-expanded={!collapsed}
            />
          )}
        </div>
        {GROUPS.map(group => (
          <React.Fragment key={group.title}>
            <SidebarLabel title={group.title} compact={compact} />
            {group.items.map(item => (
              <SidebarTab
                key={item.id}
                item={item}
                active={item.id === section}
                compact={compact}
                onSelect={onSection}
              />
            ))}
          </React.Fragment>
        ))}
      </nav>
      {/* Область страницы — светлее панели, со скруглённым углом у шапки панели, как в лаунчере */}
      <div className="flex min-w-0 flex-1 flex-col rounded-tl-2xl bg-mist-50 dark:bg-mist-950">
        <div className="flex w-full flex-row items-center justify-between gap-1 border-b border-mist-100 p-2 dark:border-mist-900">
          <div className="flex flex-row gap-1">
            <IconButton
              icon={ArrowLeftIcon}
              onClick={() => window.history.back()}
              aria-label="Назад"
            />
            <IconButton
              icon={ArrowRightIcon}
              onClick={() => window.history.forward()}
              aria-label="Вперёд"
            />
          </div>
          <div className="flex flex-row items-center gap-2">{actions}</div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-3 md:p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
