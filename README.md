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
  src/main.tsx          страницы по адресу: /, /business, /developers, /publishers, /uikit, /docs, /admin
  src/site.tsx          шапка с разделами «Для бизнеса», «Для разработчиков», «Для издателей» и подвал
  src/audiences.tsx     страницы разделов: «Для разработчиков» ведёт на UI-kit и документацию, остальные — заглушки
  src/uikit.tsx         /uikit: витрина kit (разделы example/src из пакета @tugen/uikit)
  src/docs.tsx          /docs: сайт документации kit (docs/src из пакета) под шапкой сайта
  src/landing.tsx       лендинг: слева заголовок «А что если лаунчер — …» со сменяющимся окончанием, «Скачать», Discord, роадмап
  src/roadmap.tsx       роадмап-канбан для чтения
  src/admin.tsx         скрытая админка /admin: правка канбана
  src/api.ts            запросы к API бэкенда
  src/icons.tsx         значки: Gravity UI (@gravity-ui/icons), как в лаунчере; Discord — свой знак
  src/global.css        Tailwind и стили веб-слоя kit (@tugen/uikit/web.css)
  vite.config.ts        Vite + React + Tailwind, прокси /api на бэкенд
```

## Работа

Нужны Nim 2.2.12 и Node 22.

```bash
# фронтенд
cd app
yarn install
yarn dev        # dev-сервер Vite, http://localhost:5173
yarn build      # сборка в app/dist
yarn typecheck

# бэкенд (из корня)
nimble test                   # тесты
nim c -d:release -o:tugen_web src/tugen_web.nim
ADMIN_TOKEN=… ./tugen_web     # http://localhost:8080: сайт из app/dist и API
```

`yarn dev` проксирует `/api` на бэкенд (порт 8080) — запустите его рядом.

## Сервер

Сайт крутится в Docker: образ из `Dockerfile` (сайт и бэкенд в одном контейнере), перед ним Caddy на 80/443
(`deploy/compose.yml`, `deploy/Caddyfile`). Образ собирает GitHub Actions при каждом пуше в `main`
(`.github/workflows/deploy.yml`) и публикует в GHCR как `ghcr.io/epic-group12345/tugen.webservices:latest`. На сервере
таймер `tugen-update.timer` каждые 30 секунд подтягивает образ и перезапускает контейнер, только если образ новый
(`deploy/update.sh`). Обновить сайт — значит смёржить в `main`: через пару минут (сборка в Actions и до 30 секунд
ожидания) новая версия на сервере. Если сборка в Actions упала, на сервере остаётся прежняя версия.

Пакет в GHCR должен быть публичным (Package settings → Change visibility), иначе серверу нужен вход: установите с
`GHCR_USER=<логин> GHCR_TOKEN=<токен с read:packages>`.

Установка на чистый сервер (Debian или Ubuntu, root) — одна команда с компьютера, где есть ключ к серверу:

```bash
./deploy/deploy.sh root@176.108.251.224 -i ~/.ssh/ключ_сервера
```

Скрипт ставит Docker, кладёт файлы в `/opt/tugen`, создаёт `/opt/tugen/.env` со случайным `ADMIN_TOKEN`,
скачивает и запускает сайт, включает таймер и в конце печатает токен админки. Повторный запуск безопасен: `.env`
и роадмап (том `web-data`) сохраняются. С доменом — `SITE_ADDRESS=tugen.example.com ./deploy/deploy.sh …`
(A-запись домена должна указывать на сервер): Caddy сам получит сертификат и включит HTTPS. Без домена сайт
открывается по `http://IP`.

Если порт 80 на сервере уже занят (например, nginx с другими сайтами), Caddy не запускается: сайт слушает только
`127.0.0.1:8080` (порт меняет `WEB_PORT` в `/opt/tugen/.env`), а снаружи его отдаёт ваш nginx по примеру
`deploy/nginx-tugen.conf`. Caddy включается строкой `COMPOSE_PROFILES=caddy` в `.env`.

Если домен смотрит на защиту (RT Solar и т. п.), в `/opt/tugen/.env` задаются `TRUSTED_PROXIES` — сети защиты
(у Солара `93.185.164.0/25`), чтобы в журнале Caddy и в бэкенде был адрес посетителя, а не защиты, и
`SITE_TLS="tls /etc/letsencrypt/live/<домен>/fullchain.pem /etc/letsencrypt/live/<домен>/privkey.pem"`, если
Let's Encrypt не достучится до сервера и сертификат выпущен certbot. После продления сертификата —
`docker compose restart caddy`.

На сервере: `journalctl -u tugen-update -f` — журнал обновлений, `cd /opt/tugen && docker compose logs -f` — логи
сайта, `/opt/tugen/update.sh` — обновить сейчас.

## API

| Запрос | Что делает |
| --- | --- |
| `GET /api/health` | `{"ok": true}` |
| `GET /api/roadmap` | доска `{"planned": [...], "progress": [...], "done": [...]}`, карточка — `{id, title, text}` |
| `PUT /api/roadmap` | сохранить доску целиком; нужен `Authorization: Bearer <ADMIN_TOKEN>` |
| `POST /api/admin/session` | проверить токен при входе в админку |
| `POST /api/crash/report` | отчёт о сбое лаунчера, JSON; открыт всем, не чаще 30 в минуту с адреса |
| `POST /api/crash/minidump` | отчёт с минидампом: multipart, поля `report` (JSON) и `minidump` (до 4 МБ) |
| `GET /api/crash/days` | дни, за которые есть отчёты; нужен токен |
| `GET /api/crash/reports?day=ГГГГ-ММ-ДД` | отчёты дня, новые сверху; нужен токен |
| `GET /api/crash/dump?day=…&id=…` | минидамп отчёта файлом; нужен токен |

Доска хранится в `DATA_DIR/roadmap.json` (по умолчанию `data/` рядом с исполняемым файлом, не в git); пока её не
сохранили — показывается доска по умолчанию из `roadmap.nim`. Сервер проверяет присланную доску: только три колонки,
название обязательно (до 120 символов), описание до 500, не больше 100 карточек в колонке.

## Отчёты о сбоях

Лаунчер (tugen.launcher, `src/services/crash`) с согласия игрока шлёт отчёты об ошибках JS, падениях exe и ядра,
вылетах игры. Формат и проверка — `src/tugen_web/crashes.nim`: незнакомую версию отчёта, лишнее и слишком большое
сервер отклоняет с 400, повторы с одного адреса сверх 30 в минуту — с 429 (адрес берётся из `X-Real-IP`, его
ставят Caddy и nginx из `deploy/`). Отчёты лежат в `DATA_DIR/crashes/<день UTC>/<id>.json`, минидамп — рядом
в `<id>.dmp`; старше 90 дней удаляются при приёме нового. IP не сохраняется. Читаются в админке, раздел «Сбои».

## Админка

Страница `/admin`, ссылок на неё с сайта нет. Вход — токен из переменной `ADMIN_TOKEN` бэкенда; без неё админка
выключена: роадмап только читается, отчёты о сбоях принимаются, но прочитать их нельзя. Токен страница держит в
`sessionStorage` до закрытия вкладки. Карточки правятся на месте, стрелками переносятся между колонками и внутри
колонки; изменения уходят на сервер кнопкой «Сохранить». Кнопка «Сбои» (или ссылка `/admin#crashes`) открывает
отчёты лаунчера за неделю или день, с фильтрами по виду сбоя, версии и тексту: одинаковые ошибки сведены в строку
со счётчиком и версиями, по нажатию — стек, журнал игры и минидамп (открывается в Visual Studio или WinDbg с PDB
релиза). Токен должен быть длинным и случайным (`openssl rand -hex 32`): страница скрыта, но не защищена ничем,
кроме него.

Порт — переменная `PORT` (по умолчанию 8080), папка сайта — `STATIC_DIR` (по умолчанию `app/dist` рядом
с исполняемым файлом). Файлы из `assets/` Vite называет по хешу и сервер отдаёт их с вечным кешем,
`index.html` — с `no-cache`, чтобы новая версия сайта была видна сразу.

## Оформление

Элементы — из веб-слоя UI-kit TUGEN ([tugen.uikit](https://github.com/Epic-Group12345/tugen.uikit), `@tugen/uikit/web`):
компоненты React DOM на Radix и Tailwind с теми же вариантами, размерами и цветами, что у лаунчера, поэтому
сайт выглядит как он. react-native-web не используется. Классы Tailwind пишутся целиком, брейкпоинты — обычные
`sm:` / `md:`. Тема — как в системе: `dark:` следует за `prefers-color-scheme`. Шрифты — Ubuntu Sans для текста и Ubuntu Mono для
кода, со своего сервера (`@fontsource-variable/ubuntu-sans`, `@fontsource/ubuntu-mono` в `main.tsx`, `--font-sans` и `--font-mono` в
`global.css`) вместо Segoe UI и Consolas kit.

Кнопка со значком Discord (подсказка «Связаться с разработчиком») открывает профиль разработчика в Discord. Кнопки «Скачать» ведут на последний релиз в
[epic.launcher-releases](https://github.com/Epic-Group12345/epic.launcher-releases): установщик
`tugen-setup-win-x64.exe` и портативный `tugen-portable-win-x64.zip`.

Коммит kit закреплён в `app/package.json`; чтобы взять новый, поменяйте хеш и выполните `yarn install`.
Если после смены хеша в `node_modules/@tugen/uikit` осталась старая версия, yarn взял её из кеша:
`yarn cache clean @tugen/uikit && rm -rf node_modules/@tugen && yarn install`.

Страницы `/uikit` и `/docs` — витрина (`example/`) и документация (`docs/`) из того же пакета kit: пишутся они
в tugen.uikit, а сайт подключает их псевдонимами `@uikit-gallery` и `@uikit-docs` (`vite.config.ts`). Таблицы
свойств документации собирает при сборке плагин kit `docs/props-plugin.ts` из типов компонентов. Новый компонент
или пример в kit появится на сайте после смены коммита kit.
