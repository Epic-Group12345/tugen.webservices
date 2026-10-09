import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Pill,
  Skeleton,
  Surface,
  Text,
  type PillTone,
} from '@tugen/uikit/web';
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
  <div className="flex min-w-0 flex-1 flex-col gap-3">
    <div className="flex flex-row items-center gap-2 px-1">
      <Text weight="semibold">{COLUMNS.find(c => c.id === id)!.title}</Text>
      <Pill tone={COLUMN_TONE[id]}>{String(count)}</Pill>
    </div>
    <Surface
      kind="card"
      radius="2xl"
      padding="2"
      className="flex flex-1 flex-col gap-2"
    >
      {children}
    </Surface>
  </div>
);

/** Раскладка колонок: в ряд на широком окне, друг под другом на телефоне */
export const KANBAN_LAYOUT =
  'flex flex-col gap-6 md:flex-row md:items-stretch md:gap-4';

const Card: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <Surface kind="overlay" nested className="flex flex-col gap-1 px-4 py-3">
    <Text weight="semibold">{title}</Text>
    {text.length > 0 && <Text tone="secondary">{text}</Text>}
  </Surface>
);

export const RoadmapSection: React.FC = () => {
  const [board, setBoard] = useState<Roadmap | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    fetchRoadmap()
      .then(setBoard)
      .catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Text as="h2" size="3xl" weight="bold">
          Роадмап
        </Text>
        <Text size="lg" tone="secondary">
          Над чем работаем сейчас и что будет дальше.
        </Text>
      </div>
      {failed ? (
        <Surface
          kind="card"
          radius="2xl"
          className="flex flex-col items-start gap-3 p-5"
        >
          <Text tone="secondary">
            Не удалось загрузить роадмап. Проверьте соединение и попробуйте ещё
            раз.
          </Text>
          <Button variant="secondary" onClick={load}>
            Повторить
          </Button>
        </Surface>
      ) : (
        <div className={KANBAN_LAYOUT}>
          {COLUMNS.map(({ id }) => (
            <KanbanColumn key={id} id={id} count={board?.[id].length ?? 0}>
              {board ? (
                board[id].length === 0 ? (
                  <Text as="p" tone="muted" className="px-2 py-3">
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
        </div>
      )}
    </section>
  );
};
