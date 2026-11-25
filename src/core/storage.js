import { MAX_PACK_NAME } from "./level-pack.js";
import {
  LEVEL_BIOMES,
  LEVEL_LIMITS,
  normalizeLevelRows,
  parseLevel
} from "./level-format.js";
import { sanitizeSettingsOverrides } from "./settings.js";

// ============================================
// ХРАНИЛИЩЕ ДАННЫХ
// ============================================
// Свои уровни и настройки хранятся в localStorage браузера.
// Обёртки ниже не дают игре упасть, если хранилище недоступно.

export { normalizeLevelRows };

export const STORAGE_KEYS = {
  customLevels: "platformer.customLevels.v1",
  testLevel: "platformer.testLevel.v1",
  sound: "platformer.sound.v1",
  levelSettings: "platformer.levelSettings.v1",
  progress: "platformer.progress.v1",
  editorDraft: "platformer.editorDraft.v1"
};

export const MAX_LEVEL_WIDTH = LEVEL_LIMITS.maxWidth;
export const MAX_LEVEL_HEIGHT = LEVEL_LIMITS.maxHeight;
export const CUSTOM_LEVEL_BIOMES = LEVEL_BIOMES;

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn("Не удалось прочитать localStorage:", error);
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Не удалось сохранить в localStorage:", error);
    return false;
  }
}

function makeLevelId() {
  return "lvl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

// Приводим карту к прямоугольнику: строки одинаковой длины, только строки.
// Сама нормализация живёт в level-format.js.

export function sanitizeLevel(level) {
  const { level: clean } = parseLevel(level);

  if (!clean) {
    return null;
  }

  return {
    id: typeof level.id === "string" && level.id ? level.id : makeLevelId(),
    name: clean.name,
    rows: clean.rows,
    biome: clean.biome,
    author: clean.author,
    note: clean.note,
    pack: typeof level.pack === "string"
      ? level.pack.trim().slice(0, MAX_PACK_NAME)
      : "",
    order: Number.isInteger(level.order) ? level.order : null,
    updatedAt: clean.updatedAt
  };
}

export function getCustomLevels() {
  const stored = readStorage(STORAGE_KEYS.customLevels, []);

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .map(sanitizeLevel)
    .filter(level => level !== null);
}

export function saveCustomLevels(levels) {
  return writeStorage(STORAGE_KEYS.customLevels, levels);
}

export function getCustomLevel(id) {
  return getCustomLevels().find(level => level.id === id) || null;
}

export function saveCustomLevel(level) {
  const clean = sanitizeLevel(level);

  if (!clean) {
    return null;
  }

  const levels = getCustomLevels();
  const existingIndex = levels.findIndex(item => item.id === clean.id);

  clean.updatedAt = Date.now();

  if (existingIndex >= 0) {
    levels[existingIndex] = clean;
  } else {
    levels.push(clean);
  }

  if (!saveCustomLevels(levels)) {
    return null;
  }

  return clean;
}

export function deleteCustomLevel(id) {
  const levels = getCustomLevels().filter(level => level.id !== id);
  const saved = saveCustomLevels(levels);

  if (saved) {
    deleteLevelSettings(`custom:${id}`);
  }

  return saved;
}

// Временный уровень для кнопки «Проверить» в редакторе.
export function saveTestLevel(level) {
  const clean = sanitizeLevel(level);
  return clean ? writeStorage(STORAGE_KEYS.testLevel, clean) : false;
}

export function getTestLevel() {
  return sanitizeLevel(readStorage(STORAGE_KEYS.testLevel, null));
}

export function getSoundEnabled() {
  return readStorage(STORAGE_KEYS.sound, true) !== false;
}

export function setSoundEnabled(enabled) {
  return writeStorage(STORAGE_KEYS.sound, Boolean(enabled));
}

// ============================================
// НАСТРОЙКИ ОТДЕЛЬНЫХ УРОВНЕЙ
// ============================================
// Ключи: "builtin:0" для готовых уровней и "custom:<id>" для своих.

function getAllLevelSettings() {
  const all = readStorage(STORAGE_KEYS.levelSettings, {});

  if (!all || typeof all !== "object" || Array.isArray(all)) {
    return {};
  }

  return all;
}

export function getLevelSettings(settingsKey) {
  if (!settingsKey) {
    return null;
  }

  const all = getAllLevelSettings();

  return sanitizeSettingsOverrides(all[settingsKey]);
}

export function saveLevelSettings(settingsKey, overrides) {
  if (!settingsKey) {
    return false;
  }

  const all = getAllLevelSettings();
  const clean = sanitizeSettingsOverrides(overrides);

  if (clean) {
    all[settingsKey] = clean;
  } else {
    delete all[settingsKey];
  }

  return writeStorage(STORAGE_KEYS.levelSettings, all);
}

export function deleteLevelSettings(settingsKey) {
  if (!settingsKey) {
    return false;
  }

  const all = getAllLevelSettings();

  if (all[settingsKey] === undefined) {
    return true;
  }

  delete all[settingsKey];

  return writeStorage(STORAGE_KEYS.levelSettings, all);
}

// ============================================
// ЧЕРНОВИК РЕДАКТОРА
// ============================================
// Он спасает карту, если ученик закрыл вкладку, не нажав «Сохранить».

export function saveEditorDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return false;
  }

  const rows = normalizeLevelRows(draft.rows);

  if (!rows) {
    return false;
  }

  return writeStorage(STORAGE_KEYS.editorDraft, {
    name: typeof draft.name === "string" && draft.name.trim()
      ? draft.name.trim().slice(0, LEVEL_LIMITS.maxName)
      : "Черновик",
    author: typeof draft.author === "string"
      ? draft.author.trim().slice(0, LEVEL_LIMITS.maxAuthor)
      : "",
    note: typeof draft.note === "string"
      ? draft.note.trim().slice(0, LEVEL_LIMITS.maxNote)
      : "",
    pack: typeof draft.pack === "string"
      ? draft.pack.trim().slice(0, MAX_PACK_NAME)
      : "",
    rows: rows,
    biome: CUSTOM_LEVEL_BIOMES.includes(draft.biome)
      ? draft.biome
      : "grass",
    levelId: typeof draft.levelId === "string" ? draft.levelId : null,
    updatedAt: Date.now()
  });
}

export function getEditorDraft() {
  const raw = readStorage(STORAGE_KEYS.editorDraft, null);

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const rows = normalizeLevelRows(raw.rows);

  if (!rows) {
    return null;
  }

  return {
    name: typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim().slice(0, LEVEL_LIMITS.maxName)
      : "Черновик",
    author: typeof raw.author === "string"
      ? raw.author.trim().slice(0, LEVEL_LIMITS.maxAuthor)
      : "",
    note: typeof raw.note === "string"
      ? raw.note.trim().slice(0, LEVEL_LIMITS.maxNote)
      : "",
    pack: typeof raw.pack === "string"
      ? raw.pack.trim().slice(0, MAX_PACK_NAME)
      : "",
    rows: rows,
    biome: CUSTOM_LEVEL_BIOMES.includes(raw.biome)
      ? raw.biome
      : "grass",
    levelId: typeof raw.levelId === "string" ? raw.levelId : null,
    updatedAt: Number(raw.updatedAt) || 0
  };
}

export function clearEditorDraft() {
  try {
    localStorage.removeItem(STORAGE_KEYS.editorDraft);
    return true;
  } catch (error) {
    console.warn("Не удалось удалить черновик редактора:", error);
    return false;
  }
}
