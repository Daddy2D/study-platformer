import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  EDITABLE_SETTINGS,
  SETTINGS,
  SETTINGS_PRESETS,
  applySettingsOverrides,
  clampSettingValue,
  sanitizeSettingsOverrides
} from "../src/core/settings.js";

const gravity = EDITABLE_SETTINGS.find(field => field.key === "gravity");
const maxJumps = EDITABLE_SETTINGS.find(field => field.key === "maxJumps");

describe("clampSettingValue", () => {
  it("обрезает значение по верхней границе", () => {
    expect(clampSettingValue(gravity, 5)).toBe(1.2);
  });

  it("обрезает значение по нижней границе", () => {
    expect(clampSettingValue(gravity, 0)).toBe(0.3);
  });

  it("округление до шага идёт по шагу поля", () => {
    expect(clampSettingValue(gravity, 0.63)).toBe(0.65);
    expect(clampSettingValue(maxJumps, 2.6)).toBe(3);
  });

  it("возвращает обычное значение для пустого ввода", () => {
    expect(clampSettingValue(gravity, "")).toBe(DEFAULT_SETTINGS.gravity);
    expect(clampSettingValue(gravity, "abc")).toBe(DEFAULT_SETTINGS.gravity);
    expect(clampSettingValue(gravity, null)).toBe(DEFAULT_SETTINGS.gravity);
  });
});

describe("sanitizeSettingsOverrides", () => {
  it("оставляет только известные ключи", () => {
    expect(sanitizeSettingsOverrides({ gravity: 1, лунный: true })).toEqual({
      gravity: 1
    });
  });

  it("обрезает значения", () => {
    expect(sanitizeSettingsOverrides({ gravity: 9 })).toEqual({ gravity: 1.2 });
  });

  it("возвращает null для пустых настроек", () => {
    expect(sanitizeSettingsOverrides({})).toBeNull();
    expect(sanitizeSettingsOverrides(null)).toBeNull();
    expect(sanitizeSettingsOverrides("строка")).toBeNull();
  });
});

describe("applySettingsOverrides", () => {
  it("возвращает обычные значения при сбросе", () => {
    applySettingsOverrides({ gravity: 1.2, maxJumps: 1 });
    applySettingsOverrides(null);

    expect(SETTINGS.gravity).toBe(DEFAULT_SETTINGS.gravity);
    expect(SETTINGS.maxJumps).toBe(DEFAULT_SETTINGS.maxJumps);
  });

  it("накладывает настройки поверх обычных", () => {
    applySettingsOverrides({ gravity: 1.2 });

    expect(SETTINGS.gravity).toBe(1.2);
    expect(SETTINGS.jumpForce).toBe(DEFAULT_SETTINGS.jumpForce);

    applySettingsOverrides(null);
  });
});

describe("пресеты настроек", () => {
  it("задают значения в допустимых границах", () => {
    for (const preset of SETTINGS_PRESETS) {
      for (const field of EDITABLE_SETTINGS) {
        if (preset.values[field.key] === undefined) {
          continue;
        }

        expect(preset.values[field.key]).toBeGreaterThanOrEqual(field.min);
        expect(preset.values[field.key]).toBeLessThanOrEqual(field.max);
      }
    }
  });
});
