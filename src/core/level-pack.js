// ============================================
// ПАК УРОВНЕЙ
// ============================================
// Пак — это несколько уровней одним JSON-файлом. Отдельного экрана
// у пака нет: в списке «Мои уровни» уровни просто сгруппированы
// по названию пака и идут в порядке файла.

import { LEVEL_LIMITS, parseLevel, validateLevelRows } from "./level-format.js";
import { sanitizeSettingsOverrides } from "./settings.js";

export const PACK_TYPE = "pack";
export const PACK_VERSION = 1;
export const MAX_PACK_NAME = 40;
export const MAX_PACK_AUTHOR = LEVEL_LIMITS.maxAuthor;

export function buildPack(levels, name, author) {
  return {
    version: PACK_VERSION,
    type: PACK_TYPE,
    name: cleanText(name, MAX_PACK_NAME) || "Пак уровней",
    author: cleanText(author, MAX_PACK_AUTHOR),
    levels: levels.map((entry, index) => ({
      version: entry.version || 1,
      name: entry.name,
      biome: entry.biome,
      author: entry.author || "",
      note: entry.note || "",
      pack: entry.pack || "",
      order: Number.isInteger(entry.order) ? entry.order : index,
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

  if (list.length === 0) {
    return { pack: null, errors: ["в файле нет уровней"] };
  }

  const levels = [];
  const errors = [];

  list.forEach((item, index) => {
    const { level, errors: levelErrors } = parseLevel(item);

    if (!level) {
      errors.push(`уровень ${index + 1}: ${levelErrors.join("; ")}`);
      return;
    }

    const check = validateLevelRows(level.rows);

    if (check.errors.length > 0) {
      errors.push(`уровень ${index + 1}: ${check.errors.join("; ")}`);
      return;
    }

    levels.push({
      ...level,
      pack: cleanText(item.pack, MAX_PACK_NAME),
      order: Number.isInteger(item.order) ? item.order : index,
      settings: sanitizeSettingsOverrides(item.settings)
    });
  });

  if (levels.length === 0) {
    return { pack: null, errors: errors };
  }

  return {
    pack: {
      version: PACK_VERSION,
      type: PACK_TYPE,
      name: cleanText(raw.name, MAX_PACK_NAME) || "Пак уровней",
      author: cleanText(raw.author, MAX_PACK_AUTHOR),
      levels: levels
    },
    errors: errors
  };
}

// Порядок в списке: паки по алфавиту, внутри пака — порядок файла,
// одиночные уровни в конце.
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

    const orderA = Number.isInteger(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isInteger(b.order) ? b.order : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a.name).localeCompare(String(b.name), "ru");
  });
}

// Страницы списка: уровни одного пака не разрезаем, если пак
// помещается на страницу.
export function paginateLevels(levels, pageSize) {
  const pages = [];
  let current = [];

  for (const level of levels) {
    const pack = level.pack || "";
    const currentPack =
      current.length > 0 ? current[0].pack || "" : null;

    if (current.length > 0 && pack !== currentPack) {
      pages.push(current);
      current = [];
    }

    current.push(level);

    if (current.length >= pageSize) {
      pages.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages.length > 0 ? pages : [[]];
}

function cleanText(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}
