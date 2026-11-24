// ============================================
// БОСС
// ============================================
// Босс выдерживает три удара прыжком.
// После второго удара начинается вторая фаза:
// он двигается быстрее, чаще прыгает и стреляет веером.

let boss = null;
let bossDefeated = false;
let bossMessageTimer = 0;
let bossMessageText = "";

function createBoss(px, py, type) {
  const width = SETTINGS.bossWidth;
  const height = SETTINGS.bossHeight;
  const isSnow = type === "snow";
  const isCastle = type === "castle";
  const hp = Math.max(
    1,
    SETTINGS.bossHealth + (isSnow ? 1 : 0) + (isCastle ? 2 : 0)
  );
  const phase2At =
    isSnow || isCastle
      ? Math.max(1, Math.ceil(hp / 2))
      : SETTINGS.bossPhase2At;

  return {
    x: px + (TILE - width) / 2,
    y: py + TILE - height,
    w: width,
    h: height,
    startX: px + (TILE - width) / 2,
    startY: py + TILE - height,
    prevX: px + (TILE - width) / 2,
    prevY: py + TILE - height,
    vx: 0,
    vy: 0,
    dir: -1,
    onGround: false,
    hp: hp,
    maxHp: hp,
    phase: 1,
    phase2At: phase2At,
    active: false,
    dead: false,
    type: isSnow ? "snow" : isCastle ? "castle" : "default",
    title: isSnow
      ? "ЛЕДЯНОЙ СТРАЖ"
      : isCastle
        ? "КАМЕННЫЙ СТРАЖ"
        : "БОСС",
    spriteName: isSnow ? "snowBoss" : isCastle ? "castleBoss" : "boss",
    color: isSnow ? "#7fd8ff" : isCastle ? "#b08a5a" : "#7b2ff7",
    speedPhase1:
      SETTINGS.bossSpeedPhase1 * (isSnow ? 1.15 : isCastle ? 0.95 : 1),
    speedPhase2:
      SETTINGS.bossSpeedPhase2 * (isSnow ? 1.15 : isCastle ? 0.95 : 1),
    shootCooldown1: Math.max(
      40,
      SETTINGS.bossShootCooldown1 - (isSnow ? 15 : isCastle ? 5 : 0)
    ),
    shootCooldown2: Math.max(
      30,
      SETTINGS.bossShootCooldown2 - (isSnow ? 10 : isCastle ? 5 : 0)
    ),
    bulletSpeed1:
      SETTINGS.bossBulletSpeed1 + (isSnow ? 0.4 : isCastle ? 0.2 : 0),
    bulletSpeed2:
      SETTINGS.bossBulletSpeed2 + (isSnow ? 0.4 : isCastle ? 0.2 : 0),
    bulletSize:
      SETTINGS.bossBulletWidth + (isSnow ? 2 : isCastle ? 4 : 0),
    jumpForce:
      SETTINGS.bossJumpForce * (isSnow ? 1.15 : isCastle ? 1.2 : 1),
    jumpCooldown1: Math.max(
      60,
      SETTINGS.bossJumpCooldown1 - (isSnow ? 20 : isCastle ? 10 : 0)
    ),
    jumpCooldown2: Math.max(
      40,
      SETTINGS.bossJumpCooldown2 - (isSnow ? 10 : isCastle ? 5 : 0)
    ),
    fanOffsets: isSnow
      ? [-0.42, -0.21, 0, 0.21, 0.42]
      : isCastle
        ? [-0.5, 0, 0.5]
        : [-0.26, 0, 0.26],
    jumpTimer: Math.max(
      60,
      SETTINGS.bossJumpCooldown1 - (isSnow ? 20 : isCastle ? 10 : 0)
    ),
    shootTimer: Math.max(
      40,
      SETTINGS.bossShootCooldown1 - (isSnow ? 15 : isCastle ? 5 : 0)
    ),
    hurtTimer: 0,
    contactGrace: 0
  };
}

function bossIsActive() {
  return Boolean(boss && !boss.dead && boss.active);
}

function updateBoss() {
  if (!boss || boss.dead) {
    return false;
  }

  if (!boss.active) {
    const distance = Math.abs(
      player.x + player.w / 2 - (boss.x + boss.w / 2)
    );

    if (distance < SETTINGS.bossActivationRange) {
      boss.active = true;
      bossMessageTimer = SETTINGS.bossMessageTime;
      bossMessageText = `${boss.title} ПРОБУДИЛСЯ! ПРЫГАЙ НА ГОЛОВУ!`;
      playSound("bossroar");
    } else {
      return false;
    }
  }

  if (boss.hurtTimer > 0) {
    boss.hurtTimer -= 1;
  }

  if (boss.contactGrace > 0) {
    boss.contactGrace -= 1;
  }

  boss.prevX = boss.x;
  boss.prevY = boss.y;

  const speed =
    boss.phase === 2
      ? boss.speedPhase2
      : boss.speedPhase1;

  const bossCenter = boss.x + boss.w / 2;
  const playerCenter = player.x + player.w / 2;

  if (playerCenter > bossCenter + 18) {
    boss.dir = 1;
  } else if (playerCenter < bossCenter - 18) {
    boss.dir = -1;
  }

  // Двигаемся к игроку, но не уходим далеко от места появления.
  boss.x += boss.dir * speed;

  forSolidRects(solid => {
    if (!intersects(boss, solid)) {
      return;
    }

    if (boss.dir > 0) {
      boss.x = solid.x - boss.w;
    } else {
      boss.x = solid.x + solid.w;
    }
  });

  const leftLimit = boss.startX - SETTINGS.bossPatrolRange;
  const rightLimit = boss.startX + SETTINGS.bossPatrolRange;

  if (boss.x < leftLimit) {
    boss.x = leftLimit;
  }

  if (boss.x > rightLimit) {
    boss.x = rightLimit;
  }

  // Гравитация и прыжки
  boss.vy += SETTINGS.gravity;
  boss.y += boss.vy;
  boss.onGround = false;

  forSolidRects(solid => {
    if (!intersects(boss, solid)) {
      return;
    }

    if (boss.vy > 0) {
      boss.y = solid.y - boss.h;
      boss.vy = 0;
      boss.onGround = true;
    } else if (boss.vy < 0) {
      boss.y = solid.y + solid.h;
      boss.vy = 0;
    }
  });

  boss.jumpTimer -= 1;

  if (boss.onGround && boss.jumpTimer <= 0) {
    boss.vy = boss.jumpForce;

    boss.jumpTimer =
      boss.phase === 2
        ? boss.jumpCooldown2
        : boss.jumpCooldown1;
  }

  // Стрельба по игроку
  boss.shootTimer -= 1;

  if (boss.shootTimer <= 0) {
    shootBossBullets();
    boss.shootTimer =
      boss.phase === 2
        ? boss.shootCooldown2
        : boss.shootCooldown1;
  }

  if (!intersects(player, boss)) {
    return false;
  }

  if (boss.contactGrace > 0) {
    return false;
  }

  // Прыжок на голову босса — единственный способ нанести урон.
  // Проверяем и текущее, и предыдущее положение: босс мог прыгнуть
  // навстречу игроку и успеть сдвинуть свою верхнюю границу.
  const playerBottom = player.y + player.h;
  const previousPlayerBottom = player.prevY + player.h;
  const currentTopGap = playerBottom - boss.y;
  const previousTopGap = previousPlayerBottom - boss.prevY;

  const stomping =
    player.vy > 0 &&
    (
      currentTopGap < boss.h * 0.8 ||
      previousTopGap < 24
    );

  if (stomping) {
    damageBoss();
    return false;
  }

  // Если игрок ещё поднимается или задел верхнюю часть босса,
  // не отнимаем жизнь, а мягко отталкиваем его. Это прощает
  // неудачные попытки запрыгнуть на голову.
  const upperBody = playerBottom < boss.y + boss.h * 0.7;

  if (player.vy < 0 || upperBody) {
    const pushDir =
      player.x + player.w / 2 < boss.x + boss.w / 2 ? -1 : 1;

    player.x += pushDir * 8;
    player.vx = pushDir * 2.5;
    boss.contactGrace = 12;
    return false;
  }

  return hurtPlayer();
}

function shootBossBullets() {
  const speed =
    boss.phase === 2
      ? boss.bulletSpeed2
      : boss.bulletSpeed1;

  const startX = boss.x + boss.w / 2;
  const startY = boss.y + boss.h * 0.32;

  const dx = player.x + player.w / 2 - startX;
  const dy = player.y + player.h / 2 - startY;

  const dir = dx >= 0 ? 1 : -1;
  const angle = Math.atan2(
    clamp(dy * 0.012, -2.2, 2.2),
    Math.abs(dx) + 1
  );

  const baseX = dir * Math.cos(angle);
  const baseY = Math.sin(angle);

  const offsets =
    boss.phase === 2
      ? boss.fanOffsets
      : [0];

  for (const offset of offsets) {
    const cosOffset = Math.cos(offset);
    const sinOffset = Math.sin(offset);

    const vx = (baseX * cosOffset - baseY * sinOffset) * speed;
    const vy = (baseX * sinOffset + baseY * cosOffset) * speed;

    const size = boss.bulletSize;

    bullets.push({
      x: startX - size / 2,
      y: startY - size / 2,
      w: size,
      h: size,
      vx: vx,
      vy: vy,
      life: SETTINGS.bossBulletLife,
      boss: true,
      bossType: boss.type,
      dead: false
    });
  }
}

function damageBoss() {
  if (!boss || boss.dead || boss.hurtTimer > 0) {
    return;
  }

  boss.hp -= 1;
  boss.hurtTimer = SETTINGS.bossHurtTime;
  boss.contactGrace = 28;
  bossMessageTimer = 80;

  addScreenShake(4);
  spawnParticles(
    boss.x + boss.w / 2,
    boss.y + boss.h / 2,
    "#b54bff",
    10,
    2.8
  );

  player.vy = SETTINGS.stompBounce;
  player.jumpsLeft = 1;

  score += 20;

  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.dead = true;
    bossDefeated = true;
    bossMessageTimer = SETTINGS.bossMessageTime;
    bossMessageText = `${boss.title} ПОБЕЖДЁН! ФИНИШ ОТКРЫТ!`;
    bullets.length = 0;
    score += SETTINGS.bossScore;
    addScreenShake(12);
    spawnParticles(
      boss.x + boss.w / 2,
      boss.y + boss.h / 2,
      "#ffd23d",
      20,
      4
    );
    playSound("bossdown");
    return;
  }

  if (boss.hp <= boss.phase2At && boss.phase === 1) {
    boss.phase = 2;
    boss.jumpTimer = 40;
    boss.shootTimer = 50;
    bossMessageTimer = 110;
    bossMessageText = `${boss.title} РАЗЪЯРЁН! ФАЗА 2`;
    playSound("bossphase");
    return;
  }

  bossMessageText = `ПОПАДАНИЕ! ОСТАЛОСЬ ${boss.hp}`;
  playSound("bosshit");
}

function resetBossForRespawn() {
  if (!boss || boss.dead) {
    return;
  }

  boss.x = boss.startX;
  boss.y = boss.startY;
  boss.prevX = boss.startX;
  boss.prevY = boss.startY;
  boss.vx = 0;
  boss.vy = 0;
  boss.active = false;
  boss.onGround = false;
  boss.hurtTimer = 0;
  boss.contactGrace = 0;
  boss.jumpTimer =
    boss.phase === 2
      ? boss.jumpCooldown2
      : boss.jumpCooldown1;
  boss.shootTimer =
    boss.phase === 2
      ? boss.shootCooldown2
      : boss.shootCooldown1;

  bossMessageTimer = 0;
  bossMessageText = "";
  bullets.length = 0;
}
