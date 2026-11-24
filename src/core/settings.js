// ============================================
// ОБЩИЕ НАСТРОЙКИ ИГРЫ
// ============================================

// Размер одной клетки уровня
export const TILE = 48;

// Сколько кадров в секунду обсчитывает физика.
// Игра всегда идёт с этой скоростью, даже на мониторе 144 Гц.
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

export const DEFAULT_SETTINGS = {
  // ============================================
  // ФИЗИКА
  // ============================================
  gravity: 0.6,

  // Сила прыжка. Чем меньше отрицательное число, тем ниже прыжок.
  // Например: -10 слабее, -16 выше.
  jumpForce: -13,

  // Отскок после прыжка на врага
  stompBounce: -9,

  // Насколько ниже уровня можно упасть, прежде чем игрок вернётся на чекпоинт
  fallDeathMargin: 64,

  // ============================================
  // ИГРОК
  // ============================================
  playerWidth: TILE - 8,
  playerHeight: TILE - 8,

  // Ускорение игрока
  playerAccel: 0.7,

  // Трение. Чем ближе к 1, тем дольше скольжение.
  // Чем меньше, тем быстрее останавливается.
  playerFriction: 0.88,

  // Максимальная скорость движения по горизонтали
  playerMaxSpeed: 5,

  // Сколько прыжков доступно игроку.
  // 1 - обычный прыжок
  // 2 - двойной прыжок
  maxJumps: 2,

  // ============================================
  // ЖИЗНИ
  // ============================================

  // Сколько жизней даётся на каждый уровень
  startLives: 3,

  // Сколько кадров после потери жизни игрок неуязвим.
  // 60 кадров = 1 секунда. Он мигает и не может получить урон.
  invulnerabilityTime: 90,

  // ============================================
  // ВРАГИ
  // ============================================
  enemyWidth: TILE - 8,
  enemyHeight: TILE - 8,

  // Скорость обычного врага
  enemySpeed: 1.7,

  // ============================================
  // СТРЕЛЯЮЩИЙ ВРАГ
  // ============================================

  // Расстояние по горизонтали, на котором враг замечает игрока
  shooterRangeX: 420,

  // Допустимая разница по высоте, чтобы враг начал стрелять
  shooterRangeY: 100,

  // Задержка перед первым выстрелом после появления уровня
  shooterStartCooldown: 60,

  // Пауза между выстрелами.
  // Чем меньше значение, тем чаще стреляет враг.
  shooterCooldown: 90,

  // Скорость пули
  bulletSpeed: 4.5,

  // Размер пули
  bulletWidth: 10,
  bulletHeight: 8,

  // ============================================
  // ДВИЖУЩИЕСЯ ПЛАТФОРМЫ
  // ============================================
  movingPlatformWidth: TILE,
  movingPlatformHeight: TILE,

  // Скорость горизонтальной платформы
  movingPlatformHorizontalSpeed: 1.4,

  // Скорость вертикальной платформы
  movingPlatformVerticalSpeed: 1.0,

  // Дальность движения горизонтальной платформы от стартовой точки
  movingPlatformHorizontalRange: TILE * 3,

  // Дальность движения вертикальной платформы от стартовой точки
  movingPlatformVerticalRange: TILE * 2,

  // ============================================
  // БАТУТ
  // ============================================

  // Размер батута. Он стоит на земле и не мешает ходить.
  springWidth: TILE - 12,
  springHeight: 20,

  // Сила отскока. Чем меньше отрицательное число, тем выше прыжок.
  springForce: -18.5,

  // Небольшая пауза, чтобы батут не срабатывал каждый кадр
  springCooldown: 10,

  // ============================================
  // ПАДАЮЩАЯ ПЛАТФОРМА
  // ============================================

  fallingPlatformWidth: TILE,
  fallingPlatformHeight: 18,

  // Сколько кадров платформа дрожит перед падением
  fallingShakeTime: 34,

  // Ускорение падения платформы
  fallingGravity: 0.75,

  // Сколько кадров платформа отдыхает и появляется снова
  fallingRespawnTime: 150,

  // ============================================
  // НОВЫЕ МЕХАНИКИ
  // ============================================

  // Платформа в одну сторону
  oneWayPlatformOffsetY: 10,
  oneWayPlatformHeight: 14,

  // Лестница
  ladderSpeed: 3,

  // Пила
  sawSpeed: 1.5,
  sawRange: TILE * 2,
  sawHitboxInset: 8,

  // Пушка
  cannonRangeX: 460,
  cannonRangeY: 120,
  cannonStartCooldown: 50,
  cannonCooldown: 110,
  cannonBulletSpeed: 4,
  cannonBulletWidth: 12,
  cannonBulletHeight: 8,

  // ============================================
  // БОСС
  // ============================================

  bossWidth: TILE * 2 - 8,
  bossHeight: TILE * 2 - 8,

  // Сколько ударов прыжком выдерживает босс
  bossHealth: 3,

  // После какого здоровья начинается вторая фаза
  bossPhase2At: 1,

  // На каком расстоянии босс замечает игрока
  bossActivationRange: 560,

  // Скорость движения в первой и второй фазе
  bossSpeedPhase1: 1.15,
  bossSpeedPhase2: 1.85,

  // Дальность патрулирования от места появления
  bossPatrolRange: TILE * 6,

  // Прыжок босса
  bossJumpForce: -12,
  bossJumpCooldown1: 170,
  bossJumpCooldown2: 105,

  // Стрельба босса
  bossShootCooldown1: 125,
  bossShootCooldown2: 78,
  bossBulletSpeed1: 4.2,
  bossBulletSpeed2: 5.2,
  bossBulletWidth: 14,
  bossBulletHeight: 14,
  bossBulletLife: 260,

  // Сколько кадров босс мигает после удара
  bossHurtTime: 42,

  // Сколько очков даёт победа над боссом
  bossScore: 100,

  // Сколько кадров показывать сообщение о боссе
  bossMessageTime: 150,

  // ============================================
  // УРОВНИ
  // ============================================

  // Задержка после прохождения уровня в кадрах.
  // 60 кадров примерно = 1 секунда. 180 кадров = 3 секунды:
  // этого хватает, чтобы прочитать время, монеты и звёзды.
  levelTransitionDelay: 180,

  // ============================================
  // ПРЕДМЕТЫ
  // ============================================

  // Монеты
  coinOffset: 8,
  coinWidth: TILE - 16,
  coinHeight: TILE - 16,

  // Анимация покачивания монеты
  coinBobSpeed: 200,
  coinBobAmount: 3,

  // Ключи
  keyOffset: 10,
  keyWidth: TILE - 20,
  keyHeight: TILE - 20,

  // ============================================
  // ДВЕРИ И ФИНИШ
  // ============================================

  // Дверь занимает две клетки в высоту
  doorHeight: TILE * 2,

  // Размер финишного флага (зона касания)
  exitWidth: TILE,
  exitHeight: TILE,

  // ============================================
  // СЛУЖЕБНЫЕ НАСТРОЙКИ
  // ============================================

  // Насколько расширять зону касания игрока с дверью,
  // чтобы дверь открывалась, даже если игрок стоит вплотную.
  doorSensorPadding: 6,

  // Смещение точки появления игрока
  respawnOffsetX: 4,

  // ============================================
  // ФОН
  // ============================================

  // Количество облаков
  cloudCount: 12
};

// Текущие настройки игры. При запуске уровня сюда применяются
// значения этого уровня, а остальные параметры берутся из DEFAULT_SETTINGS.
export const SETTINGS = { ...DEFAULT_SETTINGS };

// ============================================
// НАСТРОЙКИ, КОТОРЫЕ МОГУТ МЕНЯТЬ УЧЕНИКИ
// ============================================
// Эти поля показываются на странице settings.html.
// min/max/step не дают поставить опасные значения.

export const EDITABLE_SETTINGS = [
  {
    key: "gravity",
    label: "Гравитация",
    min: 0.3,
    max: 1.2,
    step: 0.05,
    hint: "Чем больше, тем быстрее игрок падает вниз."
  },
  {
    key: "jumpForce",
    label: "Сила прыжка",
    min: -16,
    max: -8,
    step: 0.5,
    hint: "Чем ниже значение, тем выше прыжок. Например, −15 выше, чем −10."
  },
  {
    key: "maxJumps",
    label: "Прыжков всего",
    min: 1,
    max: 3,
    step: 1,
    hint: "1 — обычный прыжок, 2 — двойной, 3 — тройной."
  },
  {
    key: "playerMaxSpeed",
    label: "Скорость игрока",
    min: 3,
    max: 8,
    step: 0.5,
    hint: "Максимальная скорость бега по горизонтали."
  },
  {
    key: "startLives",
    label: "Жизни",
    min: 1,
    max: 5,
    step: 1,
    hint: "Сколько жизней даётся на этот уровень."
  },
  {
    key: "enemySpeed",
    label: "Скорость врагов",
    min: 0.5,
    max: 3,
    step: 0.1,
    hint: "Как быстро ходят обычные враги."
  },
  {
    key: "springForce",
    label: "Сила батута",
    min: -24,
    max: -12,
    step: 0.5,
    hint: "Чем ниже значение, тем выше отскок от батута."
  },
  {
    key: "movingPlatformHorizontalSpeed",
    label: "Скорость платформ →",
    min: 0.5,
    max: 3,
    step: 0.1,
    hint: "Скорость платформ, которые ездят влево и вправо."
  },
  {
    key: "movingPlatformVerticalSpeed",
    label: "Скорость платформ ↑",
    min: 0.5,
    max: 3,
    step: 0.1,
    hint: "Скорость платформ, которые ездят вверх и вниз."
  },
  {
    key: "invulnerabilityTime",
    group: "advanced",
    label: "Неуязвимость после урона",
    min: 30,
    max: 180,
    step: 5,
    hint: "Сколько кадров игрок мигает и не получает урон. 60 кадров ≈ 1 секунда."
  },
  {
    key: "shooterCooldown",
    group: "advanced",
    label: "Пауза между выстрелами стрелка",
    min: 40,
    max: 180,
    step: 10,
    hint: "Чем меньше, тем чаще стрелок выпускает пули."
  },
  {
    key: "bulletSpeed",
    group: "advanced",
    label: "Скорость пуль стрелка",
    min: 2,
    max: 8,
    step: 0.5,
    hint: "Скорость пуль обычных стрелков."
  },
  {
    key: "fallingShakeTime",
    group: "advanced",
    label: "Дрожание падающей платформы",
    min: 15,
    max: 90,
    step: 1,
    hint: "Сколько кадров платформа дрожит до исчезновения."
  },
  {
    key: "fallingRespawnTime",
    group: "advanced",
    label: "Возвращение падающей платформы",
    min: 60,
    max: 300,
    step: 10,
    hint: "Через сколько кадров платформа появляется снова."
  },
  {
    key: "bossHealth",
    group: "advanced",
    label: "Здоровье босса",
    min: 1,
    max: 6,
    step: 1,
    hint: "Сколько ударов прыжком выдерживает босс."
  },
  {
    key: "bossSpeedPhase1",
    group: "advanced",
    label: "Скорость босса: фаза 1",
    min: 0.5,
    max: 3,
    step: 0.05,
    hint: "Как быстро босс двигается до второго попадания."
  },
  {
    key: "bossSpeedPhase2",
    group: "advanced",
    label: "Скорость босса: фаза 2",
    min: 0.5,
    max: 3,
    step: 0.05,
    hint: "Как быстро босс двигается после второго попадания."
  },
  {
    key: "bossShootCooldown1",
    group: "advanced",
    label: "Босс стреляет: фаза 1",
    min: 60,
    max: 240,
    step: 5,
    hint: "Пауза между выстрелами босса в первой фазе."
  },
  {
    key: "bossShootCooldown2",
    group: "advanced",
    label: "Босс стреляет: фаза 2",
    min: 40,
    max: 180,
    step: 1,
    hint: "Пауза между выстрелами босса во второй фазе."
  },
  {
    key: "bossBulletSpeed1",
    group: "advanced",
    label: "Снаряды босса: фаза 1",
    min: 2,
    max: 8,
    step: 0.1,
    hint: "Скорость снарядов босса в первой фазе."
  },
  {
    key: "bossBulletSpeed2",
    group: "advanced",
    label: "Снаряды босса: фаза 2",
    min: 2,
    max: 8,
    step: 0.1,
    hint: "Скорость снарядов босса во второй фазе."
  },
  {
    key: "shooterRangeX",
    group: "advanced",
    label: "Стрелок видит игрока",
    min: 200,
    max: 700,
    step: 20,
    hint: "Расстояние по горизонтали, на котором стрелок замечает игрока."
  },
  {
    key: "shooterRangeY",
    group: "advanced",
    label: "Стрелок видит по высоте",
    min: 50,
    max: 200,
    step: 10,
    hint: "Насколько выше или ниже стрелка может быть игрок."
  },
  {
    key: "shooterStartCooldown",
    group: "advanced",
    label: "Пауза перед первым выстрелом",
    min: 0,
    max: 180,
    step: 10,
    hint: "Сколько кадров стрелок ждёт после появления уровня."
  },
  {
    key: "bossJumpForce",
    group: "advanced",
    label: "Сила прыжка босса",
    min: -18,
    max: -7,
    step: 0.5,
    hint: "Чем ниже значение, тем выше прыгает босс."
  },
  {
    key: "bossJumpCooldown1",
    group: "advanced",
    label: "Прыжки босса: фаза 1",
    min: 80,
    max: 300,
    step: 10,
    hint: "Пауза между прыжками босса в первой фазе."
  },
  {
    key: "bossJumpCooldown2",
    group: "advanced",
    label: "Прыжки босса: фаза 2",
    min: 50,
    max: 240,
    step: 5,
    hint: "Пауза между прыжками босса во второй фазе."
  },
  {
    key: "movingPlatformHorizontalRange",
    group: "advanced",
    label: "Дальность платформ →",
    min: 48,
    max: 288,
    step: 24,
    scale: TILE,
    hint: "Сколько клеток проходит горизонтальная платформа от старта."
  },
  {
    key: "movingPlatformVerticalRange",
    group: "advanced",
    label: "Дальность платформ ↑",
    min: 48,
    max: 192,
    step: 24,
    scale: TILE,
    hint: "Сколько клеток проходит вертикальная платформа от старта."
  }
];

function roundToStep(value, step) {
  const decimals = String(step).includes(".")
    ? String(step).split(".")[1].length
    : 0;

  const rounded = Math.round(value / step) * step;

  return Number(rounded.toFixed(decimals));
}

export function clampSettingValue(field, value) {
  if (value === "" || value === null || value === undefined) {
    return DEFAULT_SETTINGS[field.key];
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return DEFAULT_SETTINGS[field.key];
  }

  const clamped = Math.max(field.min, Math.min(field.max, number));

  return roundToStep(clamped, field.step);
}

// Оставляем только известные поля и приводим значения к безопасным границам.
export function sanitizeSettingsOverrides(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const clean = {};

  for (const field of EDITABLE_SETTINGS) {
    if (raw[field.key] === undefined) {
      continue;
    }

    clean[field.key] = clampSettingValue(field, raw[field.key]);
  }

  return Object.keys(clean).length > 0 ? clean : null;
}

// Сбрасываем все параметры к обычным и накладываем настройки уровня.
export function applySettingsOverrides(overrides) {
  Object.assign(SETTINGS, DEFAULT_SETTINGS);

  const clean = sanitizeSettingsOverrides(overrides);

  if (!clean) {
    return;
  }

  for (const field of EDITABLE_SETTINGS) {
    if (clean[field.key] !== undefined) {
      SETTINGS[field.key] = clean[field.key];
    }
  }
}

const NORMAL_PRESET_VALUES = Object.fromEntries(
  EDITABLE_SETTINGS.map(field => [field.key, DEFAULT_SETTINGS[field.key]])
);

// Готовые наборы. Пресет заполняет поля, но сохраняет их только кнопка «Сохранить».
export const SETTINGS_PRESETS = [
  {
    id: "normal",
    label: "Обычно",
    values: NORMAL_PRESET_VALUES
  },
  {
    id: "easy",
    label: "Легко",
    values: {
      ...NORMAL_PRESET_VALUES,
      gravity: 0.5,
      jumpForce: -14.5,
      maxJumps: 3,
      startLives: 5,
      enemySpeed: 1.2,
      springForce: -20,
      movingPlatformHorizontalSpeed: 1.0,
      movingPlatformVerticalSpeed: 0.8,
      invulnerabilityTime: 120,
      shooterCooldown: 130,
      bulletSpeed: 3.5,
      fallingShakeTime: 45,
      fallingRespawnTime: 100,
      bossHealth: 2,
      bossSpeedPhase1: 0.9,
      bossSpeedPhase2: 1.4,
      bossShootCooldown1: 160,
      bossShootCooldown2: 110,
      bossBulletSpeed1: 3.5,
      bossBulletSpeed2: 4.0,
      shooterRangeX: 320,
      shooterRangeY: 120,
      shooterStartCooldown: 100,
      bossJumpForce: -9.5,
      bossJumpCooldown1: 240,
      bossJumpCooldown2: 160,
      movingPlatformHorizontalRange: 96,
      movingPlatformVerticalRange: 48
    }
  },
  {
    id: "hard",
    label: "Сложно",
    values: {
      ...NORMAL_PRESET_VALUES,
      gravity: 0.8,
      jumpForce: -11.5,
      maxJumps: 1,
      startLives: 1,
      enemySpeed: 2.6,
      springForce: -16,
      movingPlatformHorizontalSpeed: 2.0,
      movingPlatformVerticalSpeed: 1.7,
      invulnerabilityTime: 45,
      shooterCooldown: 60,
      bulletSpeed: 6,
      fallingShakeTime: 20,
      fallingRespawnTime: 220,
      bossHealth: 5,
      bossSpeedPhase1: 1.5,
      bossSpeedPhase2: 2.4,
      bossShootCooldown1: 80,
      bossShootCooldown2: 50,
      bossBulletSpeed1: 5.5,
      bossBulletSpeed2: 7.0,
      shooterRangeX: 560,
      shooterRangeY: 80,
      shooterStartCooldown: 30,
      bossJumpForce: -15,
      bossJumpCooldown1: 120,
      bossJumpCooldown2: 70,
      movingPlatformHorizontalRange: 192,
      movingPlatformVerticalRange: 144
    }
  },
  {
    id: "moon",
    label: "Луна",
    values: {
      ...NORMAL_PRESET_VALUES,
      gravity: 0.3,
      jumpForce: -10.5,
      maxJumps: 2,
      playerMaxSpeed: 4.5,
      startLives: 3,
      enemySpeed: 1.4,
      springForce: -16,
      movingPlatformHorizontalSpeed: 1.0,
      movingPlatformVerticalSpeed: 0.8
    }
  }
];
