import React from 'react';
import {
  Linking,
  Pressable,
  Text as RNText,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button, Divider, PopupHost, Text, Tip } from '@tugen/uikit';
import { DiscordIcon, DownloadIcon } from './icons';
import { RoadmapSection } from './roadmap';

// Лендинг TUGEN: в центре первого экрана — имя, под ним «Скачать» и значок Discord для связи
// с разработчиком в одном ряду и серая ссылка на портативную версию; ниже — роадмап

const RELEASES = 'https://github.com/Epic-Group12345/epic.launcher-releases';
// Файлы последнего полного релиза: имена пишет CI лаунчера (docs/releases.md)
const DOWNLOAD = `${RELEASES}/releases/latest/download/tugen-setup-win-x64.exe`;
const PORTABLE = `${RELEASES}/releases/latest/download/tugen-portable-win-x64.zip`;
const DEVELOPER = 'https://discordapp.com/users/884652865187115038';

const open = (url: string) => () => {
  Linking.openURL(url);
};

export const Landing: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const wide = width >= 640;

  return (
    <View className="flex-1 bg-mist-50 dark:bg-mist-950">
      <ScrollView contentContainerClassName="items-center px-5">
        <View
          className="w-full max-w-6xl items-center justify-center gap-10 py-16"
          // Первый экран — на всю высоту окна: роадмап начинается ниже сгиба
          style={{ minHeight: height }}
        >
          {/* Text kit ставит размер из своей шкалы (до 3xl): крупное имя — свой Text */}
          <RNText
            role="heading"
            className={`font-bold tracking-tight text-mist-950 dark:text-mist-50 ${
              wide ? 'text-8xl' : 'text-6xl'
            }`}
          >
            TUGEN
          </RNText>
          <View className="items-center gap-4">
            {/* «Скачать» и связь с разработчиком — в одном ряду и одной высоты (обе lg). У связи —
                только значок Discord, подпись — во всплывающей подсказке */}
            <View className="flex-row items-center justify-center gap-3">
              <Button
                variant="play"
                size="lg"
                icon={DownloadIcon}
                onPress={open(DOWNLOAD)}
              >
                Скачать
              </Button>
              <Tip label="Связаться с разработчиком">
                {/* Значок — содержимым, а не icon: без подписи кнопка с icon ниже «Скачать».
                    Невидимый пробел нулевой ширины даёт строке высоту текста, как у соседней; inline —
                    потому что preflight Tailwind делает svg блоком */}
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={open(DEVELOPER)}
                  accessibilityLabel="Связаться с разработчиком в Discord"
                >
                  {'\u200B'}
                  <DiscordIcon size={20} className="inline align-middle" />
                </Button>
              </Tip>
            </View>
            <Pressable
              role="link"
              onPress={open(PORTABLE)}
              accessibilityLabel="Скачать портативную версию"
            >
              <Text tone="muted" className="underline">
                Портативная версия
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="w-full max-w-6xl gap-12 pb-10">
          <RoadmapSection />
          <View className="gap-4">
            <Divider />
            <Text size="xs" tone="muted">
              © 2026 TUGEN. Не является официальным продуктом Minecraft и не
              связан с Mojang или Microsoft.
            </Text>
          </View>
        </View>
      </ScrollView>
      <PopupHost />
    </View>
  );
};
