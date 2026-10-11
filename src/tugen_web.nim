## Бэкенд веба TUGEN: отдаёт лендинг, собранный Vite в app/dist, и API под /api.
## Запуск: `./tugen_web`; окружение — PORT (8080), STATIC_DIR (app/dist), DATA_DIR (data),
## ADMIN_TOKEN (токен скрытой админки /admin; без него роадмап только читается, а отчёты о сбоях
## принимаются, но не читаются)

import std/[asyncdispatch, asynchttpserver, json, os, sequtils, strutils, tables, times, uri]
import tugen_web/[auth, crashes, roadmap, static]

type Config = object
  root, roadmapFile, crashDir, adminToken: string

# Отчёты о сбоях с одного адреса: лаунчер шлёт не больше 10 за запуск, 30 в минуту — с запасом
var crashLimiter = initRateLimiter(30, initDuration(minutes = 1))

proc loadConfig(): Config =
  Config(
    root: getEnv("STATIC_DIR", getAppDir() / "app" / "dist"),
    roadmapFile: getEnv("DATA_DIR", getAppDir() / "data") / "roadmap.json",
    crashDir: getEnv("DATA_DIR", getAppDir() / "data") / "crashes",
    adminToken: getEnv("ADMIN_TOKEN"),
  )

proc jsonResponse(req: Request, code: HttpCode, body: JsonNode) {.async.} =
  let headers = newHttpHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  })
  await req.respond(code, $body, headers)

proc clientAddress(req: Request): string =
  ## Адрес посетителя для ограничения частоты. Перед бэкендом Caddy или nginx (deploy/), они кладут его
  ## в X-Real-IP. Не X-Forwarded-For: первое значение в нём присылает сам клиент, а последнее за защитой —
  ## адрес защиты, один на всех
  let real = req.headers.getOrDefault("X-Real-IP")
  if real.len > 0: real.strip else: req.hostname

proc receiveCrash(req: Request, cfg: Config, withDump: bool) {.async.} =
  ## Лаунчер на 4xx отчёт выбрасывает, на 5xx и 429 пробует позже (src/services/crash в tugen.launcher)
  let now = getTime()
  if not crashLimiter.allow(clientAddress(req), now):
    await req.jsonResponse(Http429, %*{"error": "слишком часто"})
    return
  try:
    var text, dump: string
    if withDump:
      let form = parseMultipart(req.headers.getOrDefault("Content-Type"), req.body)
      text = form.getOrDefault("report")
      dump = form.getOrDefault("minidump")
      if not isMinidump(dump): raise newException(CrashError, "не минидамп")
    else:
      text = req.body
    let report = parseReport(text)
    prune(cfg.crashDir, now)
    storeReport(cfg.crashDir, report, dump, now)
    await req.jsonResponse(Http201, %*{"id": report["id"]})
  except CrashError as e:
    await req.jsonResponse(Http400, %*{"error": e.msg})

proc handleCrashAdmin(req: Request, cfg: Config) {.async.} =
  let query = toSeq(decodeQuery(req.url.query))
  proc param(name: string): string =
    for (k, v) in query:
      if k == name: return v
  case req.url.path
  of "/api/crash/days":
    await req.jsonResponse(Http200, %listDays(cfg.crashDir))
  of "/api/crash/reports":
    let day = param("day")
    if not isDay(day):
      await req.jsonResponse(Http400, %*{"error": "день — ГГГГ-ММ-ДД"})
    else:
      await req.jsonResponse(Http200, listReports(cfg.crashDir, day))
  of "/api/crash/dump":
    let file = minidumpPath(cfg.crashDir, param("day"), param("id"))
    if file.len == 0:
      await req.jsonResponse(Http404, %*{"error": "нет минидампа"})
    else:
      await req.respond(Http200, readFile(file), newHttpHeaders({
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=\"" & param("id") & ".dmp\"",
        "Cache-Control": "no-store",
      }))
  else:
    await req.jsonResponse(Http404, %*{"error": "not found"})

proc handleApi(req: Request, cfg: Config) {.async.} =
  let path = req.url.path
  let admin = isAdmin(req.headers.getOrDefault("Authorization"), cfg.adminToken)
  if path == "/api/health" and req.reqMethod == HttpGet:
    await req.jsonResponse(Http200, %*{"ok": true})
  elif path == "/api/roadmap" and req.reqMethod == HttpGet:
    await req.jsonResponse(Http200, loadRoadmap(cfg.roadmapFile))
  elif path == "/api/roadmap" and req.reqMethod == HttpPut:
    if not admin:
      await req.jsonResponse(Http401, %*{"error": "нужен токен админки"})
      return
    try:
      let board = validateRoadmap(parseJson(req.body))
      saveRoadmap(cfg.roadmapFile, board)
      await req.jsonResponse(Http200, board)
    except RoadmapError as e:
      await req.jsonResponse(Http400, %*{"error": e.msg})
    except JsonParsingError:
      await req.jsonResponse(Http400, %*{"error": "тело запроса — не JSON"})
  elif path == "/api/crash/report" and req.reqMethod == HttpPost:
    await receiveCrash(req, cfg, withDump = false)
  elif path == "/api/crash/minidump" and req.reqMethod == HttpPost:
    await receiveCrash(req, cfg, withDump = true)
  elif path.startsWith("/api/crash/") and req.reqMethod == HttpGet:
    if not admin:
      await req.jsonResponse(Http401, %*{"error": "нужен токен админки"})
    else:
      await handleCrashAdmin(req, cfg)
  elif path == "/api/admin/session" and req.reqMethod == HttpPost:
    # Проверка токена при входе в админку: страница не знает его правильность сама
    if admin:
      await req.jsonResponse(Http200, %*{"ok": true})
    else:
      await req.jsonResponse(Http401, %*{"error": "неверный токен"})
  else:
    await req.jsonResponse(Http404, %*{"error": "not found"})

proc handleStatic(req: Request, root: string) {.async.} =
  if req.reqMethod notin {HttpGet, HttpHead}:
    await req.respond(Http405, "")
    return
  let file = resolveStatic(root, req.url.path)
  if file.len == 0:
    await req.respond(Http404, "Not found",
      newHttpHeaders({"Content-Type": "text/plain; charset=utf-8"}))
    return
  let headers = newHttpHeaders({
    "Content-Type": mimeType(file),
    "Cache-Control": cacheControl(file),
  })
  await req.respond(Http200, if req.reqMethod == HttpHead: "" else: readFile(file), headers)

proc main() {.async.} =
  let cfg = loadConfig()
  let port = parseInt(getEnv("PORT", "8080"))
  if not dirExists(cfg.root):
    echo "Нет папки сайта ", cfg.root, ": соберите его (cd app && yarn build)"
  if cfg.adminToken.len == 0:
    echo "ADMIN_TOKEN не задан: админка роадмапа выключена"
  # С запасом под минидамп и отчёт в одной форме (crashes.nim)
  let server = newAsyncHttpServer(maxBody = maxMinidumpBytes + maxReportBytes + 64 * 1024)
  server.listen(Port(port))
  echo "TUGEN web: http://localhost:", port, " (сайт из ", cfg.root, ")"
  proc cb(req: Request) {.async, gcsafe.} =
    {.cast(gcsafe).}:
      if req.url.path.startsWith("/api/"):
        await handleApi(req, cfg)
      else:
        await handleStatic(req, cfg.root)
  while true:
    if server.shouldAcceptRequest():
      await server.acceptRequest(cb)
    else:
      await sleepAsync(50)

when isMainModule:
  waitFor main()
