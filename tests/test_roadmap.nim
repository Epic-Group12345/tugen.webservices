import std/[json, os, strutils, unittest]
import ../src/tugen_web/[auth, roadmap]

suite "роадмап":
  test "доска по умолчанию проходит проверку":
    let board = defaultRoadmap()
    check validateRoadmap(board) == board

  test "лишние поля отбрасываются, пробелы срезаются":
    let board = validateRoadmap(%*{
      "planned": [{"id": "a", "title": "  Скины ", "text": "x", "evil": 1}],
      "progress": [], "done": []})
    check board["planned"][0] == %*{"id": "a", "title": "Скины", "text": "x"}

  test "ошибки структуры":
    expect RoadmapError: discard validateRoadmap(%*{"planned": []})
    expect RoadmapError: discard validateRoadmap(%*[1])
    expect RoadmapError: discard validateRoadmap(%*{
      "planned": [{"id": "a", "title": ""}], "progress": [], "done": []})
    expect RoadmapError: discard validateRoadmap(%*{
      "planned": [{"id": "a", "title": "x"}], "progress": [{"id": "a", "title": "y"}], "done": []})

  test "лимит в символах, а не байтах":
    let title = repeat("ж", 120)
    check validateRoadmap(%*{
      "planned": [{"id": "a", "title": title}], "progress": [], "done": []})["planned"][0]["title"].getStr == title
    expect RoadmapError: discard validateRoadmap(%*{
      "planned": [{"id": "a", "title": title & "ж"}], "progress": [], "done": []})

  test "сохранение и чтение":
    let path = getTempDir() / "tugen_web_roadmap_test" / "roadmap.json"
    removeDir(path.parentDir)
    check loadRoadmap(path) == defaultRoadmap()
    let board = %*{"planned": [], "progress": [], "done": [{"id": "x", "title": "Готово", "text": ""}]}
    saveRoadmap(path, board)
    check loadRoadmap(path) == board
    writeFile(path, "{испорчен")
    check loadRoadmap(path) == defaultRoadmap()
    removeDir(path.parentDir)

suite "доступ к админке":
  test "токен":
    check isAdmin("Bearer s3cret", "s3cret")
    check not isAdmin("Bearer wrong!", "s3cret")
    check not isAdmin("s3cret", "s3cret")
    check not isAdmin("", "s3cret")

  test "без ADMIN_TOKEN админки нет":
    check not isAdmin("Bearer ", "")
    check not isAdmin("Bearer x", "")
