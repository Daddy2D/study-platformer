import { describe, expect, it } from "vitest";
import {
  buildPack,
  parsePack,
  sortLevelsByPack
} from "../src/core/level-pack.js";

const ROWS = [
  "..........",
  ".P......X.",
  "GGGGGGGGGG",
  "GGGGGGGGGG"
];

function level(overrides) {
  return {
    version: 1,
    name: "Уровень",
    biome: "grass",
    author: "Влад",
    note: "чем интересен",
    rows: ROWS,
    updatedAt: 1,
    ...overrides
  };
}

describe("buildPack", () => {
  it("собирает пак с именем и уровнями", () => {
    const pack = buildPack([level({ name: "Первый" }), level({ name: "Второй" })], "Работы детей");

    expect(pack.type).toBe("pack");
    expect(pack.name).toBe("Работы детей");
    expect(pack.levels).toHaveLength(2);
    expect(pack.levels[0].name).toBe("Первый");
  });

  it("подставляет имя пака по умолчанию", () => {
    expect(buildPack([level({})], "   ").name).toBe("Пак уровней");
  });

  it("переносит настройки уровня", () => {
    const pack = buildPack([level({ settings: { gravity: 0.5 } })], "Пак");

    expect(pack.levels[0].settings).toEqual({ gravity: 0.5 });
  });
});

describe("parsePack", () => {
  it("читает пак с уровнями", () => {
    const raw = buildPack([level({ name: "А" }), level({ name: "Б" })], "Пак");
    const { pack, errors } = parsePack(raw);

    expect(errors).toEqual([]);
    expect(pack.name).toBe("Пак");
    expect(pack.levels.map(item => item.name)).toEqual(["А", "Б"]);
  });

  it("читает просто массив уровней", () => {
    const { pack } = parsePack([level({ name: "Один" })]);

    expect(pack.name).toBe("Пак уровней");
    expect(pack.levels).toHaveLength(1);
  });

  it("сохраняет автора, описание и настройки", () => {
    const raw = buildPack(
      [level({ author: "Влад", note: "батут", settings: { startLives: 5 } })],
      "Пак"
    );

    const { pack } = parsePack(raw);

    expect(pack.levels[0].author).toBe("Влад");
    expect(pack.levels[0].note).toBe("батут");
    expect(pack.levels[0].settings).toEqual({ startLives: 5 });
  });

  it("пропускает битые уровни и сообщает об ошибках", () => {
    const raw = buildPack([level({ name: "Хороший" })], "Пак");
    raw.levels.push({ name: "Битый", rows: ["...."] });

    const { pack, errors } = parsePack(raw);

    expect(pack.levels).toHaveLength(1);
    expect(pack.levels[0].name).toBe("Хороший");
    expect(errors.length).toBe(1);
  });

  it("возвращает null, если уровней не осталось", () => {
    const { pack, errors } = parsePack({ levels: [{ rows: [] }] });

    expect(pack).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("не путает одиночный уровень с паком", () => {
    const { pack } = parsePack({ name: "Один", rows: ROWS });

    expect(pack).toBeNull();
  });

  it("отклоняет мусор", () => {
    expect(parsePack(null).pack).toBeNull();
    expect(parsePack("строка").pack).toBeNull();
    expect(parsePack({ name: "Пак" }).pack).toBeNull();
  });
});

describe("sortLevelsByPack", () => {
  it("ставит паки по алфавиту, одиночные — в конце", () => {
    const levels = [
      { name: "Без пака", pack: "" },
      { name: "Я", pack: "Школа" },
      { name: "А", pack: "Дом" },
      { name: "Второй без пака", pack: "" }
    ];

    const sorted = sortLevelsByPack(levels).map(item => item.name);

    expect(sorted).toEqual(["А", "Я", "Без пака", "Второй без пака"]);
  });

  it("не меняет исходный массив", () => {
    const levels = [{ name: "Б" }, { name: "А" }];
    const sorted = sortLevelsByPack(levels);

    expect(levels[0].name).toBe("Б");
    expect(sorted[0].name).toBe("А");
  });
});
