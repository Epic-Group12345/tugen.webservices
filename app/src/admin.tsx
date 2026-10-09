import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Field,
  IconButton,
  PopupHost,
  Surface,
  Text,
  TextField,
  Toaster,
  toast,
} from '@tugen/uikit';
import {
  ApiError,
  COLUMNS,
  checkToken,
  fetchRoadmap,
  saveRoadmap,
  type ColumnId,
  type Roadmap,
  type RoadmapItem,
} from './api';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from './icons';
import { KanbanColumn, useKanbanLayout } from './roadmap';

// Скрытая админка роадмапа: страница /admin, ссылок на неё нет. Вход — токен ADMIN_TOKEN бэкенда;
// он хранится только до закрытия вкладки (sessionStorage), а проверяет его сервер

const TOKEN_KEY = 'tugen.admin.token';

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};

const writeToken = (token: string) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Хранилище закрыто (приватный режим) — войти придётся заново после перезагрузки
  }
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const ORDER = COLUMNS.map(c => c.id);

const Login: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    checkToken(token)
      .then(() => onLogin(token))
      .catch(e =>
        setError(
          e instanceof ApiError && e.status === 401
            ? 'Неверный токен'
            : 'Сервер недоступен',
        ),
      )
      .finally(() => setBusy(false));
  };

  return (
    <View className="flex-1 items-center justify-center p-5">
      <Surface kind="card" radius="2xl" className="w-full max-w-sm gap-4 p-6">
        <View className="gap-1">
          <Text size="xl" weight="bold">
            Админка роадмапа
          </Text>
          <Text tone="secondary">Введите токен администратора.</Text>
        </View>
        <Field label="Токен" error={error || undefined}>
          <TextField
            value={token}
            onChangeText={setToken}
            secure
            autoFocus
            onSubmit={submit}
          />
        </Field>
        <Button onPress={submit} disabled={!token || busy}>
          Войти
        </Button>
      </Surface>
    </View>
  );
};

/** Карточка в редакторе: поля и кнопки переноса между колонками и внутри колонки */
const EditableCard: React.FC<{
  item: RoadmapItem;
  column: ColumnId;
  first: boolean;
  last: boolean;
  onChange: (item: RoadmapItem) => void;
  onMove: (dx: -1 | 1) => void;
  onShift: (dy: -1 | 1) => void;
  onDelete: () => void;
}> = ({ item, column, first, last, onChange, onMove, onShift, onDelete }) => {
  const col = ORDER.indexOf(column);
  return (
    <Surface kind="overlay" nested padding="2" className="gap-2">
      <TextField
        value={item.title}
        onChangeText={title => onChange({ ...item, title })}
        placeholder="Название"
        maxLength={120}
        invalid={item.title.trim().length === 0}
        accessibilityLabel="Название карточки"
      />
      <TextField
        value={item.text}
        onChangeText={text => onChange({ ...item, text })}
        placeholder="Описание"
        maxLength={500}
        multiline
        numberOfLines={2}
        accessibilityLabel="Описание карточки"
      />
      <View className="flex-row items-center">
        <IconButton
          icon={ArrowLeftIcon}
          onPress={() => onMove(-1)}
          disabled={col === 0}
          accessibilityLabel="В предыдущую колонку"
        />
        <IconButton
          icon={ArrowUpIcon}
          onPress={() => onShift(-1)}
          disabled={first}
          accessibilityLabel="Выше"
        />
        <IconButton
          icon={ArrowDownIcon}
          onPress={() => onShift(1)}
          disabled={last}
          accessibilityLabel="Ниже"
        />
        <IconButton
          icon={ArrowRightIcon}
          onPress={() => onMove(1)}
          disabled={col === ORDER.length - 1}
          accessibilityLabel="В следующую колонку"
        />
        <View className="flex-1" />
        <IconButton
          icon={TrashIcon}
          tone="danger"
          onPress={onDelete}
          accessibilityLabel="Удалить карточку"
        />
      </View>
    </Surface>
  );
};

const Editor: React.FC<{ token: string; onLogout: () => void }> = ({
  token,
  onLogout,
}) => {
  const [board, setBoard] = useState<Roadmap | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const layout = useKanbanLayout();

  useEffect(() => {
    fetchRoadmap()
      .then(setBoard)
      .catch(() =>
        toast({ title: 'Не удалось загрузить роадмап', tone: 'danger' }),
      );
  }, []);

  // Любая правка — новая доска; сохраняется она только по кнопке
  const edit = useCallback((fn: (b: Roadmap) => Roadmap) => {
    setBoard(b => (b ? fn(b) : b));
    setDirty(true);
  }, []);

  const update = (col: ColumnId, next: RoadmapItem) =>
    edit(b => ({
      ...b,
      [col]: b[col].map(i => (i.id === next.id ? next : i)),
    }));

  const remove = (col: ColumnId, id: string) =>
    edit(b => ({ ...b, [col]: b[col].filter(i => i.id !== id) }));

  const add = (col: ColumnId) =>
    edit(b => ({
      ...b,
      [col]: [...b[col], { id: newId(), title: '', text: '' }],
    }));

  const move = (col: ColumnId, id: string, dx: -1 | 1) =>
    edit(b => {
      const to = ORDER[ORDER.indexOf(col) + dx];
      const item = b[col].find(i => i.id === id);
      if (!to || !item) return b;
      return {
        ...b,
        [col]: b[col].filter(i => i.id !== id),
        [to]: [...b[to], item],
      };
    });

  const shift = (col: ColumnId, index: number, dy: -1 | 1) =>
    edit(b => {
      const list = [...b[col]];
      const target = index + dy;
      if (target < 0 || target >= list.length) return b;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...b, [col]: list };
    });

  const empty = board
    ? ORDER.some(col => board[col].some(i => i.title.trim().length === 0))
    : false;

  const save = () => {
    if (!board || saving) return;
    setSaving(true);
    saveRoadmap(token, board)
      .then(saved => {
        setBoard(saved);
        setDirty(false);
        toast({ title: 'Роадмап сохранён', tone: 'success' });
      })
      .catch(e => {
        if (e instanceof ApiError && e.status === 401) {
          toast({ title: 'Токен больше не действует', tone: 'danger' });
          onLogout();
        } else {
          toast({
            title: 'Не сохранилось',
            description: e instanceof Error ? e.message : undefined,
            tone: 'danger',
          });
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <ScrollView contentContainerClassName="items-center p-5">
      <View className="w-full max-w-6xl gap-6">
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="gap-0.5">
            <Text size="2xl" weight="bold">
              Роадмап
            </Text>
            <Text tone="muted">
              {dirty ? 'Есть несохранённые изменения' : 'Всё сохранено'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Button variant="ghost" onPress={onLogout}>
              Выйти
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                window.location.href = '/';
              }}
            >
              На сайт
            </Button>
            <Button onPress={save} disabled={!dirty || saving || empty}>
              Сохранить
            </Button>
          </View>
        </View>
        {empty && (
          <Text tone="warning">
            У каждой карточки должно быть название — иначе сохранить нельзя.
          </Text>
        )}
        {board && (
          <View className={layout}>
            {COLUMNS.map(({ id: col }) => (
              <KanbanColumn key={col} id={col} count={board[col].length}>
                {board[col].map((item, index) => (
                  <EditableCard
                    key={item.id}
                    item={item}
                    column={col}
                    first={index === 0}
                    last={index === board[col].length - 1}
                    onChange={next => update(col, next)}
                    onMove={dx => move(col, item.id, dx)}
                    onShift={dy => shift(col, index, dy)}
                    onDelete={() => remove(col, item.id)}
                  />
                ))}
                <Button
                  variant="ghost"
                  icon={PlusIcon}
                  onPress={() => add(col)}
                >
                  Добавить карточку
                </Button>
              </KanbanColumn>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export const Admin: React.FC = () => {
  const [token, setToken] = useState(readToken);

  const login = (next: string) => {
    writeToken(next);
    setToken(next);
  };

  return (
    <View className="flex-1 bg-mist-50 dark:bg-mist-950">
      {token ? (
        <Editor token={token} onLogout={() => login('')} />
      ) : (
        <Login onLogin={login} />
      )}
      <Toaster />
      <PopupHost />
    </View>
  );
};
