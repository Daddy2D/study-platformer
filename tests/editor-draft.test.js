import { beforeEach, describe, expect, it } from "vitest";
import {
  clearEditorDraft,
  getEditorDraft,
  saveEditorDraft
} from "../src/core/storage.js";

const GOOD_ROWS = [
  "..........",
  ".P......X.",
  "GGGGGGGGGG",
  "GGGGGGGGGG"
];

// В Node нет localStorage: подменяем на простое хранилище в памяти
const memory = new Map();

beforeEach(() => {
  memory.clear();
});

globalThis.localStorage = {
  getItem: key => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => {
    memory.set(key, String(value));
  },
  removeItem: key => {
    memory.delete(key);
  }
};

describe("черновик редактора", () => {
  it("сохраняет автора и описание", () => {
    const saved = saveEditorDraft({
      name: "Черновик",
      rows: GOOD_ROWS,
      biome: "snow",
      author: "Влад",
      note: "батут и ключ",
      levelId: "lvl_1_abc"
    });

    expect(saved).toBe(true);

    const draft = getEditorDraft();

    expect(draft.author).toBe("Влад");
    expect(draft.note).toBe("батут и ключ");
    expect(draft.biome).toBe("snow");
    expect(draft.levelId).toBe("lvl_1_abc");
  });

  it("подставляет пустые строки старому черновику", () => {
    saveEditorDraft({ name: "Старый", rows: GOOD_ROWS });

    const draft = getEditorDraft();

    expect(draft.author).toBe("");
    expect(draft.note).toBe("");
  });

  it("обрезает автора и описание по лимиту", () => {
    saveEditorDraft({
      rows: GOOD_ROWS,
      author: "а".repeat(100),
      note: "б".repeat(200)
    });

    const draft = getEditorDraft();

    expect(draft.author).toHaveLength(24);
    expect(draft.note).toHaveLength(80);
  });

  it("удаляется", () => {
    saveEditorDraft({ rows: GOOD_ROWS });
    clearEditorDraft();

    expect(getEditorDraft()).toBeNull();
  });
});
