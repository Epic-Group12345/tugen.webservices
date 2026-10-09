## Доступ к админке: один токен из переменной ADMIN_TOKEN, присылается как `Authorization: Bearer …`

import std/strutils

proc constantTimeEq*(a, b: string): bool =
  ## Сравнение за одинаковое время: по времени ответа токен не подобрать посимвольно
  if a.len != b.len:
    return false
  var diff = 0
  for i in 0 ..< a.len:
    diff = diff or (ord(a[i]) xor ord(b[i]))
  diff == 0

proc isAdmin*(authorization, token: string): bool =
  ## Без настроенного токена админки нет вовсе: пустой ADMIN_TOKEN не открывает запись
  if token.len == 0:
    return false
  const prefix = "Bearer "
  if not authorization.startsWith(prefix):
    return false
  constantTimeEq(authorization[prefix.len .. ^1].strip, token)
