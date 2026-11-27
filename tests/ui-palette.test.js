import { describe, expect, it } from "vitest";
import { getUiPalette, withAlpha } from "../src/core/ui-palette.js";

describe("withAlpha", () => {
  it("превращает hex в rgba", () => {
    expect(withAlpha("#ff6b00", 0.5)).toBe("rgba(255, 107, 0, 0.5)");
    expect(withAlpha("#fff", 0.9)).toBe("rgba(255, 255, 255, 0.9)");
  });

  it("не трогает значение, которое не удалось разобрать", () => {
    expect(withAlpha("var(--accent)", 0.5)).toBe("var(--accent)");
  });
});

describe("getUiPalette", () => {
  it("без DOM отдаёт запасной набор friendly", () => {
    const palette = getUiPalette();

    expect(palette.bg).toBe("#fff8d7");
    expect(palette.surface).toBe("#ffffff");
    expect(palette.accent).toBe("#ff6b00");
    expect(palette.danger).toBe("#e5484d");
  });
});
