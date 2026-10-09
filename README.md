# tugen.webservices

Веб TUGEN: сайт лаунчера на Vite + React. Элементы — из UI-kit TUGEN
([tugen.uikit](https://github.com/Epic-Group12345/tugen.uikit), пакет `@tugen/uikit`) через react-native-web
и Uniwind: те же компоненты, что в самом лаунчере, поэтому сайт выглядит как он.

## Работа

Нужен Node 22.

```bash
yarn install
yarn dev        # dev-сервер Vite, http://localhost:5173
yarn build      # сборка в dist/
yarn typecheck  # после первой сборки: Uniwind пишет uniwind-types.d.ts
```

```
index.html          страница
src/main.tsx        точка входа React
src/landing.tsx     лендинг: шапка, первый экран с макетом лаунчера, возможности, вопросы, «Скачать»
src/icons.tsx       значки страницы (SVG, цвет — класс text-*)
src/global.css      Tailwind + Uniwind и @source на исходники kit
vite.config.ts      настройка как у витрины kit (tugen.uikit/example/vite.config.ts)
```

## Оформление

Классы Uniwind пишутся целиком, как в лаунчере. Брейкпоинты — по `useWindowDimensions`, а не `sm:` / `md:`:
на компонентах React Native они срабатывают не там. Тема — как в системе: `dark:` следует за
`prefers-color-scheme`.

Кнопки «Скачать» ведут на последний релиз в
[epic.launcher-releases](https://github.com/Epic-Group12345/epic.launcher-releases): установщик
`tugen-setup-win-x64.exe` и портативный `tugen-portable-win-x64.zip`.

Коммит kit закреплён в `package.json`; чтобы взять новый, поменяйте хеш и выполните `yarn install`.
