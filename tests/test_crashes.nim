import std/[json, os, strutils, tables, times, unittest]
import ../src/tugen_web/crashes

# Отчёт, как его собирает лаунчер (tugen.launcher, src/services/crash/report.ts, buildReport)
proc report(id = repeat('a', 32)): JsonNode =
  %*{
    "schema": 1,
    "id": id,
    "time": 1760000000.5,
    "kind": "native",
    "fatal": true,
    "app": {"version": "v0.1.6 (2a49661)", "bundle": "1111111111111111", "native": "aaaa", "source": "update"},
    "error": {"type": "NativeCrash", "message": "0xC0000005", "frames": []},
    "tags": {"minecraft": "1.21.1"},
  }

let dir = getTempDir() / "tugen_web_crashes_test"

suite "отчёт о сбое":
  test "отчёт лаунчера принимается как есть":
    check parseReport($report()) == report()

  test "чужое и битое — CrashError":
    expect CrashError: discard parseReport("not json")
    expect CrashError: discard parseReport("[]")
    var r = report()
    r["schema"] = %2
    expect CrashError: discard parseReport($r)
    r = report("../../etc/passwd")
    expect CrashError: discard parseReport($r)
    r = report()
    r["kind"] = %"other"
    expect CrashError: discard parseReport($r)
    r = report()
    r["app"] = %*{"version": 1}
    expect CrashError: discard parseReport($r)
    r = report()
    r["tags"] = %*{"x": repeat('x', 300)}
    expect CrashError: discard parseReport($r)
    r = report()
    r["extra"] = %*{"log": repeat('x', 70_000)}
    expect CrashError: discard parseReport($r)

  test "минидамп — по сигнатуре MDMP":
    check isMinidump("MDMP\x93\xa7")
    check not isMinidump("PK\x03\x04zip")
    check not isMinidump("MDMP")

suite "multipart":
  test "поля формы лаунчера (HttpMultipartFormDataContent)":
    let body = "--b0\r\nContent-Disposition: form-data; name=\"minidump\"; filename=\"minidump.dmp\"\r\n" &
      "Content-Type: application/octet-stream\r\n\r\nMDMP\r\n\x00\x01\r\n" &
      "--b0\r\nContent-Type: application/json\r\nContent-Disposition: form-data; name=report\r\n\r\n{\"a\":1}\r\n--b0--\r\n"
    let form = parseMultipart("multipart/form-data; boundary=\"b0\"", body)
    check form["minidump"] == "MDMP\r\n\x00\x01"
    check form["report"] == "{\"a\":1}"

  test "без boundary и незакрытая часть — CrashError":
    expect CrashError: discard parseMultipart("multipart/form-data", "--b0--")
    expect CrashError: discard parseMultipart("multipart/form-data; boundary=b0", "--b0\r\nX: y\r\n\r\nтело")

suite "хранение":
  setup:
    removeDir(dir)
  teardown:
    removeDir(dir)

  test "по дням, новые сверху, минидамп рядом":
    let day = parse("2026-10-11", "yyyy-MM-dd", utc()).toTime
    storeReport(dir, report(repeat('a', 32)), "", day + initDuration(hours = 1))
    storeReport(dir, report(repeat('b', 32)), "MDMP..", day + initDuration(hours = 2))
    let list = listReports(dir, "2026-10-11")
    check list.len == 2
    check list[0]["id"].getStr == repeat('b', 32)
    check list[0]["minidump"].getBool
    check not list[1]["minidump"].getBool
    check listDays(dir) == @["2026-10-11"]
    check readFile(minidumpPath(dir, "2026-10-11", repeat('b', 32))) == "MDMP.."
    check minidumpPath(dir, "2026-10-11", repeat('a', 32)) == ""
    check minidumpPath(dir, "../2026-10-11", repeat('b', 32)) == ""

  test "старше 90 дней удаляются":
    let now = parse("2026-10-11", "yyyy-MM-dd", utc()).toTime
    storeReport(dir, report(), "", now - initDuration(days = 120))
    storeReport(dir, report(), "", now - initDuration(days = 10))
    prune(dir, now)
    check listDays(dir) == @[dayOf(now - initDuration(days = 10))]

suite "частота":
  test "не больше limit за окно, потом снова можно":
    var limiter = initRateLimiter(2, initDuration(minutes = 1))
    let t = fromUnix(1000)
    check limiter.allow("1.2.3.4", t)
    check limiter.allow("1.2.3.4", t)
    check not limiter.allow("1.2.3.4", t)
    check limiter.allow("5.6.7.8", t)
    check limiter.allow("1.2.3.4", t + initDuration(minutes = 2))
