import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { validateLevelRows } from "../src/core/level-format.js";
import { isFinishReachable } from "../src/core/level-reach.js";

const PACK_FILE = "src/data/challenge-pack.json";
const pack = JSON.parse(fs.readFileSync(PACK_FILE, "utf8"));

describe("пак «Испытания»", () => {
  it("это пак из пятидесяти уровней", () => {
    expect(pack.type).toBe("pack");
    expect(pack.name).toBe("Испытания");
    expect(pack.levels).toHaveLength(50);
  });

  it("имена уникальны и содержат номер", () => {
    const names = pack.levels.map(level => level.name);

    expect(new Set(names).size).toBe(50);
    expect(names[0]).toContain("01");
    expect(names[49]).toContain("50");
  });

  it("уровни идут по порядку", () => {
    pack.levels.forEach((level, index) => {
      expect(level.order).toBe(index);
    });
  });

  it("каждый уровень без ошибок, предупреждений и с достижимым финишем", () => {
    pack.levels.forEach(level => {
      const check = validateLevelRows(level.rows);

      expect(check.errors, level.name).toEqual([]);
      expect(check.warnings, level.name).toEqual([]);
      expect(isFinishReachable(level.rows).reachable, level.name).toBe(true);
    });
  });

  it("имена не длиннее лимита сорока символов", () => {
    pack.levels.forEach(level => {
      expect(level.name.length, level.name).toBeLessThanOrEqual(40);
    });
  });

  it("названия соответствуют содержимому карт", () => {
    for (const level of pack.levels) {
      const map = level.rows.join("");

      if (level.name.includes("Пилы")) expect(map, level.name).toContain("W");
      if (level.name.includes("Пушки")) expect(map, level.name).toContain("N");
      if (level.name.includes("Стрелки")) expect(map, level.name).toContain("T");
      if (level.name.includes("Лестницы")) expect(map, level.name).toContain("H");
      if (level.name.includes("Батуты")) expect(map, level.name).toContain("B");
      if (level.name.includes("Падающие")) expect(map, level.name).toContain("L");
      if (level.name.includes("Шипы")) expect(map, level.name).toContain("S");
      if (level.name.includes("Подъёмник")) expect(map, level.name).toMatch(/[MV]/);
      if (level.name.includes("Босс")) expect(map, level.name).toContain("Z");

      if (level.name.includes("Ключ и дверь")) {
        expect(map, level.name).toContain("K");
        expect(map, level.name).toContain("D");
      }
    }
  });

  it("охватывает все механики, а в финале есть пушки и падающие", () => {
    const all = pack.levels.map(level => level.rows.join("")).join("");
    const lastTen = pack.levels.slice(40).map(level => level.rows.join("")).join("");

    for (const char of ["B", "K", "D", "Z", "H", "S", "W", "N", "T", "L", "M", "O"]) {
      expect(all, char).toContain(char);
    }

    expect(lastTen, "пушки").toContain("N");
    expect(lastTen, "падающие").toContain("L");
    expect(pack.levels[49].rows.join("")).toContain("Z");
  });
});
