## Бэкенд веба TUGEN: отдаёт лендинг, собранный Vite в app/dist, и API под /api.
## Запуск: `nimble run` (порт — PORT, по умолчанию 8080; папка сайта — STATIC_DIR)

import std/[asyncdispatch, asynchttpserver, json, os, strutils]
import tugen_web/static

proc staticRoot(): string =
  getEnv("STATIC_DIR", getAppDir() / "app" / "dist")

proc jsonResponse(req: Request, code: HttpCode, body: JsonNode) {.async.} =
  let headers = newHttpHeaders({"Content-Type": "application/json; charset=utf-8"})
  await req.respond(code, $body, headers)

proc handle(req: Request, root: string) {.async, gcsafe.} =
  let path = req.url.path
  if path == "/api/health":
    await req.jsonResponse(Http200, %*{"ok": true})
    return
  if path.startsWith("/api/"):
    await req.jsonResponse(Http404, %*{"error": "not found"})
    return
  if req.reqMethod notin {HttpGet, HttpHead}:
    await req.respond(Http405, "")
    return
  let file = resolveStatic(root, path)
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
  let root = staticRoot()
  let port = parseInt(getEnv("PORT", "8080"))
  if not dirExists(root):
    echo "Нет папки сайта ", root, ": соберите его (cd app && yarn build)"
  let server = newAsyncHttpServer()
  server.listen(Port(port))
  echo "TUGEN web: http://localhost:", port, " (сайт из ", root, ")"
  proc cb(req: Request) {.async, gcsafe.} =
    await handle(req, root)
  while true:
    if server.shouldAcceptRequest():
      await server.acceptRequest(cb)
    else:
      await sleepAsync(50)

when isMainModule:
  waitFor main()
