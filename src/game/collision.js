// ============================================
// ГЕОМЕТРИЯ И СТОЛКНОВЕНИЯ
// ============================================

import { state } from "../core/state.js";


export function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function forSolidRects(callback) {
  for (const solid of state.solids) {
    callback(solid);
  }

  for (const door of state.doors) {
    if (!door.open) {
      callback(door);
    }
  }
}

// Проверка точки: есть ли в ней твёрдая клетка.
// Нужна врагам, чтобы не падать с края платформы.
export function solidAt(x, y) {
  for (const solid of state.solids) {
    if (
      x >= solid.x &&
      x < solid.x + solid.w &&
      y >= solid.y &&
      y < solid.y + solid.h
    ) {
      return true;
    }
  }

  for (const door of state.doors) {
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
export function blockedAt(rect) {
  for (const solid of state.solids) {
    if (intersects(rect, solid)) {
      return true;
    }
  }

  for (const door of state.doors) {
    if (!door.open && intersects(rect, door)) {
      return true;
    }
  }

  return false;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function fallingPlatformIsSolid(platform) {
  return platform.state === "idle" || platform.state === "shaking";
}
