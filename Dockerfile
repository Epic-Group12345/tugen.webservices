# syntax=docker/dockerfile:1
# Образ веба TUGEN: сайт (Vite) и бэкенд на Nim в одном контейнере.
# Собирается в GitHub Actions (.github/workflows/deploy.yml) и публикуется в GHCR; сервер подтягивает его сам.

# Сайт: git нужен yarn, чтобы взять @tugen/uikit из GitHub
FROM node:22-bookworm AS app
WORKDIR /src/app
COPY app/package.json app/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY app/ ./
RUN yarn build

# Бэкенд: образ Nim на bookworm, той же glibc, что и у итогового образа
FROM nimlang/nim:2.2.12 AS server
WORKDIR /src
COPY tugen_web.nimble ./
COPY src/ src/
RUN nim c --hints:off -d:release -o:/out/tugen_web src/tugen_web.nim

FROM debian:bookworm-slim
RUN useradd --system --uid 10001 --home-dir /srv tugen \
  && mkdir -p /data && chown tugen /data
WORKDIR /srv
COPY --from=server /out/tugen_web ./tugen_web
COPY --from=app /src/app/dist ./app/dist
ENV PORT=8080 STATIC_DIR=/srv/app/dist DATA_DIR=/data
# Роадмап из админки — в томе, чтобы пережить обновление образа
VOLUME /data
USER tugen
EXPOSE 8080
CMD ["./tugen_web"]
