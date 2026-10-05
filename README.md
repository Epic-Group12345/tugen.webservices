# tugen.webservices

Веб-часть лаунчера TUGEN: логика на Nim (компилируется в JS), сборка и dev-сервер — Vite.

## Работа

Нужны Nim 2.2.12 и Node 22.

```bash
yarn install
yarn dev        # Nim → web/generated/app.js, затем dev-сервер Vite
yarn build      # сборка в dist/
```

```
index.html          страница
web/app.nim         точка входа на Nim (std/dom)
web/main.js         подключает собранный из Nim JS для Vite
web/generated/      вывод nim js (не в git)
```

После правки `.nim` перезапусти `yarn nim`: Vite сам подхватит новый JS.

## Оформление

Элементы — из UI-kit TUGEN ([tugen.uikit](https://github.com/Epic-Group12345/tugen.uikit), пакет
`@tugen/uikit`), чтобы веб выглядел как лаунчер. `web/main.js` подключает `@tugen/uikit/css`, а
`web/app.nim` строит страницу процедурами модуля `tugen_uikit` (`button`, `section`, `row`, `toggle`…;
путь к нему добавляет `yarn nim`). Тема — как в системе, `setTheme(ctDark)` задаёт её явно.
