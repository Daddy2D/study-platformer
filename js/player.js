// ============================================
// ИГРОК
// ============================================

const player = {
  x: 100,
  y: 100,
  w: SETTINGS.playerWidth,
  h: SETTINGS.playerHeight,
  vx: 0,
  vy: 0,
  onGround: false,
  jumpsLeft: SETTINGS.maxJumps,
  standingPlatform: null,
  climbing: false,
  prevY: 100
};

function placePlayer(x, y) {
  player.x = x;
  player.y = y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.jumpsLeft = SETTINGS.maxJumps;
  player.standingPlatform = null;
  player.climbing = false;
  player.prevY = y;
}

function ladderAt(rect) {
  for (const ladder of ladders) {
    if (intersects(rect, ladder)) {
      return ladder;
    }
  }

  return null;
}

// Вернуть игрока на последний чекпоинт
function resetPlayer() {
  placePlayer(currentCheckpoint.x, currentCheckpoint.y);
  jumpPressed = false;
  bullets.length = 0;
  resetBossForRespawn();
}

// Игрок получил урон: шипы, враг, пуля, падение или платформа.
// Пока действует неуязвимость, урон не повторяется.
function hurtPlayer() {
  if (gameOver || levelComplete || paused) {
    return false;
  }

  if (invulnerableTimer > 0) {
    return false;
  }

  hurtThisFrame = true;
  lives -= 1;
  recordLifeLost();

  addScreenShake(9);
  spawnParticles(
    player.x + player.w / 2,
    player.y + player.h / 2,
    "#ff5c5c",
    12,
    3
  );

  if (lives <= 0) {
    lives = 0;
    gameOver = true;
    playSound("gameover");
    return true;
  }

  playSound("hurt");
  resetPlayer();
  invulnerableTimer = SETTINGS.invulnerabilityTime;

  return true;
}

// Если игрок стоит на движущейся платформе,
// она везёт его за собой.
function carryPlayer() {
  const platform = player.standingPlatform;

  if (!platform) {
    return;
  }

  const stillOn =
    player.x + player.w > platform.x &&
    player.x < platform.x + platform.w &&
    Math.abs((player.y + player.h) - platform.y) < 18;

  if (!stillOn) {
    player.standingPlatform = null;
    return;
  }

  player.x += platform.dx;
  player.y += platform.dy;
}

function movePlayerX(amount) {
  if (amount === 0) {
    return;
  }

  player.x += amount;

  forSolidRects(solid => {
    if (!intersects(player, solid)) {
      return;
    }

    if (amount > 0) {
      player.x = solid.x - player.w;
    } else {
      player.x = solid.x + solid.w;
    }

    player.vx = 0;
  });

  for (const platform of movingPlatforms) {
    if (!intersects(player, platform)) {
      continue;
    }

    if (amount > 0) {
      player.x = platform.x - player.w;
    } else {
      player.x = platform.x + platform.w;
    }

    player.vx = 0;
  }

  for (const platform of fallingPlatforms) {
    if (!fallingPlatformIsSolid(platform) || !intersects(player, platform)) {
      continue;
    }

    if (amount > 0) {
      player.x = platform.x - player.w;
    } else {
      player.x = platform.x + platform.w;
    }

    player.vx = 0;
  }

  for (const block of breakableBlocks) {
    if (block.broken || !intersects(player, block)) {
      continue;
    }

    if (amount > 0) {
      player.x = block.x - player.w;
    } else {
      player.x = block.x + block.w;
    }

    player.vx = 0;
  }
}

function movePlayerY(amount) {
  // Запоминаем, где игрок был до движения.
  // Это нужно, чтобы не «запрыгнуть» на стену сбоку.
  const previousBottom = player.y + player.h;
  const previousTop = player.y;

  player.y += amount;
  player.onGround = false;
  player.standingPlatform = null;

  forSolidRects(solid => {
    if (!intersects(player, solid)) {
      return;
    }

    if (amount > 0 && previousBottom <= solid.y + 1) {
      player.y = solid.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (amount < 0 && previousTop >= solid.y + solid.h - 1) {
      player.y = solid.y + solid.h;
      player.vy = 0;
    }
  });

  for (const platform of movingPlatforms) {
    if (!intersects(player, platform)) {
      continue;
    }

    if (amount > 0 && previousBottom <= platform.y + 1) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.standingPlatform = platform;
    } else if (amount < 0 && previousTop >= platform.y + platform.h - 1) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }

  for (const platform of fallingPlatforms) {
    if (!fallingPlatformIsSolid(platform) || !intersects(player, platform)) {
      continue;
    }

    if (amount > 0 && previousBottom <= platform.y + 1) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (amount < 0 && previousTop >= platform.y + platform.h - 1) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }

  for (const platform of oneWayPlatforms) {
    if (!intersects(player, platform)) {
      continue;
    }

    if (amount > 0 && previousBottom <= platform.y + 1) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  for (const block of breakableBlocks) {
    if (block.broken || !intersects(player, block)) {
      continue;
    }

    if (amount > 0 && previousBottom <= block.y + 1) {
      player.y = block.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (amount < 0 && previousTop >= block.y + block.h - 1) {
      player.y = block.y + block.h;
      player.vy = 0;
      breakBlock(block);
    }
  }
}

// Если платформа сама наехала на игрока (сбоку, снизу или сверху),
// выталкиваем его в ближайшую сторону.
// Если вытолкнуть некуда — игрока раздавило.
function resolvePlatformOverlaps() {
  for (const platform of movingPlatforms) {
    if (!intersects(player, platform)) {
      continue;
    }

    const pushUp = (player.y + player.h) - platform.y;
    const pushDown = (platform.y + platform.h) - player.y;
    const pushLeft = (player.x + player.w) - platform.x;
    const pushRight = (platform.x + platform.w) - player.x;

    const smallest = Math.min(pushUp, pushDown, pushLeft, pushRight);

    let nextX = player.x;
    let nextY = player.y;
    let direction = "";

    if (smallest === pushUp) {
      nextY = platform.y - player.h;
      direction = "up";
    } else if (smallest === pushDown) {
      nextY = platform.y + platform.h;
      direction = "down";
    } else if (smallest === pushLeft) {
      nextX = platform.x - player.w;
      direction = "left";
    } else {
      nextX = platform.x + platform.w;
      direction = "right";
    }

    const testRect = { x: nextX, y: nextY, w: player.w, h: player.h };

    if (blockedAt(testRect)) {
      hurtPlayer();
      return;
    }

    player.x = nextX;
    player.y = nextY;

    if (direction === "up") {
      player.onGround = true;
      player.standingPlatform = platform;
      player.vy = 0;
    } else if (direction === "down") {
      player.vy = 0;
    } else {
      player.vx = 0;
    }
  }
}

function updatePlayer() {
  player.prevY = player.y;

  if (invulnerableTimer > 0) {
    invulnerableTimer -= 1;
  }

  carryPlayer();

  // Платформа могла привезти игрока в стену или потолок
  if (blockedAt(player)) {
    hurtPlayer();
    return;
  }

  let input = 0;

  if (keys.ArrowLeft || keys.KeyA) {
    input -= 1;
  }

  if (keys.ArrowRight || keys.KeyD) {
    input += 1;
  }

  player.vx += input * SETTINGS.playerAccel;
  player.vx *= SETTINGS.playerFriction;
  player.vx = clamp(
    player.vx,
    -SETTINGS.playerMaxSpeed,
    SETTINGS.playerMaxSpeed
  );

  const wasOnGround = player.onGround;

  const ladder = ladderAt(player);
  const climbUp = keys.ArrowUp || keys.KeyW;
  const climbDown = keys.ArrowDown || keys.KeyS;
  const climbInput = (climbUp ? -1 : 0) + (climbDown ? 1 : 0);

  if (ladder && climbInput !== 0) {
    player.climbing = true;
  }

  if (!ladder) {
    player.climbing = false;
  }

  if (wasOnGround && climbInput === 0) {
    player.climbing = false;
  }

  if (player.onGround) {
    player.jumpsLeft = SETTINGS.maxJumps;
  }

  if (jumpPressed) {
    if (player.jumpsLeft > 0) {
      player.vy = SETTINGS.jumpForce;
      player.jumpsLeft -= 1;
      player.onGround = false;
      player.climbing = false;
      playSound("jump");
    }

    jumpPressed = false;
  }

  if (player.climbing && ladder) {
    player.vy = climbInput * SETTINGS.ladderSpeed;
    player.onGround = false;
    player.jumpsLeft = SETTINGS.maxJumps;
  } else {
    player.vy += SETTINGS.gravity;
  }

  const fallSpeed = player.vy;

  movePlayerX(player.vx);
  movePlayerY(player.vy);
  resolvePlatformOverlaps();

  if (player.onGround && climbInput === 0) {
    player.climbing = false;
  }

  if (hurtThisFrame) {
    return;
  }

  if (!wasOnGround && player.onGround && fallSpeed > 2) {
    spawnParticles(
      player.x + player.w / 2,
      player.y + player.h,
      "rgba(255, 255, 255, 0.75)",
      5,
      1.4
    );
  }

  if (player.onGround) {
    player.jumpsLeft = SETTINGS.maxJumps;
  } else if (wasOnGround && player.vy >= 0) {
    // Игрок сам сошёл с края — в воздухе остаётся один прыжок
    player.jumpsLeft = Math.min(player.jumpsLeft, 1);
  }

  checkSprings();

  if (player.y > levelHeight + SETTINGS.fallDeathMargin) {
    hurtPlayer();
  }
}

// Батут подбрасывает игрока вверх, если тот наступил на него сверху.
function checkSprings() {
  const feet = player.y + player.h;

  for (const spring of springs) {
    if (spring.timer > 0) {
      spring.timer -= 1;
      continue;
    }

    const overX =
      player.x + player.w > spring.x + 4 &&
      player.x < spring.x + spring.w - 4;

    const onTop =
      feet >= spring.y - 2 &&
      feet <= spring.y + spring.h + 8 &&
      player.vy >= 0;

    if (!overX || !onTop) {
      continue;
    }

    player.y = spring.y - player.h;
    player.vy = SETTINGS.springForce;
    player.onGround = false;
    player.jumpsLeft = SETTINGS.maxJumps;
    spring.timer = SETTINGS.springCooldown;
    playSound("spring");
    spawnParticles(
      spring.x + spring.w / 2,
      spring.y,
      "#ffd166",
      7,
      2
    );
  }
}

// ============================================
// ВЗАИМОДЕЙСТВИЕ С ПРЕДМЕТАМИ
// ============================================

function updateCheckpoints() {
  for (const checkpoint of checkpoints) {
    if (!intersects(player, checkpoint)) {
      continue;
    }

    if (checkpoint.active) {
      continue;
    }

    for (const other of checkpoints) {
      other.active = false;
    }

    checkpoint.active = true;
    playSound("checkpoint");
    spawnParticles(
      checkpoint.x + checkpoint.w / 2,
      checkpoint.y + checkpoint.h / 2,
      "#2ecc71",
      8,
      2
    );

    currentCheckpoint = {
      x: checkpoint.spawnX,
      y: checkpoint.spawnY
    };
  }
}

function updateKeys() {
  for (const key of keyItems) {
    if (!key.taken && intersects(player, key)) {
      key.taken = true;
      keyCount += 1;
      playSound("key");
      spawnParticles(
        key.x + key.w / 2,
        key.y + key.h / 2,
        "#f1c40f",
        7,
        2
      );
    }
  }

  keyItems = keyItems.filter(key => !key.taken);
}

function updateDoors() {
  const padding = SETTINGS.doorSensorPadding;

  const sensor = {
    x: player.x - padding,
    y: player.y,
    w: player.w + padding * 2,
    h: player.h
  };

  for (const door of doors) {
    if (door.open) {
      continue;
    }

    if (keyCount > 0 && intersects(sensor, door)) {
      door.open = true;
      keyCount -= 1;
      playSound("door");
    }
  }
}

function checkSpikes() {
  for (const spike of spikes) {
    for (const hitbox of spike.hitboxes) {
      if (intersects(player, hitbox)) {
        return hurtPlayer();
      }
    }
  }

  return false;
}

function checkSaws() {
  for (const saw of saws) {
    const hitbox = {
      x: saw.x + SETTINGS.sawHitboxInset,
      y: saw.y + SETTINGS.sawHitboxInset,
      w: saw.w - SETTINGS.sawHitboxInset * 2,
      h: saw.h - SETTINGS.sawHitboxInset * 2
    };

    if (intersects(player, hitbox)) {
      return hurtPlayer();
    }
  }

  return false;
}
