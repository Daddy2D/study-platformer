// ============================================
// ДОСТИЖИМОСТЬ ФИНИША (ЭВРИСТИКА)
// ============================================
// Грубая проверка: можно ли добраться от старта до финиша
// прыжками, падениями, лестницами и батутами. Это не симуляция
// физики, а граф опорных клеток, поэтому результат — предупреждение,
// а не приговор: карту всё равно нужно проверять в игре.

import { hasSupportBelow, isSolidAt, tileAt } from "./level-tiles.js";

// Насколько высоко и далеко можно прыгнуть (в клетках).
// Двойной прыжок поднимает примерно на пять клеток.
const JUMP_RISE = 5;
const JUMP_DISTANCE = 4;
const SPRING_RISE = 8;
const SPRING_DISTANCE = 6;
const MAX_DISTANCE = 6;
const LADDER_RADIUS = 2;

export function isFinishReachable(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { reachable: false, reason: "нет карты" };
  }

  const height = rawRows.length;
  const width = Math.max(...rawRows.map(row => String(row).length));
  const rows = rawRows;

  const hasKey = rows.some(row => String(row).includes("K"));
  const doorBlocks = !hasKey;
  const isLadder = (x, y) => tileAt(rows, x, y) === "H";
  const cellKey = (x, y) => `${x},${y}`;

  const nodes = new Map();
  let start = null;
  const finishes = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = tileAt(rows, x, y);

      if (char === "X") {
        finishes.push({ x: x, y: y });
      }

      if (isSolidAt(rows, x, y, doorBlocks)) {
        continue;
      }

      const isStart = char === "P";
      const isFinish = char === "X";

      if (
        !hasSupportBelow(rows, x, y) &&
        !isLadder(x, y) &&
        !isStart &&
        !isFinish
      ) {
        continue;
      }

      const node = {
        x: x,
        y: y,
        ladder: isLadder(x, y),
        spring: char === "B"
      };

      nodes.set(cellKey(x, y), node);

      if (isStart) {
        start = node;
      }
    }
  }

  if (!start) {
    return { reachable: false, reason: "в карте нет старта P" };
  }

  if (finishes.length === 0) {
    return { reachable: false, reason: "в карте нет финиша X" };
  }

  const queue = [start];
  const visited = new Set([cellKey(start.x, start.y)]);

  while (queue.length > 0) {
    const node = queue.shift();

    const nearFinish = finishes.some(
      finish =>
        Math.abs(finish.x - node.x) <= 1 && Math.abs(finish.y - node.y) <= 1
    );

    if (nearFinish) {
      return { reachable: true, reason: "" };
    }

    for (let dx = -SPRING_DISTANCE; dx <= SPRING_DISTANCE; dx++) {
      for (let dy = -SPRING_RISE; dy <= MAX_DISTANCE + 1; dy++) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const next = nodes.get(cellKey(node.x + dx, node.y + dy));

        if (!next || !canMove(node, next, dx, dy)) {
          continue;
        }

        const nextKey = cellKey(next.x, next.y);

        if (!visited.has(nextKey)) {
          visited.add(nextKey);
          queue.push(next);
        }
      }
    }
  }

  return {
    reachable: false,
    reason: "финиш не найден по прыжкам, падениям и лестницам"
  };
}

function canMove(from, to, dx, dy) {
  const distance = Math.abs(dx);

  // Лестница соединяет соседние клетки, включая ступеньку на платформу
  if (from.ladder || to.ladder) {
    return distance <= LADDER_RADIUS && Math.abs(dy) <= LADDER_RADIUS;
  }

  // Вверх: прыжок или батут
  if (dy < 0) {
    const rise = -dy;

    if (from.spring) {
      return rise <= SPRING_RISE && distance <= SPRING_DISTANCE;
    }

    return rise <= JUMP_RISE && distance <= JUMP_DISTANCE;
  }

  // Вниз: падение с горизонтальным сносом
  if (dy > 0) {
    return distance <= Math.min(MAX_DISTANCE, 2 + dy);
  }

  // В одну сторону по ровной поверхности
  return distance <= MAX_DISTANCE;
}
