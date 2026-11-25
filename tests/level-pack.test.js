import { describe, expect, it } from "vitest";
import {
  buildPack,
  paginateLevels,
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

  it("не пишет id уровня в файл", () => {
    const pack = buildPack([level({ id: "lvl_1_abc" })], "Пак");

    expect(pack.levels[0]).not.toHaveProperty("id");
  });

  it("сохраняет принадлежность паку и порядок", () => {
    const pack = buildPack(
      [level({ name: "А", pack: "Школа", order: 3 })],
      "Пак"
    );

    expect(pack.levels[0].pack).toBe("Школа");
    expect(pack.levels[0].order).toBe(3);
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

  it("пропускает уровни без старта или финиша", () => {
    const raw = buildPack([level({ name: "Без финиша" })], "Пак");
    raw.levels[0].rows = [
      "..........",
      ".P........",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    const { pack, errors } = parsePack(raw);

    expect(pack).toBeNull();
    expect(errors[0]).toMatch(/финиш/i);
  });

  it("сохраняет принадлежность паку и порядок", () => {
    const raw = buildPack(
      [level({ name: "Первый", pack: "Школа", order: 5 })],
      "Пак"
    );

    const { pack } = parsePack(raw);

    expect(pack.levels[0].pack).toBe("Школа");
    expect(pack.levels[0].order).toBe(5);
  });

  it("чистит неверные настройки уровня", () => {
    const raw = buildPack([level({})], "Пак");
    raw.levels[0].settings = { gravity: 99, мусор: true };

    const { pack } = parsePack(raw);

    expect(pack.levels[0].settings).toEqual({ gravity: 1.2 });
  });

  it("сообщает про пустой список", () => {
    const { pack, errors } = parsePack({ levels: [] });

    expect(pack).toBeNull();
    expect(errors).toEqual(["в файле нет уровней"]);
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

  it("внутри пака держит порядок файла", () => {
    const levels = [
      { name: "Третий", pack: "Школа", order: 2 },
      { name: "Первый", pack: "Школа", order: 0 },
      { name: "Второй", pack: "Школа", order: 1 }
    ];

    const sorted = sortLevelsByPack(levels).map(item => item.name);

    expect(sorted).toEqual(["Первый", "Второй", "Третий"]);
  });

  it("не меняет исходный массив", () => {
    const levels = [{ name: "Б" }, { name: "А" }];
    const sorted = sortLevelsByPack(levels);

    expect(levels[0].name).toBe("Б");
    expect(sorted[0].name).toBe("А");
  });
});

describe("paginateLevels", () => {
  it("не разрезает пак между страницами", () => {
    const levels = [
      { name: "П1", pack: "Пак" },
      { name: "П2", pack: "Пак" },
      { name: "О1", pack: "" },
      { name: "О2", pack: "" }
    ];

    const pages = paginateLevels(levels, 3);

    expect(pages).toEqual([
      [levels[0], levels[1]],
      [levels[2], levels[3]]
    ]);
  });

  it("режет страницы, когда пак больше страницы", () => {
    const levels = [
      { name: "1", pack: "Пак" },
      { name: "2", pack: "Пак" },
      { name: "3", pack: "Пак" }
    ];

    const pages = paginateLevels(levels, 2);

    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(2);
    expect(pages[1]).toHaveLength(1);
  });

  it("возвращает одну пустую страницу для пустого списка", () => {
    expect(paginateLevels([], 4)).toEqual([[]]);
  });
});
