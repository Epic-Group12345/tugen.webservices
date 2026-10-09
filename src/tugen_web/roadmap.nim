## Роадмап лендинга: три колонки канбана (запланировано, в работе, готово) в JSON-файле.
## Читают все, меняет админка целиком: присылает доску, сервер проверяет её и сохраняет

import std/[json, os, strutils, unicode]

const
  columns* = ["planned", "progress", "done"]
  maxItems = 100
  maxTitle = 120
  maxText = 500
  maxId = 64

type RoadmapError* = object of ValueError

proc item(id, title, text: string): JsonNode =
  %*{"id": id, "title": title, "text": text}

proc defaultRoadmap*(): JsonNode =
  ## Доска, пока админка её не сохранила: порядок работ из продуктового плана
  %*{
    "planned": [
      item("together", "Вместе", "«Играть на сервере» и «Зайти к другу» одной кнопкой, приглашения, Discord"),
      item("beta", "Бета", "Скорость запуска, память, списки и сеть"),
      item("skins", "Скины", "Свои скины и плащи прямо в лаунчере"),
    ],
    "progress": [
      item("microsoft", "Вход через Microsoft", "Лицензионный аккаунт без браузера"),
      item("migrate", "Переезд", "Импорт из Prism, MultiMC, Modrinth App, CurseForge и TLauncher, модпаки .mrpack"),
    ],
    "done": [
      item("servers", "Каталог серверов", "Фильтры, отзывы, вайпы и свои метки"),
      item("builds", "Сборки", "Fabric и Forge, моды в общем хранилище"),
      item("friends", "Друзья и звонки", "Чаты и звонки с показом экрана"),
    ],
  }

proc fail(msg: string) {.noreturn.} =
  raise newException(RoadmapError, msg)

proc cleanString(node: JsonNode, field: string, limit: int, required: bool): string =
  let value = node{field}
  if value == nil or value.kind != JString:
    if required: fail("поле " & field & " должно быть строкой")
    return ""
  result = strutils.strip(value.getStr)
  if validateUtf8(result) != -1: fail("поле " & field & " не в UTF-8")
  if required and result.len == 0: fail("поле " & field & " пустое")
  # Лимит в символах, а не байтах: кириллица занимает по два байта
  if result.runeLen > limit: fail("поле " & field & " длиннее " & $limit & " символов")

proc validateRoadmap*(input: JsonNode): JsonNode =
  ## Доска из запроса админки → чистая доска (только известные поля) или RoadmapError
  if input == nil or input.kind != JObject: fail("ожидается объект")
  result = newJObject()
  var seen: seq[string]
  for col in columns:
    let list = input{col}
    if list == nil or list.kind != JArray: fail("колонка " & col & " должна быть массивом")
    if list.len > maxItems: fail("в колонке " & col & " больше " & $maxItems & " карточек")
    var clean = newJArray()
    for node in list:
      if node.kind != JObject: fail("карточка должна быть объектом")
      let id = cleanString(node, "id", maxId, true)
      if id in seen: fail("повтор id " & id)
      seen.add id
      clean.add item(id, cleanString(node, "title", maxTitle, true),
        cleanString(node, "text", maxText, false))
    result[col] = clean

proc loadRoadmap*(path: string): JsonNode =
  ## Сохранённая доска; нет файла или он испорчен — доска по умолчанию, чтобы лендинг не пустел
  if not fileExists(path):
    return defaultRoadmap()
  try:
    validateRoadmap(parseFile(path))
  except CatchableError:
    defaultRoadmap()

proc saveRoadmap*(path: string, board: JsonNode) =
  ## Пишем во временный файл и переименовываем: оборванная запись не испортит доску
  createDir(path.parentDir)
  let tmp = path & ".tmp"
  writeFile(tmp, board.pretty)
  moveFile(tmp, path)
