import { TILE, SETTINGS } from "../core/settings.js";
import { state } from "../core/state.js";
import { playSound } from "../core/sound.js";
import { addScreenShake, spawnParticles } from "../core/effects.js";
import { intersects, forSolidRects, clamp } from "./collision.js";
import { player, hurtPlayer } from "./player.js";

// ============================================
// БОСС
// ============================================
// Босс выдерживает три удара прыжком.
// После второго удара начинается вторая фаза:
// он двигается быстрее, чаще прыгает и стреляет веером.


export function createBoss(px, py, type) {
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

export function updateBoss() {
  if (!state.boss || state.boss.dead) {
    return false;
  }

  if (!state.boss.active) {
    const distance = Math.abs(
      player.x + player.w / 2 - (state.boss.x + state.boss.w / 2)
    );

    if (distance < SETTINGS.bossActivationRange) {
      state.boss.active = true;
      state.bossMessageTimer = SETTINGS.bossMessageTime;
      state.bossMessageText = `${state.boss.title} ПРОБУДИЛСЯ! ПРЫГАЙ НА ГОЛОВУ!`;
      playSound("bossroar");
    } else {
      return false;
    }
  }

  if (state.boss.hurtTimer > 0) {
    state.boss.hurtTimer -= 1;
  }

  if (state.boss.contactGrace > 0) {
    state.boss.contactGrace -= 1;
  }

  state.boss.prevX = state.boss.x;
  state.boss.prevY = state.boss.y;

  const speed =
    state.boss.phase === 2
      ? state.boss.speedPhase2
      : state.boss.speedPhase1;

  const bossCenter = state.boss.x + state.boss.w / 2;
  const playerCenter = player.x + player.w / 2;

  if (playerCenter > bossCenter + 18) {
    state.boss.dir = 1;
  } else if (playerCenter < bossCenter - 18) {
    state.boss.dir = -1;
  }

  // Двигаемся к игроку, но не уходим далеко от места появления.
  state.boss.x += state.boss.dir * speed;

  forSolidRects(solid => {
    if (!intersects(state.boss, solid)) {
      return;
    }

    if (state.boss.dir > 0) {
      state.boss.x = solid.x - state.boss.w;
    } else {
      state.boss.x = solid.x + solid.w;
    }
  });

  const leftLimit = state.boss.startX - SETTINGS.bossPatrolRange;
  const rightLimit = state.boss.startX + SETTINGS.bossPatrolRange;

  if (state.boss.x < leftLimit) {
    state.boss.x = leftLimit;
  }

  if (state.boss.x > rightLimit) {
    state.boss.x = rightLimit;
  }

  // Гравитация и прыжки
  state.boss.vy += SETTINGS.gravity;
  state.boss.y += state.boss.vy;
  state.boss.onGround = false;

  forSolidRects(solid => {
    if (!intersects(state.boss, solid)) {
      return;
    }

    if (state.boss.vy > 0) {
      state.boss.y = solid.y - state.boss.h;
      state.boss.vy = 0;
      state.boss.onGround = true;
    } else if (state.boss.vy < 0) {
      state.boss.y = solid.y + solid.h;
      state.boss.vy = 0;
    }
  });

  state.boss.jumpTimer -= 1;

  if (state.boss.onGround && state.boss.jumpTimer <= 0) {
    state.boss.vy = state.boss.jumpForce;

    state.boss.jumpTimer =
      state.boss.phase === 2
        ? state.boss.jumpCooldown2
        : state.boss.jumpCooldown1;
  }

  // Стрельба по игроку
  state.boss.shootTimer -= 1;

  if (state.boss.shootTimer <= 0) {
    shootBossBullets();
    state.boss.shootTimer =
      state.boss.phase === 2
        ? state.boss.shootCooldown2
        : state.boss.shootCooldown1;
  }

  if (!intersects(player, state.boss)) {
    return false;
  }

  if (state.boss.contactGrace > 0) {
    return false;
  }

  // Прыжок на голову босса — единственный способ нанести урон.
  // Проверяем и текущее, и предыдущее положение: босс мог прыгнуть
  // навстречу игроку и успеть сдвинуть свою верхнюю границу.
  const playerBottom = player.y + player.h;
  const previousPlayerBottom = player.prevY + player.h;
  const currentTopGap = playerBottom - state.boss.y;
  const previousTopGap = previousPlayerBottom - state.boss.prevY;

  const stomping =
    player.vy > 0 &&
    (
      currentTopGap < state.boss.h * 0.8 ||
      previousTopGap < 24
    );

  if (stomping) {
    damageBoss();
    return false;
  }

  // Если игрок ещё поднимается или задел верхнюю часть босса,
  // не отнимаем жизнь, а мягко отталкиваем его. Это прощает
  // неудачные попытки запрыгнуть на голову.
  const upperBody = playerBottom < state.boss.y + state.boss.h * 0.7;

  if (player.vy < 0 || upperBody) {
    const pushDir =
      player.x + player.w / 2 < state.boss.x + state.boss.w / 2 ? -1 : 1;

    player.x += pushDir * 8;
    player.vx = pushDir * 2.5;
    state.boss.contactGrace = 12;
    return false;
  }

  return hurtPlayer();
}

function shootBossBullets() {
  const speed =
    state.boss.phase === 2
      ? state.boss.bulletSpeed2
      : state.boss.bulletSpeed1;

  const startX = state.boss.x + state.boss.w / 2;
  const startY = state.boss.y + state.boss.h * 0.32;

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
    state.boss.phase === 2
      ? state.boss.fanOffsets
      : [0];

  for (const offset of offsets) {
    const cosOffset = Math.cos(offset);
    const sinOffset = Math.sin(offset);

    const vx = (baseX * cosOffset - baseY * sinOffset) * speed;
    const vy = (baseX * sinOffset + baseY * cosOffset) * speed;

    const size = state.boss.bulletSize;

    state.bullets.push({
      x: startX - size / 2,
      y: startY - size / 2,
      w: size,
      h: size,
      vx: vx,
      vy: vy,
      life: SETTINGS.bossBulletLife,
      boss: true,
      bossType: state.boss.type,
      dead: false
    });
  }
}

function damageBoss() {
  if (!state.boss || state.boss.dead || state.boss.hurtTimer > 0) {
    return;
  }

  state.boss.hp -= 1;
  state.boss.hurtTimer = SETTINGS.bossHurtTime;
  state.boss.contactGrace = 28;
  state.bossMessageTimer = 80;

  addScreenShake(4);
  spawnParticles(
    state.boss.x + state.boss.w / 2,
    state.boss.y + state.boss.h / 2,
    "#b54bff",
    10,
    2.8
  );

  player.vy = SETTINGS.stompBounce;
  player.jumpsLeft = 1;

  state.score += 20;

  if (state.boss.hp <= 0) {
    state.boss.hp = 0;
    state.boss.dead = true;
    state.bossDefeated = true;
    state.bossMessageTimer = SETTINGS.bossMessageTime;
    state.bossMessageText = `${state.boss.title} ПОБЕЖДЁН! ФИНИШ ОТКРЫТ!`;
    state.bullets.length = 0;
    state.score += SETTINGS.bossScore;
    addScreenShake(12);
    spawnParticles(
      state.boss.x + state.boss.w / 2,
      state.boss.y + state.boss.h / 2,
      "#ffd23d",
      20,
      4
    );
    playSound("bossdown");
    return;
  }

  if (state.boss.hp <= state.boss.phase2At && state.boss.phase === 1) {
    state.boss.phase = 2;
    state.boss.jumpTimer = 40;
    state.boss.shootTimer = 50;
    state.bossMessageTimer = 110;
    state.bossMessageText = `${state.boss.title} РАЗЪЯРЁН! ФАЗА 2`;
    playSound("bossphase");
    return;
  }

  state.bossMessageText = `ПОПАДАНИЕ! ОСТАЛОСЬ ${state.boss.hp}`;
  playSound("bosshit");
}

export function resetBossForRespawn() {
  if (!state.boss || state.boss.dead) {
    return;
  }

  state.boss.x = state.boss.startX;
  state.boss.y = state.boss.startY;
  state.boss.prevX = state.boss.startX;
  state.boss.prevY = state.boss.startY;
  state.boss.vx = 0;
  state.boss.vy = 0;
  state.boss.active = false;
  state.boss.onGround = false;
  state.boss.hurtTimer = 0;
  state.boss.contactGrace = 0;
  state.boss.jumpTimer =
    state.boss.phase === 2
      ? state.boss.jumpCooldown2
      : state.boss.jumpCooldown1;
  state.boss.shootTimer =
    state.boss.phase === 2
      ? state.boss.shootCooldown2
      : state.boss.shootCooldown1;

  state.bossMessageTimer = 0;
  state.bossMessageText = "";
  state.bullets.length = 0;
}
