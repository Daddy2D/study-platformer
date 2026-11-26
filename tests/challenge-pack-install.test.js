import { beforeEach, describe, expect, it, vi } from "vitest";

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
  "..........",
  ".P......X.",
  "GGGGGGGGGG",
  "GGGGGGGGGG"
];

beforeEach(() => {
  memory.clear();
  vi.resetModules();
});

async function load() {
  const storage = await import("../src/core/storage.js");
  const bundled = await import("../src/game/challenge-pack.js");

  return { storage, bundled };
}

describe("пак испытаний в игре", () => {
  it("ставит 50 уровней при первом запуске", async () => {
    const { storage, bundled } = await load();

    expect(bundled.installChallengePack()).toBe(50);

    const levels = storage.getCustomLevels();

    expect(levels).toHaveLength(50);
    expect(levels[0].name).toContain("Испытание 01");
    expect(levels[0].pack).toBe("Испытания");
    expect(levels[0].imported).toBe(true);
  });

  it("второй запуск ничего не добавляет", async () => {
    const { storage, bundled } = await load();

    expect(bundled.installChallengePack()).toBe(50);
    expect(bundled.installChallengePack()).toBe(0);
    expect(storage.getCustomLevels()).toHaveLength(50);
  });

  it("не дублирует пак, если он уже сохранён", async () => {
    const { storage, bundled } = await load();

    storage.saveCustomLevel({
      name: "Уже есть",
      rows: GOOD_ROWS,
      pack: "Испытания",
      imported: true
    });

    expect(bundled.installChallengePack()).toBe(0);
    expect(storage.getCustomLevels()).toHaveLength(1);
  });

  it("не мешает своим уровням", async () => {
    const { storage, bundled } = await load();

    storage.saveCustomLevel({ name: "Свой", rows: GOOD_ROWS });
    bundled.installChallengePack();

    expect(storage.getCustomLevels()).toHaveLength(51);
    expect(storage.getCustomLevels().filter(level => level.imported)).toHaveLength(50);
  });
});
