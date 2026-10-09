## Бэкенд веба TUGEN: отдаёт лендинг, собранный Vite в app/dist, и API под /api.
## Запуск: `./tugen_web`; окружение — PORT (8080), STATIC_DIR (app/dist), DATA_DIR (data),
## ADMIN_TOKEN (токен скрытой админки /admin; без него роадмап только читается)

import std/[asyncdispatch, asynchttpserver, json, os, strutils]
import tugen_web/[auth, roadmap, static]

type Config = object
  root, roadmapFile, adminToken: string

proc loadConfig(): Config =
  Config(
    root: getEnv("STATIC_DIR", getAppDir() / "app" / "dist"),
    roadmapFile: getEnv("DATA_DIR", getAppDir() / "data") / "roadmap.json",
    adminToken: getEnv("ADMIN_TOKEN"),
  )

proc jsonResponse(req: Request, code: HttpCode, body: JsonNode) {.async.} =
  let headers = newHttpHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  })
  await req.respond(code, $body, headers)

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
  let server = newAsyncHttpServer(maxBody = 1024 * 1024)
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
