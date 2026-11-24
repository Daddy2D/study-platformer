// ============================================
// ФОРМАТ УРОВНЯ
// ============================================
// Единственное описание того, как выглядит карта и JSON уровня.
// Игра, редактор, хранилище и тесты пользуются этими функциями,
// чтобы проверки не расходились.

import { isFinishReachable } from "./level-reach.js";
import { hasSupportBelow, tileAt } from "./level-tiles.js";

// Какие символы можно использовать в карте уровня
export const TILE_CHARS = new Set([
  "G", // земля
  "P", // старт игрока
  "C", // монета
  "E", // обычный враг
  "T", // стреляющий враг
  "S", // шипы
  "F", // чекпоинт
  "M", // движущаяся платформа (по горизонтали)
  "V", // движущаяся платформа (по вертикали)
  "K", // ключ
  "D", // дверь
  "B", // батут
  "L", // падающая платформа
  "O", // платформа в одну сторону
  "R", // разрушаемый блок
  "H", // лестница
  "W", // пила
  "N", // пушка
  "Z", // босс
  "X"  // финишный флаг
]);

export const EMPTY_TILE = ".";

export const LEVEL_BIOMES = ["grass", "snow", "castle"];

export const LEVEL_LIMITS = {
  version: 1,
  minWidth: 8,
  maxWidth: 120,
  minHeight: 4,
  maxHeight: 40,
  maxName: 40,
  maxAuthor: 24,
  maxNote: 80
};

// Что считается опорой под ногами, знает level-tiles.js.

// Приводим карту к прямоугольнику: строки одинаковой длины, только строки.
export function normalizeLevelRows(rows) {
  if (!Array.isArray(rows) || rows.length < LEVEL_LIMITS.minHeight) {
    return null;
  }

  if (rows.length > LEVEL_LIMITS.maxHeight) {
    return null;
  }

  if (rows.some(row => typeof row !== "string")) {
    return null;
  }

  const width = Math.max(...rows.map(row => row.length));

  if (width < LEVEL_LIMITS.minWidth || width > LEVEL_LIMITS.maxWidth) {
    return null;
  }

  return rows.map(row => (row + EMPTY_TILE.repeat(width)).slice(0, width));
}

function cleanText(value, limit) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, limit);
}

// JSON уровня → нормализованный уровень.
// Возвращает { level, errors }: level === null, если карту не прочитать.
export function parseLevel(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { level: null, errors: ["это не объект уровня"] };
  }

  const rows = normalizeLevelRows(raw.rows);

  if (!rows) {
    return {
      level: null,
      errors: [
        "карта должна быть массивом строк от " +
          `${LEVEL_LIMITS.minHeight} до ${LEVEL_LIMITS.maxHeight} строк ` +
          `шириной от ${LEVEL_LIMITS.minWidth} до ${LEVEL_LIMITS.maxWidth} клеток`
      ]
    };
  }

  return {
    level: {
      version: Number.isInteger(raw.version) ? raw.version : LEVEL_LIMITS.version,
      name: cleanText(raw.name, LEVEL_LIMITS.maxName) || "Мой уровень",
      biome: LEVEL_BIOMES.includes(raw.biome) ? raw.biome : "grass",
      author: cleanText(raw.author, LEVEL_LIMITS.maxAuthor),
      note: cleanText(raw.note, LEVEL_LIMITS.maxNote),
      rows: rows,
      updatedAt: Number(raw.updatedAt) || Date.now()
    },
    errors: []
  };
}

export function countTiles(rows) {
  const counts = {};

  for (const char of TILE_CHARS) {
    counts[char] = 0;
  }

  counts[EMPTY_TILE] = 0;

  for (const row of rows) {
    for (const char of row) {
      counts[char] = (counts[char] || 0) + 1;
    }
  }

  return counts;
}

function findByChar(rows, char) {
  const found = [];

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === char) {
        found.push({ x: x, y: y });
      }
    }
  });

  return found;
}

// Проверка карты: ошибки не дают сохранить уровень,
// предупреждения — повод посмотреть внимательнее.
export function validateLevelRows(rawRows) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(rawRows) || rawRows.length < LEVEL_LIMITS.minHeight) {
    return {
      errors: ["карта должна быть массивом строк высотой не меньше " + LEVEL_LIMITS.minHeight],
      warnings: []
    };
  }

  if (rawRows.length > LEVEL_LIMITS.maxHeight) {
    errors.push("строк больше " + LEVEL_LIMITS.maxHeight);
  }

  if (rawRows.some(row => typeof row !== "string")) {
    return { errors: ["карта должна состоять из строк"], warnings: [] };
  }

  const width = Math.max(...rawRows.map(row => row.length));

  if (rawRows.some(row => row.length !== width)) {
    errors.push("строки разной длины — выровняй карту");
  }

  if (width < LEVEL_LIMITS.minWidth) {
    errors.push("карта уже " + LEVEL_LIMITS.minWidth + " клеток");
  }

  if (width > LEVEL_LIMITS.maxWidth) {
    errors.push("карта шире " + LEVEL_LIMITS.maxWidth + " клеток");
  }

  const rows = rawRows;

  const counts = countTiles(rows);
  const starts = findByChar(rows, "P");
  const finishes = findByChar(rows, "X");
  const bosses = findByChar(rows, "Z");
  const doors = findByChar(rows, "D");
  const keys = findByChar(rows, "K");

  const unknown = [];

  for (const char of Object.keys(counts)) {
    if (char !== EMPTY_TILE && !TILE_CHARS.has(char)) {
      unknown.push(char);
    }
  }

  if (unknown.length > 0) {
    errors.push("неизвестные символы: " + unknown.join(" "));
  }

  if (starts.length !== 1) {
    errors.push("нужен ровно один старт P");
  }

  if (finishes.length === 0) {
    errors.push("нужен финиш X");
  }

  if (bosses.length > 1) {
    errors.push("босс Z должен быть один");
  }

  if (finishes.length > 1) {
    warnings.push("финишей несколько, лучше оставить один");
  }

  if ((counts.G || 0) === 0) {
    warnings.push("на карте нет земли G");
  }

  if (starts.length === 1) {
    const start = starts[0];

    if (!hasSupportBelow(rows, start.x, start.y)) {
      warnings.push("под стартом P нет опоры — игрок сразу упадёт");
    }

    if (tileAt(rows, start.x, start.y + 1) === "L") {
      warnings.push("старт P стоит на падающей платформе L — она исчезнет");
    }
  }

  if (doors.length > 0 && keys.length === 0) {
    warnings.push("есть дверь D, но нет ключа K");
  }

  for (const door of doors) {
    const aboveDoor = tileAt(rows, door.x, door.y - 2);

    // Над дверью должна быть именно земля: платформа или блок
    // дают обход, а не стену. Сверху карты потолка нет, поэтому
    // дверь у самой кромки тоже можно обойти.
    if (aboveDoor !== "G") {
      warnings.push("над дверью D нет земли — её можно перепрыгнуть");
      break;
    }
  }

  const doorStacked = doors.some(door => {
    const neighbors = [
      tileAt(rows, door.x, door.y - 1),
      tileAt(rows, door.x, door.y + 1)
    ];

    return neighbors.includes("D");
  });

  if (doorStacked) {
    warnings.push("двери D стоят друг на друге");
  }

  for (const boss of bosses) {
    if (!hasSupportBelow(rows, boss.x, boss.y)) {
      warnings.push("под боссом Z нет земли — он может упасть");
      break;
    }
  }

  if (bosses.length > 0 && tileAt(rows, bosses[0].x, bosses[0].y - 1) === "G") {
    warnings.push("над боссом Z мало места — поставь его ниже");
  }

  for (const finish of finishes) {
    if (!hasSupportBelow(rows, finish.x, finish.y)) {
      warnings.push("финиш X висит в воздухе — к нему не добраться");
      break;
    }
  }

  const sawBuried = findByChar(rows, "W").some(saw => {
    return (
      tileAt(rows, saw.x, saw.y - 1) === "G" &&
      tileAt(rows, saw.x - 1, saw.y) === "G" &&
      tileAt(rows, saw.x + 1, saw.y) === "G"
    );
  });

  if (sawBuried) {
    warnings.push("пила W вкопана в землю — её не видно");
  }

  const fallingOverSpikes = findByChar(rows, "L").some(platform => {
    return tileAt(rows, platform.x, platform.y + 1) === "S";
  });

  if (fallingOverSpikes) {
    warnings.push("падающая платформа L стоит над шипами S — путь оборвётся");
  }

  const unreachable =
    starts.length === 1 &&
    finishes.length > 0 &&
    !isFinishReachable(rows).reachable;

  if (unreachable) {
    warnings.push("финиш X недостижим: проверь прыжки, лестницы и платформы");
  }

  return { errors: errors, warnings: warnings };
}
