import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseLevel, validateLevelRows } from "../src/core/level-format.js";

const PACK_DIR = "Пак_уровней(20.11.26)";

const files = fs
  .readdirSync(PACK_DIR)
  .filter(name => name.endsWith(".json"))
  .sort();

function loadPack() {
  return files.map(file => {
    const raw = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), "utf8"));
    const { level, errors } = parseLevel(raw);

    return { file, raw, level, errors };
  });
}

describe("пак детских уровней", () => {
  it("содержит десять файлов", () => {
    expect(files).toHaveLength(10);
  });

  it("все уровни разбираются без ошибок", () => {
    for (const item of loadPack()) {
      expect(item.errors, item.file).toEqual([]);
      expect(item.level, item.file).not.toBeNull();
    }
  });

  it("сохраняет имена уровней", () => {
    const names = loadPack()
      .map(item => item.level.name)
      .sort();

    expect(names).toEqual(
      [
        "67",
        "Лёгкий",
        "Максимальный 30Х30",
        "Мой уровень",
        "МЯСОКОМБИНАТ",
        "Пример мяса",
        "майнкрафт",
        "парашутист",
        "парашутист_V2",
        "понятный уровень"
      ].sort()
    );
  });

  it("находит падающую платформу над шипами в «Максимальный 30Х30»", () => {
    const item = loadPack().find(entry => entry.level.name === "Максимальный 30Х30");
    const warnings = validateLevelRows(item.level.rows).warnings;

    expect(warnings.some(text => /над шипами/i.test(text))).toBe(true);
  });

  it("находит финиш в воздухе у «парашутист»", () => {
    const item = loadPack().find(entry => entry.level.name === "парашутист");
    const warnings = validateLevelRows(item.level.rows).warnings;

    expect(warnings.some(text => /висит в воздухе/i.test(text))).toBe(true);
  });

  it("«Лёгкий» проходит проверку без предупреждений", () => {
    const item = loadPack().find(entry => entry.level.name === "Лёгкий");
    const warnings = validateLevelRows(item.level.rows).warnings;

    expect(warnings).toEqual([]);
  });

  it("находит столбик дверей у «МЯСОКОМБИНАТ»", () => {
    const item = loadPack().find(entry => entry.level.name === "МЯСОКОМБИНАТ");
    const warnings = validateLevelRows(item.level.rows).warnings;

    expect(warnings.some(text => /друг на друге/i.test(text))).toBe(true);
  });

  it("не находит ошибок формата ни в одном уровне", () => {
    for (const item of loadPack()) {
      expect(validateLevelRows(item.level.rows).errors, item.file).toEqual([]);
    }
  });
});
