import { describe, expect, it } from "vitest";
import {
  LEVEL_LIMITS,
  TILE_CHARS,
  countTiles,
  normalizeLevelRows,
  parseLevel,
  validateLevelRows
} from "../src/core/level-format.js";

// 10×4: старт слева, финиш справа, ровная земля
const SIMPLE = [
  "..........",
  ".P.....X..",
  "GGGGGGGGGG",
  "GGGGGGGGGG"
];

function has(list, pattern) {
  return list.some(item => pattern.test(item));
}

describe("константы формата", () => {
  it("знает все двадцать символов карты", () => {
    expect(TILE_CHARS.size).toBe(20);
    expect(TILE_CHARS.has("Z")).toBe(true);
    expect(TILE_CHARS.has("X")).toBe(true);
    expect(TILE_CHARS.has(".")).toBe(false);
  });

  it("держит границы размеров", () => {
    expect(LEVEL_LIMITS.minWidth).toBe(8);
    expect(LEVEL_LIMITS.maxWidth).toBe(120);
    expect(LEVEL_LIMITS.minHeight).toBe(4);
    expect(LEVEL_LIMITS.maxHeight).toBe(40);
  });
});

describe("normalizeLevelRows", () => {
  it("дополняет короткие строки точками", () => {
    expect(normalizeLevelRows(["..........", "...", "GGGGGGGGGG", "GGGGGGGGGG"])).toEqual([
      "..........",
      "..........",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ]);
  });

  it("отклоняет карту вне границ", () => {
    expect(normalizeLevelRows(["..."])).toBeNull();
    expect(normalizeLevelRows(Array(41).fill(".........."))).toBeNull();
    expect(
      normalizeLevelRows(Array(4).fill("................")).map(row => row.length)
    ).toEqual([16, 16, 16, 16]);
  });
});

describe("parseLevel", () => {
  it("читает простой уровень", () => {
    const { level, errors } = parseLevel({ name: "Тест", rows: SIMPLE });

    expect(errors).toEqual([]);
    expect(level.name).toBe("Тест");
    expect(level.biome).toBe("grass");
    expect(level.version).toBe(1);
    expect(level.rows).toEqual(SIMPLE);
  });

  it("подставляет имя, биом и пустые автора с описанием", () => {
    const { level } = parseLevel({ rows: SIMPLE });

    expect(level.name).toBe("Мой уровень");
    expect(level.biome).toBe("grass");
    expect(level.author).toBe("");
    expect(level.note).toBe("");
  });

  it("сохраняет автора и описание", () => {
    const { level } = parseLevel({
      rows: SIMPLE,
      author: "  Влад  ",
      note: "  три прыжка и батут  "
    });

    expect(level.author).toBe("Влад");
    expect(level.note).toBe("три прыжка и батут");
  });

  it("не пускает автора и описание длиннее лимита", () => {
    const { level } = parseLevel({
      rows: SIMPLE,
      author: "а".repeat(LEVEL_LIMITS.maxAuthor + 10),
      note: "б".repeat(LEVEL_LIMITS.maxNote + 10)
    });

    expect(level.author).toHaveLength(LEVEL_LIMITS.maxAuthor);
    expect(level.note).toHaveLength(LEVEL_LIMITS.maxNote);
  });

  it("неизвестный биом заменяет обычным", () => {
    expect(parseLevel({ rows: SIMPLE, biome: "луна" }).level.biome).toBe("grass");
  });

  it("выравнивает строки по самой длинной", () => {
    const { level } = parseLevel({
      rows: ["..........", ".P.....X", "GGGGGGGGGG", "GGGGGGGGGG"]
    });

    expect(level.rows[1]).toBe(".P.....X..");
  });

  it("возвращает ошибки для мусора", () => {
    expect(parseLevel(null).errors.length).toBeGreaterThan(0);
    expect(parseLevel({}).errors.length).toBeGreaterThan(0);
    expect(parseLevel({ rows: "карта" }).errors.length).toBeGreaterThan(0);
    expect(parseLevel({ rows: SIMPLE.slice(0, 2) }).errors.length).toBeGreaterThan(0);
  });

  it("обрезает слишком длинное имя", () => {
    const { level } = parseLevel({ rows: SIMPLE, name: "я".repeat(60) });

    expect(level.name).toHaveLength(LEVEL_LIMITS.maxName);
  });
});

describe("validateLevelRows: ошибки", () => {
  it("пропускает корректную карту", () => {
    const result = validateLevelRows(SIMPLE);

    expect(result.errors).toEqual([]);
  });

  it("ловит неизвестный символ", () => {
    const rows = [...SIMPLE];
    rows[1] = ".P..Q..X..";

    expect(has(validateLevelRows(rows).errors, /неизвестн/i)).toBe(true);
  });

  it("требует ровно один старт", () => {
    const noStart = [...SIMPLE];
    noStart[1] = "........X.";
    expect(has(validateLevelRows(noStart).errors, /старт/i)).toBe(true);

    const twoStarts = [...SIMPLE];
    twoStarts[1] = ".P.P...X..";
    expect(has(validateLevelRows(twoStarts).errors, /старт/i)).toBe(true);
  });

  it("требует финиш", () => {
    const rows = [...SIMPLE];
    rows[1] = ".P........";

    expect(has(validateLevelRows(rows).errors, /финиш/i)).toBe(true);
  });

  it("запрещает двух боссов", () => {
    const rows = [...SIMPLE];
    rows[1] = ".P.ZZ..X..";

    expect(has(validateLevelRows(rows).errors, /босс/i)).toBe(true);
  });

  it("ловит строки разной длины", () => {
    const rows = ["..........", ".P.....X..", "GGGGGGGGG", "GGGGGGGGGG"];

    expect(has(validateLevelRows(rows).errors, /длин/i)).toBe(true);
  });
});

describe("validateLevelRows: несколько финишей", () => {
  it("предупреждает, но не запрещает", () => {
    const rows = [...SIMPLE];
    rows[1] = ".P...X.X..";

    const result = validateLevelRows(rows);

    expect(result.errors).toEqual([]);
    expect(has(result.warnings, /финишей несколько/i)).toBe(true);
  });
});

describe("validateLevelRows: предупреждения", () => {
  it("замечает старт в воздухе", () => {
    const rows = [
      "..........",
      ".P.....X..",
      "..........",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /под стартом/i)).toBe(true);
  });

  it("замечает старт на падающей платформе", () => {
    const rows = [
      "..........",
      ".P.....X..",
      ".L........",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /падающ/i)).toBe(true);
  });

  it("замечает дверь без ключа", () => {
    const rows = [
      "..........",
      ".P.D...X..",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /ключ/i)).toBe(true);
  });

  it("замечает дверь, которую можно перепрыгнуть", () => {
    const rows = [
      "..........",
      "..........",
      ".P.DK..X..",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /перепрыгнуть/i)).toBe(true);
  });

  it("не предупреждает про дверь с землёй сверху", () => {
    const safe = [
      "...G......",
      "..........",
      ".P.DK..X..",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    const warnings = validateLevelRows(safe).warnings;

    expect(has(warnings, /перепрыгнуть/i)).toBe(false);
  });

  it("не предупреждает про дверь у верхней кромки карты", () => {
    const rows = [
      ".P.DK..X..",
      "GGGGGGGGGG",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    const warnings = validateLevelRows(rows).warnings;

    expect(has(warnings, /перепрыгнуть/i)).toBe(false);
  });

  it("замечает двери друг на друге", () => {
    const rows = [
      "..........",
      ".P.DK.KX..",
      "...D...G..",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /друг на друге/i)).toBe(true);
  });

  it("замечает босса в воздухе", () => {
    const rows = [
      "..........",
      ".P....Z.X.",
      "..........",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /под боссом/i)).toBe(true);
  });

  it("замечает финиш в воздухе", () => {
    const rows = [
      "..........",
      ".P.....X..",
      "..........",
      "GGGGGGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /висит в воздухе/i)).toBe(true);
  });

  it("замечает пилу, вкопанную в землю", () => {
    const rows = [...SIMPLE];
    rows[3] = "GGGWGGGGGG";

    expect(has(validateLevelRows(rows).warnings, /пила/i)).toBe(true);
  });

  it("предупреждает о недостижимом финише", () => {
    const rows = [
      "......................",
      ".P.................X..",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG"
    ];

    expect(has(validateLevelRows(rows).warnings, /недостижим/i)).toBe(true);
  });

  it("не ругается на уровень, где финиш достижим", () => {
    const warnings = validateLevelRows(SIMPLE).warnings;

    expect(has(warnings, /недостижим/i)).toBe(false);
  });
});

describe("countTiles", () => {
  it("считает клетки по символам", () => {
    const counts = countTiles(SIMPLE);

    expect(counts.P).toBe(1);
    expect(counts.X).toBe(1);
    expect(counts.G).toBe(20);
    expect(counts.E).toBe(0);
  });
});
