import React, { useEffect, useState } from 'react';
import { Button, Divider, Text, Tip } from '@tugen/uikit/web';
import { DiscordIcon, DownloadIcon } from './icons';
import { RoadmapSection } from './roadmap';

// Лендинг TUGEN: первый экран выровнен по левому краю — имя, заголовок «А что если лаунчер — …»
// со сменяющимся окончанием, под ним «Скачать» и значок Discord для связи с разработчиком в одном
// ряду и серая ссылка на портативную версию; ниже — роадмап

const RELEASES = 'https://github.com/Epic-Group12345/epic.launcher-releases';
// Файлы последнего полного релиза: имена пишет CI лаунчера (docs/releases.md)
const DOWNLOAD = `${RELEASES}/releases/latest/download/tugen-setup-win-x64.exe`;
const PORTABLE = `${RELEASES}/releases/latest/download/tugen-portable-win-x64.zip`;
const DEVELOPER = 'https://discordapp.com/users/884652865187115038';

const open = (url: string) => () => {
  window.location.href = url;
};

// Окончания заголовка «А что если лаунчер — …»: первое — основное, остальные сменяют друг друга
const WHAT_IF = [
  'это не просто кнопка «Играть»',
  'заказывает еду',
  'помогает с домашкой',
  'социальный',
  'сам ставит моды',
  'находит тиммейтов',
  'напоминает, что пора спать',
  'знает, во что играют друзья',
];
const WHAT_IF_INTERVAL = 3000;

// Заголовок первого экрана. Все окончания лежат в одной ячейке сетки друг на друге, видно одно:
// высота — по самому длинному, и строка не прыгает при смене. Читалкам экрана — только основная
// фраза, без смены; при «уменьшить движение» окончание не меняется
const WhatIfTitle: React.FC = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(
      () => setIndex(i => (i + 1) % WHAT_IF.length),
      WHAT_IF_INTERVAL,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <h1
      aria-label={`А что если лаунчер — ${WHAT_IF[0]}`}
      className="max-w-4xl text-4xl font-bold tracking-tight text-balance text-mist-950 sm:text-6xl dark:text-mist-50"
    >
      <span aria-hidden="true">А что если лаунчер — </span>
      <span aria-hidden="true" className="grid">
        {WHAT_IF.map((text, i) => (
          <span
            key={text}
            className={`col-start-1 row-start-1 text-mist-500 transition-opacity duration-500 dark:text-mist-400 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {text}
          </span>
        ))}
      </span>
    </h1>
  );
};

export const Landing: React.FC = () => (
  <main className="flex flex-col items-center px-5">
    {/* Первый экран — на всю высоту окна, по левому краю: роадмап начинается ниже сгиба */}
    <div className="flex min-h-svh w-full max-w-6xl flex-col items-start justify-center gap-10 py-16">
      <div className="flex flex-col items-start gap-4">
        {/* Text kit ставит размер из своей шкалы (до 3xl): имя и заголовок — свои */}
        <p className="text-xl font-bold tracking-tight text-mist-950 dark:text-mist-50">
          TUGEN
        </p>
        <WhatIfTitle />
      </div>
      <div className="flex flex-col items-start gap-4">
        {/* «Скачать» и связь с разработчиком — в одном ряду и одной высоты (обе lg). У связи —
            только значок Discord, подпись — во всплывающей подсказке */}
        <div className="flex flex-row items-center gap-3">
          <Button
            variant="play"
            size="lg"
            icon={DownloadIcon}
            onClick={open(DOWNLOAD)}
          >
            Скачать
          </Button>
          <Tip label="Связаться с разработчиком">
            {/* Значок — содержимым, а не icon: строчный svg в строке текста даёт кнопке ту же
                высоту, что у «Скачать» (preflight Tailwind делает svg блоком — возвращаем inline) */}
            <Button
              variant="secondary"
              size="lg"
              onClick={open(DEVELOPER)}
              aria-label="Связаться с разработчиком в Discord"
            >
              <DiscordIcon size={20} className="inline align-middle" />
            </Button>
          </Tip>
        </div>
        <a
          href={PORTABLE}
          className="rounded-sm text-sm text-mist-500 underline hover:text-mist-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-mist-400 dark:hover:text-mist-200"
        >
          Портативная версия
        </a>
      </div>
    </div>

    <div className="flex w-full max-w-6xl flex-col gap-12 pb-10">
      <RoadmapSection />
      <footer className="flex flex-col gap-4">
        <Divider />
        <Text size="xs" tone="muted">
          © 2026 TUGEN. Не является официальным продуктом Minecraft и не связан
          с Mojang или Microsoft.
        </Text>
      </footer>
    </div>
  </main>
);
