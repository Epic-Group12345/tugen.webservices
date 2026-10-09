import std/[os, unittest]
import ../src/tugen_web/static

let root = getTempDir() / "tugen_web_static_test"

suite "раздача сайта":
  setup:
    createDir(root / "assets")
    createDir(root / "docs")
    writeFile(root / "index.html", "<html>")
    writeFile(root / "assets" / "index-abc.js", "")
    writeFile(root / "docs" / "index.html", "")
    writeFile(getTempDir() / "secret.txt", "")

  teardown:
    removeDir(root)

  test "корень — index.html":
    check resolveStatic(root, "/") == root / "index.html"

  test "файл из assets":
    check resolveStatic(root, "/assets/index-abc.js") == root / "assets/index-abc.js"

  test "папка с index.html":
    check resolveStatic(root, "/docs/") == root / "docs/index.html"

  test "строка запроса не мешает":
    check resolveStatic(root, "/?utm=1") == root / "index.html"

  test "нет файла — пусто":
    check resolveStatic(root, "/missing.js") == ""

  test "за пределы папки не выйти":
    check resolveStatic(root, "/../secret.txt") == ""
    check resolveStatic(root, "/%2e%2e/secret.txt") == ""
    check resolveStatic(root, "/assets/..%2f..%2fsecret.txt") == ""

  test "типы и кеш":
    check mimeType("a/index.html") == "text/html; charset=utf-8"
    check mimeType("a/x.JS") == "text/javascript; charset=utf-8"
    check mimeType("a/x.bin") == "application/octet-stream"
    check cacheControl(root / "assets/index-abc.js") == "public, max-age=31536000, immutable"
    check cacheControl(root / "index.html") == "no-cache"
