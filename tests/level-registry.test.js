import { describe, expect, it } from "vitest";
import {
  LEVELS,
  LEVEL_NAMES,
  LEVEL_BIOMES,
  LEVEL_BOSS_TYPES,
  LEVEL_META
} from "../src/data/levels/index.js";
import { validateLevelRows } from "../src/core/level-format.js";
import { isFinishReachable } from "../src/core/level-reach.js";
import { sanitizeSettingsOverrides } from "../src/core/settings.js";

// Контрольные суммы карт 1–8: уровни менять нельзя
const BUILTIN_FINGERPRINTS = [
  1225108745,
  1509693233,
  732793567,
  2926242694,
  3449856026,
  964337926,
  1714922135,
  1704112941
];

function fingerprint(rows) {
  let hash = 2166136261;

  for (const char of rows.join("\n")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
}

// Полный набор символов совпадает с TILE_CHARS в src/core/level-format.js
const ALLOWED = new Set("GPXCETSFMVKDBLORHWNZ".split(""));
const BUILTIN_COUNT = 8;

describe("реестр готовых уровней", () => {
  it("содержит шестнадцать уровней с именем и биомом", () => {
    expect(LEVELS).toHaveLength(16);
    expect(LEVEL_NAMES).toHaveLength(16);
    expect(LEVEL_BIOMES).toHaveLength(16);
    expect(LEVEL_BOSS_TYPES).toHaveLength(16);
    expect(LEVEL_META).toHaveLength(16);

    for (const name of LEVEL_NAMES) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("не повторяет имена", () => {
    expect(new Set(LEVEL_NAMES).size).toBe(LEVEL_NAMES.length);
  });

  it("использует только известные биомы", () => {
    for (const biome of LEVEL_BIOMES) {
      expect(["grass", "snow", "castle"]).toContain(biome);
    }
  });

  it("у каждого уровня есть строка «чем интересен»", () => {
    for (const [index, meta] of LEVEL_META.entries()) {
      expect(typeof meta.author, LEVEL_NAMES[index]).toBe("string");
      expect(meta.note.length, LEVEL_NAMES[index]).toBeGreaterThan(0);
    }
  });

  it("авторские настройки уровней проходят проверку значений", () => {
    for (const [index, meta] of LEVEL_META.entries()) {
      if (!meta.settings) {
        continue;
      }

      const clean = sanitizeSettingsOverrides(meta.settings);

      expect(clean, LEVEL_NAMES[index]).toEqual(meta.settings);
    }
  });

  it("держит одинаковую длину строк на каждом уровне", () => {
    for (const [index, rows] of LEVELS.entries()) {
      const width = rows[0].length;

      for (const row of rows) {
        expect(row.length, `уровень ${index + 1}`).toBe(width);
      }
    }
  });

  it("имеет ровно один старт и хотя бы один финиш", () => {
    for (const [index, rows] of LEVELS.entries()) {
      const map = rows.join("");

      expect(map.split("P").length - 1, `уровень ${index + 1}`).toBe(1);
      expect(map.split("X").length - 1, `уровень ${index + 1}`).toBeGreaterThan(0);
    }
  });

  it("не содержит символов вне формата", () => {
    for (const [index, rows] of LEVELS.entries()) {
      for (const char of rows.join("")) {
        const known = char === "." || ALLOWED.has(char);
        expect(known, `уровень ${index + 1}: символ "${char}"`).toBe(true);
      }
    }
  });

  it("не меняет уровни 1–8", () => {
    for (let index = 0; index < BUILTIN_COUNT; index++) {
      expect(fingerprint(LEVELS[index]), `уровень ${index + 1}`).toBe(
        BUILTIN_FINGERPRINTS[index]
      );
    }
  });

  it("держит «Парашютист» и «Парашютист V2» не рядом", () => {
    const first = LEVEL_NAMES.indexOf("Парашютист");
    const second = LEVEL_NAMES.indexOf("Парашютист V2");

    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(Math.abs(first - second)).toBeGreaterThan(1);
  });

  it("финиш достижим на каждом уровне", () => {
    for (const [index, rows] of LEVELS.entries()) {
      expect(
        isFinishReachable(rows).reachable,
        LEVEL_NAMES[index]
      ).toBe(true);
    }
  });

  it("проходит проверку: 1–15 без предупреждений, у 16 только шипы", () => {
    for (const [index, rows] of LEVELS.entries()) {
      const result = validateLevelRows(rows);

      expect(result.errors, LEVEL_NAMES[index]).toEqual([]);

      if (index === 15) {
        expect(result.warnings, LEVEL_NAMES[index]).toEqual([
          "падающая платформа L стоит над шипами S — путь оборвётся"
        ]);
      } else {
        expect(result.warnings, LEVEL_NAMES[index]).toEqual([]);
      }
    }
  });
});
