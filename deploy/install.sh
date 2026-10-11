#!/bin/sh
# Установка веба TUGEN на сервер (Debian/Ubuntu, root). Выполняется на сервере из папки с файлами deploy/;
# обычно её запускает deploy.sh с вашего компьютера. Повторный запуск безопасен: .env и данные сохраняются.
#   SITE_ADDRESS=tugen.example.com ./install.sh   — с доменом (HTTPS); без него сайт работает по http на IP
set -eu
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo '> Ставлю Docker'
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
# Пакет в GHCR приватный — нужен токен с read:packages: GHCR_USER=… GHCR_TOKEN=… ./install.sh
if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:?нужен GHCR_USER}" --password-stdin
fi

mkdir -p /opt/tugen
install -m 644 compose.yml Caddyfile /opt/tugen/
install -m 755 update.sh /opt/tugen/
# Следы прежней схемы, где образ собирался на сервере
rm -f /opt/tugen/.rev /opt/tugen/.failed
install -m 644 tugen-update.service tugen-update.timer /etc/systemd/system/

# Токен админки создаётся один раз и остаётся при переустановке
if [ ! -f /opt/tugen/.env ]; then
  umask 077
  printf 'ADMIN_TOKEN=%s\nSITE_ADDRESS=%s\n' "$(od -An -tx1 -N32 /dev/urandom | tr -d " \n")" "${SITE_ADDRESS:-:80}" > /opt/tugen/.env
  # Порт 80 занят (например, nginx с другими сайтами) — Caddy не ставим, проксировать будет тот сервер
  if ss -Hltn 'sport = :80' | grep -q .; then
    echo '> Порт 80 занят: Caddy не запускаю, подключите сайт к своему nginx (deploy/nginx-tugen.conf)'
  else
    echo 'COMPOSE_PROFILES=caddy' >> /opt/tugen/.env
  fi
  echo '> Создан /opt/tugen/.env с новым ADMIN_TOKEN'
elif [ -n "${SITE_ADDRESS:-}" ]; then
  sed -i "s|^SITE_ADDRESS=.*|SITE_ADDRESS=$SITE_ADDRESS|" /opt/tugen/.env
fi

# Таймер включается до первого запуска: если тот упадёт (например, занят порт), обновления всё равно пойдут.
# Первый запуск — через тот же юнит: таймер может стартовать его сразу, а systemd не даст двум запускам пересечься
systemctl daemon-reload
systemctl enable --now tugen-update.timer
systemctl start tugen-update.service

echo '> Готово. Токен админки (/admin):'
grep '^ADMIN_TOKEN=' /opt/tugen/.env | cut -d= -f2
