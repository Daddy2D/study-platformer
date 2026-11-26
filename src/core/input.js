import { canvas } from "./canvas.js";
import { initAudio, toggleSound } from "./sound.js";
import { state } from "./state.js";

// ============================================
// УПРАВЛЕНИЕ: КЛАВИАТУРА И МЫШЬ
// ============================================

// Какие клавиши сейчас зажаты
export const keys = {};

const PREVENT_DEFAULT_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space"
];

function isJumpKey(code) {
  return code === "Space" || code === "ArrowUp" || code === "KeyW";
}

function isConfirmKey(code) {
  return code === "Enter" || code === "NumpadEnter" || code === "Space";
}

function isBackKey(code) {
  return code === "Escape" || code === "Backspace";
}

// Пересчитываем положение мыши в координаты холста.
// Холст растянут через CSS, поэтому учитываем масштаб.
function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();

  state.mouseMoved = true;

  state.mouseOnCanvas =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (!state.mouseOnCanvas) {
    state.mouseX = -1000;
    state.mouseY = -1000;
    return;
  }

  state.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
  state.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
}

export function isPointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

window.addEventListener("keydown", event => {
  if (PREVENT_DEFAULT_KEYS.includes(event.code)) {
    event.preventDefault();
  }

  // Браузер включает звук только после действия пользователя
  initAudio();

  keys[event.code] = true;

  if (event.repeat) {
    return;
  }

  if (isJumpKey(event.code)) {
    state.jumpPressed = true;
  }

  if (event.code === "KeyP") {
    state.pausePressed = true;
  }

  if (event.code === "KeyR") {
    state.restartPressed = true;
  }

  if (event.code === "KeyQ") {
    state.menuPressed = true;
  }

  if (event.code === "KeyM") {
    toggleSound();
  }

  if (isConfirmKey(event.code)) {
    state.confirmPressed = true;
  }

  if (isBackKey(event.code)) {
    state.backPressed = true;
  }

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    state.upPressed = true;
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    state.downPressed = true;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.leftPressed = true;
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.rightPressed = true;
  }
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

window.addEventListener("pointermove", updateMousePosition);

window.addEventListener("pointerdown", event => {
  updateMousePosition(event);

  if (event.button !== 0) {
    return;
  }

  initAudio();

  if (state.mouseOnCanvas) {
    state.clickPressed = true;
  }
});

// Если окно потеряло фокус, отпускаем все клавиши,
// чтобы игрок не убежал в сторону.
window.addEventListener("blur", () => {
  for (const code in keys) {
    keys[code] = false;
  }

  state.jumpPressed = false;
  state.clickPressed = false;
  state.mouseOnCanvas = false;
  state.mouseX = -1000;
  state.mouseY = -1000;
});

// ============================================
// КНОПКИ ДЛЯ ТЕЛЕФОНА И ПЛАНШЕТА
// ============================================

const touchControls = document.getElementById("touchControls");

function enableTouchMode() {
  document.body.classList.add("touch");
}

if (touchControls) {
  // На сенсорных устройствах кнопки показываются сразу
  if (navigator.maxTouchPoints > 0) {
    enableTouchMode();
  }

  window.addEventListener("touchstart", enableTouchMode, {
    once: true,
    passive: true
  });

  touchControls.addEventListener("contextmenu", event => {
    event.preventDefault();
  });

  for (const button of touchControls.querySelectorAll("[data-key]")) {
    const code = button.dataset.key;

    const press = event => {
      event.preventDefault();
      event.stopPropagation();
      initAudio();
      keys[code] = true;
    };

    const release = event => {
      event.preventDefault();
      event.stopPropagation();
      keys[code] = false;
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  const jumpButton = touchControls.querySelector('[data-action="jump"]');
  const pauseButton = touchControls.querySelector('[data-action="pause"]');

  if (jumpButton) {
    // ▲ и прыгает, и работает как «вверх» на лестнице
    jumpButton.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
      initAudio();
      keys.ArrowUp = true;
      state.jumpPressed = true;
    });

    const stopJump = event => {
      event.preventDefault();
      event.stopPropagation();
      keys.ArrowUp = false;
    };

    jumpButton.addEventListener("pointerup", stopJump);
    jumpButton.addEventListener("pointercancel", stopJump);
    jumpButton.addEventListener("pointerleave", stopJump);
  }

  if (pauseButton) {
    pauseButton.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
      state.pausePressed = true;
    });
  }
}

// Если вкладку скрыли или приложение свернули, отпускаем все клавиши
// и ставим игру на паузу: иначе игрок «убежит» при возврате.
function suspendInput() {
  for (const code in keys) {
    keys[code] = false;
  }

  state.jumpPressed = false;
  state.clickPressed = false;

  if (
    state.gameState === "playing" &&
    !state.paused &&
    !state.gameOver &&
    !state.levelComplete &&
    !state.gameFinished
  ) {
    state.paused = true;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    suspendInput();
  }
});

window.addEventListener("pagehide", suspendInput);
