## Точка входа веб-части на Nim: компилируется в JS (`yarn nim`), Vite собирает результат.
## Элементы — из UI-kit TUGEN (`tugen_uikit`, классы из `@tugen/uikit/css`), как в лаунчере
import std/dom
import tugen_uikit

proc main() =
  let root = document.getElementById("app")
  if root == nil:
    return
  mount(document.body)
  root.add emptyState(
    "<svg viewBox=\"0 0 16 16\"><path d=\"M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5zM5 8h6M8 5v6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg>",
    "TUGEN", "Веб-часть лаунчера: скоро здесь появятся сервисы")

main()
