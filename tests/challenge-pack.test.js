import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { validateLevelRows } from "../src/core/level-format.js";
import { isFinishReachable } from "../src/core/level-reach.js";

const PACK_FILE = "packs/Испытания.json";
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

  it("каждый уровень без ошибок и с достижимым финишем", () => {
    pack.levels.forEach(level => {
      const check = validateLevelRows(level.rows);

      expect(check.errors, level.name).toEqual([]);
      expect(isFinishReachable(level.rows).reachable, level.name).toBe(true);
    });
  });

  it("сложность растёт: в конце есть боссы и пилы", () => {
    const last = pack.levels[49];
    const first = pack.levels[0];

    expect(last.rows.join("")).toContain("Z");
    expect(first.rows.join("")).not.toContain("Z");
    expect(last.rows.join("")).toContain("W");
  });
});
