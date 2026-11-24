// ============================================
// РАЗРУШАЕМЫЙ БЛОК
// ============================================

import { playSound } from "../core/sound.js";
import { addScreenShake, spawnParticles } from "../core/effects.js";

export function breakBlock(block) {
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
