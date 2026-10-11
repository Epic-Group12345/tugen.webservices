import React, { useEffect, useState } from 'react';
import { Button, Divider, Text, Tip } from '@tugen/uikit/web';
import { DiscordIcon, DownloadIcon } from './icons';
import { RoadmapSection } from './roadmap';

// Лендинг TUGEN: первый экран выровнен влево — имя, заголовок «А что если лаунчер — …» со сменяющимся
// окончанием, под ним «Скачать» и значок Discord для связи с разработчиком в одном ряду и серая ссылка
// на портативную версию; ниже — роадмап

const RELEASES = 'https://github.com/Epic-Group12345/epic.launcher-releases';
// Файлы последнего полного релиза: имена пишет CI лаунчера (docs/releases.md)
const DOWNLOAD = `${RELEASES}/releases/latest/download/tugen-setup-win-x64.exe`;
const PORTABLE = `${RELEASES}/releases/latest/download/tugen-portable-win-x64.zip`;
const DEVELOPER = 'https://discordapp.com/users/884652865187115038';

// Окончания заголовка: первое — главное, остальные сменяют его по кругу
const IDEAS = [
  'это не просто кнопка «Играть»',
  'заказывает еду',
  'помогает с домашкой',
  'социальный',
  'находит тиммейтов',
  'знает, во что играют друзья',
  'сам собирает сборку модов',
  'напоминает, что пора спать',
];
const IDEA_MS = 3200;
const FADE_MS = 300;

// Окончание заголовка меняется плавно: гаснет, сменяется, проявляется. Кто просил меньше движения —
// видит только первое
const useIdea = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let swap: number | undefined;
    const timer = window.setInterval(() => {
      setVisible(false);
      swap = window.setTimeout(() => {
        setIndex(i => (i + 1) % IDEAS.length);
        setVisible(true);
      }, FADE_MS);
    }, IDEA_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(swap);
    };
  }, []);
  return { idea: IDEAS[index], visible };
};

const open = (url: string) => () => {
  window.location.href = url;
};

export const Landing: React.FC = () => {
  const { idea, visible } = useIdea();
  return (
    <main className="flex flex-col items-center px-5">
      {/* Первый экран — на всю высоту окна: роадмап начинается ниже сгиба */}
      <div className="flex min-h-svh w-full max-w-6xl flex-col items-start justify-center gap-10 py-16">
        <div className="flex flex-col items-start gap-4">
          <span className="text-lg font-semibold tracking-widest text-mist-500 dark:text-mist-400">
            TUGEN
          </span>
          {/* Text kit ставит размер из своей шкалы (до 3xl): крупный заголовок — свой. Читалке экрана —
            неизменный главный вариант, сменяющиеся окончания ей не озвучиваются */}
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-mist-950 sm:text-6xl dark:text-mist-50">
            <span className="sr-only">А что если лаунчер — {IDEAS[0]}</span>
            <span aria-hidden="true">
              А что если лаунчер{'\u00a0'}—{' '}
              {/* min-h держит две строки — по длине самого длинного окончания, — чтобы кнопки ниже не прыгали */}
              <span
                className={`block min-h-[2lh] text-blue-600 transition-opacity duration-300 dark:text-blue-400 ${
                  visible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {idea}
              </span>
            </span>
          </h1>
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
            © 2026 TUGEN. Не является официальным продуктом Minecraft и не
            связан с Mojang или Microsoft.
          </Text>
        </footer>
      </div>
    </main>
  );
};
