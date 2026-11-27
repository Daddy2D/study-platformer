import { TILE, SETTINGS } from "../core/settings.js";
import { canvas, ctx } from "../core/canvas.js";
import { IMAGES } from "../core/sprites.js";
import { state } from "../core/state.js";
import { clamp } from "./collision.js";
import { player } from "./player.js";
import { drawParticles } from "../core/effects.js";
import { getUiPalette, uiFont, withAlpha } from "../core/ui-palette.js";
import {
  formatTimeFrames,
  getStarsText,
  getProgressOverview,
  getAchievementList
} from "./progress.js";

// ============================================
// ОТРИСОВКА
// ============================================

// Облака для параллакса
const clouds = [];

for (let i = 0; i < SETTINGS.cloudCount; i++) {
  clouds.push({
    x: Math.random() * (canvas.width + 600),
    y: 20 + Math.random() * 220,
    scale: 0.5 + Math.random() * 1.3,
    factor: 0.1 + Math.random() * 0.4
  });
}

const snowflakes = [];

for (let i = 0; i < 70; i++) {
  snowflakes.push({
    x: Math.random() * (canvas.width + 100),
    y: Math.random() * canvas.height,
    size: 1 + Math.random() * 2.5,
    speed: 0.02 + Math.random() * 0.06,
    drift: 0.01 + Math.random() * 0.03,
    factor: 0.1 + Math.random() * 0.25
  });
}

function drawSprite(name, fallbackColor, x, y, w, h) {
  const img = IMAGES[name];

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, w, h);
  }
}

function drawSky() {
  if (state.currentBiome === "castle") {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#161d2e");
    gradient.addColorStop(0.55, "#333044");
    gradient.addColorStop(1, "#5a4350");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  if (state.currentBiome === "snow") {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#bfe6f7");
    gradient.addColorStop(0.6, "#e8f9ff");
    gradient.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const img = IMAGES.sky;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#63b8ff");
    gradient.addColorStop(1, "#cfefff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawSnowMountains(camX, camY) {
  const shift = (camX * 0.08) % 420;
  const baseY = canvas.height - 90 - camY * 0.04;

  ctx.fillStyle = "rgba(159, 202, 224, 0.55)";

  for (let index = -1; index < 5; index++) {
    const x = index * 420 - shift;

    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + 150, baseY - 180);
    ctx.lineTo(x + 300, baseY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

  for (let index = -1; index < 5; index++) {
    const x = index * 420 - shift;

    ctx.beginPath();
    ctx.moveTo(x + 150, baseY - 180);
    ctx.lineTo(x + 190, baseY - 120);
    ctx.lineTo(x + 150, baseY - 130);
    ctx.lineTo(x + 115, baseY - 112);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCastleBackground(camX, camY) {
  const shift = (camX * 0.12) % 420;
  const baseY = canvas.height - 105 - camY * 0.04;

  ctx.fillStyle = "#262331";
  ctx.fillRect(0, baseY, canvas.width, canvas.height - baseY);

  for (let index = -1; index < 4; index++) {
    const x = index * 420 - shift;

    ctx.fillStyle = "#302b3d";
    ctx.fillRect(x + 40, baseY - 150, 90, 150);
    ctx.fillRect(x + 170, baseY - 110, 70, 110);

    ctx.fillStyle = "#3b354a";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 40 + i * 20, baseY - 165, 14, 18);
    }

    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 170 + i * 20, baseY - 122, 12, 14);
    }

    ctx.fillStyle = "#ffb347";
    ctx.fillRect(x + 78, baseY - 120, 12, 18);
    ctx.fillRect(x + 195, baseY - 90, 10, 14);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, baseY - 8, canvas.width, 8);
}

function drawSnowfall(camX, camY) {
  const time = Date.now();

  for (const flake of snowflakes) {
    const wrapWidth = canvas.width + 100;

    let x =
      flake.x -
      camX * flake.factor +
      time * flake.drift;

    x = ((x % wrapWidth) + wrapWidth) % wrapWidth - 50;

    const y =
      ((flake.y + time * flake.speed - camY * flake.factor) %
        canvas.height +
        canvas.height) %
      canvas.height;

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(x, y, flake.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClouds(camX, camY) {
  const wrapW = canvas.width + 600;

  for (const cloud of clouds) {
    let cx = cloud.x - camX * cloud.factor;

    cx = ((cx % wrapW) + wrapW) % wrapW - 300;

    const cy = cloud.y - camY * cloud.factor * 0.25;

    const img = IMAGES.cloud;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        cx,
        cy,
        160 * cloud.scale,
        80 * cloud.scale
      );
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

      ctx.beginPath();
      ctx.ellipse(cx, cy, 45 * cloud.scale, 24 * cloud.scale, 0, 0, Math.PI * 2);
      ctx.ellipse(
        cx + 35 * cloud.scale,
        cy + 6 * cloud.scale,
        34 * cloud.scale,
        20 * cloud.scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.ellipse(
        cx - 35 * cloud.scale,
        cy + 8 * cloud.scale,
        30 * cloud.scale,
        18 * cloud.scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

function drawSpike(spike) {
  const img = IMAGES.spike;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, spike.x, spike.y, spike.w, spike.h);
  } else {
    ctx.fillStyle = "#c0392b";

    ctx.beginPath();
    ctx.moveTo(spike.x + 4, spike.y + spike.h - 4);
    ctx.lineTo(spike.x + spike.w / 2, spike.y + 6);
    ctx.lineTo(spike.x + spike.w - 4, spike.y + spike.h - 4);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCheckpoint(checkpoint) {
  const img = IMAGES.checkpoint;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      checkpoint.x,
      checkpoint.y,
      checkpoint.w,
      checkpoint.h
    );

    if (checkpoint.active) {
      ctx.strokeStyle = "#2ecc71";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        checkpoint.x + 2,
        checkpoint.y + 2,
        checkpoint.w - 4,
        checkpoint.h - 4
      );
    }
  } else {
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(checkpoint.x + 20, checkpoint.y + 6, 6, checkpoint.h - 12);

    ctx.fillStyle = checkpoint.active ? "#2ecc71" : "#bdc3c7";
    ctx.fillRect(checkpoint.x + 26, checkpoint.y + 10, 16, 12);
  }
}

function drawSpring(spring) {
  const squash = spring.timer > 0 ? 0.62 : 1;
  const height = spring.h * squash;
  const y = spring.y + spring.h - height;

  drawSprite("spring", "#e74c3c", spring.x, y, spring.w, height);
}

function drawFallingPlatform(platform) {
  if (platform.state === "gone") {
    return;
  }

  const shake =
    platform.state === "shaking"
      ? Math.sin(Date.now() / 22) * 3
      : 0;

  ctx.save();
  ctx.globalAlpha = platform.state === "falling" ? 0.7 : 1;

  drawSprite(
    "falling",
    "#c08a4a",
    platform.x + shake,
    platform.y,
    platform.w,
    platform.h
  );

  if (platform.state === "shaking") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      platform.x + shake + 2,
      platform.y + 2,
      platform.w - 4,
      platform.h - 4
    );
  }

  ctx.restore();
}

function drawOneWayPlatform(platform) {
  drawSprite(
    "oneway",
    "#d9a441",
    platform.x,
    platform.y,
    platform.w,
    platform.h
  );
}

function drawBreakable(block) {
  if (block.broken) {
    return;
  }

  drawSprite("breakable", "#b8793f", block.x, block.y, block.w, block.h);
}

function drawLadder(ladder) {
  drawSprite("ladder", "#a06a3b", ladder.x, ladder.y, ladder.w, ladder.h);
}

function drawSaw(saw) {
  const centerX = saw.x + saw.w / 2;
  const centerY = saw.y + saw.h / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(saw.angle);
  drawSprite("saw", "#95a5a6", -saw.w / 2, -saw.h / 2, saw.w, saw.h);
  ctx.restore();
}

function drawCannon(cannon) {
  ctx.save();

  if (cannon.dir < 0) {
    ctx.translate(cannon.x + cannon.w, cannon.y);
    ctx.scale(-1, 1);
    drawSprite("cannon", "#6b7280", 0, 0, cannon.w, cannon.h);
  } else {
    drawSprite(
      "cannon",
      "#6b7280",
      cannon.x,
      cannon.y,
      cannon.w,
      cannon.h
    );
  }

  ctx.restore();
}

function drawBoss() {
  if (!state.boss || state.boss.dead) {
    return;
  }

  const flash =
    state.boss.hurtTimer > 0 &&
    Math.floor(state.boss.hurtTimer / 5) % 2 === 0;

  ctx.save();

  if (flash) {
    ctx.globalAlpha = 0.45;
  }

  drawSprite(state.boss.spriteName, state.boss.color, state.boss.x, state.boss.y, state.boss.w, state.boss.h);

  ctx.globalAlpha = 1;

  if (state.boss.phase === 2) {
    ctx.strokeStyle =
      state.boss.type === "snow"
        ? "rgba(127, 216, 255, 0.95)"
        : state.boss.type === "castle"
          ? "rgba(255, 166, 77, 0.95)"
          : "rgba(255, 90, 90, 0.9)";
    ctx.lineWidth = 4;
    ctx.strokeRect(state.boss.x - 3, state.boss.y - 3, state.boss.w + 6, state.boss.h + 6);
  }

  // Глаза смотрят в сторону игрока
  const eyeY = state.boss.y + state.boss.h * 0.3;
  const eyeX = state.boss.x + state.boss.w * 0.5;

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(eyeX - 15, eyeY, 7, 0, Math.PI * 2);
  ctx.arc(eyeX + 15, eyeY, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(eyeX - 15 + state.boss.dir * 2, eyeY, 3.5, 0, Math.PI * 2);
  ctx.arc(eyeX + 15 + state.boss.dir * 2, eyeY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawKey(key) {
  const img = IMAGES.key;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, key.x, key.y, key.w, key.h);
  } else {
    ctx.fillStyle = "#f1c40f";

    ctx.fillRect(key.x, key.y + key.h * 0.35, key.w, key.h * 0.3);
    ctx.fillRect(key.x + key.w * 0.45, key.y, key.w * 0.15, key.h);
  }
}

function drawDoor(door) {
  if (door.open) {
    ctx.globalAlpha = 0.3;
  }

  drawSprite("door", "#8b5a2b", door.x, door.y, door.w, door.h);

  ctx.globalAlpha = 1;

  if (!door.open) {
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(
      door.x + door.w / 2 - 3,
      door.y + door.h / 2 - 4,
      6,
      12
    );
  }
}

function drawBullet(bullet) {
  const img = IMAGES.bullet;

  if (!bullet.boss && img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, bullet.x, bullet.y, bullet.w, bullet.h);
  } else {
    ctx.fillStyle = bullet.boss
      ? bullet.bossType === "snow"
        ? "#7fd8ff"
        : bullet.bossType === "castle"
          ? "#ffa64d"
          : "#b54bff"
      : "#e74c3c";

    ctx.beginPath();
    ctx.arc(
      bullet.x + bullet.w / 2,
      bullet.y + bullet.h / 2,
      bullet.w / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();

    if (bullet.boss) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawEnemy(enemy) {
  if (enemy.dead) {
    return;
  }

  drawSprite(
    "enemy",
    enemy.shooter ? "#e67e22" : "#d94f4f",
    enemy.x,
    enemy.y,
    enemy.w,
    enemy.h
  );

  if (enemy.shooter) {
    ctx.fillStyle = "#333";

    if (enemy.dir > 0) {
      ctx.fillRect(
        enemy.x + enemy.w - 6,
        enemy.y + enemy.h / 2 - 3,
        14,
        6
      );
    } else {
      ctx.fillRect(
        enemy.x - 8,
        enemy.y + enemy.h / 2 - 3,
        14,
        6
      );
    }
  }
}

function drawExit(exit) {
  const flagHeight = TILE * 2;

  drawSprite(
    "exit",
    "#27ae60",
    exit.x,
    exit.y + exit.h - flagHeight,
    exit.w,
    flagHeight
  );

  // На уровне с боссом финиш закрыт до победы
  if (state.boss && !state.bossDefeated) {
    ctx.fillStyle = "rgba(20, 20, 35, 0.55)";
    ctx.fillRect(exit.x - 6, exit.y + exit.h - flagHeight, exit.w + 12, flagHeight);

    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(exit.x + exit.w / 2 - 10, exit.y + exit.h - 30, 20, 16);

    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(exit.x + exit.w / 2, exit.y + exit.h - 30, 8, Math.PI, 0);
    ctx.stroke();
  }
}

// ============================================
// МЕНЮ, КНОПКИ И ПОДСКАЗКИ
// ============================================

function drawCenteredText(text, x, y, font, color, maxWidth) {
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.fillStyle = color;

  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

function drawHeart(x, y, size, filled) {
  const C = getUiPalette();
  const w = size;
  const h = size;
  const cx = x + w / 2;

  ctx.beginPath();
  ctx.moveTo(cx, y + h * 0.3);
  ctx.bezierCurveTo(cx, y, x, y, x, y + h * 0.35);
  ctx.bezierCurveTo(x, y + h * 0.62, cx, y + h * 0.82, cx, y + h);
  ctx.bezierCurveTo(cx, y + h * 0.82, x + w, y + h * 0.62, x + w, y + h * 0.35);
  ctx.bezierCurveTo(x + w, y, cx, y, cx, y + h * 0.3);
  ctx.closePath();

  ctx.fillStyle = filled ? C.danger : withAlpha(C.surface, 0.9);
  ctx.fill();

  ctx.strokeStyle = filled ? C.danger : C.border;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawUiButtons() {
  const C = getUiPalette();

  for (let i = 0; i < state.uiButtons.length; i++) {
    const button = state.uiButtons[i];
    const rect = button.rect;
    const selected = i === state.uiIndex;

    ctx.fillStyle = selected ? C.surfaceWarm : withAlpha(C.surface, 0.96);

    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = selected ? C.accent : C.border;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);

    const cx = rect.x + rect.w / 2;

    ctx.textAlign = "center";
    ctx.fillStyle = C.fg;

    if (button.sub) {
      ctx.font = uiFont(20, "bold");
      ctx.fillText(button.label, cx, rect.y + rect.h / 2 - 2, rect.w - 24);

      ctx.font = uiFont(13);
      ctx.fillStyle = selected ? C.fg2 : C.muted;
      ctx.fillText(button.sub, cx, rect.y + rect.h / 2 + 16, rect.w - 24);
    } else {
      ctx.font = uiFont(21, "bold");
      ctx.fillText(button.label, cx, rect.y + rect.h / 2 + 7, rect.w - 24);
    }
  }
}

function drawMenuBackground() {
  const C = getUiPalette();

  drawSky();
  drawClouds((Date.now() / 70) % 2000, 0);

  // Полоска земли внизу, чтобы меню было похоже на игру
  const groundY = canvas.height - TILE;

  for (let x = 0; x < canvas.width; x += TILE) {
    drawSprite("ground", "#7a4f2a", x, groundY, TILE, TILE);
  }

  ctx.fillStyle = withAlpha(C.bg, 0.9);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStatsScreen() {
  const C = getUiPalette();

  drawMenuBackground();

  const overview = getProgressOverview();
  const achievements = getAchievementList();

  ctx.save();
  ctx.fillStyle = withAlpha(C.bg, 0.86);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCenteredText(
    state.uiTitle,
    canvas.width / 2,
    78,
    uiFont(44, "bold"),
    C.fg
  );

  drawCenteredText(
    state.uiSubtitle,
    canvas.width / 2,
    112,
    uiFont(18),
    C.fg2
  );

  // Общая статистика
  ctx.fillStyle = withAlpha(C.surface, 0.94);
  ctx.fillRect(80, 135, 800, 92);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 135, 800, 92);

  ctx.textAlign = "left";
  ctx.font = uiFont(18, "bold");
  ctx.fillStyle = C.fg;

  ctx.fillText(
    `Пройдено уровней: ${overview.completed}/${overview.totalLevels}`,
    100,
    166
  );
  ctx.fillText(
    `Звёзды: ${overview.stars}/${overview.maxStars}`,
    100,
    196
  );
  ctx.fillText(
    `Монеты: ${overview.coins}/${overview.coinsPossible}`,
    100,
    224
  );

  ctx.fillText(`Потеряно жизней: ${overview.deaths}`, 500, 166);
  ctx.fillText(`Попыток: ${overview.attempts}`, 500, 196);
  ctx.fillText(`Побед: ${overview.completions}`, 500, 224);

  // Достижения
  ctx.fillStyle = withAlpha(C.surface, 0.94);
  ctx.fillRect(80, 245, 800, 205);

  ctx.strokeStyle = C.border;
  ctx.strokeRect(80, 245, 800, 205);

  for (let index = 0; index < achievements.length; index++) {
    const achievement = achievements[index];
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 100 + column * 400;
    const y = 274 + row * 46;

    ctx.textAlign = "left";
    ctx.font = uiFont(16, "bold");
    ctx.fillStyle = achievement.unlocked ? C.success : C.muted;

    ctx.fillText(
      `${achievement.unlocked ? "✓" : "•"} ${achievement.title}`,
      x,
      y
    );

    ctx.font = uiFont(12);
    ctx.fillStyle = achievement.unlocked ? C.fg2 : C.muted;

    ctx.fillText(achievement.description, x + 18, y + 17);
  }

  ctx.restore();

  drawUiButtons();

  drawCenteredText(
    state.uiHint,
    canvas.width / 2,
    530,
    uiFont(14),
    C.fg2
  );
}

function drawMenuScreen() {
  const C = getUiPalette();

  drawMenuBackground();

  const firstButtonY = state.uiButtons.length > 0 ? state.uiButtons[0].rect.y : 190;

  // Заголовок с мягким светлым контуром, как наклейка
  ctx.textAlign = "center";
  ctx.font = uiFont(52, "bold");
  ctx.lineWidth = 10;
  ctx.strokeStyle = withAlpha(C.bg, 0.92);
  ctx.strokeText(state.uiTitle, canvas.width / 2, 98);

  ctx.fillStyle = C.fg;
  ctx.fillText(state.uiTitle, canvas.width / 2, 98);

  drawCenteredText(
    state.uiSubtitle,
    canvas.width / 2,
    138,
    uiFont(20),
    C.fg2,
    canvas.width - 80
  );

  if (state.uiMessage) {
    drawCenteredText(
      state.uiMessage,
      canvas.width / 2,
      firstButtonY - 22,
      uiFont(17),
      C.fg,
      canvas.width - 80
    );
  }

  drawUiButtons();
  drawSelectedLevelInfo();

  drawCenteredText(
    state.uiHint,
    canvas.width / 2,
    state.gameState === "custom" ? canvas.height - 12 : canvas.height - 26,
    uiFont(16),
    C.fg2,
    canvas.width - 60
  );
}

// Автор и строка «чем интересен» для выбранного уровня.
// Показываем только на экранах со списком уровней.
function drawSelectedLevelInfo() {
  const C = getUiPalette();

  if (state.gameState !== "levels" && state.gameState !== "custom") {
    return;
  }

  const button = state.uiButtons[state.uiIndex];

  if (!button) {
    return;
  }

  const author = button.author ? `Автор: ${button.author}` : "";
  const note = button.note || "";

  if (!author && !note) {
    return;
  }

  // Строку ставим под последней кнопкой, чтобы не наехать на неё
  const lastBottom = state.uiButtons.reduce(
    (max, item) => Math.max(max, item.rect.y + item.rect.h),
    0
  );

  const y = Math.min(canvas.height - 60, lastBottom + 16);

  if (author) {
    drawCenteredText(
      author,
      canvas.width / 2,
      y,
      uiFont(16, "bold"),
      C.fg,
      canvas.width - 80
    );
  }

  if (note) {
    drawCenteredText(
      note,
      canvas.width / 2,
      y + 24,
      uiFont(15),
      C.fg2,
      canvas.width - 80
    );
  }
}

// ============================================
// HUD И ОВЕРЛЕИ
// ============================================

function drawBossHud() {
  const C = getUiPalette();

  if (!state.boss || state.bossDefeated) {
    return;
  }

  const width = 360;
  const x = canvas.width - width - 14;
  const y = 14;
  const height = 68;

  ctx.fillStyle = withAlpha(C.surface, 0.94);
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.textAlign = "left";
  ctx.fillStyle = C.danger;
  ctx.font = uiFont(18, "bold");
  ctx.fillText(state.boss.title, x + 14, y + 25);

  ctx.textAlign = "right";
  ctx.fillStyle = C.fg2;
  ctx.font = uiFont(15);
  ctx.fillText(
    `Фаза ${state.boss.phase} из 2`,
    x + width - 14,
    y + 25
  );

  const barX = x + 14;
  const barY = y + 36;
  const barWidth = width - 28;
  const gap = 6;
  const segmentWidth = (barWidth - gap * (state.boss.maxHp - 1)) / state.boss.maxHp;

  for (let i = 0; i < state.boss.maxHp; i++) {
    const filled = i < state.boss.hp;

    ctx.fillStyle = filled ? C.danger : withAlpha(C.surfaceWarm, 0.9);
    ctx.fillRect(barX + i * (segmentWidth + gap), barY, segmentWidth, 16);

    ctx.strokeStyle = filled ? withAlpha(C.danger, 0.55) : C.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      barX + i * (segmentWidth + gap),
      barY,
      segmentWidth,
      16
    );
  }

  if (!state.boss.active) {
    ctx.textAlign = "center";
    ctx.fillStyle = C.muted;
    ctx.font = uiFont(14);
    ctx.fillText("Босс ждёт игрока", x + width / 2, y + height - 6);
  }
}

function drawBossMessage() {
  const C = getUiPalette();

  if (state.bossMessageTimer <= 0 || !state.boss || !state.bossMessageText) {
    return;
  }

  const padding = 22;

  ctx.save();
  ctx.font = uiFont(24, "bold");

  const textWidth = Math.min(
    canvas.width - 80,
    ctx.measureText(state.bossMessageText).width + padding * 2
  );

  const x = canvas.width / 2 - textWidth / 2;

  ctx.fillStyle = state.bossDefeated ? C.success : C.danger;

  ctx.fillRect(x, 100, textWidth, 46);

  ctx.strokeStyle = withAlpha(C.accentOn, 0.55);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, 101, textWidth - 2, 44);

  drawCenteredText(
    state.bossMessageText,
    canvas.width / 2,
    132,
    uiFont(24, "bold"),
    C.accentOn,
    canvas.width - 100
  );

  ctx.restore();
}

function drawHud() {
  const C = getUiPalette();

  ctx.save();

  ctx.fillStyle = withAlpha(C.surface, 0.94);
  ctx.fillRect(12, 12, 375, 168);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 375, 168);

  ctx.fillStyle = C.fg;
  ctx.font = uiFont(20, "bold");
  ctx.textAlign = "left";

  const levelLabel =
    state.levelSource === "builtin"
      ? `Уровень: ${state.currentLevelIndex + 1}/${state.gameLevels.length}`
      : state.levelSource === "test"
        ? "Проверка уровня"
        : "Свой уровень";

  ctx.fillText(levelLabel, 24, 42);

  ctx.font = uiFont(16);
  ctx.fillStyle = C.fg2;
  ctx.fillText(state.currentLevelName, 24, 66, 350);

  ctx.fillStyle = C.fg;
  ctx.font = uiFont(18);
  ctx.fillText(`Очки: ${state.score}`, 24, 96);
  ctx.fillText(`Монеты: ${state.coinsTaken}/${state.coinsTotal}`, 190, 96);
  ctx.fillText(`Ключи: ${state.keyCount}`, 24, 122);
  ctx.fillText(
    `Время: ${formatTimeFrames(state.levelTimerFrames)}`,
    190,
    122
  );

  ctx.font = uiFont(16);
  ctx.fillStyle = C.fg2;
  ctx.fillText("Жизни:", 24, 156);

  for (let i = 0; i < SETTINGS.startLives; i++) {
    drawHeart(82 + i * 30, 138, 24, i < state.lives);
  }

  // Подсказка по управлению только на первом уровне
  if (state.levelSource === "builtin" && state.currentLevelIndex === 0 && !state.levelComplete) {
    ctx.fillStyle = withAlpha(C.surface, 0.92);
    ctx.fillRect(400, 12, 548, 32);

    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 12, 548, 32);

    ctx.fillStyle = C.fg;
    ctx.font = uiFont(15);
    ctx.fillText(
      "← → — движение   Space — прыжок   P — пауза   R — заново   Q — меню",
      414,
      34
    );
  }

  drawBossHud();
  drawBossMessage();

  ctx.restore();
}

function drawOverlayTitle(title, subtitle, color) {
  const C = getUiPalette();
  const cx = canvas.width / 2;

  ctx.textAlign = "center";
  ctx.font = uiFont(44, "bold");
  ctx.lineWidth = 10;
  ctx.strokeStyle = withAlpha(C.bg, 0.92);
  ctx.strokeText(title, cx, 215);

  ctx.fillStyle = color || C.fg;
  ctx.fillText(title, cx, 215);

  if (subtitle) {
    drawCenteredText(
      subtitle,
      cx,
      252,
      uiFont(21),
      C.fg2,
      canvas.width - 80
    );
  }
}

function drawOverlays() {
  const C = getUiPalette();

  if (state.paused) {
    ctx.fillStyle = withAlpha(C.bg, 0.9);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawOverlayTitle(state.uiTitle, "Можно передохнуть");
    drawUiButtons();

    drawCenteredText(
      state.uiHint,
      canvas.width / 2,
      canvas.height - 26,
      uiFont(16),
      C.fg2
    );
    return;
  }

  if (state.gameOver) {
    ctx.fillStyle = withAlpha(C.bg, 0.96);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawOverlayTitle(state.uiTitle, state.uiSubtitle, C.danger);
    drawUiButtons();

    drawCenteredText(
      state.uiHint,
      canvas.width / 2,
      canvas.height - 26,
      uiFont(16),
      C.fg2
    );
    return;
  }

  if (state.gameFinished) {
    ctx.fillStyle = withAlpha(C.bg, 0.96);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawOverlayTitle(state.uiTitle, state.uiSubtitle, C.success);
    drawUiButtons();

    drawCenteredText(
      state.uiHint,
      canvas.width / 2,
      canvas.height - 26,
      uiFont(16),
      C.fg2
    );
    return;
  }

  if (state.levelComplete) {
    ctx.fillStyle = withAlpha(C.bg, 0.96);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const result = state.lastLevelResult;
    const stars = result ? result.stars : 1;

    drawCenteredText(
      "УРОВЕНЬ ПРОЙДЕН!",
      canvas.width / 2,
      148,
      uiFont(42, "bold"),
      C.success
    );

    drawCenteredText(
      `Время: ${formatTimeFrames(state.levelTimerFrames)}`,
      canvas.width / 2,
      202,
      uiFont(24),
      C.fg2
    );

    drawCenteredText(
      `Монеты: ${state.coinsTaken}/${state.coinsTotal}   Жизни: ${state.lives}`,
      canvas.width / 2,
      238,
      uiFont(20),
      C.fg
    );

    drawCenteredText(
      `Звёзды: ${getStarsText(stars)}`,
      canvas.width / 2,
      290,
      uiFont(36, "bold"),
      C.accent
    );

    const credit = [
      state.currentLevelAuthor ? `Автор: ${state.currentLevelAuthor}` : "",
      state.currentLevelNote
    ]
      .filter(Boolean)
      .join(" · ");

    if (credit) {
      drawCenteredText(
        credit,
        canvas.width / 2,
        322,
        uiFont(17),
        C.fg2,
        canvas.width - 80
      );
    }

    if (result && result.saved && result.bestTimeFrames !== null) {
      if (result.newBestTime) {
        drawCenteredText(
          "Новый рекорд времени!",
          canvas.width / 2,
          352,
          uiFont(18),
          C.success
        );
      }

      drawCenteredText(
        `Лучшее: ${formatTimeFrames(result.bestTimeFrames)} · жизни: ${result.bestLives}`,
        canvas.width / 2,
        result.newBestTime ? 376 : 354,
        uiFont(18),
        C.fg2
      );
    }

    const nextText =
      state.currentLevelIndex + 1 < state.gameLevels.length
        ? "Переход на следующий уровень..."
        : "Завершение игры...";

    drawCenteredText(
      nextText,
      canvas.width / 2,
      408,
      uiFont(22),
      C.fg2
    );
  }
}

// ============================================
// МИР
// ============================================

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSky();

  const camX = clamp(
    player.x + player.w / 2 - canvas.width / 2,
    0,
    Math.max(0, state.levelWidth - canvas.width)
  );

  const camY = clamp(
    player.y + player.h / 2 - canvas.height / 2,
    0,
    Math.max(0, state.levelHeight - canvas.height)
  );

  // Рисуем только то, что попадает в кадр: на больших картах
  // это экономит сотни вызовов drawImage каждый кадр.
  const view = {
    x: camX - 64,
    y: camY - 64,
    w: canvas.width + 128,
    h: canvas.height + 128
  };

  const inView = item => {
    // Подстраховка: объект без размеров считаем точкой и не теряем
    const w = Number.isFinite(item.w) ? item.w : 1;
    const h = Number.isFinite(item.h) ? item.h : 1;

    return (
      item.x + w > view.x &&
      item.x < view.x + view.w &&
      item.y + h > view.y &&
      item.y < view.y + view.h
    );
  };

  if (state.currentBiome === "castle") {
    drawCastleBackground(camX, camY);
  } else {
    drawClouds(camX, camY);
  }

  if (state.currentBiome === "snow") {
    drawSnowMountains(camX, camY);
  }

  const shakeX =
    state.screenShake > 0
      ? (Math.random() * 2 - 1) * state.screenShake
      : 0;

  const shakeY =
    state.screenShake > 0
      ? (Math.random() * 2 - 1) * state.screenShake
      : 0;

  ctx.save();
  ctx.translate(
    -Math.round(camX + shakeX),
    -Math.round(camY + shakeY)
  );

  for (const solid of state.solids) {
    if (!inView(solid)) continue;
    // Верхний слой земли — с травой, остальной — просто земля
    const covered = solid.covered;

    if (state.currentBiome === "snow") {
      if (covered) {
        drawSprite(
          "snowDirt",
          "#7896a8",
          solid.x,
          solid.y,
          solid.w,
          solid.h
        );
      } else {
        drawSprite(
          "snowGround",
          "#eaf7ff",
          solid.x,
          solid.y,
          solid.w,
          solid.h
        );
      }
    } else if (state.currentBiome === "castle") {
      if (covered) {
        drawSprite(
          "castleDirt",
          "#34333d",
          solid.x,
          solid.y,
          solid.w,
          solid.h
        );
      } else {
        drawSprite(
          "castleGround",
          "#4b4a55",
          solid.x,
          solid.y,
          solid.w,
          solid.h
        );
      }
    } else if (covered) {
      drawSprite("dirt", "#5a3617", solid.x, solid.y, solid.w, solid.h);
    } else {
      drawSprite("ground", "#7a4f2a", solid.x, solid.y, solid.w, solid.h);
    }
  }

  for (const platform of state.movingPlatforms) {
    if (!inView(platform)) continue;
    drawSprite(
      "moving",
      "#8e44ad",
      platform.x,
      platform.y,
      platform.w,
      platform.h
    );
  }

  for (const platform of state.fallingPlatforms) {
    if (!inView(platform)) continue;
    drawFallingPlatform(platform);
  }

  for (const platform of state.oneWayPlatforms) {
    if (!inView(platform)) continue;
    drawOneWayPlatform(platform);
  }

  for (const block of state.breakableBlocks) {
    if (!inView(block)) continue;
    drawBreakable(block);
  }

  for (const ladder of state.ladders) {
    if (!inView(ladder)) continue;
    drawLadder(ladder);
  }

  for (const door of state.doors) {
    if (!inView(door)) continue;
    drawDoor(door);
  }

  for (const checkpoint of state.checkpoints) {
    if (!inView(checkpoint)) continue;
    drawCheckpoint(checkpoint);
  }

  for (const key of state.keyItems) {
    if (!inView(key)) continue;
    drawKey(key);
  }

  for (const spike of state.spikes) {
    if (!inView(spike)) continue;
    drawSpike(spike);
  }

  for (const spring of state.springs) {
    if (!inView(spring)) continue;
    drawSpring(spring);
  }

  for (const saw of state.saws) {
    if (!inView(saw)) continue;
    drawSaw(saw);
  }

  for (const cannon of state.cannons) {
    if (!inView(cannon)) continue;
    drawCannon(cannon);
  }

  for (const coin of state.coins) {
    if (!inView(coin)) continue;
    const bob =
      Math.sin(Date.now() / SETTINGS.coinBobSpeed + coin.x) *
      SETTINGS.coinBobAmount;

    drawSprite("coin", "#ffd23d", coin.x, coin.y + bob, coin.w, coin.h);
  }

  for (const enemy of state.enemies) {
    if (!inView(enemy)) continue;
    drawEnemy(enemy);
  }

  for (const bullet of state.bullets) {
    if (!inView(bullet)) continue;
    drawBullet(bullet);
  }

  for (const exit of state.exits) {
    if (!inView(exit)) continue;
    drawExit(exit);
  }

  drawBoss();
  drawParticles();

  // После потери жизни игрок мигает
  const blinking =
    state.invulnerableTimer > 0 && Math.floor(state.invulnerableTimer / 5) % 2 === 0;

  const walkingBob =
    player.onGround && Math.abs(player.vx) > 0.5
      ? Math.sin(Date.now() / 90) * 1.5
      : 0;

  if (!blinking) {
    drawSprite(
      "player",
      "#3aa6ff",
      player.x,
      player.y + walkingBob,
      player.w,
      player.h
    );
  }

  ctx.restore();

  if (state.currentBiome === "snow") {
    drawSnowfall(camX, camY);
  }
}

export function drawGame() {
  if (state.gameState === "stats") {
    drawStatsScreen();
    return;
  }

  if (state.gameState !== "playing") {
    drawMenuScreen();
    return;
  }

  drawWorld();
  drawHud();
  drawOverlays();
}
