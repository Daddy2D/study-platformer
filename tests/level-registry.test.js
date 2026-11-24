import { describe, expect, it } from "vitest";
import {
  LEVELS,
  LEVEL_NAMES,
  LEVEL_BIOMES,
  LEVEL_BOSS_TYPES
} from "../src/data/levels/index.js";
import { validateLevelRows } from "../src/core/level-format.js";

// Полный набор символов совпадает с TILE_CHARS в js/world.js
const ALLOWED = new Set("GPXCETSFMVKDBLORHWNZ".split(""));

describe("реестр готовых уровней", () => {
  it("содержит восемь уровней с именем и биомом", () => {
    expect(LEVELS).toHaveLength(8);
    expect(LEVEL_NAMES).toHaveLength(8);
    expect(LEVEL_BIOMES).toHaveLength(8);
    expect(LEVEL_BOSS_TYPES).toHaveLength(8);

    for (const name of LEVEL_NAMES) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("использует только известные биомы", () => {
    for (const biome of LEVEL_BIOMES) {
      expect(["grass", "snow", "castle"]).toContain(biome);
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

  it("проходит проверку без ошибок и предупреждений", () => {
    for (const [index, rows] of LEVELS.entries()) {
      const result = validateLevelRows(rows);

      expect(result.errors, LEVEL_NAMES[index]).toEqual([]);
      expect(result.warnings, LEVEL_NAMES[index]).toEqual([]);
    }
  });
});
