import React, { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import {
  Button,
  Pill,
  Skeleton,
  Surface,
  Text,
  type PillTone,
} from '@tugen/uikit';
import { COLUMNS, fetchRoadmap, type ColumnId, type Roadmap } from './api';

// Роадмап на лендинге: канбан только для чтения. Править — в скрытой админке /admin

export const COLUMN_TONE: Record<ColumnId, PillTone> = {
  planned: 'neutral',
  progress: 'amber',
  done: 'green',
};

/** Колонка канбана: заголовок со счётчиком и карточки на подложке. Карточки рисует вызывающий */
export const KanbanColumn: React.FC<{
  id: ColumnId;
  count: number;
  children: React.ReactNode;
}> = ({ id, count, children }) => (
  <View className="flex-1 gap-3">
    <View className="flex-row items-center gap-2 px-1">
      <Text weight="semibold">{COLUMNS.find(c => c.id === id)!.title}</Text>
      <Pill tone={COLUMN_TONE[id]}>{String(count)}</Pill>
    </View>
    <Surface kind="card" radius="2xl" padding="2" className="flex-1 gap-2">
      {children}
    </Surface>
  </View>
);

/** Раскладка колонок: в ряд на широком окне, друг под другом на телефоне */
export const useKanbanLayout = () => {
  const { width } = useWindowDimensions();
  return width >= 768 ? 'flex-row items-stretch gap-4' : 'gap-6';
};

const Card: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <Surface kind="overlay" nested className="gap-1 px-4 py-3">
    <Text weight="semibold">{title}</Text>
    {text.length > 0 && <Text tone="secondary">{text}</Text>}
  </Surface>
);

export const RoadmapSection: React.FC = () => {
  const [board, setBoard] = useState<Roadmap | null>(null);
  const [failed, setFailed] = useState(false);
  const layout = useKanbanLayout();

  const load = useCallback(() => {
    setFailed(false);
    fetchRoadmap()
      .then(setBoard)
      .catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text size="3xl" weight="bold">
          Роадмап
        </Text>
        <Text size="lg" tone="secondary">
          Над чем работаем сейчас и что будет дальше.
        </Text>
      </View>
      {failed ? (
        <Surface kind="card" radius="2xl" className="items-start gap-3 p-5">
          <Text tone="secondary">
            Не удалось загрузить роадмап. Проверьте соединение и попробуйте ещё
            раз.
          </Text>
          <Button variant="secondary" onPress={load}>
            Повторить
          </Button>
        </Surface>
      ) : (
        <View className={layout}>
          {COLUMNS.map(({ id }) => (
            <KanbanColumn key={id} id={id} count={board?.[id].length ?? 0}>
              {board ? (
                board[id].length === 0 ? (
                  <Text tone="muted" className="px-2 py-3">
                    Пока пусто
                  </Text>
                ) : (
                  board[id].map(item => (
                    <Card key={item.id} title={item.title} text={item.text} />
                  ))
                )
              ) : (
                <>
                  <Skeleton className="h-16" rounded="rounded-lg" />
                  <Skeleton className="h-16" rounded="rounded-lg" />
                </>
              )}
            </KanbanColumn>
          ))}
        </View>
      )}
    </View>
  );
};
