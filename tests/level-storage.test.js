import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL_WIDTH,
  deleteCustomLevel,
  deleteCustomResult,
  getCustomLevel,
  getCustomResults,
  normalizeLevelRows,
  sanitizeLevel,
  saveCustomLevel,
  saveCustomResult
} from "../src/core/storage.js";

// В Node нет localStorage: подменяем на хранилище в памяти
const memory = new Map();

globalThis.localStorage = {
  getItem: key => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => {
    memory.set(key, String(value));
  },
  removeItem: key => {
    memory.delete(key);
  }
};

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
    expect(level.pack).toBe("");
  });

  it("сохраняет название пака", () => {
    const level = sanitizeLevel({ rows: GOOD_ROWS, pack: "  Работы детей  " });

    expect(level.pack).toBe("Работы детей");
  });

  it("возвращает null для карты неверного формата", () => {
    expect(sanitizeLevel(null)).toBeNull();
    expect(sanitizeLevel({ rows: [".....", "..P..", "....X", "....."] })).toBeNull();
  });
});

describe("сохранение своего уровня", () => {
  it("сохраняет автора, описание и пак", () => {
    const saved = saveCustomLevel({
      name: "  Тест  ",
      rows: GOOD_ROWS,
      biome: "snow",
      author: "  Влад  ",
      note: "  батут  ",
      pack: "  Работы детей  "
    });

    expect(saved.author).toBe("Влад");
    expect(saved.note).toBe("батут");
    expect(saved.pack).toBe("Работы детей");
    expect(saved.name).toBe("Тест");

    const restored = getCustomLevel(saved.id);

    expect(restored).not.toBeNull();
    expect(restored.author).toBe("Влад");
    expect(restored.note).toBe("батут");
    expect(restored.pack).toBe("Работы детей");
  });
});

describe("результаты своих уровней", () => {
  it("запоминает прохождение и лучшее время", () => {
    saveCustomResult("lvl_1", { frames: 2000 });
    saveCustomResult("lvl_1", { frames: 1500 });
    saveCustomResult("lvl_1", { frames: 1700 });

    expect(getCustomResults().lvl_1).toEqual({
      completed: true,
      bestTimeFrames: 1500
    });
  });

  it("удаляет результат вместе с уровнем", () => {
    const saved = saveCustomLevel({ name: "Тест", rows: GOOD_ROWS });

    saveCustomResult(saved.id, { frames: 900 });
    expect(getCustomResults()[saved.id]).toBeDefined();

    deleteCustomLevel(saved.id);

    expect(getCustomResults()[saved.id]).toBeUndefined();
  });

  it("умеет удалить результат отдельно", () => {
    saveCustomResult("lvl_2", { frames: 100 });
    deleteCustomResult("lvl_2");

    expect(getCustomResults().lvl_2).toBeUndefined();
  });
});
