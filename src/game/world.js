import { LEVELS, LEVEL_NAMES, LEVEL_BIOMES, LEVEL_BOSS_TYPES, LEVEL_META } from "../data/levels/index.js";
import { TILE, SETTINGS, applySettingsOverrides } from "../core/settings.js";
import { state } from "../core/state.js";
import { getLevelSettings } from "../core/storage.js";
import { TILE_CHARS, validateLevelRows } from "../core/level-format.js";
import { playSound } from "../core/sound.js";
import { resetEffects } from "../core/effects.js";
import { intersects, clamp } from "./collision.js";
import { player, placePlayer } from "./player.js";
import { createBoss } from "./boss.js";
import { recordLevelAttempt } from "./progress.js";

// ============================================
// МИР: уровни, клетки и столкновения
// ============================================

// Уровни игры в одном формате: имя + карта.
// Свои уровни из редактора выглядят так же.
export const BUILTIN_LEVELS = LEVELS.map((rows, index) => ({
  name: LEVEL_NAMES[index] || `Уровень ${index + 1}`,
  rows: rows,
  settingsKey: `builtin:${index}`,
  biome: LEVEL_BIOMES[index] || "grass",
  bossType: LEVEL_BOSS_TYPES[index] || "default",
  author: (LEVEL_META[index] && LEVEL_META[index].author) || "",
  note: (LEVEL_META[index] && LEVEL_META[index].note) || ""
}));

// Какие уровни сейчас играются: встроенные или один свой
state.gameLevels = BUILTIN_LEVELS;
state.currentLevelName = LEVEL_NAMES[0];

// TILE_CHARS живёт в модуле формата уровня.




// ============================================
// ДВИЖУЩИЕСЯ ПЛАТФОРМЫ
// ============================================

function createMovingPlatform(px, py, axis) {
  return {
    x: px,
    y: py,
    w: SETTINGS.movingPlatformWidth,
    h: SETTINGS.movingPlatformHeight,
    startX: px,
    startY: py,
    axis: axis,
    dir: 1,
    speed: axis === "x"
      ? SETTINGS.movingPlatformHorizontalSpeed
      : SETTINGS.movingPlatformVerticalSpeed,
    range: axis === "x"
      ? SETTINGS.movingPlatformHorizontalRange
      : SETTINGS.movingPlatformVerticalRange,
    dx: 0,
    dy: 0
  };
}

export function updateMovingPlatforms() {
  for (const platform of state.movingPlatforms) {
    const oldX = platform.x;
    const oldY = platform.y;

    if (platform.axis === "x") {
      platform.x += platform.dir * platform.speed;

      if (
        platform.x > platform.startX + platform.range ||
        platform.x < platform.startX - platform.range
      ) {
        platform.dir *= -1;
        platform.x = clamp(
          platform.x,
          platform.startX - platform.range,
          platform.startX + platform.range
        );
      }
    } else {
      platform.y += platform.dir * platform.speed;

      if (
        platform.y > platform.startY + platform.range ||
        platform.y < platform.startY - platform.range
      ) {
        platform.dir *= -1;
        platform.y = clamp(
          platform.y,
          platform.startY - platform.range,
          platform.startY + platform.range
        );
      }
    }

    platform.dx = platform.x - oldX;
    platform.dy = platform.y - oldY;
  }
}

// ============================================
// БАТУТ И ПАДАЮЩИЕ ПЛАТФОРМЫ
// ============================================

function createSpring(px, py) {
  return {
    x: px + (TILE - SETTINGS.springWidth) / 2,
    y: py + TILE - SETTINGS.springHeight,
    w: SETTINGS.springWidth,
    h: SETTINGS.springHeight,
    timer: 0
  };
}

function createFallingPlatform(px, py) {
  const height = SETTINGS.fallingPlatformHeight;

  return {
    x: px + (TILE - SETTINGS.fallingPlatformWidth) / 2,
    y: py + (TILE - height) / 2,
    startX: px + (TILE - SETTINGS.fallingPlatformWidth) / 2,
    startY: py + (TILE - height) / 2,
    w: SETTINGS.fallingPlatformWidth,
    h: height,
    state: "idle", // idle | shaking | falling | gone
    timer: 0,
    respawnTimer: 0,
    vy: 0
  };
}


// Падающая платформа начинает дрожать, когда на неё наступили,
// а через несколько кадров исчезает и позже появляется на месте.
export function updateFallingPlatforms() {
  for (const platform of state.fallingPlatforms) {
    if (platform.state === "idle") {
      const onTop =
        player.x + player.w > platform.x + 3 &&
        player.x < platform.x + platform.w - 3 &&
        Math.abs(player.y + player.h - platform.y) < 8 &&
        player.vy >= 0;

      if (onTop) {
        platform.state = "shaking";
        platform.timer = SETTINGS.fallingShakeTime;
        playSound("crack");
      }

      continue;
    }

    if (platform.state === "shaking") {
      platform.timer -= 1;

      if (platform.timer <= 0) {
        platform.state = "falling";
        platform.vy = 0;
      }

      continue;
    }

    if (platform.state === "falling") {
      platform.vy += SETTINGS.fallingGravity;
      platform.y += platform.vy;

      if (platform.y > state.levelHeight + 200) {
        platform.state = "gone";
        platform.respawnTimer = SETTINGS.fallingRespawnTime;
      }

      continue;
    }

    if (platform.state === "gone") {
      platform.respawnTimer -= 1;

      if (platform.respawnTimer <= 0) {
        const spawnRect = {
          x: platform.startX,
          y: platform.startY,
          w: platform.w,
          h: platform.h
        };

        // Не появляемся прямо внутри игрока
        if (intersects(player, spawnRect)) {
          platform.respawnTimer = 10;
          continue;
        }

        platform.x = platform.startX;
        platform.y = platform.startY;
        platform.vy = 0;
        platform.state = "idle";
      }
    }
  }
}

// ============================================
// НОВЫЕ МЕХАНИКИ
// ============================================


export function updateSaws() {
  for (const saw of state.saws) {
    saw.x += saw.dir * saw.speed;
    saw.angle += 0.25;

    if (
      saw.x > saw.startX + saw.range ||
      saw.x < saw.startX - saw.range
    ) {
      saw.dir *= -1;
      saw.x = clamp(
        saw.x,
        saw.startX - saw.range,
        saw.startX + saw.range
      );
    }
  }
}

export function updateCannons() {
  for (const cannon of state.cannons) {
    const dx =
      player.x + player.w / 2 - (cannon.x + cannon.w / 2);
    const dy = Math.abs(
      player.y + player.h / 2 - (cannon.y + cannon.h / 2)
    );

    if (Math.abs(dx) >= SETTINGS.cannonRangeX) {
      if (cannon.shootCooldown > 0) {
        cannon.shootCooldown -= 1;
      }

      continue;
    }

    if (dy >= SETTINGS.cannonRangeY) {
      if (cannon.shootCooldown > 0) {
        cannon.shootCooldown -= 1;
      }

      continue;
    }

    cannon.dir = dx >= 0 ? 1 : -1;

    if (cannon.shootCooldown > 0) {
      cannon.shootCooldown -= 1;
      continue;
    }

    state.bullets.push({
      x: cannon.x + cannon.w / 2 +
        cannon.dir * (cannon.w / 2 + 4) -
        SETTINGS.cannonBulletWidth / 2,
      y: cannon.y + cannon.h / 2 -
        SETTINGS.cannonBulletHeight / 2,
      w: SETTINGS.cannonBulletWidth,
      h: SETTINGS.cannonBulletHeight,
      vx: cannon.dir * SETTINGS.cannonBulletSpeed,
      vy: 0,
      cannon: true,
      dead: false
    });

    cannon.shootCooldown = SETTINGS.cannonCooldown;
    playSound("cannon");
  }
}

// ============================================
// ЗАГРУЗКА УРОВНЯ
// ============================================

export function loadLevel(index) {
  state.currentLevelIndex = index;
  state.scoreAtLevelStart = state.score;

  const level = state.gameLevels[index];

  if (!level) {
    console.warn(`Уровень ${index + 1} не найден.`);
    return;
  }

  // У каждого уровня могут быть свои гравитация, скорость, жизни и т. д.
  applySettingsOverrides(
    level.settingsKey ? getLevelSettings(level.settingsKey) : null
  );

  state.currentBiome = level.biome || "grass";
  state.currentBossType = level.bossType || "default";

  const rows = level.rows;

  // Игра грузит карту даже с ошибками, но пишет их в консоль:
  // так видно, что не так в уровне, не блокируя запуск.
  const check = validateLevelRows(rows);

  for (const problem of [...check.errors, ...check.warnings]) {
    console.warn(`Уровень ${index + 1}: ${problem}`);
  }

  state.currentLevelName = level.name;
  state.currentLevelAuthor = level.author || "";
  state.currentLevelNote = level.note || "";

  state.solids.length = 0;
  state.spikes.length = 0;
  state.checkpoints.length = 0;
  state.movingPlatforms.length = 0;
  state.coins.length = 0;
  state.enemies.length = 0;
  state.keyItems.length = 0;
  state.doors.length = 0;
  state.bullets.length = 0;
  state.exits.length = 0;
  state.springs.length = 0;
  state.fallingPlatforms.length = 0;
  state.oneWayPlatforms.length = 0;
  state.breakableBlocks.length = 0;
  state.ladders.length = 0;
  state.saws.length = 0;
  state.cannons.length = 0;

  state.boss = null;
  state.bossDefeated = false;
  state.bossMessageTimer = 0;
  state.bossMessageText = "";

  state.keyCount = 0;
  state.coinsTaken = 0;
  state.coinsTotal = 0;

  state.levelComplete = false;
  state.levelCompleteTimer = 0;
  state.levelTimerFrames = 0;
  state.lastLevelResult = null;
  resetEffects();
  state.gameFinished = false;
  state.paused = false;
  state.gameOver = false;
  state.hurtThisFrame = false;

  // 3 жизни даются заново на каждом уровне
  state.lives = SETTINGS.startLives;
  state.invulnerableTimer = 0;

  // Все строки уровня должны быть одинаковой длины.
  // Если кто-то ошибся в карте, дополняем строки точками.
  const width = Math.max(...rows.map(row => row.length));
  const badRows = [];

  let start = null;

  rows.forEach((row, y) => {
    if (row.length !== width) {
      badRows.push(y + 1);
    }

    for (let x = 0; x < width; x++) {
      const char = row[x] || ".";
      const px = x * TILE;
      const py = y * TILE;

      if (char !== "." && !TILE_CHARS.has(char)) {
        console.warn(`Уровень ${index + 1}: неизвестный символ "${char}" в строке ${y + 1}, колонка ${x + 1}.`);
      }

      if (char === "G") {
        state.solids.push({ x: px, y: py, w: TILE, h: TILE });
      }

      if (char === "P") {
        start = {
          x: px + SETTINGS.respawnOffsetX,
          y: py + TILE - SETTINGS.playerHeight
        };
      }

      if (char === "C") {
        state.coins.push({
          x: px + SETTINGS.coinOffset,
          y: py + SETTINGS.coinOffset,
          w: SETTINGS.coinWidth,
          h: SETTINGS.coinHeight,
          taken: false
        });

        state.coinsTotal += 1;
      }

      if (char === "E" || char === "T") {
        const shooter = char === "T";

        state.enemies.push({
          x: px + 4,
          y: py + TILE - SETTINGS.enemyHeight,
          w: SETTINGS.enemyWidth,
          h: SETTINGS.enemyHeight,
          vx: 0,
          vy: 0,
          dir: 1,
          speed: shooter ? 0 : SETTINGS.enemySpeed,
          onGround: false,
          dead: false,
          shooter: shooter,
          shootCooldown: SETTINGS.shooterStartCooldown
        });
      }

      if (char === "S") {
        // У шипов есть прозрачные участки. Поэтому урон считается
        // не по всей клетке, а по нескольким зонам у видимых треугольников.
        state.spikes.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          hitboxes: [
            { x: px + 9, y: py + 10, w: 10, h: 14 },
            { x: px + 21, y: py + 10, w: 10, h: 14 },
            { x: px + 34, y: py + 10, w: 10, h: 14 },
            { x: px + 5, y: py + 24, w: TILE - 10, h: 18 }
          ]
        });
      }

      if (char === "F") {
        state.checkpoints.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          active: false,
          spawnX: px + SETTINGS.respawnOffsetX,
          spawnY: py + TILE - SETTINGS.playerHeight
        });
      }

      if (char === "M") {
        state.movingPlatforms.push(createMovingPlatform(px, py, "x"));
      }

      if (char === "V") {
        state.movingPlatforms.push(createMovingPlatform(px, py, "y"));
      }

      if (char === "K") {
        state.keyItems.push({
          x: px + SETTINGS.keyOffset,
          y: py + SETTINGS.keyOffset,
          w: SETTINGS.keyWidth,
          h: SETTINGS.keyHeight,
          taken: false
        });
      }

      if (char === "D") {
        state.doors.push({
          x: px,
          y: py + TILE - SETTINGS.doorHeight,
          w: TILE,
          h: SETTINGS.doorHeight,
          open: false
        });
      }

      if (char === "B") {
        state.springs.push(createSpring(px, py));
      }

      if (char === "L") {
        state.fallingPlatforms.push(createFallingPlatform(px, py));
      }

      if (char === "O") {
        state.oneWayPlatforms.push({
          x: px,
          y: py + SETTINGS.oneWayPlatformOffsetY,
          w: TILE,
          h: SETTINGS.oneWayPlatformHeight
        });
      }

      if (char === "R") {
        state.breakableBlocks.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          broken: false
        });
      }

      if (char === "H") {
        state.ladders.push({ x: px, y: py, w: TILE, h: TILE });
      }

      if (char === "W") {
        state.saws.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          startX: px,
          startY: py,
          dir: 1,
          speed: SETTINGS.sawSpeed,
          range: SETTINGS.sawRange,
          angle: 0
        });
      }

      if (char === "N") {
        state.cannons.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          dir: 1,
          shootCooldown: SETTINGS.cannonStartCooldown
        });
      }

      if (char === "Z") {
        state.boss = createBoss(px, py, state.currentBossType);
      }

      if (char === "X") {
        state.exits.push({
          x: px,
          y: py,
          w: SETTINGS.exitWidth,
          h: SETTINGS.exitHeight
        });
      }
    }
  });

  if (badRows.length > 0) {
    console.warn(
      `Уровень ${index + 1}: строки ${badRows.join(", ")} короче остальных. ` +
      `Они дополнены точками, но карту лучше выровнять.`
    );
  }

  if (!start) {
    console.warn(`Уровень ${index + 1}: нет точки старта P. Игрок появится в левом верхнем углу.`);
    start = { x: TILE, y: TILE };
  }

  if (state.exits.length === 0) {
    console.warn(`Уровень ${index + 1}: нет финиша X. Уровень нельзя пройти.`);
  }

  state.levelWidth = width * TILE;
  state.levelHeight = rows.length * TILE;

  state.playerStart = start;
  state.currentCheckpoint = { x: start.x, y: start.y };

  placePlayer(start.x, start.y);

  state.jumpPressed = false;
  state.confirmPressed = false;
  state.clickPressed = false;
  state.invulnerableTimer = 0;

  recordLevelAttempt(index);
}
