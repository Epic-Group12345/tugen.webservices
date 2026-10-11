// API бэкенда на Nim (src/tugen_web.nim): роадмап читают все, меняет скрытая админка по токену

export type ColumnId = 'planned' | 'progress' | 'done';

export interface RoadmapItem {
  id: string;
  title: string;
  text: string;
}

export type Roadmap = Record<ColumnId, RoadmapItem[]>;

export const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: 'planned', title: 'Запланировано' },
  { id: 'progress', title: 'В работе' },
  { id: 'done', title: 'Готово' },
];

/** Ответ сервера с кодом, по которому админка понимает, что токен больше не годится */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Ошибка ${res.status}`, res.status);
  }
  return body as T;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const fetchRoadmap = () => request<Roadmap>('/api/roadmap');

export const checkToken = (token: string) =>
  request<{ ok: true }>('/api/admin/session', {
    method: 'POST',
    headers: auth(token),
    // asynchttpserver требует Content-Length у POST: пустое тело его не всегда получает
    body: '{}',
  });

export const saveRoadmap = (token: string, board: Roadmap) =>
  request<Roadmap>('/api/roadmap', {
    method: 'PUT',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });

// Отчёты о сбоях лаунчера (src/tugen_web/crashes.nim): шлёт лаунчер, читает админка

export interface CrashFrame {
  function?: string;
  file?: string;
  line?: number;
  column?: number;
  native?: boolean;
}

export interface CrashReport {
  id: string;
  /** Время сбоя у игрока, секунды */
  time: number;
  /** Когда сервер принял отчёт, ISO */
  received: string;
  kind: 'js' | 'native' | 'core' | 'abort' | 'game';
  fatal: boolean;
  app: { version: string; bundle: string; native: string; source: string };
  error: { type: string; message: string; frames: CrashFrame[] };
  tags: Record<string, string>;
  extra?: Record<string, unknown>;
  minidump: boolean;
}

export const fetchCrashDays = (token: string) =>
  request<string[]>('/api/crash/days', { headers: auth(token) });

export const fetchCrashes = (token: string, day: string) =>
  request<CrashReport[]>(`/api/crash/reports?day=${encodeURIComponent(day)}`, {
    headers: auth(token),
  });

/** Скачать минидамп: ссылкой нельзя — нужен заголовок с токеном */
export const downloadMinidump = async (
  token: string,
  day: string,
  id: string,
) => {
  const res = await fetch(
    `/api/crash/dump?day=${encodeURIComponent(day)}&id=${encodeURIComponent(
      id,
    )}`,
    { headers: auth(token) },
  );
  if (!res.ok) throw new ApiError(`Ошибка ${res.status}`, res.status);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `${id}.dmp`;
  link.click();
  URL.revokeObjectURL(url);
};
