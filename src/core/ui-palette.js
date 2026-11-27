// ============================================
// ПАЛИТРА ИНТЕРФЕЙСА НА КАНВАСЕ
// ============================================
// Канвас не умеет var(--*), поэтому один раз читаем значения
// из docs/design/tokens.css. Источник истины — токены, здесь
// только их имена и запасные значения на случай, если CSS ещё не загрузился.

const TOKENS = {
  bg: "--bg",
  surface: "--surface",
  surfaceWarm: "--surface-warm",
  fg: "--fg",
  fg2: "--fg-2",
  muted: "--muted",
  accent: "--accent",
  accentOn: "--accent-on",
  success: "--success",
  warn: "--warn",
  danger: "--danger",
  border: "--border",
  borderSoft: "--border-soft",
  font: "--font-body"
};

// Запасной набор повторяет friendly из docs/design/tokens.css.
const FALLBACK = {
  bg: "#fff8d7",
  surface: "#ffffff",
  surfaceWarm: "#ffef9f",
  fg: "#1d1836",
  fg2: "#4c426c",
  muted: "#796f91",
  accent: "#ff6b00",
  accentOn: "#ffffff",
  success: "#2e9d57",
  warn: "#ffb020",
  danger: "#e5484d",
  border: "#eadfba",
  borderSoft: "#f5eccd",
  font: "Inter, system-ui, sans-serif"
};

let cache = null;

export function getUiPalette() {
  if (cache) {
    return cache;
  }

  const styles =
    typeof document === "undefined"
      ? null
      : getComputedStyle(document.documentElement);

  cache = {};

  for (const [key, token] of Object.entries(TOKENS)) {
    const value = styles ? styles.getPropertyValue(token).trim() : "";
    cache[key] = value || FALLBACK[key];
  }

  return cache;
}

// Шрифт канваса тоже берём из токенов, чтобы меню совпадало с редактором.
export function uiFont(size, weight = "normal") {
  return `${weight} ${size}px ${getUiPalette().font}`;
}

// Полупрозрачные панели: hex из токена превращаем в rgba.
export function withAlpha(hex, alpha) {
  const value = String(hex).replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map(char => char + char)
          .join("")
      : value;

  if (full.length !== 6) {
    return hex;
  }

  const number = Number.parseInt(full, 16);

  if (Number.isNaN(number)) {
    return hex;
  }

  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
