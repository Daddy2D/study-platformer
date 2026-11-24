// ============================================
// УПРАВЛЕНИЕ: КЛАВИАТУРА И МЫШЬ
// ============================================

// Какие клавиши сейчас зажаты
const keys = {};

// Нажатия, которые важны один раз (а не каждый кадр)
let jumpPressed = false;
let pausePressed = false;
let restartPressed = false;
let confirmPressed = false;
let backPressed = false;
let menuPressed = false;
let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

// Мышь в координатах игрового холста (960×540)
let mouseX = -1000;
let mouseY = -1000;
let mouseOnCanvas = false;
let clickPressed = false;
let mouseMoved = false;

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

  mouseMoved = true;

  mouseOnCanvas =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (!mouseOnCanvas) {
    mouseX = -1000;
    mouseY = -1000;
    return;
  }

  mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
}

function isPointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

// Сбрасываем «одноразовые» нажатия после обработки экрана.
function clearMenuInput() {
  confirmPressed = false;
  backPressed = false;
  clickPressed = false;
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;
  mouseMoved = false;
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
    jumpPressed = true;
  }

  if (event.code === "KeyP") {
    pausePressed = true;
  }

  if (event.code === "KeyR") {
    restartPressed = true;
  }

  if (event.code === "KeyQ") {
    menuPressed = true;
  }

  if (event.code === "KeyM") {
    toggleSound();
  }

  if (isConfirmKey(event.code)) {
    confirmPressed = true;
  }

  if (isBackKey(event.code)) {
    backPressed = true;
  }

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    upPressed = true;
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    downPressed = true;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    leftPressed = true;
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    rightPressed = true;
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

  if (mouseOnCanvas) {
    clickPressed = true;
  }
});

// Если окно потеряло фокус, отпускаем все клавиши,
// чтобы игрок не убежал в сторону.
window.addEventListener("blur", () => {
  for (const code in keys) {
    keys[code] = false;
  }

  jumpPressed = false;
  clickPressed = false;
  mouseOnCanvas = false;
  mouseX = -1000;
  mouseY = -1000;
});
