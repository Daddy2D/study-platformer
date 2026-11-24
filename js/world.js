// ============================================
// МИР: уровни, клетки и столкновения
// ============================================

// Уровни игры в одном формате: имя + карта.
// Свои уровни из редактора выглядят так же.
const BUILTIN_LEVELS = LEVELS.map((rows, index) => ({
  name: LEVEL_NAMES[index] || `Уровень ${index + 1}`,
  rows: rows,
  settingsKey: `builtin:${index}`,
  biome: LEVEL_BIOMES[index] || "grass",
  bossType: LEVEL_BOSS_TYPES[index] || "default"
}));

// Какие уровни сейчас играются: встроенные или один свой
let gameLevels = BUILTIN_LEVELS;
let levelSource = "builtin";
let currentLevelName = LEVEL_NAMES[0];

// Какие символы можно использовать в карте уровня
const TILE_CHARS = new Set([
  "G", // земля
  "P", // старт игрока
  "C", // монета
  "E", // обычный враг
  "T", // стреляющий враг
  "S", // шипы
  "F", // чекпоинт
  "M", // движущаяся платформа (по горизонтали)
  "V", // движущаяся платформа (по вертикали)
  "K", // ключ
  "D", // дверь
  "B", // батут
  "L", // падающая платформа
  "O", // платформа в одну сторону
  "R", // разрушаемый блок
  "H", // лестница
  "W", // пила
  "N", // пушка
  "Z", // босс
  "X"  // финишный флаг
]);

// Объекты текущего уровня
let solids = [];
let spikes = [];
let checkpoints = [];
let movingPlatforms = [];
let coins = [];
let enemies = [];
let keyItems = [];
let doors = [];
let bullets = [];
let exits = [];
let springs = [];
let fallingPlatforms = [];
let oneWayPlatforms = [];
let breakableBlocks = [];
let ladders = [];
let saws = [];
let cannons = [];

let keyCount = 0;
let coinsTaken = 0;
let coinsTotal = 0;

let playerStart = { x: 100, y: 100 };
let currentCheckpoint = { x: 100, y: 100 };

// Состояние игры
let score = 0;
let scoreAtLevelStart = 0;
let currentLevelIndex = 0;
let currentBiome = "grass";
let currentBossType = "default";

// Жизни и защита после respawn
let lives = SETTINGS.startLives;
let invulnerableTimer = 0;
let gameOver = false;
let hurtThisFrame = false;

let levelWidth = 1;
let levelHeight = 1;

let levelComplete = false;
let levelCompleteTimer = 0;
let levelTimerFrames = 0;
let lastLevelResult = null;
let gameFinished = false;
let paused = false;

// ============================================
// ГЕОМЕТРИЯ И СТОЛКНОВЕНИЯ
// ============================================

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function forSolidRects(callback) {
  for (const solid of solids) {
    callback(solid);
  }

  for (const door of doors) {
    if (!door.open) {
      callback(door);
    }
  }
}

// Проверка точки: есть ли в ней твёрдая клетка.
// Нужна врагам, чтобы не падать с края платформы.
function solidAt(x, y) {
  for (const solid of solids) {
    if (
      x >= solid.x &&
      x < solid.x + solid.w &&
      y >= solid.y &&
      y < solid.y + solid.h
    ) {
      return true;
    }
  }

  for (const door of doors) {
    if (
      !door.open &&
      x >= door.x &&
      x < door.x + door.w &&
      y >= door.y &&
      y < door.y + door.h
    ) {
      return true;
    }
  }

  return false;
}

// Не окажется ли прямоугольник внутри земли или закрытой двери
function blockedAt(rect) {
  for (const solid of solids) {
    if (intersects(rect, solid)) {
      return true;
    }
  }

  for (const door of doors) {
    if (!door.open && intersects(rect, door)) {
      return true;
    }
  }

  return false;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

function updateMovingPlatforms() {
  for (const platform of movingPlatforms) {
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

function fallingPlatformIsSolid(platform) {
  return platform.state === "idle" || platform.state === "shaking";
}

// Падающая платформа начинает дрожать, когда на неё наступили,
// а через несколько кадров исчезает и позже появляется на месте.
function updateFallingPlatforms() {
  for (const platform of fallingPlatforms) {
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

      if (platform.y > levelHeight + 200) {
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

function breakBlock(block) {
  if (!block || block.broken) {
    return;
  }

  block.broken = true;
  playSound("crack");
  addScreenShake(2);
  spawnParticles(
    block.x + block.w / 2,
    block.y + block.h / 2,
    "#c08a4a",
    10,
    2.5
  );
}

function updateSaws() {
  for (const saw of saws) {
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

function updateCannons() {
  for (const cannon of cannons) {
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

    bullets.push({
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

function loadLevel(index) {
  currentLevelIndex = index;
  scoreAtLevelStart = score;

  const level = gameLevels[index];

  if (!level) {
    console.warn(`Уровень ${index + 1} не найден.`);
    return;
  }

  // У каждого уровня могут быть свои гравитация, скорость, жизни и т. д.
  applySettingsOverrides(
    level.settingsKey ? getLevelSettings(level.settingsKey) : null
  );

  currentBiome = level.biome || "grass";
  currentBossType = level.bossType || "default";

  const rows = level.rows;

  currentLevelName = level.name;

  solids.length = 0;
  spikes.length = 0;
  checkpoints.length = 0;
  movingPlatforms.length = 0;
  coins.length = 0;
  enemies.length = 0;
  keyItems.length = 0;
  doors.length = 0;
  bullets.length = 0;
  exits.length = 0;
  springs.length = 0;
  fallingPlatforms.length = 0;
  oneWayPlatforms.length = 0;
  breakableBlocks.length = 0;
  ladders.length = 0;
  saws.length = 0;
  cannons.length = 0;

  boss = null;
  bossDefeated = false;
  bossMessageTimer = 0;
  bossMessageText = "";

  keyCount = 0;
  coinsTaken = 0;
  coinsTotal = 0;

  levelComplete = false;
  levelCompleteTimer = 0;
  levelTimerFrames = 0;
  lastLevelResult = null;
  resetEffects();
  gameFinished = false;
  paused = false;
  gameOver = false;
  hurtThisFrame = false;

  // 3 жизни даются заново на каждом уровне
  lives = SETTINGS.startLives;
  invulnerableTimer = 0;

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
        solids.push({ x: px, y: py, w: TILE, h: TILE });
      }

      if (char === "P") {
        start = {
          x: px + SETTINGS.respawnOffsetX,
          y: py + TILE - SETTINGS.playerHeight
        };
      }

      if (char === "C") {
        coins.push({
          x: px + SETTINGS.coinOffset,
          y: py + SETTINGS.coinOffset,
          w: SETTINGS.coinWidth,
          h: SETTINGS.coinHeight,
          taken: false
        });

        coinsTotal += 1;
      }

      if (char === "E" || char === "T") {
        const shooter = char === "T";

        enemies.push({
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
        spikes.push({
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
        checkpoints.push({
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
        movingPlatforms.push(createMovingPlatform(px, py, "x"));
      }

      if (char === "V") {
        movingPlatforms.push(createMovingPlatform(px, py, "y"));
      }

      if (char === "K") {
        keyItems.push({
          x: px + SETTINGS.keyOffset,
          y: py + SETTINGS.keyOffset,
          w: SETTINGS.keyWidth,
          h: SETTINGS.keyHeight,
          taken: false
        });
      }

      if (char === "D") {
        doors.push({
          x: px,
          y: py + TILE - SETTINGS.doorHeight,
          w: TILE,
          h: SETTINGS.doorHeight,
          open: false
        });
      }

      if (char === "B") {
        springs.push(createSpring(px, py));
      }

      if (char === "L") {
        fallingPlatforms.push(createFallingPlatform(px, py));
      }

      if (char === "O") {
        oneWayPlatforms.push({
          x: px,
          y: py + SETTINGS.oneWayPlatformOffsetY,
          w: TILE,
          h: SETTINGS.oneWayPlatformHeight
        });
      }

      if (char === "R") {
        breakableBlocks.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          broken: false
        });
      }

      if (char === "H") {
        ladders.push({ x: px, y: py, w: TILE, h: TILE });
      }

      if (char === "W") {
        saws.push({
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
        cannons.push({
          x: px,
          y: py,
          w: TILE,
          h: TILE,
          dir: 1,
          shootCooldown: SETTINGS.cannonStartCooldown
        });
      }

      if (char === "Z") {
        boss = createBoss(px, py, currentBossType);
      }

      if (char === "X") {
        exits.push({
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

  if (exits.length === 0) {
    console.warn(`Уровень ${index + 1}: нет финиша X. Уровень нельзя пройти.`);
  }

  levelWidth = width * TILE;
  levelHeight = rows.length * TILE;

  playerStart = start;
  currentCheckpoint = { x: start.x, y: start.y };

  placePlayer(start.x, start.y);

  jumpPressed = false;
  confirmPressed = false;
  clickPressed = false;
  invulnerableTimer = 0;

  recordLevelAttempt(index);
}
