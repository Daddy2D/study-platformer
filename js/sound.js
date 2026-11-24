// ============================================
// ЗВУКИ
// ============================================
// Короткие сигналы генерируются прямо в браузере через WebAudio.
// Внешние mp3/wav не нужны.

let audioContext = null;
let soundEnabled = getSoundEnabled();

function ensureAudio() {
  if (!soundEnabled) {
    return false;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return false;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return true;
}

// Вызывается при первом клике или нажатии клавиши:
// браузеры разрешают звук только после действия пользователя.
function initAudio() {
  ensureAudio();
}

function tone(frequency, duration, type, volume, delay, endFrequency) {
  if (!audioContext) {
    return;
  }

  const start = audioContext.currentTime + (delay || 0);
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type || "square";
  oscillator.frequency.setValueAtTime(frequency, start);

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      start + duration
    );
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume || 0.1, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playSound(name) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  if (name === "jump") {
    tone(330, 0.14, "square", 0.07, 0, 560);
  }

  if (name === "coin") {
    tone(880, 0.08, "sine", 0.09, 0);
    tone(1320, 0.1, "sine", 0.09, 0.07);
  }

  if (name === "stomp") {
    tone(240, 0.14, "square", 0.09, 0, 110);
  }

  if (name === "hurt") {
    tone(220, 0.28, "sawtooth", 0.08, 0, 70);
  }

  if (name === "checkpoint") {
    tone(660, 0.09, "sine", 0.08, 0);
    tone(990, 0.13, "sine", 0.08, 0.08);
  }

  if (name === "key") {
    tone(740, 0.07, "triangle", 0.08, 0);
    tone(1108, 0.1, "triangle", 0.08, 0.06);
  }

  if (name === "door") {
    tone(440, 0.08, "triangle", 0.08, 0);
    tone(587, 0.12, "triangle", 0.08, 0.07);
  }

  if (name === "click") {
    tone(700, 0.04, "square", 0.04, 0);
  }

  if (name === "win") {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      tone(frequency, 0.14, "triangle", 0.08, index * 0.11);
    });
  }

  if (name === "gameover") {
    tone(330, 0.18, "triangle", 0.1, 0);
    tone(247, 0.2, "triangle", 0.1, 0.18);
    tone(165, 0.42, "triangle", 0.1, 0.38);
  }

  if (name === "spring") {
    tone(240, 0.2, "sine", 0.09, 0, 780);
  }

  if (name === "crack") {
    tone(170, 0.08, "square", 0.05, 0);
    tone(120, 0.1, "square", 0.05, 0.08);
  }

  if (name === "bossroar") {
    tone(90, 0.5, "sawtooth", 0.09, 0, 55);
    tone(140, 0.35, "square", 0.06, 0.08, 90);
  }

  if (name === "bosshit") {
    tone(180, 0.16, "square", 0.1, 0, 80);
  }

  if (name === "bossphase") {
    tone(110, 0.25, "sawtooth", 0.09, 0, 220);
    tone(220, 0.3, "square", 0.08, 0.2, 440);
  }

  if (name === "bossdown") {
    [220, 330, 440, 660, 880].forEach((frequency, index) => {
      tone(frequency, 0.18, "triangle", 0.09, index * 0.12);
    });
  }

  if (name === "cannon") {
    tone(120, 0.12, "square", 0.08, 0, 70);
    tone(180, 0.08, "sawtooth", 0.05, 0.02, 90);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  setSoundEnabled(soundEnabled);

  if (soundEnabled) {
    playSound("click");
  }

  // Если открыто меню, обновляем надпись «Звук: вкл/выкл»
  if (typeof rebuildUi === "function" && typeof gameState !== "undefined") {
    rebuildUi();
  }
}
