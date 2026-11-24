import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL_WIDTH,
  normalizeLevelRows,
  sanitizeLevel
} from "../src/core/storage.js";

const GOOD_ROWS = [
  "........",
  "..P.....",
  "....X...",
  "........"
];

describe("normalizeLevelRows", () => {
  it("дополняет короткие строки точками", () => {
    const rows = normalizeLevelRows(["........", "...", "....X...", "........"]);

    expect(rows).toEqual([
      "........",
      "........",
      "....X...",
      "........"
    ]);
  });

  it("отклоняет карту шире допустимой", () => {
    const long = ".".repeat(MAX_LEVEL_WIDTH + 10);

    expect(normalizeLevelRows([long, long, long, long])).toBeNull();
  });

  it("отклоняет карту ниже четырёх строк", () => {
    expect(normalizeLevelRows(["........", "..P.....", "....X..."])).toBeNull();
  });

  it("отклоняет карту уже восьми клеток", () => {
    expect(
      normalizeLevelRows([".....", "..P..", "....X", "....."])
    ).toBeNull();
  });

  it("отклоняет не строки и не массивы", () => {
    expect(normalizeLevelRows(["........", null, "....X...", "........"])).toBeNull();
    expect(normalizeLevelRows("........")).toBeNull();
  });

  it("возвращает копию строк, а не исходный массив", () => {
    const source = GOOD_ROWS.slice();
    const rows = normalizeLevelRows(source);

    expect(rows).toEqual(GOOD_ROWS);
    expect(rows).not.toBe(source);
  });
});

describe("sanitizeLevel", () => {
  it("оставляет только известные поля и обрезает имя", () => {
    const name = "Очень длинное название уровня, которое не помещается";

    const level = sanitizeLevel({
      name: name,
      rows: GOOD_ROWS,
      biome: "snow",
      author: "Влад",
      note: "секрет",
      history: "мусор"
    });

    expect(level.name).toBe(name.slice(0, 40));
    expect(level.rows).toEqual(GOOD_ROWS);
    expect(level.biome).toBe("snow");
    expect(level.author).toBe("Влад");
    expect(level.note).toBe("секрет");
    expect(level).not.toHaveProperty("history");
  });

  it("подставляет обычное имя и биом", () => {
    const level = sanitizeLevel({ name: "   ", rows: GOOD_ROWS, biome: "unknown" });

    expect(level.name).toBe("Мой уровень");
    expect(level.biome).toBe("grass");
  });

  it("выдаёт id, если его нет", () => {
    const level = sanitizeLevel({ rows: GOOD_ROWS });

    expect(level.id).toMatch(/^lvl_\d+_[a-z0-9]+$/);
  });

  it("сохраняет существующий id", () => {
    const level = sanitizeLevel({ id: "lvl_1_abc", rows: GOOD_ROWS });

    expect(level.id).toBe("lvl_1_abc");
  });

  it("сохраняет автора и описание", () => {
    const level = sanitizeLevel({
      rows: GOOD_ROWS,
      author: "Влад",
      note: "три прыжка и батут"
    });

    expect(level.author).toBe("Влад");
    expect(level.note).toBe("три прыжка и батут");
  });

  it("подставляет пустые строки старым уровням без автора", () => {
    const level = sanitizeLevel({ rows: GOOD_ROWS });

    expect(level.author).toBe("");
    expect(level.note).toBe("");
  });

  it("возвращает null для карты неверного формата", () => {
    expect(sanitizeLevel(null)).toBeNull();
    expect(sanitizeLevel({ rows: [".....", "..P..", "....X", "....."] })).toBeNull();
  });
});
