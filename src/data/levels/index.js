// ============================================
// СПИСОК ГОТОВЫХ УРОВНЕЙ И ИХ НАЗВАНИЯ
// ============================================

import { LEVEL_1 } from "./level1.js";
import { LEVEL_2 } from "./level2.js";
import { LEVEL_3 } from "./level3.js";
import { LEVEL_4 } from "./level4.js";
import { LEVEL_5 } from "./level5.js";
import { LEVEL_6 } from "./level6.js";
import { LEVEL_7 } from "./level7.js";
import { LEVEL_8 } from "./level8.js";

export const LEVELS = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8
];

export const LEVEL_NAMES = [
  "Зелёные холмы",
  "Шипастая тропа",
  "Ключ и платформа",
  "Стрелок в пещере",
  "Финальный рывок",
  "Логово босса",
  "Снежные вершины",
  "Каменный замок"
];

// Биом меняет фон, землю и погоду. У своих уровней по умолчанию "grass".
export const LEVEL_BIOMES = [
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "snow",
  "castle"
];

// Тип босса: "default" — фиолетовый, "snow" — ледяной,
// "castle" — каменный страж.
export const LEVEL_BOSS_TYPES = [
  null,
  null,
  null,
  null,
  null,
  "default",
  "snow",
  "castle"
];
