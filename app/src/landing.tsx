import React from 'react';
import {
  Linking,
  Text as RNText,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Divider,
  Pill,
  PopupHost,
  Surface,
  Text,
} from '@tugen/uikit';
import {
  DownloadIcon,
  FriendsIcon,
  LogoMark,
  ModsIcon,
  PlayIcon,
  ServersIcon,
  type Glyph,
} from './icons';

// Лендинг TUGEN: что это за лаунчер и где его скачать. Тексты — из концепта продукта
// (одно окно для всей игры), оформление — элементы @tugen/uikit, как в самом лаунчере

const RELEASES = 'https://github.com/Epic-Group12345/epic.launcher-releases';
// Установщик последнего полного релиза: имя файла пишет CI лаунчера (docs/releases.md)
const DOWNLOAD = `${RELEASES}/releases/latest/download/tugen-setup-win-x64.exe`;
const PORTABLE = `${RELEASES}/releases/latest/download/tugen-portable-win-x64.zip`;

const open = (url: string) => () => {
  Linking.openURL(url);
};

const FEATURES: { icon: Glyph; title: string; text: string }[] = [
  {
    icon: PlayIcon,
    title: 'Сразу играть',
    text: 'Кнопка «Играть» работает с первого запуска. Лаунчер ждёт только то, без чего игра не стартует.',
  },
  {
    icon: ServersIcon,
    title: 'Серверы рядом',
    text: 'Каталог серверов с фильтрами, отзывами и вайпами. Понятно, куда зайти сегодня.',
  },
  {
    icon: ModsIcon,
    title: 'Моды без поломок',
    text: 'Основная сборка остаётся целой, эксперименты живут рядом. Моды из Modrinth и CurseForge, файлы не качаются дважды.',
  },
  {
    icon: FriendsIcon,
    title: 'Друзья в том же окне',
    text: 'Видно, кто где играет. Чаты и звонки с показом экрана без Discord и браузера.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Сколько стоит TUGEN?',
    a: 'Нисколько. Лаунчер бесплатный.',
  },
  {
    q: 'Какие версии Minecraft поддерживаются?',
    a: 'Обычные версии игры, а также Fabric и Forge для 1.7.10–1.12.2. Список растёт с обновлениями.',
  },
  {
    q: 'Я играю в другом лаунчере. Миры пропадут?',
    a: 'Нет. Перенос миров и сборок из Prism, MultiMC, Modrinth App, CurseForge и TLauncher — следующий большой шаг лаунчера.',
  },
  {
    q: 'Что будет, если ваши серверы упадут?',
    a: 'Игра всё равно запустится. Каталог и чаты подождут, а «Играть» от них не зависит.',
  },
];

/** Карточка возможности: значок в синей плашке, заголовок и пояснение */
const Feature: React.FC<{ icon: Glyph; title: string; text: string }> = ({
  icon: Icon,
  title,
  text,
}) => (
  <Surface kind="card" radius="2xl" padding="5" className="flex-1 gap-3">
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
      <Icon size={20} className="text-blue-600 dark:text-blue-400" />
    </View>
    <Text size="lg" weight="semibold">
      {title}
    </Text>
    <Text tone="secondary">{text}</Text>
  </Surface>
);

/** Строка сервера в макете окна лаунчера */
const ServerRow: React.FC<{
  name: string;
  online: string;
  tag?: React.ReactNode;
}> = ({ name, online, tag }) => (
  <View className="flex-row items-center gap-3 px-4 py-3">
    <View className="h-8 w-8 rounded-lg bg-mist-200 dark:bg-mist-800" />
    <View className="flex-1 gap-0.5">
      <Text weight="semibold">{name}</Text>
      <Text size="xs" tone="muted">
        {online}
      </Text>
    </View>
    {tag}
  </View>
);

/**
 * Макет окна лаунчера из тех же элементов kit: как выглядит главная. Скругления — по правилу kit:
 * окно 3xl + p-2 → карточки 2xl, карточка + p-2 → кнопка lg
 */
const LauncherPreview: React.FC = () => (
  <Surface kind="overlay" radius="3xl" padding="2" className="w-full gap-2">
    <View className="flex-row items-center gap-2 px-3 pt-1">
      <View className="h-3 w-3 rounded-full bg-mist-200 dark:bg-mist-800" />
      <View className="h-3 w-3 rounded-full bg-mist-200 dark:bg-mist-800" />
      <View className="h-3 w-3 rounded-full bg-mist-200 dark:bg-mist-800" />
      <Text size="xs" tone="muted" className="ml-2">
        TUGEN
      </Text>
    </View>
    <Surface kind="card" nested padding="2" className="gap-2">
      <View className="flex-row items-center justify-between gap-3 px-2 pt-2">
        <View className="gap-0.5">
          <Text size="xs" tone="muted" uppercase>
            Основная сборка
          </Text>
          <Text size="lg" weight="semibold">
            Выживание · 1.21.4
          </Text>
        </View>
        <Pill tone="violet">Fabric</Pill>
      </View>
      <Button variant="play" size="lg" icon={PlayIcon} grow>
        Играть
      </Button>
    </Surface>
    <Surface kind="card" nested>
      <ServerRow
        name="Ванильный остров"
        online="1 204 игрока"
        tag={<Pill tone="green">В сети</Pill>}
      />
      <Divider inset />
      <ServerRow
        name="Техно-сити"
        online="612 игроков"
        tag={<Pill tone="amber">Вайп завтра</Pill>}
      />
      <Divider inset />
      <ServerRow
        name="Скайблок Плюс"
        online="388 игроков"
        tag={<Pill>Мини-игры</Pill>}
      />
    </Surface>
  </Surface>
);

export const Landing: React.FC = () => {
  const { width } = useWindowDimensions();
  // Ширины — как compact / regular / wide лаунчера: брейкпоинты Uniwind на RN-компонентах не годятся
  const wide = width >= 960;
  const regular = width >= 640;

  return (
    <View className="flex-1 bg-mist-50 dark:bg-mist-950">
      <ScrollView contentContainerClassName="items-center px-5 pb-10">
        <View className="w-full max-w-6xl gap-16">
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center gap-2">
              <LogoMark size={28} />
              <Text size="lg" weight="bold">
                TUGEN
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {regular && (
                <Button variant="ghost" onPress={open(RELEASES)}>
                  Релизы
                </Button>
              )}
              <Button icon={DownloadIcon} onPress={open(DOWNLOAD)}>
                Скачать
              </Button>
            </View>
          </View>

          <View
            className={
              wide ? 'flex-row items-center gap-12' : 'items-stretch gap-10'
            }
          >
            <View className={wide ? 'flex-1 gap-6' : 'gap-6'}>
              <View className="flex-row">
                <Pill tone="green">Бесплатно · Windows 10 и 11</Pill>
              </View>
              {/* Text kit всегда ставит размер из своей шкалы (до 3xl): крупный заголовок — свой */}
              <RNText
                role="heading"
                className={`font-bold leading-tight text-mist-950 dark:text-mist-50 ${
                  wide ? 'text-6xl' : 'text-4xl'
                }`}
              >
                Одно окно для всей игры
              </RNText>
              <Text size="lg" tone="secondary" className="leading-relaxed">
                TUGEN — лаунчер Minecraft, который отвечает не на «как запустить
                версию», а на «во что поиграть, где и с кем». Игра, серверы,
                моды и друзья без переключения между окнами.
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <Button
                  variant="play"
                  size="lg"
                  icon={DownloadIcon}
                  onPress={open(DOWNLOAD)}
                >
                  Скачать для Windows
                </Button>
                <Button variant="secondary" size="lg" onPress={open(PORTABLE)}>
                  Портативная версия
                </Button>
              </View>
            </View>
            <View className={wide ? 'flex-1' : ''}>
              <LauncherPreview />
            </View>
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Text size="3xl" weight="bold">
                Всё, что нужно игроку
              </Text>
              <Text size="lg" tone="secondary">
                Лаунчер, сайт рейтинга серверов и мессенджер больше не нужно
                держать открытыми одновременно.
              </Text>
            </View>
            <View className={regular ? 'flex-row gap-4' : 'gap-4'}>
              {FEATURES.slice(0, 2).map(f => (
                <Feature key={f.title} {...f} />
              ))}
            </View>
            <View className={regular ? 'flex-row gap-4' : 'gap-4'}>
              {FEATURES.slice(2).map(f => (
                <Feature key={f.title} {...f} />
              ))}
            </View>
          </View>

          <View className={wide ? 'flex-row gap-12' : 'gap-6'}>
            <View className={wide ? 'w-80 gap-2' : 'gap-2'}>
              <Text size="3xl" weight="bold">
                Вопросы
              </Text>
              <Text tone="secondary">
                Коротко о том, о чём спрашивают чаще всего.
              </Text>
            </View>
            <View className="flex-1">
              <Accordion type="single" collapsible variant="card">
                {FAQ.map(item => (
                  <AccordionItem key={item.q} value={item.q}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </View>
          </View>

          <Surface
            kind="card"
            radius="3xl"
            padding="4"
            className={
              regular ? 'flex-row items-center justify-between gap-6' : 'gap-6'
            }
          >
            <View className="flex-1 gap-2 p-4">
              <Text size="2xl" weight="bold">
                Попробуйте TUGEN
              </Text>
              <Text tone="secondary">
                Кнопка «Играть» доступна сразу после первого запуска.
              </Text>
            </View>
            <Button
              variant="play"
              size="lg"
              icon={DownloadIcon}
              onPress={open(DOWNLOAD)}
            >
              Скачать для Windows
            </Button>
          </Surface>

          <View className="gap-4">
            <Divider />
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text size="xs" tone="muted">
                © 2026 TUGEN. Не является официальным продуктом Minecraft и не
                связан с Mojang или Microsoft.
              </Text>
              <Button variant="ghost" size="sm" onPress={open(RELEASES)}>
                Все релизы
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
      <PopupHost />
    </View>
  );
};
