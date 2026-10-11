import React from 'react';
import { Button, EmptyState, Text, cx } from '@tugen/uikit/web';
import {
  BusinessIcon,
  DiscordIcon,
  DocsIcon,
  GoIcon,
  KitIcon,
  PublisherIcon,
  type Glyph,
} from './icons';
import { DEVELOPER, SitePage } from './site';

// Разделы из шапки: «Для разработчиков» ведёт на UI-kit и документацию, «Для бизнеса» и «Для издателей»
// пока заглушки со ссылкой на разработчика

const Intro: React.FC<{ title: string; lead: string }> = ({ title, lead }) => (
  <div className="flex flex-col gap-3">
    <h1 className="text-3xl font-bold tracking-tight text-mist-950 sm:text-5xl dark:text-mist-50">
      {title}
    </h1>
    <Text size="lg" tone="muted" className="max-w-2xl">
      {lead}
    </Text>
  </div>
);

const LinkCard: React.FC<{
  href: string;
  icon: Glyph;
  title: string;
  text: string;
}> = ({ href, icon: Icon, title, text }) => (
  <a
    href={href}
    className={cx(
      'group flex flex-col gap-3 rounded-2xl border border-mist-200 bg-mist-100 p-6 transition-colors',
      'hover:border-blue-300 hover:bg-mist-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
      'dark:border-mist-800 dark:bg-mist-900 dark:hover:border-blue-700 dark:hover:bg-mist-800/60',
    )}
  >
    <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
      <Icon size={20} />
    </span>
    <span className="flex flex-row items-center gap-1.5 text-lg font-semibold text-mist-950 dark:text-mist-50">
      {title}
      <GoIcon
        size={16}
        className="text-mist-400 transition-transform group-hover:translate-x-0.5"
      />
    </span>
    <span className="text-sm text-mist-600 dark:text-mist-400">{text}</span>
  </a>
);

export const Developers: React.FC = () => (
  <SitePage>
    <Intro
      title="Для разработчиков"
      lead="Элементы интерфейса TUGEN для мини-приложений и веба: те же варианты, размеры и цвета, что в лаунчере."
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LinkCard
        href="/uikit"
        icon={KitIcon}
        title="UI-kit"
        text="Все элементы веб-слоя на одной странице: кнопки, формы, меню, окна и уведомления."
      />
      <LinkCard
        href="/docs"
        icon={DocsIcon}
        title="Документация"
        text="Токены, правило скругления и страница на каждый компонент — с живыми примерами, кодом и свойствами."
      />
    </div>
  </SitePage>
);

const Soon: React.FC<{ title: string; lead: string; icon: Glyph }> = ({
  title,
  lead,
  icon,
}) => (
  <SitePage>
    <Intro title={title} lead={lead} />
    <EmptyState
      className="rounded-2xl border border-dashed border-mist-300 py-12 dark:border-mist-700"
      icon={icon}
      title="Раздел готовится"
      text="Пока здесь пусто. Напишите разработчику в Discord — расскажем, что уже можно сделать вместе."
    >
      <Button
        variant="secondary"
        icon={DiscordIcon}
        onClick={() => {
          window.location.href = DEVELOPER;
        }}
      >
        Написать в Discord
      </Button>
    </EmptyState>
  </SitePage>
);

export const Business: React.FC = () => (
  <Soon
    title="Для бизнеса"
    lead="Сотрудничество с TUGEN для компаний и брендов."
    icon={BusinessIcon}
  />
);

export const Publishers: React.FC = () => (
  <Soon
    title="Для издателей"
    lead="Серверы, сборки и мини-приложения в каталоге TUGEN."
    icon={PublisherIcon}
  />
);
