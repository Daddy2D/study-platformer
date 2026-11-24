import { describe, expect, it } from "vitest";
import {
  hasSupportBelow,
  isSolidAt,
  isSupportChar,
  tileAt
} from "../src/core/level-tiles.js";

// Дверь D в (3,2) занимает клетки (3,1) и (3,2),
// поэтому стоять на ней можно в клетке (3,0)
const DOOR_MAP = [
  "..........",
  "..........",
  "...D......",
  "...G......",
  "GGGGGGGGGG"
];

describe("tileAt", () => {
  it("возвращает точку за границами карты", () => {
    expect(tileAt(DOOR_MAP, -1, 0)).toBe(".");
    expect(tileAt(DOOR_MAP, 0, -1)).toBe(".");
    expect(tileAt(DOOR_MAP, 0, 99)).toBe(".");
    expect(tileAt(DOOR_MAP, 3, 2)).toBe("D");
  });

  it("не падает на пустых данных", () => {
    expect(tileAt(null, 0, 0)).toBe(".");
  });
});

describe("isSupportChar", () => {
  it("считает опорой землю, блоки и платформы", () => {
    for (const char of ["G", "R", "O", "L", "M", "V", "B"]) {
      expect(isSupportChar(char), char).toBe(true);
    }
  });

  it("не считает опорой дверь, лестницу и пустоту", () => {
    for (const char of ["D", "H", ".", "P", "X"]) {
      expect(isSupportChar(char), char).toBe(false);
    }
  });
});

describe("hasSupportBelow", () => {
  it("видит землю прямо под клеткой", () => {
    expect(hasSupportBelow(DOOR_MAP, 3, 2)).toBe(true);
    expect(hasSupportBelow(DOOR_MAP, 1, 3)).toBe(true);
  });

  it("видит верхнюю половину двери на две клетки ниже", () => {
    // Стоять на двери можно в клетке (3,0): символ D на две клетки ниже
    expect(hasSupportBelow(DOOR_MAP, 3, 0)).toBe(true);
  });

  it("не считает опорой пустоту", () => {
    expect(hasSupportBelow(DOOR_MAP, 8, 2)).toBe(false);
  });
});

describe("isSolidAt", () => {
  it("считает твёрдыми землю и разрушаемый блок", () => {
    const rows = ["R.........", "GGGGGGGGGG", "..........", ".........."];

    expect(isSolidAt(rows, 0, 0, false)).toBe(true);
    expect(isSolidAt(rows, 0, 1, false)).toBe(true);
  });

  it("не считает твёрдыми платформы", () => {
    const rows = ["O.L.M.V.B.", "GGGGGGGGGG", "..........", ".........."];

    for (let x = 0; x < 9; x += 2) {
      expect(isSolidAt(rows, x, 0, false), String(x)).toBe(false);
    }
  });

  it("закрытая дверь занимает две клетки", () => {
    expect(isSolidAt(DOOR_MAP, 3, 2, true)).toBe(true);
    expect(isSolidAt(DOOR_MAP, 3, 1, true)).toBe(true);
  });

  it("открытая дверь не мешает", () => {
    expect(isSolidAt(DOOR_MAP, 3, 2, false)).toBe(false);
    expect(isSolidAt(DOOR_MAP, 3, 1, false)).toBe(false);
  });
});
