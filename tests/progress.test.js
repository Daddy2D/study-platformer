import { describe, expect, it } from "vitest";
import {
  calculateLevelStars,
  formatTimeFrames,
  getStarsText
} from "../src/game/progress.js";

function result(overrides) {
  return {
    coins: 0,
    coinsTotal: 0,
    lives: 3,
    startLives: 3,
    ...overrides
  };
}

describe("calculateLevelStars", () => {
  it("даёт три звезды за все монеты и все жизни", () => {
    expect(calculateLevelStars(result({ coins: 5, coinsTotal: 5 }))).toBe(3);
  });

  it("даёт две звезды за все монеты с потерями", () => {
    expect(
      calculateLevelStars(result({ coins: 5, coinsTotal: 5, lives: 2 }))
    ).toBe(2);
  });

  it("даёт две звезды за прохождение без потерь", () => {
    expect(calculateLevelStars(result({ coins: 2, coinsTotal: 5 }))).toBe(2);
  });

  it("даёт одну звезду за обычное прохождение", () => {
    expect(
      calculateLevelStars(result({ coins: 2, coinsTotal: 5, lives: 1 }))
    ).toBe(1);
  });

  it("без монет на уровне три звезды недостижимы", () => {
    // Известное ограничение: allCoins требует coinsTotal > 0
    expect(calculateLevelStars(result({ coins: 0, coinsTotal: 0 }))).toBe(2);
  });
});

describe("formatTimeFrames", () => {
  it("округляет кадры вниз", () => {
    expect(formatTimeFrames(59)).toBe("00:00");
    expect(formatTimeFrames(60)).toBe("00:01");
  });

  it("добавляет ведущие нули", () => {
    expect(formatTimeFrames(9 * 60)).toBe("00:09");
    expect(formatTimeFrames(90 * 60)).toBe("01:30");
  });
});

describe("getStarsText", () => {
  it("рисует три позиции", () => {
    expect(getStarsText(0)).toBe("☆☆☆");
    expect(getStarsText(2)).toBe("★★☆");
    expect(getStarsText(3)).toBe("★★★");
  });

  it("не выходит за пределы трёх звёзд", () => {
    expect(getStarsText(7)).toBe("★★★");
  });
});
