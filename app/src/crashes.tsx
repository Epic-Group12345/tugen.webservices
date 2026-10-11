import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Pill,
  Select,
  Surface,
  Text,
  TextField,
  toast,
} from '@tugen/uikit/web';
import {
  ApiError,
  downloadMinidump,
  fetchCrashDays,
  fetchCrashes,
  type CrashReport,
} from './api';
import { AdminShell, type AdminSection } from './admin-shell';

// Отчёты о сбоях лаунчера в админке: за день или неделю одинаковые ошибки сведены в одну строку со
// счётчиком; фильтры по виду, версии и тексту. Минидамп скачивается файлом — его открывают в Visual Studio
// или WinDbg с PDB релиза

const KIND: Record<CrashReport['kind'], string> = {
  js: 'JS',
  native: 'exe',
  core: 'ядро',
  abort: 'abort',
  game: 'игра',
};

interface Group {
  key: string;
  reports: Loaded[];
}

// Период: последние 7 дней с отчётами или один день
const WEEK = 'week';
const WEEK_DAYS = 7;
const ALL = 'all';

interface Loaded {
  /** День каждого отчёта: минидамп скачивается по дню и id */
  day: string;
  report: CrashReport;
}

const firstLine = (text: string) => text.split('\n')[0].slice(0, 160);

/** Одинаковые ошибки: вид, тип, первая строка текста и место */
const groupKey = (r: CrashReport) => {
  const top = r.error.frames[0];
  return [
    r.kind,
    r.error.type,
    firstLine(r.error.message),
    top ? `${top.function ?? ''}@${top.file ?? ''}:${top.line ?? ''}` : '',
  ].join('|');
};

const where = (r: CrashReport) => {
  const top = r.error.frames[0];
  if (!top) return '';
  if (top.native) return `${top.function ?? '?'} (native)`;
  return `${top.function ?? '?'} ${top.file ?? ''}:${top.line ?? ''}:${
    top.column ?? ''
  }`;
};

const versionOf = (r: CrashReport) => r.app.version || 'dev';

const versions = (reports: Loaded[]) =>
  [...new Set(reports.map(l => versionOf(l.report)))].join(', ');

/** Когда ошибка была в первый и последний раз за период */
const seen = (reports: Loaded[]) => {
  const times = reports.map(l => l.report.received).sort();
  const fmt = (iso: string) => new Date(iso).toLocaleString();
  return times.length > 1
    ? `${fmt(times[0])} — ${fmt(times[times.length - 1])}`
    : fmt(times[0]);
};

const Details: React.FC<{
  token: string;
  day: string;
  report: CrashReport;
}> = ({ token, day, report }) => {
  const log =
    typeof report.extra?.log === 'string' ? (report.extra.log as string) : '';
  return (
    <div className="flex flex-col gap-2">
      <Text tone="muted" size="xs">
        {new Date(report.received).toLocaleString()} ·{' '}
        {report.app.version || 'dev'} · бандл {report.app.bundle || '—'} (
        {report.app.source}) · ядро {report.app.native || '—'}
        {Object.entries(report.tags).map(([k, v]) => ` · ${k} ${v}`)}
      </Text>
      {report.error.message.includes('\n') && (
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
          {report.error.message}
        </pre>
      )}
      {report.error.frames.length > 0 && (
        <pre className="overflow-x-auto text-xs">
          {report.error.frames
            .map(f =>
              f.native
                ? `at ${f.function ?? '?'} (native)`
                : `at ${f.function ?? '?'} (${f.file}:${f.line}:${f.column})`,
            )
            .join('\n')}
        </pre>
      )}
      {log && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
          {log}
        </pre>
      )}
      {report.minidump && (
        <div>
          <Button
            variant="secondary"
            onClick={() =>
              downloadMinidump(token, day, report.id).catch(() =>
                toast({ title: 'Минидамп не скачался', tone: 'danger' }),
              )
            }
          >
            Скачать минидамп
          </Button>
        </div>
      )}
    </div>
  );
};

const GroupCard: React.FC<{ token: string; group: Group }> = ({
  token,
  group,
}) => {
  const [open, setOpen] = useState(false);
  const first = group.reports[0].report;
  return (
    <Surface kind="card" padding="3" className="flex flex-col gap-2">
      <button
        type="button"
        className="flex flex-row items-start gap-3 text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <Text weight="bold" className="w-10 shrink-0 text-right">
          {group.reports.length}
        </Text>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Pill tone={first.fatal ? 'red' : 'amber'}>{KIND[first.kind]}</Pill>
            <Text weight="semibold" className="min-w-0 break-words">
              {first.error.type}: {firstLine(first.error.message)}
            </Text>
          </div>
          <Text tone="muted" size="xs" mono className="break-all">
            {where(first)}
          </Text>
          <Text tone="muted" size="xs">
            {versions(group.reports)} · {seen(group.reports)}
          </Text>
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-4 pl-13">
          {group.reports.slice(0, 20).map(l => (
            <Details
              key={l.report.id}
              token={token}
              day={l.day}
              report={l.report}
            />
          ))}
          {group.reports.length > 20 && (
            <Text tone="muted" size="xs">
              И ещё {group.reports.length - 20}
            </Text>
          )}
        </div>
      )}
    </Surface>
  );
};

const KIND_OPTIONS = [
  { value: ALL, label: 'Все виды' },
  ...(Object.keys(KIND) as CrashReport['kind'][]).map(kind => ({
    value: kind,
    label: KIND[kind],
  })),
];

export const Crashes: React.FC<{
  token: string;
  onLogout: () => void;
  onSection: (section: AdminSection) => void;
}> = ({ token, onLogout, onSection }) => {
  const [days, setDays] = useState<string[] | null>(null);
  const [period, setPeriod] = useState(WEEK);
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const [kind, setKind] = useState(ALL);
  const [version, setVersion] = useState(ALL);
  const [query, setQuery] = useState('');

  const failed = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      toast({ title: 'Токен больше не действует', tone: 'danger' });
      onLogout();
    } else {
      toast({ title: 'Не удалось загрузить отчёты', tone: 'danger' });
    }
  };

  useEffect(() => {
    fetchCrashDays(token).then(setDays).catch(failed);
  }, [token]);

  useEffect(() => {
    if (!days) return;
    const wanted = period === WEEK ? days.slice(0, WEEK_DAYS) : [period];
    let cancelled = false;
    setLoaded(null);
    Promise.all(
      wanted.map(day =>
        fetchCrashes(token, day).then(list =>
          list.map(report => ({ day, report })),
        ),
      ),
    )
      .then(parts => {
        if (!cancelled) setLoaded(parts.flat());
      })
      .catch(failed);
    return () => {
      cancelled = true;
    };
  }, [token, days, period]);

  const versionOptions = useMemo(() => {
    const list = [...new Set((loaded ?? []).map(l => versionOf(l.report)))];
    list.sort().reverse();
    return [
      { value: ALL, label: 'Все версии' },
      ...list.map(v => ({ value: v, label: v })),
    ];
  }, [loaded]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (loaded ?? []).filter(({ report: r }) => {
      if (kind !== ALL && r.kind !== kind) return false;
      if (version !== ALL && versionOf(r) !== version) return false;
      if (!text) return true;
      return `${r.error.type} ${r.error.message} ${where(r)}`
        .toLowerCase()
        .includes(text);
    });
  }, [loaded, kind, version, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const l of filtered) {
      const key = groupKey(l.report);
      const group = map.get(key) ?? { key, reports: [] };
      group.reports.push(l);
      map.set(key, group);
    }
    return [...map.values()].sort(
      (a, b) => b.reports.length - a.reports.length,
    );
  }, [filtered]);

  const periodOptions = [
    { value: WEEK, label: 'Последние 7 дней' },
    ...(days ?? []).map(d => ({ value: d, label: d })),
  ];

  return (
    <AdminShell section="crashes" onSection={onSection} onLogout={onLogout}>
      <div className="flex flex-col gap-0.5">
        <Text as="h1" size="2xl" weight="bold">
          Сбои лаунчера
        </Text>
        <Text tone="muted">
          {loaded
            ? `${filtered.length} отчётов, ${groups.length} разных ошибок`
            : 'Загружаем…'}
        </Text>
      </div>
      {days && days.length > 0 && (
        <div className="flex flex-row flex-wrap items-center gap-2">
          <div className="w-full md:w-52">
            <Select
              options={periodOptions}
              value={period}
              onChange={setPeriod}
              aria-label="Период"
            />
          </div>
          <div className="w-full md:w-52">
            <Select
              options={KIND_OPTIONS}
              value={kind}
              onChange={setKind}
              aria-label="Вид сбоя"
            />
          </div>
          <div className="w-full md:w-52">
            <Select
              options={versionOptions}
              value={version}
              onChange={setVersion}
              aria-label="Версия"
            />
          </div>
          <div className="min-w-48 flex-1">
            <TextField
              value={query}
              onChangeText={setQuery}
              type="search"
              placeholder="Текст ошибки или место"
              aria-label="Поиск"
            />
          </div>
        </div>
      )}
      {days && days.length === 0 && <Text tone="muted">Отчётов пока нет.</Text>}
      {loaded && loaded.length > 0 && groups.length === 0 && (
        <Text tone="muted">Под фильтр ничего не попало.</Text>
      )}
      {groups.map(g => (
        <GroupCard key={g.key} token={token} group={g} />
      ))}
    </AdminShell>
  );
};
