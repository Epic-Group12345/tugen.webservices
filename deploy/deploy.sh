#!/bin/sh
# Ставит веб TUGEN на сервер с вашего компьютера одной командой:
#   ./deploy/deploy.sh root@176.108.251.224 [-i ~/.ssh/ключ]
# Домен (необязательно): SITE_ADDRESS=tugen.example.com ./deploy/deploy.sh root@…
set -eu
host="$1"; shift
dir="$(cd "$(dirname "$0")" && pwd)"
ssh "$@" "$host" 'mkdir -p /tmp/tugen-deploy'
scp -q "$@" "$dir"/compose.yml "$dir"/Caddyfile "$dir"/update.sh "$dir"/install.sh \
  "$dir"/tugen-update.service "$dir"/tugen-update.timer "$host":/tmp/tugen-deploy/
ssh "$@" "$host" "SITE_ADDRESS='${SITE_ADDRESS:-}' sh /tmp/tugen-deploy/install.sh && rm -rf /tmp/tugen-deploy"
