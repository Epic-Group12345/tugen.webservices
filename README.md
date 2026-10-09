# tugen.webservices

Веб TUGEN: бэкенд на Nim в корне репозитория и фронтенд на Vite + React в `app/`.

```
tugen_web.nimble        пакет бэкенда
src/tugen_web.nim       HTTP-сервер: отдаёт app/dist и API под /api
src/tugen_web/static.nim путь запроса → файл сайта, тип и кеш (без выхода за пределы папки)
src/tugen_web/roadmap.nim роадмап: проверка доски, чтение и запись data/roadmap.json
src/tugen_web/auth.nim  токен админки
tests/                  тесты бэкенда
app/                    фронтенд: Vite + React на UI-kit TUGEN
  src/landing.tsx       лендинг: TUGEN по центру, «Скачать» и значок Discord разработчика, портативная версия, роадмап
  src/roadmap.tsx       роадмап-канбан для чтения
  src/admin.tsx         скрытая админка /admin: правка канбана
  src/api.ts            запросы к API бэкенда
  src/icons.tsx         значки: Gravity UI (@gravity-ui/icons), как в лаунчере; Discord — свой знак
  src/global.css        Tailwind + Uniwind и @source на исходники kit
  vite.config.ts        настройка как у витрины kit (tugen.uikit/example/vite.config.ts)
```

## Работа

Нужны Nim 2.2.12 и Node 22.

```bash
# фронтенд
cd app
yarn install
yarn dev        # dev-сервер Vite, http://localhost:5173
yarn build      # сборка в app/dist
yarn typecheck  # после первой сборки: Uniwind пишет uniwind-types.d.ts

# бэкенд (из корня)
nim c -r tests/test_static.nim && nim c -r tests/test_roadmap.nim   # тесты
nim c -d:release -o:tugen_web src/tugen_web.nim
ADMIN_TOKEN=… ./tugen_web     # http://localhost:8080: сайт из app/dist и API
```

`yarn dev` проксирует `/api` на бэкенд (порт 8080) — запустите его рядом.

## API

| Запрос | Что делает |
| --- | --- |
| `GET /api/health` | `{"ok": true}` |
| `GET /api/roadmap` | доска `{"planned": [...], "progress": [...], "done": [...]}`, карточка — `{id, title, text}` |
| `PUT /api/roadmap` | сохранить доску целиком; нужен `Authorization: Bearer <ADMIN_TOKEN>` |
| `POST /api/admin/session` | проверить токен при входе в админку |

Доска хранится в `DATA_DIR/roadmap.json` (по умолчанию `data/` рядом с исполняемым файлом, не в git); пока её не
сохранили — показывается доска по умолчанию из `roadmap.nim`. Сервер проверяет присланную доску: только три колонки,
название обязательно (до 120 символов), описание до 500, не больше 100 карточек в колонке.

## Админка

Страница `/admin`, ссылок на неё с сайта нет. Вход — токен из переменной `ADMIN_TOKEN` бэкенда; без неё админка
выключена и роадмап только читается. Токен страница держит в `sessionStorage` до закрытия вкладки. Карточки
правятся на месте, стрелками переносятся между колонками и внутри колонки; изменения уходят на сервер кнопкой
«Сохранить». Токен должен быть длинным и случайным (`openssl rand -hex 32`): страница скрыта, но не защищена
ничем, кроме него.

Порт — переменная `PORT` (по умолчанию 8080), папка сайта — `STATIC_DIR` (по умолчанию `app/dist` рядом
с исполняемым файлом). Файлы из `assets/` Vite называет по хешу и сервер отдаёт их с вечным кешем,
`index.html` — с `no-cache`, чтобы новая версия сайта была видна сразу.

## Оформление

Элементы — из UI-kit TUGEN ([tugen.uikit](https://github.com/Epic-Group12345/tugen.uikit), пакет `@tugen/uikit`)
через react-native-web и Uniwind: те же компоненты, что в лаунчере, поэтому сайт выглядит как он. Классы
Uniwind пишутся целиком. Брейкпоинты — по `useWindowDimensions`, а не `sm:` / `md:`: на компонентах React
Native они срабатывают не там. Тема — как в системе: `dark:` следует за `prefers-color-scheme`.

Кнопка со значком Discord (подсказка «Связаться с разработчиком») открывает профиль разработчика в Discord. Кнопки «Скачать» ведут на последний релиз в
[epic.launcher-releases](https://github.com/Epic-Group12345/epic.launcher-releases): установщик
`tugen-setup-win-x64.exe` и портативный `tugen-portable-win-x64.zip`.

Коммит kit закреплён в `app/package.json`; чтобы взять новый, поменяйте хеш и выполните `yarn install`.
