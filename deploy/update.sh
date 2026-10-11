#!/bin/sh
# Подтягивает свежий образ сайта из GHCR и перезапускает контейнер, только если образ изменился.
# Запускается таймером tugen-update.timer каждые 30 секунд; ручной запуск: /opt/tugen/update.sh
set -eu
cd /opt/tugen
docker compose pull --quiet
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
