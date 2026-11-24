// ============================================
// СПИСОК ГОТОВЫХ УРОВНЕЙ И ИХ НАЗВАНИЯ
// ============================================

const LEVELS = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8
];

const LEVEL_NAMES = [
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
const LEVEL_BIOMES = [
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
const LEVEL_BOSS_TYPES = [
  null,
  null,
  null,
  null,
  null,
  "default",
  "snow",
  "castle"
];
