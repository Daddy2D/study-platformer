import { FRAME_TIME, SETTINGS } from "../core/settings.js";
import { canvas } from "../core/canvas.js";
import { state } from "../core/state.js";
import { isPointInRect } from "../core/input.js";
import {
  playSound,
  toggleSound,
  onSoundChange,
  isSoundEnabled
} from "../core/sound.js";
import { updateEffects, spawnParticles } from "../core/effects.js";
import {
  getCustomLevels,
  getCustomLevel,
  getTestLevel
} from "../core/storage.js";
import { LEVEL_NAMES, LEVEL_META } from "../data/levels/index.js";
import {
  BUILTIN_LEVELS,
  loadLevel,
  updateMovingPlatforms,
  updateFallingPlatforms,
  updateSaws,
  updateCannons
} from "./world.js";
import {
  player,
  hurtPlayer,
  updatePlayer,
  updateCheckpoints,
  updateKeys,
  updateDoors,
  checkSpikes,
  checkSaws
} from "./player.js";
import { updateEnemy, updateBullets } from "./enemies.js";
import { intersects, clamp } from "./collision.js";
import { updateBoss } from "./boss.js";
import {
  calculateLevelStars,
  recordLevelCompletion,
  getProgressOverview,
  getContinueLevelIndex,
  getLevelProgress,
  formatTimeFrames,
  getStarsText
} from "./progress.js";
import { drawGame } from "./render.js";

// ============================================
// ПРАВИЛА ИГРЫ, ЭКРАНЫ И ГЛАВНЫЙ ЦИКЛ
// ============================================

// "menu" | "levels" | "custom" | "playing"
// Экран, выбранная кнопка и заголовки лежат в state.

// Свои уровни в меню и номер страницы
let customLevelsCache = [];
let customPage = 0;
const CUSTOM_PAGE_SIZE = 4;

// Готовые уровни и номер страницы
let levelPage = 0;
const LEVELS_PER_PAGE = 8;

// ============================================
// ЭКРАНЫ
// ============================================

function setState(nextState) {
  state.gameState = nextState;
  state.uiIndex = 0;
  rebuildUi();
}

function rebuildUi() {
  if (state.gameState === "playing") {
    state.uiIndex = 0;
  }

  state.uiButtons = [];
  state.uiTitle = "";
  state.uiSubtitle = "";
  state.uiHint = "";
  state.uiMessage = "";

  if (state.gameState === "menu") {
    state.uiTitle = "МИНИ-ПЛАТФОРМЕР";
    state.uiSubtitle = "Играем и учимся делать уровни";
    state.uiHint = "↑ ↓ — выбор    Enter или клик — ОК    M — звук";
    state.uiMessage = `Своих уровней: ${getCustomLevels().length}`;

    const overview = getProgressOverview();
    const primaryLabel =
      overview.completed === 0
        ? "Играть"
        : overview.completed >= overview.totalLevels
          ? "Начать заново"
          : "Продолжить";

    const specs = [
      { action: "play", label: primaryLabel },
      { action: "levels", label: "Уровни" },
      { action: "custom", label: "Мои уровни" },
      { action: "stats", label: "Достижения" },
      { action: "settings", label: "Настройки уровней" },
      { action: "editor", label: "Редактор уровней" },
      { action: "sound", label: `Звук: ${isSoundEnabled() ? "вкл" : "выкл"}` }
    ];

    state.uiButtons = layoutButtons(specs, 184, 380, 36, 4);
    return;
  }

  if (state.gameState === "levels") {
    state.uiTitle = "ВЫБЕРИ УРОВЕНЬ";
    state.uiSubtitle = `${LEVEL_NAMES.length} готовых уровней игры`;
    state.uiHint = "↑ ↓ ← → — выбор    Enter — играть    Esc — назад";

    const totalPages = Math.max(
      1,
      Math.ceil(LEVEL_NAMES.length / LEVELS_PER_PAGE)
    );

    levelPage = clamp(levelPage, 0, totalPages - 1);

    const pageStart = levelPage * LEVELS_PER_PAGE;
    const pageNames = LEVEL_NAMES.slice(
      pageStart,
      pageStart + LEVELS_PER_PAGE
    );

    const specs = pageNames.map((name, offset) => {
      const index = pageStart + offset;
      const record = getLevelProgress(index);
      const completed = Boolean(record && record.completed);
      const meta = LEVEL_META[index] || { author: "", note: "" };

      return {
        action: "startLevel",
        levelIndex: index,
        label: `${index + 1}. ${name}${completed ? " " + getStarsText(record.stars) : ""}`,
        sub: completed
          ? `Лучшее: ${record.bestTimeFrames !== null ? formatTimeFrames(record.bestTimeFrames) : "—"} · жизни: ${record.bestLives}`
          : "Ещё не пройден",
        author: meta.author,
        note: meta.note
      };
    });

    if (totalPages > 1) {
      specs.push({
        action: "levelsPage",
        label:
          levelPage + 1 < totalPages
            ? `Страница ${levelPage + 1} из ${totalPages}  →`
            : `←  Страница ${levelPage + 1} из ${totalPages}`
      });
    }

    specs.push({ action: "back", label: "Назад" });

    state.uiButtons = layoutLevelButtons(specs);
    return;
  }

  if (state.gameState === "stats") {
    state.uiTitle = "ДОСТИЖЕНИЯ";
    state.uiSubtitle = "Прогресс, рекорды и коллекция";
    state.uiHint = "Esc — назад";
    state.uiButtons = layoutButtons(
      [{ action: "back", label: "Назад" }],
      468,
      220,
      40,
      0
    );
    return;
  }

  if (state.gameState === "custom") {
    state.uiTitle = "МОИ УРОВНИ";
    state.uiSubtitle = "Сохранены в этом браузере";
    state.uiHint = "↑ ↓ — выбор    Enter — играть    Esc — назад";

    const totalPages = Math.max(
      1,
      Math.ceil(customLevelsCache.length / CUSTOM_PAGE_SIZE)
    );

    customPage = clamp(customPage, 0, totalPages - 1);

    const pageStart = customPage * CUSTOM_PAGE_SIZE;
    const pageLevels = customLevelsCache.slice(
      pageStart,
      pageStart + CUSTOM_PAGE_SIZE
    );

    const specs = pageLevels.map(level => ({
      action: "playCustom",
      levelId: level.id,
      label: level.name,
      sub: `${level.rows[0].length} × ${level.rows.length}`,
      author: level.author || "",
      note: level.note || ""
    }));

    if (customLevelsCache.length === 0) {
      state.uiMessage = "Пока пусто. Создай уровень в редакторе и сохрани его.";
    }

    if (totalPages > 1) {
      const pageLabel =
        customPage + 1 < totalPages
          ? `Страница ${customPage + 1} из ${totalPages}  →`
          : `←  Страница ${customPage + 1} из ${totalPages}`;

      specs.push({
        action: "customPage",
        label: pageLabel
      });
    }

    specs.push({ action: "back", label: "Назад" });

    const top = customLevelsCache.length === 0 ? 255 : 155;

    state.uiButtons = layoutButtons(specs, top, 390, 44, 9);
    return;
  }

  if (state.gameState === "playing") {
    if (state.paused) {
      state.uiTitle = "ПАУЗА";
      state.uiSubtitle = "";
      state.uiHint = "P или Esc — продолжить    Q — в меню    R — заново";

      state.uiButtons = layoutButtons(
        [
          { action: "resume", label: "Продолжить" },
          { action: "restart", label: "Начать уровень заново" },
          { action: "menu", label: "В главное меню" }
        ],
        285,
        360,
        48,
        12
      );
    }

    if (state.gameOver) {
      state.uiTitle = "ИГРА ОКОНЧЕНА";
      state.uiSubtitle = "Жизни закончились. Попробуй ещё раз!";
      state.uiHint = "R — заново    Esc — в меню";

      const specs = [
        { action: "restart", label: "Начать заново" },
        { action: "menu", label: "В главное меню" }
      ];

      if (state.levelSource === "test") {
        specs.push({ action: "backToEditor", label: "Вернуться в редактор" });
      }

      state.uiButtons = layoutButtons(specs, 300, 360, 48, 12);
    }

    if (state.gameFinished) {
      state.uiTitle = state.levelSource === "test" ? "ПРОВЕРКА ПРОЙДЕНА!" : "ИГРА ПРОЙДЕНА!";
      state.uiSubtitle = `Итоговые очки: ${state.score}`;
      state.uiHint = "Enter — выбранная кнопка    Esc — в меню";

      const specs = [
        { action: "menu", label: "В главное меню" },
        { action: "playAgain", label: "Играть снова" }
      ];

      if (state.levelSource === "test") {
        specs.push({ action: "backToEditor", label: "Вернуться в редактор" });
      }

      state.uiButtons = layoutButtons(specs, 300, 360, 48, 12);
    }
  }
}

function layoutButtons(specs, top, width, height, gap) {
  const buttonWidth = width || 380;
  const buttonHeight = height || 46;
  const buttonGap = gap === undefined ? 10 : gap;
  const left = (canvas.width - buttonWidth) / 2;

  return specs.map((spec, index) => ({
    action: spec.action,
    label: spec.label,
    sub: spec.sub || "",
    levelIndex: spec.levelIndex,
    levelId: spec.levelId,
    rect: {
      x: left,
      y: top + index * (buttonHeight + buttonGap),
      w: buttonWidth,
      h: buttonHeight
    }
  }));
}

function layoutLevelButtons(specs) {
  const columns = 2;
  const width = 430;
  const height = 54;
  const gapX = 20;
  const gapY = 6;
  const top = 150;
  const left =
    (canvas.width - width * columns - gapX) / 2;

  return specs.map((spec, index) => ({
    action: spec.action,
    label: spec.label,
    sub: spec.sub || "",
    levelIndex: spec.levelIndex,
    levelId: spec.levelId,
    author: spec.author || "",
    note: spec.note || "",
    rect: {
      x: left + (index % columns) * (width + gapX),
      y: top + Math.floor(index / columns) * (height + gapY),
      w: width,
      h: height
    }
  }));
}

function openCustomScreen() {
  customLevelsCache = getCustomLevels();
  customPage = 0;
  setState("custom");
}

// ============================================
// ЗАПУСК ИГРЫ
// ============================================

function startBuiltinGame(levelIndex) {
  state.gameLevels = BUILTIN_LEVELS;
  state.levelSource = "builtin";
  state.score = 0;
  state.gameState = "playing";
  state.paused = false;
  state.gameOver = false;
  state.gameFinished = false;
  loadLevel(levelIndex);
  rebuildUi();
}

function startCustomGame(levelId) {
  const level = getCustomLevel(levelId);

  if (!level) {
    rebuildUi();
    state.uiMessage = "Не удалось найти уровень. Открой редактор и сохрани его снова.";
    return;
  }

  startSingleLevel(level, "custom", `custom:${levelId}`);
}

function startTestGame() {
  const level = getTestLevel();

  if (!level) {
    setState("menu");
    return;
  }

  startSingleLevel(level, "test", null);
}

function startSingleLevel(level, source, settingsKey) {
  state.gameLevels = [{
    name: level.name,
    rows: level.rows,
    settingsKey: settingsKey || null,
    biome: level.biome || "grass",
    bossType: level.bossType || "default",
    author: level.author || "",
    note: level.note || ""
  }];
  state.levelSource = source;
  state.score = 0;
  state.gameState = "playing";
  state.paused = false;
  state.gameOver = false;
  state.gameFinished = false;
  loadLevel(0);
  rebuildUi();
}

function restartCurrentLevel() {
  state.score = state.scoreAtLevelStart;
  state.paused = false;
  state.gameOver = false;
  state.gameFinished = false;
  state.gameState = "playing";
  loadLevel(state.currentLevelIndex);
  rebuildUi();
}

function goToMenu() {
  state.paused = false;
  state.gameOver = false;
  state.gameFinished = false;
  state.levelComplete = false;
  state.jumpPressed = false;
  state.currentBiome = "grass";
  setState("menu");
}

// ============================================
// КНОПКИ И КЛАВИАТУРА В МЕНЮ
// ============================================

function activateButton(button) {
  if (!button) {
    return;
  }

  playSound("click");

  if (button.action === "play") {
    startBuiltinGame(getContinueLevelIndex());
    return;
  }

  if (button.action === "levels") {
    levelPage = 0;
    setState("levels");
    return;
  }

  if (button.action === "custom") {
    openCustomScreen();
    return;
  }

  if (button.action === "stats") {
    setState("stats");
    return;
  }

  if (button.action === "editor") {
    const editorWindow = window.open("editor.html", "_blank");

    if (!editorWindow) {
      window.location.href = "editor.html";
    }

    return;
  }

  if (button.action === "settings") {
    const settingsWindow = window.open("settings.html", "_blank");

    if (!settingsWindow) {
      window.location.href = "settings.html";
    }

    return;
  }

  if (button.action === "backToEditor") {
    // Вкладку проверки открыл редактор — просто закрываем её.
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    window.location.href = "editor.html";
    return;
  }

  if (button.action === "sound") {
    toggleSound();
    rebuildUi();
    return;
  }

  if (button.action === "startLevel") {
    startBuiltinGame(button.levelIndex);
    return;
  }

  if (button.action === "playCustom") {
    startCustomGame(button.levelId);
    return;
  }

  if (button.action === "customPage") {
    customPage += 1;
    state.uiIndex = 0;
    rebuildUi();
    return;
  }

  if (button.action === "levelsPage") {
    const totalPages = Math.max(
      1,
      Math.ceil(LEVEL_NAMES.length / LEVELS_PER_PAGE)
    );

    levelPage = levelPage + 1 < totalPages ? levelPage + 1 : 0;
    state.uiIndex = 0;
    rebuildUi();
    return;
  }

  if (button.action === "back") {
    setState("menu");
    return;
  }

  if (button.action === "resume") {
    state.paused = false;
    rebuildUi();
    return;
  }

  if (button.action === "restart") {
    restartCurrentLevel();
    return;
  }

  if (button.action === "menu") {
    goToMenu();
    return;
  }

  if (button.action === "playAgain") {
    if (state.levelSource === "builtin") {
      startBuiltinGame(0);
    } else if (state.levelSource === "custom") {
      restartCurrentLevel();
    } else {
      startTestGame();
    }

    return;
  }
}

function updateUiInput() {
  const count = state.uiButtons.length;

  if (count === 0) {
    return;
  }

  let hovered = -1;

  if (state.mouseMoved && state.mouseOnCanvas) {
    for (let i = 0; i < count; i++) {
      if (isPointInRect(state.mouseX, state.mouseY, state.uiButtons[i].rect)) {
        hovered = i;
        break;
      }
    }

    if (hovered >= 0) {
      state.uiIndex = hovered;
    }
  }

  if (state.gameState === "levels") {
    const columns = 2;

    if (state.leftPressed && state.uiIndex % columns > 0) {
      state.uiIndex -= 1;
    }

    if (
      state.rightPressed &&
      state.uiIndex % columns < columns - 1 &&
      state.uiIndex + 1 < count
    ) {
      state.uiIndex += 1;
    }

    if (state.upPressed && state.uiIndex - columns >= 0) {
      state.uiIndex -= columns;
    }

    if (state.downPressed) {
      const next = state.uiIndex + columns;

      if (next < count) {
        state.uiIndex = next;
      } else if (count % columns === 1 && state.uiIndex === count - 2) {
        state.uiIndex = count - 1;
      }
    }
  } else {
    if (state.upPressed) {
      state.uiIndex = (state.uiIndex - 1 + count) % count;
    }

    if (state.downPressed) {
      state.uiIndex = (state.uiIndex + 1) % count;
    }
  }

  state.uiIndex = clamp(state.uiIndex, 0, count - 1);

  if (state.confirmPressed) {
    activateButton(state.uiButtons[state.uiIndex]);
    state.confirmPressed = false;
    return;
  }

  if (state.clickPressed) {
    state.clickPressed = false;

    if (hovered >= 0) {
      activateButton(state.uiButtons[hovered]);
    }
  }
}

// Сбрасываем нажатия, которые уже обработаны в этом кадре.
function clearOneShotInput() {
  state.confirmPressed = false;
  state.backPressed = false;
  state.pausePressed = false;
  state.restartPressed = false;
  state.menuPressed = false;
  state.clickPressed = false;
  state.upPressed = false;
  state.downPressed = false;
  state.leftPressed = false;
  state.rightPressed = false;
  state.mouseMoved = false;
}

// ============================================
// ГЛАВНЫЙ ШАГ ИГРЫ
// ============================================

function completeLevel() {
  if (state.levelComplete) {
    return;
  }

  const result = {
    frames: state.levelTimerFrames,
    lives: state.lives,
    coins: state.coinsTaken,
    coinsTotal: state.coinsTotal,
    startLives: SETTINGS.startLives
  };

  const stars = calculateLevelStars(result);

  if (state.levelSource === "builtin") {
    state.lastLevelResult = recordLevelCompletion(state.currentLevelIndex, result);
  }

  if (!state.lastLevelResult) {
    state.lastLevelResult = {
      saved: false,
      stars: stars,
      newBestTime: false,
      bestTimeFrames: null,
      bestLives: state.lives,
      bestCoins: state.coinsTaken,
      startLives: SETTINGS.startLives
    };
  }

  state.levelComplete = true;
  state.levelCompleteTimer = SETTINGS.levelTransitionDelay;
  playSound("win");
}

function updateGame() {
  // ------ ЭКРАНЫ МЕНЮ ------
  if (state.gameState !== "playing") {
    updateUiInput();

    if (state.backPressed) {
      state.backPressed = false;

      if (
        state.gameState === "levels" ||
        state.gameState === "custom" ||
        state.gameState === "stats"
      ) {
        setState("menu");
      }
    }

    state.jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ПАУЗА ------
  if (
    (state.pausePressed || state.backPressed) &&
    !state.gameOver &&
    !state.gameFinished &&
    !state.levelComplete
  ) {
    state.paused = !state.paused;
    state.jumpPressed = false;
    state.pausePressed = false;
    state.backPressed = false;
    rebuildUi();
  } else {
    state.pausePressed = false;

    if (!state.gameOver && !state.gameFinished) {
      state.backPressed = false;
    }
  }

  if (state.paused) {
    if (state.uiButtons.length === 0) {
      rebuildUi();
    }

    updateUiInput();

    if (state.restartPressed) {
      state.restartPressed = false;
      restartCurrentLevel();
      clearOneShotInput();
      return;
    }

    if (state.menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    state.jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ПРОИГРЫШ ------
  if (state.gameOver) {
    if (state.uiButtons.length === 0) {
      rebuildUi();
    }

    if (state.backPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    updateUiInput();

    if (state.restartPressed) {
      state.restartPressed = false;
      restartCurrentLevel();
      clearOneShotInput();
      return;
    }

    if (state.menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    state.jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ФИНАЛ ------
  if (state.gameFinished) {
    if (state.uiButtons.length === 0) {
      rebuildUi();
    }

    if (state.backPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    updateUiInput();

    if (state.menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    state.jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ВЫХОД В МЕНЮ ВО ВРЕМЯ ИГРЫ ------
  if (state.menuPressed) {
    clearOneShotInput();
    goToMenu();
    return;
  }

  // ------ ПЕРЕЗАПУСК УРОВНЯ ------
  if (state.restartPressed) {
    state.restartPressed = false;
    restartCurrentLevel();
    clearOneShotInput();
    return;
  }

  // ------ ПРОХОЖДЕНИЕ УРОВНЯ ------
  if (state.levelComplete) {
    state.levelCompleteTimer -= 1;

    if (state.levelCompleteTimer <= 0) {
      if (state.currentLevelIndex + 1 < state.gameLevels.length) {
        loadLevel(state.currentLevelIndex + 1);
      } else {
        state.gameFinished = true;
        rebuildUi();
      }
    }

    clearOneShotInput();
    return;
  }

  // ------ ОБЫЧНАЯ ИГРА ------
  state.hurtThisFrame = false;
  state.levelTimerFrames += 1;

  if (state.bossMessageTimer > 0) {
    state.bossMessageTimer -= 1;
  }

  updateMovingPlatforms();
  updateSaws();
  updatePlayer();
  updateFallingPlatforms();
  updateEffects();

  if (updateBoss()) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  if (state.hurtThisFrame || state.gameOver) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  updateCheckpoints();
  updateKeys();
  updateDoors();

  if (checkSpikes()) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  if (checkSaws()) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  for (const enemy of state.enemies) {
    updateEnemy(enemy);

    if (!enemy.dead && intersects(player, enemy)) {
      if (player.vy > 0 && player.y + player.h - enemy.y < 26) {
        enemy.dead = true;
        player.vy = SETTINGS.stompBounce;
        player.jumpsLeft = 1;
        state.score += 5;
        playSound("stomp");
        spawnParticles(
          enemy.x + enemy.w / 2,
          enemy.y + enemy.h / 2,
          "#ff9f68",
          8,
          2.2
        );
      } else if (hurtPlayer()) {
        rebuildUi();
        clearOneShotInput();
        return;
      }
    }
  }

  state.enemies = state.enemies.filter(enemy => !enemy.dead);

  updateCannons();

  if (updateBullets()) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  for (const coin of state.coins) {
    if (!coin.taken && intersects(player, coin)) {
      coin.taken = true;
      state.coinsTaken += 1;
      state.score += 1;
      playSound("coin");
      spawnParticles(
        coin.x + coin.w / 2,
        coin.y + coin.h / 2,
        "#ffd23d",
        5,
        1.8
      );
    }
  }

  state.coins = state.coins.filter(coin => !coin.taken);

  // Уровень завершается, когда игрок дотронулся до финишного флага.
  // На уровне с боссом финиш открывается только после победы.
  const exitLocked = state.boss && !state.bossDefeated;

  if (!exitLocked) {
    for (const exit of state.exits) {
      if (intersects(player, exit)) {
        completeLevel();
        break;
      }
    }
  }

  clearOneShotInput();
}

// ============================================
// ГЛАВНЫЙ ЦИКЛ
// ============================================

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("test") === "1") {
  startTestGame();
} else if (urlParams.has("play")) {
  const customLevelId = urlParams.get("play");
  const customLevel = getCustomLevel(customLevelId);

  if (customLevel) {
    startSingleLevel(customLevel, "custom", `custom:${customLevelId}`);
  } else {
    setState("menu");
  }
} else if (urlParams.has("level")) {
  const levelIndex = Number(urlParams.get("level"));

  if (
    Number.isInteger(levelIndex) &&
    levelIndex >= 0 &&
    levelIndex < BUILTIN_LEVELS.length
  ) {
    startBuiltinGame(levelIndex);
  } else {
    setState("menu");
  }
} else {
  setState("menu");
}

// При смене звука обновляем надпись в меню
onSoundChange(() => {
  rebuildUi();
});

let lastTime = null;
let accumulator = 0;

function gameLoop(now) {
  if (lastTime === null) {
    lastTime = now;
  }

  let delta = now - lastTime;
  lastTime = now;

  // Если вкладка была скрыта, не пытаемся догнать всё время сразу
  if (delta > 100) {
    delta = 100;
  }

  accumulator += delta;

  let steps = 0;

  // Физика всегда обсчитывается фиксированными шагами:
  // игра идёт одинаково на 60, 120 и 144 Гц.
  while (accumulator >= FRAME_TIME && steps < 5) {
    updateGame();
    accumulator -= FRAME_TIME;
    steps += 1;
  }

  drawGame();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
