// ============================================
// КЛЕТКИ УРОВНЯ
// ============================================
// Геометрия тайлов, общая для валидатора и проверки достижимости.
// Помни про дверь: символ D занимает свою клетку и клетку выше,
// поэтому игрок стоит на две клетки выше символа.

export const SOLID_CHARS = new Set(["G", "R"]);

// На чём можно стоять. Двери сюда не входят — у них своя геометрия.
export const SUPPORT_CHARS = new Set(["G", "R", "O", "L", "M", "V", "B"]);

export function tileAt(rows, x, y) {
  if (!Array.isArray(rows) || y < 0 || y >= rows.length || x < 0) {
    return ".";
  }

  return rows[y][x] || ".";
}

export function isSupportChar(char) {
  return SUPPORT_CHARS.has(char);
}

// Есть ли опора под клеткой (x, y): платформа сразу под ней
// или верхняя половина двери, символ которой стоит на две клетки ниже.
export function hasSupportBelow(rows, x, y) {
  if (isSupportChar(tileAt(rows, x, y + 1))) {
    return true;
  }

  return tileAt(rows, x, y + 2) === "D";
}

// Занята ли клетка твёрдым тайлом или закрытой дверью.
// Дверь занимает две клетки: саму клетку символа и клетку выше.
export function isSolidAt(rows, x, y, doorBlocks) {
  if (SOLID_CHARS.has(tileAt(rows, x, y))) {
    return true;
  }

  if (!doorBlocks) {
    return false;
  }

  return tileAt(rows, x, y) === "D" || tileAt(rows, x, y + 1) === "D";
}
