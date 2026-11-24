// ============================================
// СОСТОЯНИЕ ИГРЫ
// ============================================
// Один изменяемый объект на всю игру: объекты уровня, счётчики,
// текущий экран, кнопки меню и флаги ввода. Модули меняют его поля
// через state.*, поэтому состояние живёт в одном месте, а не
// в глобальной области.

import { SETTINGS } from "./settings.js";

export const state = {
  // Экран и меню
  gameState: "menu",
  uiIndex: 0,
  uiButtons: [],
  uiTitle: "",
  uiSubtitle: "",
  uiHint: "",
  uiMessage: "",

  // Объекты текущего уровня
  solids: [],
  spikes: [],
  checkpoints: [],
  movingPlatforms: [],
  coins: [],
  enemies: [],
  keyItems: [],
  doors: [],
  bullets: [],
  exits: [],
  springs: [],
  fallingPlatforms: [],
  oneWayPlatforms: [],
  breakableBlocks: [],
  ladders: [],
  saws: [],
  cannons: [],

  keyCount: 0,
  coinsTaken: 0,
  coinsTotal: 0,

  playerStart: { x: 100, y: 100 },
  currentCheckpoint: { x: 100, y: 100 },

  // Счёт и уровень
  score: 0,
  scoreAtLevelStart: 0,
  currentLevelIndex: 0,
  currentBiome: "grass",
  currentBossType: "default",
  currentLevelAuthor: "",
  currentLevelNote: "",
  gameLevels: [],
  levelSource: "builtin",
  currentLevelName: "",

  // Жизни и защита после respawn
  lives: SETTINGS.startLives,
  invulnerableTimer: 0,
  gameOver: false,
  hurtThisFrame: false,

  levelWidth: 1,
  levelHeight: 1,

  levelComplete: false,
  levelCompleteTimer: 0,
  levelTimerFrames: 0,
  lastLevelResult: null,
  gameFinished: false,
  paused: false,

  // Босс
  boss: null,
  bossDefeated: false,
  bossMessageTimer: 0,
  bossMessageText: "",

  // Эффекты
  screenShake: 0,

  // Клавиатура: одноразовые нажатия
  jumpPressed: false,
  pausePressed: false,
  restartPressed: false,
  confirmPressed: false,
  backPressed: false,
  menuPressed: false,
  upPressed: false,
  downPressed: false,
  leftPressed: false,
  rightPressed: false,

  // Мышь в координатах игрового холста
  mouseX: -1000,
  mouseY: -1000,
  mouseOnCanvas: false,
  clickPressed: false,
  mouseMoved: false
};
