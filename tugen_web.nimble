# Бэкенд веба TUGEN: HTTP-сервер на Nim, отдаёт собранный лендинг из app/dist и API
version       = "0.1.0"
author        = "TUGEN"
description   = "Бэкенд веба TUGEN"
license       = "Proprietary"
srcDir        = "src"
bin           = @["tugen_web"]

requires "nim >= 2.2.0"

task test, "Тесты бэкенда":
  exec "nim c -r --hints:off tests/test_static.nim"
  exec "nim c -r --hints:off tests/test_roadmap.nim"
