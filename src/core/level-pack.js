// ============================================
// ПАК УРОВНЕЙ
// ============================================
// Пак — это несколько уровней одним JSON-файлом. Отдельного экрана
// у пака нет: в списке «Мои уровни» уровни просто сгруппированы
// по названию пака.

import { parseLevel } from "./level-format.js";
import { sanitizeSettingsOverrides } from "./settings.js";

export const PACK_TYPE = "pack";
export const PACK_VERSION = 1;
export const MAX_PACK_NAME = 40;

export function buildPack(levels, name, author) {
  return {
    version: PACK_VERSION,
    type: PACK_TYPE,
    name: cleanName(name) || "Пак уровней",
    author: typeof author === "string" ? author.trim().slice(0, 24) : "",
    levels: levels.map(entry => ({
      version: entry.version || 1,
      name: entry.name,
      biome: entry.biome,
      author: entry.author || "",
      note: entry.note || "",
      rows: entry.rows,
      updatedAt: entry.updatedAt,
      ...(entry.settings ? { settings: entry.settings } : {})
    }))
  };
}

// Принимает и пак, и просто массив уровней.
// Возвращает { pack, errors }: pack === null, если уровней не осталось.
export function parsePack(raw) {
  if (!raw || typeof raw !== "object") {
    return { pack: null, errors: ["это не файл пака"] };
  }

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.levels)
      ? raw.levels
      : null;

  if (!list) {
    return { pack: null, errors: ["в файле нет списка уровней"] };
  }

  const levels = [];
  const errors = [];

  list.forEach((item, index) => {
    const { level, errors: levelErrors } = parseLevel(item);

    if (!level) {
      errors.push(`уровень ${index + 1}: ${levelErrors.join("; ")}`);
      return;
    }

    const settings = sanitizeSettingsOverrides(item && item.settings);

    levels.push({
      ...level,
      settings: settings || null
    });
  });

  if (levels.length === 0) {
    return { pack: null, errors };
  }

  return {
    pack: {
      version: PACK_VERSION,
      type: PACK_TYPE,
      name: cleanName(raw.name) || "Пак уровней",
      author: typeof raw.author === "string" ? raw.author.trim().slice(0, 24) : "",
      levels: levels
    },
    errors: errors
  };
}

// Порядок в списке: сначала паки по алфавиту, потом одиночные уровни.
export function sortLevelsByPack(levels) {
  return levels.slice().sort((a, b) => {
    const packA = (a.pack || "").toLowerCase();
    const packB = (b.pack || "").toLowerCase();

    if (packA !== packB) {
      if (!packA) {
        return 1;
      }

      if (!packB) {
        return -1;
      }

      return packA.localeCompare(packB, "ru");
    }

    return String(a.name).localeCompare(String(b.name), "ru");
  });
}

function cleanName(value) {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_PACK_NAME)
    : "";
}
