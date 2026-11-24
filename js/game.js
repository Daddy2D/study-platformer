// ============================================
// ПРАВИЛА ИГРЫ, ЭКРАНЫ И ГЛАВНЫЙ ЦИКЛ
// ============================================

// "menu" | "levels" | "custom" | "playing"
let gameState = "menu";

// Выбранная кнопка в меню
let uiIndex = 0;

// Кнопки текущего экрана. Их рисует render.js,
// а нажатия обрабатывает этот файл.
let uiButtons = [];

// Заголовки и подсказки текущего экрана
let uiTitle = "";
let uiSubtitle = "";
let uiHint = "";
let uiMessage = "";

// Свои уровни в меню и номер страницы
let customLevelsCache = [];
let customPage = 0;
const CUSTOM_PAGE_SIZE = 4;

// ============================================
// ЭКРАНЫ
// ============================================

function setState(state) {
  gameState = state;
  uiIndex = 0;
  rebuildUi();
}

function rebuildUi() {
  if (gameState === "playing") {
    uiIndex = 0;
  }

  uiButtons = [];
  uiTitle = "";
  uiSubtitle = "";
  uiHint = "";
  uiMessage = "";

  if (gameState === "menu") {
    uiTitle = "МИНИ-ПЛАТФОРМЕР";
    uiSubtitle = "Играем и учимся делать уровни";
    uiHint = "↑ ↓ — выбор    Enter или клик — ОК    M — звук";
    uiMessage = `Своих уровней: ${getCustomLevels().length}`;

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
      { action: "sound", label: `Звук: ${soundEnabled ? "вкл" : "выкл"}` }
    ];

    uiButtons = layoutButtons(specs, 184, 380, 36, 4);
    return;
  }

  if (gameState === "levels") {
    uiTitle = "ВЫБЕРИ УРОВЕНЬ";
    uiSubtitle = "Восемь готовых уровней игры";
    uiHint = "↑ ↓ ← → — выбор    Enter — играть    Esc — назад";

    const specs = LEVEL_NAMES.map((name, index) => {
      const record = getLevelProgress(index);
      const completed = Boolean(record && record.completed);

      return {
        action: "startLevel",
        levelIndex: index,
        label: `${index + 1}. ${name}${completed ? " " + getStarsText(record.stars) : ""}`,
        sub: completed
          ? `Лучшее: ${record.bestTimeFrames !== null ? formatTimeFrames(record.bestTimeFrames) : "—"} · жизни: ${record.bestLives}`
          : "Ещё не пройден"
      };
    });

    specs.push({ action: "back", label: "Назад" });

    uiButtons = layoutLevelButtons(specs);
    return;
  }

  if (gameState === "stats") {
    uiTitle = "ДОСТИЖЕНИЯ";
    uiSubtitle = "Прогресс, рекорды и коллекция";
    uiHint = "Esc — назад";
    uiButtons = layoutButtons(
      [{ action: "back", label: "Назад" }],
      468,
      220,
      40,
      0
    );
    return;
  }

  if (gameState === "custom") {
    uiTitle = "МОИ УРОВНИ";
    uiSubtitle = "Сохранены в этом браузере";
    uiHint = "↑ ↓ — выбор    Enter — играть    Esc — назад";

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
      sub: `${level.rows[0].length} × ${level.rows.length}`
    }));

    if (customLevelsCache.length === 0) {
      uiMessage = "Пока пусто. Создай уровень в редакторе и сохрани его.";
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

    uiButtons = layoutButtons(specs, top, 390, 44, 9);
    return;
  }

  if (gameState === "playing") {
    if (paused) {
      uiTitle = "ПАУЗА";
      uiSubtitle = "";
      uiHint = "P или Esc — продолжить    Q — в меню    R — заново";

      uiButtons = layoutButtons(
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

    if (gameOver) {
      uiTitle = "ИГРА ОКОНЧЕНА";
      uiSubtitle = "Жизни закончились. Попробуй ещё раз!";
      uiHint = "R — заново    Esc — в меню";

      const specs = [
        { action: "restart", label: "Начать заново" },
        { action: "menu", label: "В главное меню" }
      ];

      if (levelSource === "test") {
        specs.push({ action: "backToEditor", label: "Вернуться в редактор" });
      }

      uiButtons = layoutButtons(specs, 300, 360, 48, 12);
    }

    if (gameFinished) {
      uiTitle = levelSource === "test" ? "ПРОВЕРКА ПРОЙДЕНА!" : "ИГРА ПРОЙДЕНА!";
      uiSubtitle = `Итоговые очки: ${score}`;
      uiHint = "Enter — выбранная кнопка    Esc — в меню";

      const specs = [
        { action: "menu", label: "В главное меню" },
        { action: "playAgain", label: "Играть снова" }
      ];

      if (levelSource === "test") {
        specs.push({ action: "backToEditor", label: "Вернуться в редактор" });
      }

      uiButtons = layoutButtons(specs, 300, 360, 48, 12);
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
  gameLevels = BUILTIN_LEVELS;
  levelSource = "builtin";
  score = 0;
  gameState = "playing";
  paused = false;
  gameOver = false;
  gameFinished = false;
  loadLevel(levelIndex);
  rebuildUi();
}

function startCustomGame(levelId) {
  const level = getCustomLevel(levelId);

  if (!level) {
    rebuildUi();
    uiMessage = "Не удалось найти уровень. Открой редактор и сохрани его снова.";
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
  gameLevels = [{
    name: level.name,
    rows: level.rows,
    settingsKey: settingsKey || null,
    biome: level.biome || "grass",
    bossType: level.bossType || "default"
  }];
  levelSource = source;
  score = 0;
  gameState = "playing";
  paused = false;
  gameOver = false;
  gameFinished = false;
  loadLevel(0);
  rebuildUi();
}

function restartCurrentLevel() {
  score = scoreAtLevelStart;
  paused = false;
  gameOver = false;
  gameFinished = false;
  gameState = "playing";
  loadLevel(currentLevelIndex);
  rebuildUi();
}

function goToMenu() {
  paused = false;
  gameOver = false;
  gameFinished = false;
  levelComplete = false;
  jumpPressed = false;
  currentBiome = "grass";
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
    uiIndex = 0;
    rebuildUi();
    return;
  }

  if (button.action === "back") {
    setState("menu");
    return;
  }

  if (button.action === "resume") {
    paused = false;
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
    if (levelSource === "builtin") {
      startBuiltinGame(0);
    } else if (levelSource === "custom") {
      restartCurrentLevel();
    } else {
      startTestGame();
    }

    return;
  }
}

function updateUiInput() {
  const count = uiButtons.length;

  if (count === 0) {
    return;
  }

  let hovered = -1;

  if (mouseMoved && mouseOnCanvas) {
    for (let i = 0; i < count; i++) {
      if (isPointInRect(mouseX, mouseY, uiButtons[i].rect)) {
        hovered = i;
        break;
      }
    }

    if (hovered >= 0) {
      uiIndex = hovered;
    }
  }

  if (gameState === "levels") {
    const columns = 2;

    if (leftPressed && uiIndex % columns > 0) {
      uiIndex -= 1;
    }

    if (
      rightPressed &&
      uiIndex % columns < columns - 1 &&
      uiIndex + 1 < count
    ) {
      uiIndex += 1;
    }

    if (upPressed && uiIndex - columns >= 0) {
      uiIndex -= columns;
    }

    if (downPressed) {
      const next = uiIndex + columns;

      if (next < count) {
        uiIndex = next;
      } else if (count % columns === 1 && uiIndex === count - 2) {
        uiIndex = count - 1;
      }
    }
  } else {
    if (upPressed) {
      uiIndex = (uiIndex - 1 + count) % count;
    }

    if (downPressed) {
      uiIndex = (uiIndex + 1) % count;
    }
  }

  uiIndex = clamp(uiIndex, 0, count - 1);

  if (confirmPressed) {
    activateButton(uiButtons[uiIndex]);
    confirmPressed = false;
    return;
  }

  if (clickPressed) {
    clickPressed = false;

    if (hovered >= 0) {
      activateButton(uiButtons[hovered]);
    }
  }
}

// Сбрасываем нажатия, которые уже обработаны в этом кадре.
function clearOneShotInput() {
  confirmPressed = false;
  backPressed = false;
  pausePressed = false;
  restartPressed = false;
  menuPressed = false;
  clickPressed = false;
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;
  mouseMoved = false;
}

// ============================================
// ГЛАВНЫЙ ШАГ ИГРЫ
// ============================================

function completeLevel() {
  if (levelComplete) {
    return;
  }

  const result = {
    frames: levelTimerFrames,
    lives: lives,
    coins: coinsTaken,
    coinsTotal: coinsTotal,
    startLives: SETTINGS.startLives
  };

  const stars = calculateLevelStars(result);

  if (levelSource === "builtin") {
    lastLevelResult = recordLevelCompletion(currentLevelIndex, result);
  }

  if (!lastLevelResult) {
    lastLevelResult = {
      saved: false,
      stars: stars,
      newBestTime: false,
      bestTimeFrames: null,
      bestLives: lives,
      bestCoins: coinsTaken,
      startLives: SETTINGS.startLives
    };
  }

  levelComplete = true;
  levelCompleteTimer = SETTINGS.levelTransitionDelay;
  playSound("win");
}

function updateGame() {
  // ------ ЭКРАНЫ МЕНЮ ------
  if (gameState !== "playing") {
    updateUiInput();

    if (backPressed) {
      backPressed = false;

      if (
        gameState === "levels" ||
        gameState === "custom" ||
        gameState === "stats"
      ) {
        setState("menu");
      }
    }

    jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ПАУЗА ------
  if (
    (pausePressed || backPressed) &&
    !gameOver &&
    !gameFinished &&
    !levelComplete
  ) {
    paused = !paused;
    jumpPressed = false;
    pausePressed = false;
    backPressed = false;
    rebuildUi();
  } else {
    pausePressed = false;

    if (!gameOver && !gameFinished) {
      backPressed = false;
    }
  }

  if (paused) {
    if (uiButtons.length === 0) {
      rebuildUi();
    }

    updateUiInput();

    if (restartPressed) {
      restartPressed = false;
      restartCurrentLevel();
      clearOneShotInput();
      return;
    }

    if (menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ПРОИГРЫШ ------
  if (gameOver) {
    if (uiButtons.length === 0) {
      rebuildUi();
    }

    if (backPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    updateUiInput();

    if (restartPressed) {
      restartPressed = false;
      restartCurrentLevel();
      clearOneShotInput();
      return;
    }

    if (menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ФИНАЛ ------
  if (gameFinished) {
    if (uiButtons.length === 0) {
      rebuildUi();
    }

    if (backPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    updateUiInput();

    if (menuPressed) {
      clearOneShotInput();
      goToMenu();
      return;
    }

    jumpPressed = false;
    clearOneShotInput();
    return;
  }

  // ------ ВЫХОД В МЕНЮ ВО ВРЕМЯ ИГРЫ ------
  if (menuPressed) {
    clearOneShotInput();
    goToMenu();
    return;
  }

  // ------ ПЕРЕЗАПУСК УРОВНЯ ------
  if (restartPressed) {
    restartPressed = false;
    restartCurrentLevel();
    clearOneShotInput();
    return;
  }

  // ------ ПРОХОЖДЕНИЕ УРОВНЯ ------
  if (levelComplete) {
    levelCompleteTimer -= 1;

    if (levelCompleteTimer <= 0) {
      if (currentLevelIndex + 1 < gameLevels.length) {
        loadLevel(currentLevelIndex + 1);
      } else {
        gameFinished = true;
        rebuildUi();
      }
    }

    clearOneShotInput();
    return;
  }

  // ------ ОБЫЧНАЯ ИГРА ------
  hurtThisFrame = false;
  levelTimerFrames += 1;

  if (bossMessageTimer > 0) {
    bossMessageTimer -= 1;
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

  if (hurtThisFrame || gameOver) {
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

  for (const enemy of enemies) {
    updateEnemy(enemy);

    if (!enemy.dead && intersects(player, enemy)) {
      if (player.vy > 0 && player.y + player.h - enemy.y < 26) {
        enemy.dead = true;
        player.vy = SETTINGS.stompBounce;
        player.jumpsLeft = 1;
        score += 5;
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

  enemies = enemies.filter(enemy => !enemy.dead);

  updateCannons();

  if (updateBullets()) {
    rebuildUi();
    clearOneShotInput();
    return;
  }

  for (const coin of coins) {
    if (!coin.taken && intersects(player, coin)) {
      coin.taken = true;
      coinsTaken += 1;
      score += 1;
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

  coins = coins.filter(coin => !coin.taken);

  // Уровень завершается, когда игрок дотронулся до финишного флага.
  // На уровне с боссом финиш открывается только после победы.
  const exitLocked = boss && !bossDefeated;

  if (!exitLocked) {
    for (const exit of exits) {
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
