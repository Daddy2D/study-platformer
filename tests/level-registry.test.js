import { describe, expect, it } from "vitest";
import {
  LEVELS,
  LEVEL_NAMES,
  LEVEL_BIOMES,
  LEVEL_BOSS_TYPES,
  LEVEL_META
} from "../src/data/levels/index.js";
import { validateLevelRows } from "../src/core/level-format.js";
import { LEVEL_1 } from "../src/data/levels/level1.js";
import { LEVEL_2 } from "../src/data/levels/level2.js";
import { LEVEL_3 } from "../src/data/levels/level3.js";
import { LEVEL_4 } from "../src/data/levels/level4.js";
import { LEVEL_5 } from "../src/data/levels/level5.js";
import { LEVEL_6 } from "../src/data/levels/level6.js";
import { LEVEL_7 } from "../src/data/levels/level7.js";
import { LEVEL_8 } from "../src/data/levels/level8.js";

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
    const original = [
      LEVEL_1,
      LEVEL_2,
      LEVEL_3,
      LEVEL_4,
      LEVEL_5,
      LEVEL_6,
      LEVEL_7,
      LEVEL_8
    ];

    for (let index = 0; index < BUILTIN_COUNT; index++) {
      expect(LEVELS[index], `уровень ${index + 1}`).toBe(original[index]);
    }
  });

  it("держит «Парашютист» и «Парашютист V2» не рядом", () => {
    const first = LEVEL_NAMES.indexOf("Парашютист");
    const second = LEVEL_NAMES.indexOf("Парашютист V2");

    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(Math.abs(first - second)).toBeGreaterThan(1);
  });

  it("проходит проверку без ошибок, а первые восемь — без предупреждений", () => {
    for (const [index, rows] of LEVELS.entries()) {
      const result = validateLevelRows(rows);

      expect(result.errors, LEVEL_NAMES[index]).toEqual([]);

      if (index < BUILTIN_COUNT) {
        expect(result.warnings, LEVEL_NAMES[index]).toEqual([]);
      }
    }
  });
});
