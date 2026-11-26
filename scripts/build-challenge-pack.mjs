// ============================================
// СБОРКА ПАКА «ИСПЫТАНИЯ» (50 уровней)
// ============================================
// Генерирует пак JSON для импорта в редакторе.
// Каждый уровень проверяется валидатором и эвристикой достижимости:
// ошибок быть не должно, финиш обязан быть достижим.
// Сложность растёт от разминки к финальным аренам с боссами.

import fs from "node:fs";
import path from "node:path";
import { validateLevelRows } from "../src/core/level-format.js";
import { isFinishReachable } from "../src/core/level-reach.js";

const SEED = 20261126;
const PACK_NAME = "Испытания";
const OUT_FILE = path.join("src", "data", "challenge-pack.json");

const TIER_NOTES = [
  "Разминка: прыжки, монеты и первые шипы.",
  "Снежные вершины: шипы, стрелки и скользкие прыжки.",
  "Каменный замок: пилы, пушки и ключи.",
  "Сложнее: узкие прыжки и перекрёстный огонь.",
  "Финальные испытания: всё сразу."
];

const TIER_WORDS = ["разминка", "лёгкое", "среднее", "сложное", "финал"];

function mulberry32(seed) {
  let value = seed >>> 0;

  return function random() {
    value += 0x6d2b79f5;
    let result = value;

    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLevel(n, random) {
  const tier = Math.min(4, Math.floor((n - 1) / 10));
  const bossLevel = n % 10 === 0;
  const width = 50 + tier * 6 + Math.floor(random() * 7);
  const height = 13 + Math.floor(random() * 3);
  const floorTop = height - 3;
  const ground = height - 2;

  const rows = Array.from({ length: height }, () => new Array(width).fill("."));

  const get = (x, y) =>
    x >= 0 && x < width && y >= 0 && y < height ? rows[y][x] : ".";
  const set = (x, y, char) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      rows[y][x] = char;
    }
  };

  for (let x = 0; x < width; x++) {
    set(x, ground, "G");
    set(x, height - 1, "G");
  }

  set(2, floorTop, "P");
  set(width - 3, floorTop, "X");

  const arenaStart = bossLevel ? width - 17 : width;
  const limit = arenaStart - 4;

  // ---------- опасности на пути ----------

  let x = 6;

  while (x < limit) {
    const roll = random();

    // Шипы
    if (roll < 0.18 + tier * 0.03) {
      const size =
        tier === 0
          ? 1 + Math.floor(random() * 2)
          : 2 + Math.floor(random() * 3);

      if (x + size < limit) {
        for (let i = 0; i < size; i++) {
          set(x + i, floorTop, "S");
        }

        x += size + 2;
        continue;
      }
    }

    // Яма
    if (roll < 0.42 + tier * 0.03) {
      const gap = 2 + Math.floor(random() * (tier >= 2 ? 4 : 3));

      if (x + gap < limit) {
        for (let i = 0; i < gap; i++) {
          set(x + i, ground, ".");
          set(x + i, height - 1, ".");
          set(x + i, floorTop - 1, "C");
        }

        const bridge = random();

        if (gap >= 4 && bridge < 0.35) {
          set(x + 1, floorTop, "O");
        } else if (tier >= 1 && gap >= 3 && bridge < 0.6) {
          for (let i = 1; i < gap - 1; i++) {
            set(x + i, floorTop, "L");
          }
        } else if (tier >= 2 && gap >= 4 && bridge < 0.8) {
          set(x + 1, floorTop, "M");
        }

        x += gap + 2;
        continue;
      }
    }

    // Батут с высокими монетами
    if (roll < 0.5) {
      if (get(x, floorTop) === "." && get(x, floorTop - 1) === ".") {
        set(x, floorTop, "B");
        set(x + 1, floorTop - 4, "G");
        set(x + 2, floorTop - 4, "G");
        set(x + 1, floorTop - 5, "C");
        set(x + 2, floorTop - 5, "C");
        x += 4;
        continue;
      }
    }

    // Площадка со стрелком
    if (roll < 0.58 + tier * 0.02) {
      if (get(x, floorTop) === "." && get(x, floorTop - 2) === ".") {
        set(x, floorTop - 2, "G");
        set(x + 1, floorTop - 2, "G");
        set(x, floorTop - 3, "T");
        x += 3;
        continue;
      }
    }

    // Пила на земле (со среднего уровня)
    if (tier >= 1 && roll < 0.64 + tier * 0.02) {
      if (get(x, floorTop) === "." && get(x + 1, floorTop) === ".") {
        set(x, floorTop, "W");
        x += 3;
        continue;
      }
    }

    // Пушка (со второго уровня пака)
    if (tier >= 2 && roll < 0.70 + tier * 0.03) {
      if (get(x, floorTop) === ".") {
        set(x, floorTop, "N");
        x += 3;
        continue;
      }
    }

    // Лестница вверх с монетами
    if (roll < 0.86) {
      if (get(x, floorTop) === ".") {
        for (let i = 0; i < 5; i++) {
          set(x, floorTop - i, "H");
        }

        set(x, floorTop - 6, "C");
        x += 3;
        continue;
      }
    }

    // Враг
    if (roll < 0.93) {
      if (get(x, floorTop) === ".") {
        set(x, floorTop, "E");
        x += 2;
        continue;
      }
    }

    // Монета на земле
    if (get(x, floorTop) === ".") {
      set(x, floorTop, "C");
    }

    x += 1;
  }

  // ---------- дверь и ключ ----------

  if (!bossLevel && tier >= 1) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const doorX =
        Math.round(width * (0.4 + attempt * 0.04)) +
        Math.floor(random() * 4);

      const doorFree =
        doorX > 12 &&
        doorX < limit - 6 &&
        get(doorX, ground) === "G" &&
        get(doorX, height - 1) === "G" &&
        get(doorX, floorTop) === "." &&
        get(doorX, floorTop - 1) === "." &&
        get(doorX, floorTop - 2) === ".";

      if (!doorFree) {
        continue;
      }

      // Стена над дверью высокая: двойным прыжком не перепрыгнуть
      const wallTop = floorTop - 6;
      let wallFree = wallTop > 0;

      for (let y = floorTop - 2; y >= wallTop; y--) {
        if (get(doorX, y) !== ".") {
          wallFree = false;
        }
      }

      if (!wallFree) {
        continue;
      }

      const keyX = doorX - 6 - Math.floor(random() * 4);

      const keyPlaced =
        keyX > 5 &&
        get(keyX, floorTop) === "." &&
        get(keyX, ground) === "G";

      if (!keyPlaced) {
        continue;
      }

      set(keyX, floorTop, "K");
      set(doorX, floorTop, "D");

      for (let y = floorTop - 2; y >= wallTop; y--) {
        set(doorX, y, "G");
      }

      break;
    }
  }

  // ---------- чекпоинты ----------

  for (let checkX = 22; checkX < width - 10; checkX += 16) {
    const spot = checkX + Math.floor(random() * 4);

    if (
      get(spot, floorTop) === "." &&
      get(spot, ground) === "G" &&
      get(spot, height - 1) === "G"
    ) {
      set(spot, floorTop, "F");
    }
  }

  // ---------- арена босса ----------

  if (bossLevel) {
    for (let bx = arenaStart; bx < width; bx++) {
      set(bx, ground, "G");
      set(bx, height - 1, "G");

      for (let y = 0; y < ground; y++) {
        if (get(bx, y) !== "P" && get(bx, y) !== "X") {
          set(bx, y, ".");
        }
      }
    }

    set(2, floorTop, "P");
    set(width - 3, floorTop, "X");
    set(width - 7, floorTop, "Z");
    set(width - 12, floorTop - 3, "G");
    set(width - 11, floorTop - 3, "G");
    set(width - 10, floorTop - 3, "G");
    set(width - 9, floorTop - 5, "C");
    set(width - 8, floorTop - 5, "C");
  }

  return rows.map(row => row.join(""));
}

function fallbackLevel() {
  const rows = Array.from({ length: 12 }, () => ".".repeat(24));

  rows[9] = ".P......C...........X...";
  rows[10] = "GGGGGGGGGGGGGGGGGGGGGGGG";
  rows[11] = "GGGGGGGGGGGGGGGGGGGGGGGG";

  return rows;
}

function nameFor(n, rows) {
  const number = String(n).padStart(2, "0");
  const tier = Math.min(4, Math.floor((n - 1) / 10));
  const count = char => rows.join("").split(char).length - 1;
  const suffix = " · " + TIER_WORDS[tier];

  const feature =
    count("Z") > 0
      ? "Босс"
      : count("D") > 0
        ? "Ключ и дверь"
        : count("W") > 0
          ? "Пилы"
          : count("N") > 0
            ? "Пушки"
            : count("T") > 0
              ? "Стрелки"
              : count("L") > 0
                ? "Падающие"
                : count("M") > 0 || count("V") > 0
                  ? "Подъёмник"
                  : count("H") > 0
                    ? "Лестницы"
                    : count("B") > 0
                      ? "Батуты"
                      : count("S") > 0
                        ? "Шипы"
                        : "Разминка";

  return `Испытание ${number} — ${feature}${suffix}`;
}

function biomeFor(n) {
  const tier = Math.min(4, Math.floor((n - 1) / 10));

  if (tier === 0) return "grass";
  if (tier === 1) return "snow";
  if (tier === 2) return "castle";
  if (tier === 3) return "castle";

  return n % 2 === 0 ? "castle" : "snow";
}

function noteFor(n) {
  const tier = Math.min(4, Math.floor((n - 1) / 10));
  const boss = n % 10 === 0;

  if (boss) {
    return `${TIER_NOTES[tier]} В конце арена с боссом.`;
  }

  if (tier === 0 && n <= 2) {
    return "Разминка: прыжки, монеты и первые шипы.";
  }

  return TIER_NOTES[tier];
}

function main() {
  const levels = [];
  const report = [];

  for (let n = 1; n <= 50; n++) {
    let rows = null;
    let attempt = 0;
    let warnings = [];

    while (attempt < 40) {
      const candidate = buildLevel(n, mulberry32(SEED + n * 1000 + attempt));
      const check = validateLevelRows(candidate);

      if (check.errors.length === 0 && isFinishReachable(candidate).reachable) {
        rows = candidate;
        warnings = check.warnings;
        break;
      }

      attempt += 1;
    }

    if (!rows) {
      rows = fallbackLevel();
      report.push(`${n}: запасной простой уровень`);
    }

    levels.push({
      version: 1,
      name: nameFor(n, rows),
      biome: biomeFor(n),
      author: "",
      note: noteFor(n),
      order: n - 1,
      rows: rows,
      updatedAt: SEED
    });

    const tries = attempt + 1;
    report.push(
      `${String(n).padStart(2, "0")} ${biomeFor(n)} ` +
        `${rows[0].length}×${rows.length} попыток: ${tries}` +
        (warnings.length ? ` предупреждения: ${warnings.join("; ")}` : "")
    );
  }

  const pack = {
    version: 1,
    type: "pack",
    name: PACK_NAME,
    author: "",
    levels: levels
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(pack, null, 1), "utf8");

  console.log(`Готово: ${OUT_FILE} — ${levels.length} уровней`);
  console.log(report.join("\n"));
}

main();
