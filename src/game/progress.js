import { FPS } from "../core/settings.js";
import { state } from "../core/state.js";
import { STORAGE_KEYS, readStorage, writeStorage } from "../core/storage.js";
import { LEVELS, LEVEL_NAMES, LEVEL_BOSS_TYPES } from "../data/levels/index.js";

// ============================================
// ПРОГРЕСС, РЕКОРДЫ И ДОСТИЖЕНИЯ
// ============================================
// Прогресс хранится в localStorage и относится к готовым уровням.
// Свои уровни и режим проверки рекорды не меняют.

const FAST_LEVEL_FRAMES = 90 * FPS;
const TOTAL_CAMPAIGN_LEVELS = LEVEL_NAMES.length;

function clampInteger(value, min, max) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

function optionalInteger(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Math.floor(Number(value));

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function builtinLevelKey(index) {
  return `builtin:${index}`;
}

function createEmptyLevelProgress() {
  return {
    completed: false,
    stars: 0,
    bestTimeFrames: null,
    bestLives: 0,
    startLives: 0,
    bestCoins: 0,
    coinsTotal: 0,
    attempts: 0,
    lastTimeFrames: null,
    lastStars: 0
  };
}

function createEmptyProgress() {
  return {
    levels: {},
    stats: {
      deaths: 0,
      attempts: 0,
      completions: 0
    }
  };
}

function sanitizeLevelProgress(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    completed: raw.completed === true,
    stars: clampInteger(raw.stars, 0, 3),
    bestTimeFrames: optionalInteger(raw.bestTimeFrames),
    bestLives: clampInteger(raw.bestLives, 0, 99),
    startLives: clampInteger(raw.startLives, 0, 99),
    bestCoins: clampInteger(raw.bestCoins, 0, 9999),
    coinsTotal: clampInteger(raw.coinsTotal, 0, 9999),
    attempts: clampInteger(raw.attempts, 0, 999999),
    lastTimeFrames: optionalInteger(raw.lastTimeFrames),
    lastStars: clampInteger(raw.lastStars, 0, 3)
  };
}

function sanitizeProgress(raw) {
  const progress = createEmptyProgress();

  if (!raw || typeof raw !== "object") {
    return progress;
  }

  if (raw.levels && typeof raw.levels === "object") {
    for (let index = 0; index < TOTAL_CAMPAIGN_LEVELS; index++) {
      const record = sanitizeLevelProgress(
        raw.levels[builtinLevelKey(index)]
      );

      if (record) {
        progress.levels[builtinLevelKey(index)] = record;
      }
    }
  }

  if (raw.stats && typeof raw.stats === "object") {
    progress.stats.deaths = clampInteger(raw.stats.deaths, 0, 999999);
    progress.stats.attempts = clampInteger(raw.stats.attempts, 0, 999999);
    progress.stats.completions = clampInteger(
      raw.stats.completions,
      0,
      999999
    );
  }

  return progress;
}

function getProgress() {
  return sanitizeProgress(
    readStorage(STORAGE_KEYS.progress, null)
  );
}

function saveProgress(progress) {
  return writeStorage(STORAGE_KEYS.progress, progress);
}

export function getLevelProgress(index) {
  return getProgress().levels[builtinLevelKey(index)] || null;
}

export function recordLevelAttempt(index) {
  if (state.levelSource !== "builtin") {
    return;
  }

  const progress = getProgress();
  const key = builtinLevelKey(index);
  const record = progress.levels[key] || createEmptyLevelProgress();

  record.attempts += 1;
  progress.levels[key] = record;
  progress.stats.attempts += 1;

  saveProgress(progress);
}

export function recordLifeLost() {
  if (state.levelSource !== "builtin") {
    return;
  }

  const progress = getProgress();
  progress.stats.deaths += 1;
  saveProgress(progress);
}

export function calculateLevelStars(result) {
  const allCoins =
    result.coinsTotal > 0 && result.coins >= result.coinsTotal;

  const noDamage = result.lives >= result.startLives;

  if (allCoins && noDamage) {
    return 3;
  }

  if (allCoins || noDamage) {
    return 2;
  }

  return 1;
}

export function recordLevelCompletion(index, result) {
  if (state.levelSource !== "builtin") {
    return null;
  }

  const progress = getProgress();
  const key = builtinLevelKey(index);
  const record = progress.levels[key] || createEmptyLevelProgress();

  const stars = calculateLevelStars(result);
  const previousBest = record.bestTimeFrames;
  const newBestTime =
    previousBest === null || result.frames < previousBest;

  record.completed = true;
  record.stars = Math.max(record.stars, stars);
  record.bestTimeFrames = newBestTime
    ? Math.floor(result.frames)
    : previousBest;
  record.bestLives = Math.max(record.bestLives, result.lives);
  record.startLives = result.startLives;
  record.bestCoins = Math.max(record.bestCoins, result.coins);
  record.coinsTotal = result.coinsTotal;
  record.lastTimeFrames = Math.floor(result.frames);
  record.lastStars = stars;

  progress.levels[key] = record;
  progress.stats.completions += 1;

  saveProgress(progress);

  return {
    saved: true,
    stars: stars,
    newBestTime: newBestTime,
    bestTimeFrames: record.bestTimeFrames,
    bestLives: record.bestLives,
    bestCoins: record.bestCoins,
    startLives: record.startLives
  };
}

function countLevelCoins(index) {
  const rows = LEVELS[index];

  if (!Array.isArray(rows)) {
    return 0;
  }

  return rows.join("").split("C").length - 1;
}

export function getProgressOverview() {
  const progress = getProgress();

  let completed = 0;
  let stars = 0;
  let coins = 0;
  let coinsPossible = 0;
  let noDamage = false;
  let allCoinsOnLevel = false;
  let fastLevel = false;

  for (let index = 0; index < TOTAL_CAMPAIGN_LEVELS; index++) {
    coinsPossible += countLevelCoins(index);

    const record = progress.levels[builtinLevelKey(index)];

    if (!record) {
      continue;
    }

    if (record.completed) {
      completed += 1;
    }

    stars += record.stars;
    coins += record.bestCoins;

    if (
      record.completed &&
      record.startLives > 0 &&
      record.bestLives >= record.startLives
    ) {
      noDamage = true;
    }

    if (
      record.completed &&
      record.coinsTotal > 0 &&
      record.bestCoins >= record.coinsTotal
    ) {
      allCoinsOnLevel = true;
    }

    if (
      record.bestTimeFrames !== null &&
      record.bestTimeFrames <= FAST_LEVEL_FRAMES
    ) {
      fastLevel = true;
    }
  }

  const bossDefeated = LEVEL_BOSS_TYPES.some(
    (type, index) =>
      Boolean(type) &&
      progress.levels[builtinLevelKey(index)] &&
      progress.levels[builtinLevelKey(index)].completed
  );

  return {
    completed,
    totalLevels: TOTAL_CAMPAIGN_LEVELS,
    stars,
    maxStars: TOTAL_CAMPAIGN_LEVELS * 3,
    coins: coins,
    coinsPossible,
    deaths: progress.stats.deaths,
    attempts: progress.stats.attempts,
    completions: progress.stats.completions,
    noDamage,
    allCoinsOnLevel,
    fastLevel,
    bossDefeated
  };
}

export function getContinueLevelIndex() {
  const progress = getProgress();

  for (let index = 0; index < TOTAL_CAMPAIGN_LEVELS; index++) {
    const record = progress.levels[builtinLevelKey(index)];

    if (!record || !record.completed) {
      return index;
    }
  }

  return 0;
}

export function formatTimeFrames(frames) {
  const totalSeconds = Math.max(0, Math.floor(frames / FPS));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getStarsText(stars) {
  const count = clampInteger(stars, 0, 3);
  return "★".repeat(count) + "☆".repeat(3 - count);
}

const ACHIEVEMENTS = [
  {
    id: "first-step",
    title: "Первый шаг",
    description: "Пройти любой готовый уровень",
    check: overview => overview.completed >= 1
  },
  {
    id: "coin-hunter",
    title: "Охотник за монетами",
    description: "Собрать все монеты на одном уровне",
    check: overview => overview.allCoinsOnLevel
  },
  {
    id: "no-damage",
    title: "Без урона",
    description: "Пройти уровень, не потеряв жизни",
    check: overview => overview.noDamage
  },
  {
    id: "boss-down",
    title: "Босс повержен",
    description: "Победить любого босса",
    check: overview => overview.bossDefeated
  },
  {
    id: "all-levels",
    title: "Все уровни",
    description: "Пройти все готовые уровни",
    check: overview => overview.completed >= overview.totalLevels
  },
  {
    id: "collector",
    title: "Коллекционер",
    description: "Собрать 50 монет по лучшим прохождениям",
    check: overview => overview.coins >= 50
  },
  {
    id: "fast-step",
    title: "Быстрый шаг",
    description: "Пройти любой уровень быстрее 1:30",
    check: overview => overview.fastLevel
  },
  {
    id: "star-master",
    title: "Звёздный коллекционер",
    description: "Собрать 15 звёзд",
    check: overview => overview.stars >= 15
  }
];

export function getAchievementList() {
  const overview = getProgressOverview();

  return ACHIEVEMENTS.map(achievement => ({
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    unlocked: achievement.check(overview)
  }));
}
