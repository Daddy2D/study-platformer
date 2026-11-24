import { SETTINGS } from "../core/settings.js";
import { state } from "../core/state.js";
import { intersects, forSolidRects, solidAt } from "./collision.js";
import { player, hurtPlayer } from "./player.js";

// ============================================
// ВРАГИ И ПУЛИ
// ============================================

export function updateEnemy(enemy) {
  if (enemy.dead) {
    return;
  }

  enemy.vy += SETTINGS.gravity;

  if (!enemy.shooter) {
    updateWalkingEnemy(enemy);
  } else {
    updateShooterEnemy(enemy);
  }

  if (enemy.y > state.levelHeight + 300) {
    enemy.dead = true;
  }
}

function updateWalkingEnemy(enemy) {
  let hitWall = false;
  const moveDir = enemy.dir;

  enemy.x += enemy.dir * enemy.speed;

  forSolidRects(solid => {
    if (!intersects(enemy, solid)) {
      return;
    }

    if (moveDir > 0) {
      enemy.x = solid.x - enemy.w;
    } else if (moveDir < 0) {
      enemy.x = solid.x + solid.w;
    }

    if (!hitWall) {
      enemy.dir *= -1;
      hitWall = true;
    }
  });

  enemy.y += enemy.vy;
  enemy.onGround = false;

  forSolidRects(solid => {
    if (!intersects(enemy, solid)) {
      return;
    }

    if (enemy.vy > 0) {
      enemy.y = solid.y - enemy.h;
      enemy.vy = 0;
      enemy.onGround = true;
    } else if (enemy.vy < 0) {
      enemy.y = solid.y + solid.h;
      enemy.vy = 0;
    }
  });

  // На краю платформы разворачиваемся, чтобы не упасть
  if (!hitWall && enemy.onGround) {
    const frontX = enemy.dir > 0 ? enemy.x + enemy.w + 4 : enemy.x - 4;
    const footY = enemy.y + enemy.h + 4;

    if (!solidAt(frontX, footY)) {
      enemy.dir *= -1;
    }
  }
}

function updateShooterEnemy(enemy) {
  enemy.dir =
    player.x + player.w / 2 > enemy.x + enemy.w / 2
      ? 1
      : -1;

  enemy.y += enemy.vy;
  enemy.onGround = false;

  forSolidRects(solid => {
    if (!intersects(enemy, solid)) {
      return;
    }

    if (enemy.vy > 0) {
      enemy.y = solid.y - enemy.h;
      enemy.vy = 0;
      enemy.onGround = true;
    } else if (enemy.vy < 0) {
      enemy.y = solid.y + solid.h;
      enemy.vy = 0;
    }
  });

  if (enemy.shootCooldown > 0) {
    enemy.shootCooldown -= 1;
  }

  const dx = Math.abs(
    player.x + player.w / 2 - (enemy.x + enemy.w / 2)
  );

  const dy = Math.abs(
    player.y + player.h / 2 - (enemy.y + enemy.h / 2)
  );

  if (
    dx < SETTINGS.shooterRangeX &&
    dy < SETTINGS.shooterRangeY &&
    enemy.shootCooldown <= 0
  ) {
    state.bullets.push({
      x: enemy.x + enemy.w / 2 + enemy.dir * (enemy.w / 2 + 4),
      y: enemy.y + enemy.h / 2 - SETTINGS.bulletHeight / 2,
      w: SETTINGS.bulletWidth,
      h: SETTINGS.bulletHeight,
      vx: enemy.dir * SETTINGS.bulletSpeed,
      vy: 0,
      dead: false
    });

    enemy.shootCooldown = SETTINGS.shooterCooldown;
  }
}

export function updateBullets() {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy || 0;

    if (
      bullet.x < -200 ||
      bullet.x > state.levelWidth + 200 ||
      bullet.y < -200 ||
      bullet.y > state.levelHeight + 200
    ) {
      bullet.dead = true;
    }

    if (bullet.life !== undefined) {
      bullet.life -= 1;

      if (bullet.life <= 0) {
        bullet.dead = true;
      }
    }

    forSolidRects(solid => {
      if (intersects(bullet, solid)) {
        bullet.dead = true;
      }
    });

    for (const platform of state.movingPlatforms) {
      if (intersects(bullet, platform)) {
        bullet.dead = true;
      }
    }

    if (!bullet.dead && intersects(bullet, player)) {
      bullet.dead = true;

      if (hurtPlayer()) {
        return true;
      }
    }
  }

  state.bullets = state.bullets.filter(bullet => !bullet.dead);

  return false;
}
