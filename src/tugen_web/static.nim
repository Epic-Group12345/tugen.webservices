## Раздача собранного фронтенда (app/dist): путь запроса → файл на диске и его тип.
## Чистая логика без сокетов — её проверяют тесты

import std/[os, strutils, uri]

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
}

proc mimeType*(path: string): string =
  ## Тип по расширению; незнакомое отдаём как поток байт, чтобы браузер не угадывал
  let ext = path.splitFile.ext.toLowerAscii
  for (known, mime) in mimeTypes:
    if ext == known:
      return mime
  "application/octet-stream"

proc resolveStatic*(root, requestPath: string): string =
  ## Файл в `root` для пути запроса или "" если такого нет. Путь за пределы `root`
  ## (`..`, закодированные слеши) не выходит: сегменты с `..` и пустые отбрасываются
  var parts: seq[string]
  for raw in requestPath.split('?')[0].split('/'):
    let part = decodeUrl(raw, decodePlus = false)
    if part.len == 0 or part == ".":
      continue
    if part == ".." or '/' in part or '\\' in part or '\0' in part:
      return ""
    parts.add part
  let candidate = if parts.len == 0: root / "index.html" else: root / parts.join("/")
  if fileExists(candidate):
    return candidate
  if dirExists(candidate) and fileExists(candidate / "index.html"):
    return candidate / "index.html"
  ""

proc cacheControl*(path: string): string =
  ## Файлы из assets/ Vite называет по хешу содержимого — их можно кешировать навсегда,
  ## а index.html всегда перепроверять, иначе игрок не увидит новую версию
  if "/assets/" in path.replace('\\', '/'):
    "public, max-age=31536000, immutable"
  else:
    "no-cache"
