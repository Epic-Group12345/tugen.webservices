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
