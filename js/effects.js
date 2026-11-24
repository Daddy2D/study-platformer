// ============================================
// ЭФФЕКТЫ И ЧАСТИЦЫ
// ============================================
// Частицы живут в координатах уровня, поэтому рисуются
// вместе с миром и двигаются вместе с камерой.

let effectParticles = [];
let screenShake = 0;

function resetEffects() {
  effectParticles = [];
  screenShake = 0;
}

function addScreenShake(amount) {
  screenShake = Math.max(screenShake, amount);
}

function spawnParticles(x, y, color, count, speed) {
  const amount = count || 6;
  const particleSpeed = speed || 2;

  for (let index = 0; index < amount; index++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity =
      particleSpeed * (0.35 + Math.random() * 0.85);

    const life = 22 + Math.floor(Math.random() * 20);

    effectParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 1.2,
      gravity: 0.12,
      life: life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color: color
    });
  }
}

function updateEffects() {
  screenShake *= 0.86;

  if (screenShake < 0.3) {
    screenShake = 0;
  }

  for (const particle of effectParticles) {
    particle.life -= 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= 0.98;
  }

  effectParticles = effectParticles.filter(
    particle => particle.life > 0
  );
}

function drawParticles() {
  for (const particle of effectParticles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
