#!/bin/sh
# Следит за веткой main: при новом коммите пересобирает образ из GitHub и перезапускает сайт.
# Запускается таймером tugen-update.timer каждые 30 секунд; ручной запуск: /opt/tugen/update.sh
set -eu
cd /opt/tugen
repo=https://github.com/Epic-Group12345/tugen.webservices.git
rev=$(git ls-remote "$repo" refs/heads/main | cut -f1)
[ -n "$rev" ] || { echo 'Не удалось узнать коммит main'; exit 1; }

# Коммит уже собран или его сборка уже падала — пересобирать нечего, только держим контейнеры запущенными
if [ "$rev" = "$(cat .rev 2>/dev/null)" ] || [ "$rev" = "$(cat .failed 2>/dev/null)" ]; then
  docker compose up -d --no-build --remove-orphans >/dev/null 2>&1 || true
  exit 0
fi

echo "> Сборка $rev"
if ! docker compose build --pull web; then
  echo "$rev" > .failed
  echo "Сборка $rev не удалась, на сервере остаётся прежняя версия"
  exit 1
fi
docker compose up -d --remove-orphans
echo "$rev" > .rev
rm -f .failed
docker image prune -f >/dev/null
docker builder prune -f --filter until=168h >/dev/null
