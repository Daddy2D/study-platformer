// ============================================
// ПАК ИСПЫТАНИЙ В ИГРЕ
// ============================================
// Пак из 50 уровней лежит внутри приложения и устанавливается
// в «Мои уровни» при первом запуске. Импортированные уровни не
// считаются работами ребёнка, поэтому задания урока они не закрывают.

import pack from "../data/challenge-pack.json";
import {
  getCustomLevels,
  saveCustomLevel,
  saveLevelSettings
} from "../core/storage.js";

let installed = false;

export function installChallengePack() {
  if (installed) {
    return 0;
  }

  installed = true;

  const existing = getCustomLevels();

  // Пак уже стоит — второй раз не добавляем
  if (existing.some(level => level.pack === pack.name)) {
    return 0;
  }

  let added = 0;

  pack.levels.forEach((item, index) => {
    const level = saveCustomLevel({
      name: item.name,
      rows: item.rows,
      biome: item.biome,
      author: item.author || "",
      note: item.note || "",
      pack: pack.name,
      order: Number.isInteger(item.order) ? item.order : index,
      imported: true
    });

    if (!level) {
      return;
    }

    if (item.settings) {
      saveLevelSettings(`custom:${level.id}`, item.settings);
    }

    added += 1;
  });

  return added;
}
