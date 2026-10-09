# tugen.webservices

Веб TUGEN: бэкенд на Nim в корне репозитория и фронтенд на Vite + React в `app/`.

```
tugen_web.nimble        пакет бэкенда
src/tugen_web.nim       HTTP-сервер: отдаёт app/dist и API под /api (пока /api/health)
src/tugen_web/static.nim путь запроса → файл сайта, тип и кеш (без выхода за пределы папки)
tests/                  тесты бэкенда
app/                    фронтенд: Vite + React на UI-kit TUGEN
  src/landing.tsx       лендинг: шапка, первый экран с макетом лаунчера, возможности, вопросы, «Скачать»
  src/icons.tsx         значки страницы (SVG, цвет — класс text-*)
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
nim c -r tests/test_static.nim               # тесты
nim c -d:release -o:tugen_web src/tugen_web.nim
./tugen_web     # http://localhost:8080: сайт из app/dist и /api/health
```

Порт — переменная `PORT` (по умолчанию 8080), папка сайта — `STATIC_DIR` (по умолчанию `app/dist` рядом
с исполняемым файлом). Файлы из `assets/` Vite называет по хешу и сервер отдаёт их с вечным кешем,
`index.html` — с `no-cache`, чтобы новая версия сайта была видна сразу.

## Оформление

Элементы — из UI-kit TUGEN ([tugen.uikit](https://github.com/Epic-Group12345/tugen.uikit), пакет `@tugen/uikit`)
через react-native-web и Uniwind: те же компоненты, что в лаунчере, поэтому сайт выглядит как он. Классы
Uniwind пишутся целиком. Брейкпоинты — по `useWindowDimensions`, а не `sm:` / `md:`: на компонентах React
Native они срабатывают не там. Тема — как в системе: `dark:` следует за `prefers-color-scheme`.

Кнопки «Скачать» ведут на последний релиз в
[epic.launcher-releases](https://github.com/Epic-Group12345/epic.launcher-releases): установщик
`tugen-setup-win-x64.exe` и портативный `tugen-portable-win-x64.zip`.

Коммит kit закреплён в `app/package.json`; чтобы взять новый, поменяйте хеш и выполните `yarn install`.
