## Отчёты о сбоях лаунчера TUGEN (tugen.launcher, src/services/crash/report.ts): приём, проверка, хранение.
## Приём открыт всем — адрес вшит в лаунчер, — поэтому храним только отчёты понятной формы и разумного
## размера, а частоту с одного адреса ограничиваем. Читает их админка по токену.
##
## Файлы: DATA_DIR/crashes/<день UTC>/<id>.json и <id>.dmp рядом, если пришёл минидамп. IP не храним

import std/[json, os, strutils, tables, times, algorithm]

const
  reportSchema* = 1
  maxReportBytes* = 64 * 1024
  ## Минидамп без памяти кучи (MiniDumpWithThreadInfo) — сотни килобайт
  maxMinidumpBytes* = 4 * 1024 * 1024
  ## Сколько дней держим отчёты: старше — удаляются при приёме нового
  keepDays* = 90
  kinds = ["js", "native", "core", "abort", "game"]
  appFields = ["version", "bundle", "native", "source"]
  maxText = 8000
  maxShort = 200

type CrashError* = object of ValueError

proc fail(msg: string) {.noreturn.} =
  raise newException(CrashError, msg)

proc isId*(id: string): bool =
  ## id отчёта — 32 шестнадцатеричных знака: из него собирается имя файла
  id.len == 32 and id.allCharsInSet(HexDigits - {'A' .. 'F'})

proc isDay*(day: string): bool =
  try:
    discard parse(day, "yyyy-MM-dd", utc())
    day.len == 10
  except TimeParseError:
    false

proc requireString(node: JsonNode, field: string, limit: int) =
  let value = node{field}
  if value == nil or value.kind != JString: fail("поле " & field & " должно быть строкой")
  if value.getStr.len > limit: fail("поле " & field & " слишком длинное")

proc parseReport*(text: string): JsonNode =
  ## Отчёт лаунчера из JSON или CrashError. Возвращает его как есть: лишних полей лаунчер не шлёт
  if text.len > maxReportBytes: fail("отчёт больше " & $maxReportBytes & " байт")
  try:
    result = parseJson(text)
  except JsonParsingError, ValueError:
    fail("отчёт — не JSON")
  if result.kind != JObject: fail("отчёт должен быть объектом")
  if result{"schema"} == nil or result{"schema"}.kind != JInt or result{"schema"}.getInt != reportSchema:
    fail("незнакомая версия отчёта")
  requireString(result, "id", 32)
  if not isId(result["id"].getStr): fail("неверный id")
  let time = result{"time"}
  if time == nil or time.kind notin {JInt, JFloat}: fail("поле time должно быть числом")
  requireString(result, "kind", 16)
  if result["kind"].getStr notin kinds: fail("неизвестный вид сбоя")
  if result{"fatal"} == nil or result{"fatal"}.kind != JBool: fail("поле fatal должно быть true или false")
  let app = result{"app"}
  if app == nil or app.kind != JObject: fail("поле app должно быть объектом")
  for field in appFields:
    requireString(app, field, maxShort)
  let error = result{"error"}
  if error == nil or error.kind != JObject: fail("поле error должно быть объектом")
  requireString(error, "type", maxShort)
  requireString(error, "message", maxText)
  if error{"frames"} == nil or error{"frames"}.kind != JArray: fail("поле error.frames должно быть массивом")
  let tags = result{"tags"}
  if tags == nil or tags.kind != JObject: fail("поле tags должно быть объектом")
  for key, value in tags:
    if value.kind != JString or value.getStr.len > maxShort: fail("метка " & key & " должна быть короткой строкой")

proc isMinidump*(data: string): bool =
  ## Минидамп Windows начинается с сигнатуры MDMP
  data.len > 4 and data.len <= maxMinidumpBytes and data.startsWith("MDMP")

# --- multipart/form-data ---

proc boundaryOf(contentType: string): string =
  for part in contentType.split(';'):
    let item = part.strip
    if item.toLowerAscii.startsWith("boundary="):
      return item["boundary=".len .. ^1].strip(chars = {'"'})

proc parseMultipart*(contentType, body: string): Table[string, string] =
  ## Поля multipart/form-data: имя → содержимое. Такого шлёт лаунчер (HttpMultipartFormDataContent):
  ## без вложенных частей и без кодировки передачи
  let boundary = boundaryOf(contentType)
  if boundary.len == 0: fail("нет boundary в Content-Type")
  let delimiter = "--" & boundary
  var pos = body.find(delimiter)
  if pos < 0: fail("пустая форма")
  while true:
    pos += delimiter.len
    if body.continuesWith("--", pos):
      break
    let headersEnd = body.find("\r\n\r\n", pos)
    if headersEnd < 0: fail("часть формы без заголовков")
    let next = body.find("\r\n" & delimiter, headersEnd + 4)
    if next < 0: fail("часть формы не закрыта")
    var name = ""
    for line in body[pos ..< headersEnd].splitLines:
      if line.toLowerAscii.startsWith("content-disposition:"):
        for attr in line.split(';'):
          let a = attr.strip
          if a.toLowerAscii.startsWith("name="):
            name = a[5 .. ^1].strip(chars = {'"'})
    if name.len > 0:
      result[name] = body[headersEnd + 4 ..< next]
    pos = next + 2

# --- Хранение ---

proc dayOf*(t: Time): string = t.utc.format("yyyy-MM-dd")

proc storeReport*(dir: string, report: JsonNode, dump: string, received: Time) =
  ## Описание — последним: по нему админка видит готовый отчёт. Через временный файл: оборванная
  ## запись не оставит полфайла под настоящим именем
  let folder = dir / dayOf(received)
  createDir(folder)
  let id = report["id"].getStr
  if dump.len > 0:
    writeFile(folder / id & ".dmp.tmp", dump)
    moveFile(folder / id & ".dmp.tmp", folder / id & ".dmp")
  var stored = report.copy
  stored["received"] = %($received.utc)
  stored["minidump"] = %(dump.len > 0)
  writeFile(folder / id & ".json.tmp", $stored)
  moveFile(folder / id & ".json.tmp", folder / id & ".json")

proc prune*(dir: string, now: Time) =
  ## Удалить дни старше keepDays
  if not dirExists(dir):
    return
  let oldest = dayOf(now - initDuration(days = keepDays))
  for kind, path in walkDir(dir):
    let day = path.extractFilename
    if kind == pcDir and isDay(day) and day < oldest:
      removeDir(path)

proc listReports*(dir, day: string): JsonNode =
  ## Отчёты дня для админки: сами описания (они маленькие), новые сверху
  result = newJArray()
  let folder = dir / day
  if not isDay(day) or not dirExists(folder):
    return
  var reports: seq[JsonNode]
  for kind, path in walkDir(folder):
    if kind == pcFile and path.endsWith(".json"):
      try:
        reports.add parseFile(path)
      except CatchableError:
        discard
  reports.sort(proc (a, b: JsonNode): int = cmp(b{"received"}.getStr, a{"received"}.getStr))
  for r in reports:
    result.add r

proc listDays*(dir: string): seq[string] =
  ## Дни, за которые есть отчёты, новые первыми
  if dirExists(dir):
    for kind, path in walkDir(dir):
      if kind == pcDir and isDay(path.extractFilename):
        result.add path.extractFilename
  result.sort(SortOrder.Descending)

proc minidumpPath*(dir, day, id: string): string =
  ## Путь минидампа или пусто: day и id проверены, за папку отчётов не выйти
  if isDay(day) and isId(id) and fileExists(dir / day / id & ".dmp"):
    dir / day / id & ".dmp"
  else:
    ""

# --- Частота ---

type RateLimiter* = object
  ## Не больше limit отчётов за окно с одного адреса. Адреса живут только в памяти, до конца окна
  limit*: int
  window*: Duration
  started: Time
  counts: Table[string, int]

proc initRateLimiter*(limit: int, window: Duration): RateLimiter =
  RateLimiter(limit: limit, window: window)

proc allow*(limiter: var RateLimiter, key: string, now: Time): bool =
  if now - limiter.started >= limiter.window:
    limiter.started = now
    limiter.counts.clear()
  let n = limiter.counts.getOrDefault(key) + 1
  limiter.counts[key] = n
  n <= limiter.limit
