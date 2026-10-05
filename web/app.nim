## Точка входа веб-части на Nim: компилируется в JS (`yarn nim`), Vite собирает результат
import std/dom

proc main() =
  let root = document.getElementById("app")
  if root != nil:
    root.innerHTML = "TUGEN"

main()
