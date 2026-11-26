import { LEVELS, LEVEL_NAMES, LEVEL_BIOMES } from "../data/levels/index.js";
import { countTiles as countLevelTiles, validateLevelRows } from "../core/level-format.js";
import { buildPack, parsePack, sortLevelsByPack } from "../core/level-pack.js";
import { sanitizeSettingsOverrides } from "../core/settings.js";
import {
  normalizeLevelRows,
  sanitizeLevel,
  getCustomLevels,
  getCustomLevel,
  saveCustomLevel,
  deleteCustomLevel,
  saveEditorDraft,
  getEditorDraft,
  clearEditorDraft,
  saveTestLevel,
  getLevelSettings,
  saveLevelSettings
} from "../core/storage.js";

// ============================================
// РЕДАКТОР УРОВНЕЙ
// ============================================
// Карта хранится как массив строк, как в файлах levels/*.js.
// Внутри редактора удобнее массив массивов символов.

const CELL_SIZE = 30;
const MIN_WIDTH = 10;
const MAX_WIDTH = 120;
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 40;
const MAX_UNDO = 80;

// Описание всех клеток: цвет, буква и название для палитры
const TILES = {
  ".": {
    name: "Пусто",
    color: "#ffffff",
    letter: "",
    textColor: "#94a3b8",
    hint: "Свободное место: здесь можно ходить, прыгать и падать."
  },
  "G": {
    name: "Земля",
    color: "#a06a3b",
    letter: "G",
    textColor: "#ffffff",
    hint: "Твёрдая опора: на ней стоят и по ней ходят."
  },
  "P": {
    name: "Старт",
    color: "#2f80ed",
    letter: "P",
    textColor: "#ffffff",
    hint: "Откуда начинает игрок. Нужен ровно один."
  },
  "X": {
    name: "Финиш",
    color: "#27ae60",
    letter: "X",
    textColor: "#ffffff",
    hint: "Флаг, к которому нужно добраться. Без него уровень не пройти."
  },
  "C": {
    name: "Монета",
    color: "#ffd23d",
    letter: "C",
    textColor: "#7a5a00",
    hint: "Собирается по пути и даёт очки."
  },
  "E": {
    name: "Враг",
    color: "#e74c3c",
    letter: "E",
    textColor: "#ffffff",
    hint: "Ходит по платформе и ранит при касании."
  },
  "T": {
    name: "Стрелок",
    color: "#e67e22",
    letter: "T",
    textColor: "#ffffff",
    hint: "Стоит на месте и стреляет, когда видит игрока."
  },
  "S": {
    name: "Шипы",
    color: "#c0392b",
    letter: "S",
    textColor: "#ffffff",
    hint: "Ранит при касании. Ставь на землю."
  },
  "F": {
    name: "Чекпоинт",
    color: "#16a085",
    letter: "F",
    textColor: "#ffffff",
    hint: "Сюда игрок вернётся после урона."
  },
  "M": {
    name: "Платформа →",
    color: "#8e44ad",
    letter: "M",
    textColor: "#ffffff",
    hint: "Ездит влево и вправо и везёт игрока."
  },
  "V": {
    name: "Платформа ↑",
    color: "#6c5ce7",
    letter: "V",
    textColor: "#ffffff",
    hint: "Ездит вверх и вниз и поднимает игрока."
  },
  "K": {
    name: "Ключ",
    color: "#f1c40f",
    letter: "K",
    textColor: "#6b5200",
    hint: "Открывает одну дверь."
  },
  "D": {
    name: "Дверь",
    color: "#8b5a2b",
    letter: "D",
    textColor: "#ffffff",
    hint: "Занимает две клетки вверх, открывается ключом."
  },
  "B": {
    name: "Батут",
    color: "#e74c3c",
    letter: "B",
    textColor: "#ffffff",
    hint: "Высоко подбрасывает игрока. Ставь на землю."
  },
  "L": {
    name: "Падающая",
    color: "#c08a4a",
    letter: "L",
    textColor: "#3f2a14",
    hint: "Дрожит, исчезает и появляется снова."
  },
  "O": {
    name: "Платформа 1-сторонняя",
    color: "#d9a441",
    letter: "O",
    textColor: "#4b2e12",
    hint: "Сверху стоит, снизу и сбоку проходит насквозь."
  },
  "R": {
    name: "Разрушаемый блок",
    color: "#b8793f",
    letter: "R",
    textColor: "#ffffff",
    hint: "Ломается от удара головой снизу."
  },
  "H": {
    name: "Лестница",
    color: "#a06a3b",
    letter: "H",
    textColor: "#ffffff",
    hint: "По ней лазают вверх и вниз стрелками."
  },
  "W": {
    name: "Пила",
    color: "#95a5a6",
    letter: "W",
    textColor: "#1f2937",
    hint: "Ездит и ранит при касании."
  },
  "N": {
    name: "Пушка",
    color: "#6b7280",
    letter: "N",
    textColor: "#ffffff",
    hint: "Стреляет в игрока, когда он близко."
  },
  "Z": {
    name: "Босс",
    color: "#7b2ff7",
    letter: "Z",
    textColor: "#ffffff",
    hint: "Побеждай прыжком на голову. На уровне только один."
  }
};

const PALETTE_ORDER = [
  ".",
  "G",
  "P",
  "X",
  "C",
  "E",
  "T",
  "S",
  "F",
  "M",
  "V",
  "K",
  "D",
  "B",
  "L",
  "O",
  "R",
  "H",
  "W",
  "N",
  "Z"
];

// ---------- Ссылки на элементы страницы ----------

const mapCanvas = document.getElementById("mapCanvas");
const ctx = mapCanvas.getContext("2d");
const mapScroll = document.getElementById("mapScroll");

const levelNameInput = document.getElementById("levelName");
const levelWidthInput = document.getElementById("levelWidth");
const levelHeightInput = document.getElementById("levelHeight");
const biomeSelect = document.getElementById("biomeSelect");
const levelAuthorInput = document.getElementById("levelAuthor");
const levelNoteInput = document.getElementById("levelNote");
const levelPackInput = document.getElementById("levelPack");
const tileHintElement = document.getElementById("tileHint");

const paletteElement = document.getElementById("palette");
const paintTool = document.getElementById("paintTool");
const eraseTool = document.getElementById("eraseTool");
const rectTool = document.getElementById("rectTool");
const selectTool = document.getElementById("selectTool");
const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const templateSelect = document.getElementById("templateSelect");
const templateBtn = document.getElementById("templateBtn");
const miniMap = document.getElementById("miniMap");
const miniCtx = miniMap.getContext("2d");
const jumpStartBtn = document.getElementById("jumpStartBtn");
const jumpFinishBtn = document.getElementById("jumpFinishBtn");

const loadSelect = document.getElementById("loadSelect");
const deleteBtn = document.getElementById("deleteBtn");
const positionElement = document.getElementById("position");
const selectionInfoElement = document.getElementById("selectionInfo");
const statsElement = document.getElementById("stats");
const validationElement = document.getElementById("validation");

const toastElement = document.getElementById("toast");
const importInput = document.getElementById("importInput");

// ---------- Состояние редактора ----------

let grid = [];
let levelId = null;
let levelBiome = "grass";
let levelAuthor = "";
let levelNote = "";
let levelPack = "";
let currentTool = "paint";
let selectedTile = "G";

let undoStack = [];
let redoStack = [];
let strokeStart = null;
let painting = false;
let lastCell = null;
let hoverCell = null;
let dirty = false;
let importedSettings = null;
let toastTimer = null;
let draftTimer = null;
let validationTimer = null;

let selection = null;
let selecting = false;
let rectStart = null;
let rectEnd = null;
let rectErase = false;
let clipboard = null;

// ============================================
// СОЗДАНИЕ И ГЕОМЕТРИЯ КАРТЫ
// ============================================

function createTemplateGrid(width, height) {
  const nextGrid = [];

  for (let y = 0; y < height; y++) {
    nextGrid.push(new Array(width).fill("."));
  }

  // Нижние две строки — земля, чтобы новый уровень сразу можно было играть
  for (let x = 0; x < width; x++) {
    nextGrid[height - 2][x] = "G";
    nextGrid[height - 1][x] = "G";
  }

  nextGrid[height - 3][2] = "P";
  nextGrid[height - 3][width - 3] = "X";

  return nextGrid;
}

function rowsToStrings(source) {
  return source.map(row => row.join(""));
}

function rowsKey(rows) {
  return rows.join("\n");
}

function gridKey(source) {
  return rowsKey(rowsToStrings(source));
}

function snapshotGrid() {
  return rowsToStrings(grid);
}

function resizeCanvasToGrid() {
  mapCanvas.width = grid[0].length * CELL_SIZE;
  mapCanvas.height = grid.length * CELL_SIZE;
}

function normalizeRect(first, second) {
  return {
    x1: Math.min(first.x, second.x),
    y1: Math.min(first.y, second.y),
    x2: Math.max(first.x, second.x),
    y2: Math.max(first.y, second.y)
  };
}

function fillGridRect(target, x1, y1, x2, y2, char) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (target[y] && target[y][x] !== undefined) {
        target[y][x] = char;
      }
    }
  }
}

function scheduleDraftSave() {
  clearTimeout(draftTimer);

  draftTimer = setTimeout(() => {
    saveEditorDraft({
      name: levelNameInput.value,
      rows: rowsToStrings(grid),
      biome: levelBiome,
      author: levelAuthor,
      note: levelNote,
      pack: levelPack,
      levelId: levelId
    });
  }, 500);
}

// ============================================
// ШАБЛОНЫ УРОВНЕЙ
// ============================================

function createPlatformsTemplate() {
  const template = createTemplateGrid(32, 12);

  fillGridRect(template, 8, 8, 12, 8, "G");
  fillGridRect(template, 18, 7, 22, 7, "G");
  fillGridRect(template, 25, 9, 28, 9, "G");

  for (let x = 8; x <= 12; x++) {
    template[7][x] = "C";
  }

  template[6][20] = "C";
  template[6][21] = "C";
  template[9][26] = "C";
  template[9][27] = "C";

  template[9][15] = "E";
  template[9][24] = "S";

  return template;
}

function createSnowTemplate() {
  const template = createTemplateGrid(32, 14);

  fillGridRect(template, 5, 10, 8, 10, "G");
  fillGridRect(template, 12, 8, 15, 8, "G");
  fillGridRect(template, 19, 6, 22, 6, "G");
  fillGridRect(template, 25, 9, 28, 9, "G");

  template[9][6] = "C";
  template[9][7] = "C";
  template[7][13] = "C";
  template[7][14] = "C";
  template[5][20] = "C";
  template[5][21] = "C";
  template[8][26] = "C";
  template[8][27] = "C";

  template[12][9] = "S";
  template[12][18] = "S";
  template[10][23] = "O";
  template[9][24] = "C";

  return template;
}

function createCastleTemplate() {
  const template = createTemplateGrid(32, 14);

  fillGridRect(template, 5, 10, 8, 10, "G");
  fillGridRect(template, 12, 8, 15, 8, "G");
  fillGridRect(template, 19, 6, 22, 6, "G");
  fillGridRect(template, 24, 10, 28, 10, "G");

  template[9][6] = "C";
  template[9][7] = "C";
  template[7][13] = "C";
  template[7][14] = "C";
  template[5][20] = "C";
  template[5][21] = "C";
  template[9][25] = "C";
  template[9][26] = "C";

  template[12][10] = "S";
  template[12][18] = "S";
  template[9][23] = "R";
  template[8][24] = "C";

  return template;
}

function createMechanicsTemplate() {
  const template = createTemplateGrid(40, 16);

  fillGridRect(template, 7, 10, 10, 10, "O");
  fillGridRect(template, 14, 9, 16, 9, "R");
  fillGridRect(template, 15, 8, 15, 8, "R");

  fillGridRect(template, 22, 7, 22, 13, "H");
  fillGridRect(template, 20, 6, 24, 6, "G");
  template[5][21] = "C";
  template[5][22] = "C";
  template[5][23] = "C";

  template[8][28] = "W";
  fillGridRect(template, 31, 12, 34, 12, "G");
  template[11][32] = "N";

  template[13][18] = "F";
  template[12][8] = "C";
  template[12][9] = "C";
  template[11][15] = "C";
  template[7][26] = "C";

  return template;
}

function createTowerTemplate() {
  const template = createTemplateGrid(32, 24);

  // Убираем стандартный финиш и поднимаем его наверх.
  template[21][29] = ".";

  fillGridRect(template, 5, 18, 8, 18, "G");
  fillGridRect(template, 11, 15, 14, 15, "G");
  fillGridRect(template, 18, 12, 21, 12, "G");
  fillGridRect(template, 24, 9, 27, 9, "G");
  fillGridRect(template, 19, 6, 22, 6, "G");
  fillGridRect(template, 26, 3, 30, 3, "G");

  template[2][29] = "X";
  template[11][19] = "F";
  template[5][21] = "C";
  template[5][20] = "C";
  template[8][25] = "C";
  template[8][26] = "C";
  template[17][6] = "E";
  template[14][12] = "E";
  template[21][16] = "S";

  return template;
}

function createCaveTemplate() {
  const template = createTemplateGrid(40, 18);

  fillGridRect(template, 5, 14, 9, 14, "G");
  fillGridRect(template, 13, 11, 17, 11, "G");
  fillGridRect(template, 21, 8, 25, 8, "G");
  fillGridRect(template, 29, 5, 34, 5, "G");
  fillGridRect(template, 34, 12, 37, 12, "G");

  template[13][8] = "T";
  template[10][15] = "T";
  template[7][23] = "T";
  template[4][32] = "E";
  template[15][7] = "S";
  template[15][12] = "S";
  template[15][22] = "S";
  template[13][9] = "C";
  template[10][16] = "C";
  template[7][24] = "C";
  template[4][31] = "C";

  return template;
}

function createBossTemplate() {
  const template = createTemplateGrid(32, 14);

  fillGridRect(template, 7, 9, 10, 9, "G");
  fillGridRect(template, 21, 9, 24, 9, "G");
  fillGridRect(template, 13, 7, 16, 7, "G");

  template[11][16] = "Z";
  template[8][9] = "C";
  template[8][10] = "C";
  template[8][22] = "C";
  template[8][23] = "C";
  template[10][3] = "F";

  return template;
}

const TEMPLATES = {
  empty: {
    label: "Пустой уровень",
    build: () => createTemplateGrid(24, 12)
  },
  platforms: {
    label: "Платформы и монеты",
    build: createPlatformsTemplate
  },
  snow: {
    label: "Снежные вершины",
    biome: "snow",
    build: createSnowTemplate
  },
  castle: {
    label: "Каменный замок",
    biome: "castle",
    build: createCastleTemplate
  },
  mechanics: {
    label: "Новые механики",
    build: createMechanicsTemplate
  },
  tower: {
    label: "Высокая башня",
    build: createTowerTemplate
  },
  cave: {
    label: "Пещера со стрелками",
    build: createCaveTemplate
  },
  boss: {
    label: "Арена босса",
    build: createBossTemplate
  }
};

function buildTemplateOptions() {
  templateSelect.innerHTML = "";

  for (const [id, template] of Object.entries(TEMPLATES)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = template.label;
    templateSelect.appendChild(option);
  }

  templateSelect.value = "empty";
}

function applyTemplate() {
  const template = TEMPLATES[templateSelect.value];

  if (!template) {
    return;
  }

  if (
    dirty &&
    !confirm("Текущая карта будет заменена шаблоном. Продолжить?")
  ) {
    return;
  }

  undoStack = [];
  redoStack = [];
  levelId = null;

  applyGrid(
    rowsToStrings(template.build()),
    template.label,
    null,
    true,
    template.biome || "grass",
    levelAuthor,
    levelNote,
    levelPack
  );

  loadSelect.value = "";
  updateUndoButtons();
  updateDeleteButton();
  showToast(`Шаблон «${template.label}» создан.`, "success");
}

// ============================================
// МИНИ-КАРТА
// ============================================

function scrollToCell(x, y) {
  const scrollX = x * CELL_SIZE - mapScroll.clientWidth / 2;
  const scrollY = y * CELL_SIZE - mapScroll.clientHeight / 2;

  mapScroll.scrollLeft = Math.max(0, scrollX);
  mapScroll.scrollTop = Math.max(0, scrollY);
  drawMiniMap();
}

function drawMiniMap() {
  if (!grid.length || !grid[0]) {
    return;
  }

  const width = miniMap.width;
  const height = miniMap.height;
  const columns = grid[0].length;
  const rows = grid.length;
  const scaleX = width / columns;
  const scaleY = height / rows;

  miniCtx.clearRect(0, 0, width, height);
  miniCtx.fillStyle = "#ffffff";
  miniCtx.fillRect(0, 0, width, height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const char = grid[y][x];

      if (char === ".") {
        continue;
      }

      const info = TILES[char] || TILES["."];
      miniCtx.fillStyle = info.color;
      miniCtx.fillRect(
        Math.floor(x * scaleX),
        Math.floor(y * scaleY),
        Math.ceil(scaleX),
        Math.ceil(scaleY)
      );
    }
  }

  const viewX = (mapScroll.scrollLeft / CELL_SIZE) * scaleX;
  const viewY = (mapScroll.scrollTop / CELL_SIZE) * scaleY;
  const viewW = (mapScroll.clientWidth / CELL_SIZE) * scaleX;
  const viewH = (mapScroll.clientHeight / CELL_SIZE) * scaleY;

  miniCtx.strokeStyle = "#2f80ed";
  miniCtx.lineWidth = 2;
  miniCtx.strokeRect(
    Math.max(1, viewX),
    Math.max(1, viewY),
    Math.max(4, Math.min(width - viewX - 2, viewW)),
    Math.max(4, Math.min(height - viewY - 2, viewH))
  );
}

// ============================================
// РИСОВАНИЕ КАРТЫ
// ============================================

function drawMap() {
  const width = mapCanvas.width;
  const height = mapCanvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const char = grid[y][x];
      const info = TILES[char] || TILES["."];
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;

      ctx.fillStyle = info.color;
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

      // Лёгкая фактура земли
      if (char === "G") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        ctx.fillRect(px, py, CELL_SIZE, 5);
      }

      ctx.strokeStyle = "rgba(31, 41, 55, 0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

      if (info.letter) {
        ctx.fillStyle = info.textColor;
        ctx.font = "bold 14px Arial";
        ctx.fillText(info.letter, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 1);
      }
    }
  }

  if (selection) {
    ctx.fillStyle = "rgba(47, 128, 237, 0.16)";
    ctx.fillRect(
      selection.x1 * CELL_SIZE,
      selection.y1 * CELL_SIZE,
      (selection.x2 - selection.x1 + 1) * CELL_SIZE,
      (selection.y2 - selection.y1 + 1) * CELL_SIZE
    );

    ctx.strokeStyle = "#2f80ed";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      selection.x1 * CELL_SIZE + 1.5,
      selection.y1 * CELL_SIZE + 1.5,
      (selection.x2 - selection.x1 + 1) * CELL_SIZE - 3,
      (selection.y2 - selection.y1 + 1) * CELL_SIZE - 3
    );
  }

  if (painting && currentTool === "rect" && rectStart && rectEnd) {
    const preview = normalizeRect(rectStart, rectEnd);

    ctx.fillStyle = "rgba(47, 128, 237, 0.22)";
    ctx.fillRect(
      preview.x1 * CELL_SIZE,
      preview.y1 * CELL_SIZE,
      (preview.x2 - preview.x1 + 1) * CELL_SIZE,
      (preview.y2 - preview.y1 + 1) * CELL_SIZE
    );

    ctx.strokeStyle = "#1c5fc0";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      preview.x1 * CELL_SIZE + 1,
      preview.y1 * CELL_SIZE + 1,
      (preview.x2 - preview.x1 + 1) * CELL_SIZE - 2,
      (preview.y2 - preview.y1 + 1) * CELL_SIZE - 2
    );
  }

  if (currentTool === "paste" && clipboard && hoverCell) {
    ctx.globalAlpha = 0.55;

    for (let y = 0; y < clipboard.h; y++) {
      for (let x = 0; x < clipboard.w; x++) {
        const targetX = hoverCell.x + x;
        const targetY = hoverCell.y + y;

        if (
          targetY < 0 ||
          targetY >= grid.length ||
          targetX < 0 ||
          targetX >= grid[0].length
        ) {
          continue;
        }

        const char = clipboard.rows[y][x];
        const info = TILES[char] || TILES["."];

        ctx.fillStyle = info.color;
        ctx.fillRect(
          targetX * CELL_SIZE,
          targetY * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#2f80ed";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      hoverCell.x * CELL_SIZE + 1,
      hoverCell.y * CELL_SIZE + 1,
      clipboard.w * CELL_SIZE - 2,
      clipboard.h * CELL_SIZE - 2
    );
  }

  if (hoverCell) {
    ctx.strokeStyle = "#2f80ed";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      hoverCell.x * CELL_SIZE + 1.5,
      hoverCell.y * CELL_SIZE + 1.5,
      CELL_SIZE - 3,
      CELL_SIZE - 3
    );
  }
}

// ============================================
// КЛЕТКИ И РИСОВАНИЕ МЫШЬЮ
// ============================================

function clearTile(char) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === char) {
        grid[y][x] = ".";
      }
    }
  }
}

// Старт и финиш должны быть в единственном экземпляре
function paintCell(x, y, char) {
  if (grid[y][x] === char) {
    return false;
  }

  if (char === "P" || char === "X") {
    clearTile(char);
  }

  grid[y][x] = char;
  return true;
}

function cellFromEvent(event) {
  const rect = mapCanvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  const scaleX = mapCanvas.width / rect.width;
  const scaleY = mapCanvas.height / rect.height;

  const x = Math.floor(((event.clientX - rect.left) * scaleX) / CELL_SIZE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / CELL_SIZE);

  if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length) {
    return null;
  }

  return { x: x, y: y };
}

function plotLine(x0, y0, x1, y1, callback) {
  let x = x0;
  let y = y0;

  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;

  let error = dx + dy;

  while (true) {
    callback(x, y);

    if (x === x1 && y === y1) {
      break;
    }

    const doubleError = 2 * error;

    if (doubleError >= dy) {
      error += dy;
      x += sx;
    }

    if (doubleError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function paintAt(cell, char) {
  let changed = false;

  if (lastCell) {
    plotLine(lastCell.x, lastCell.y, cell.x, cell.y, (x, y) => {
      if (paintCell(x, y, char)) {
        changed = true;
      }
    });
  } else if (paintCell(cell.x, cell.y, char)) {
    changed = true;
  }

  lastCell = cell;

  if (changed) {
    drawMap();
    updateStats();
    scheduleValidation();
  }
}

function beginStroke() {
  strokeStart = snapshotGrid();
  painting = true;
  lastCell = null;
}

function endStroke() {
  if (!painting) {
    return;
  }

  painting = false;
  lastCell = null;

  if (strokeStart && rowsKey(strokeStart) !== gridKey(grid)) {
    undoStack.push(strokeStart);

    if (undoStack.length > MAX_UNDO) {
      undoStack.shift();
    }

    redoStack = [];
    dirty = true;
    updateUndoButtons();
    scheduleDraftSave();
    updateValidation();
    drawMiniMap();
  }

  strokeStart = null;
}

function updateSelectionInfo() {
  if (!selection) {
    selectionInfoElement.textContent = "";
    return;
  }

  const width = selection.x2 - selection.x1 + 1;
  const height = selection.y2 - selection.y1 + 1;

  selectionInfoElement.textContent = `Выделение: ${width} × ${height}`;
}

function updateSelectionButtons() {
  copyBtn.disabled = !selection;
  pasteBtn.disabled = !clipboard;
}

function clearSelectionState() {
  selection = null;
  selecting = false;
  rectStart = null;
  rectEnd = null;
  updateSelectionInfo();
  updateSelectionButtons();
}

function copySelection() {
  if (!selection) {
    return;
  }

  const width = selection.x2 - selection.x1 + 1;
  const height = selection.y2 - selection.y1 + 1;
  const rows = [];

  for (let y = selection.y1; y <= selection.y2; y++) {
    rows.push(grid[y].slice(selection.x1, selection.x2 + 1));
  }

  clipboard = { w: width, h: height, rows: rows };
  updateSelectionButtons();
  showToast(`Скопировано: ${width} × ${height}.`, "success");
  drawMap();
}

function deleteSelection() {
  if (!selection) {
    return;
  }

  beginStroke();

  for (let y = selection.y1; y <= selection.y2; y++) {
    for (let x = selection.x1; x <= selection.x2; x++) {
      paintCell(x, y, ".");
    }
  }

  endStroke();
  selection = null;
  updateSelectionInfo();
  updateSelectionButtons();
  drawMap();
  updateStats();
  updateValidation();
}

function cutSelection() {
  if (!selection) {
    return;
  }

  copySelection();
  deleteSelection();
}

function enterPasteMode() {
  if (!clipboard) {
    return;
  }

  setTool("paste");
  showToast("Кликни по карте, чтобы вставить. Esc — выйти.", "success");
  drawMap();
}

function pasteClipboard(anchor) {
  if (!clipboard) {
    return;
  }

  let changed = false;

  for (let y = 0; y < clipboard.h; y++) {
    for (let x = 0; x < clipboard.w; x++) {
      const targetX = anchor.x + x;
      const targetY = anchor.y + y;

      if (
        targetY < 0 ||
        targetY >= grid.length ||
        targetX < 0 ||
        targetX >= grid[0].length
      ) {
        continue;
      }

      if (paintCell(targetX, targetY, clipboard.rows[y][x])) {
        changed = true;
      }
    }
  }

  if (changed) {
    drawMap();
    updateStats();
    updateValidation();
  }
}

function applyRectFill() {
  if (!rectStart || !rectEnd) {
    return;
  }

  const rect = normalizeRect(rectStart, rectEnd);
  const char = rectErase ? "." : selectedTile;
  let changed = false;

  for (let y = rect.y1; y <= rect.y2; y++) {
    for (let x = rect.x1; x <= rect.x2; x++) {
      if (paintCell(x, y, char)) {
        changed = true;
      }
    }
  }

  rectStart = null;
  rectEnd = null;

  if (changed) {
    drawMap();
    updateStats();
    scheduleValidation();
  }
}

mapCanvas.addEventListener("pointerdown", event => {
  if (event.button !== 0 && event.button !== 2) {
    return;
  }

  event.preventDefault();

  const cell = cellFromEvent(event);

  if (!cell) {
    return;
  }

  mapCanvas.setPointerCapture(event.pointerId);

  if (currentTool === "select") {
    if (event.button === 2) {
      selection = null;
      updateSelectionInfo();
      updateSelectionButtons();
      drawMap();
      return;
    }

    selecting = true;
    selection = {
      x1: cell.x,
      y1: cell.y,
      x2: cell.x,
      y2: cell.y
    };
    updateSelectionInfo();
    updateSelectionButtons();
    drawMap();
    return;
  }

  if (currentTool === "paste" && clipboard) {
    if (event.button === 2) {
      setTool("paint");
      return;
    }

    beginStroke();
    pasteClipboard(cell);
    endStroke();
    return;
  }

  if (currentTool === "rect") {
    beginStroke();
    rectStart = { x: cell.x, y: cell.y };
    rectEnd = { x: cell.x, y: cell.y };
    rectErase = event.button === 2;
    drawMap();
    return;
  }

  beginStroke();

  const char =
    event.button === 2 || currentTool === "erase" ? "." : selectedTile;

  paintAt(cell, char);
});

mapCanvas.addEventListener("pointermove", event => {
  const cell = cellFromEvent(event);

  hoverCell = cell;
  updatePosition(cell);

  if (selecting && cell) {
    selection.x2 = cell.x;
    selection.y2 = cell.y;
    updateSelectionInfo();
  } else if (painting && currentTool === "rect" && cell) {
    rectEnd = { x: cell.x, y: cell.y };
  } else if (
    painting &&
    (currentTool === "paint" || currentTool === "erase")
  ) {
    if (!cell) {
      lastCell = null;
    } else {
      paintAt(cell, currentTool === "erase" ? "." : selectedTile);
    }
  }

  drawMap();
});

mapCanvas.addEventListener("pointerup", () => {
  if (selecting) {
    selecting = false;
    updateSelectionButtons();
    drawMap();
    return;
  }

  if (painting && currentTool === "rect") {
    applyRectFill();
    endStroke();
    drawMap();
    return;
  }

  endStroke();
});

mapCanvas.addEventListener("pointercancel", () => {
  if (selecting) {
    selecting = false;
    updateSelectionButtons();
  }

  if (painting && currentTool === "rect") {
    rectStart = null;
    rectEnd = null;
  }

  endStroke();
  drawMap();
});

mapCanvas.addEventListener("pointerleave", () => {
  if (!painting && !selecting) {
    hoverCell = null;
    updatePosition(null);
    drawMap();
  }
});

mapCanvas.addEventListener("contextmenu", event => {
  event.preventDefault();
});

// ============================================
// ПАЛИТРА И ИНСТРУМЕНТЫ
// ============================================

function buildPalette() {
  paletteElement.innerHTML = "";

  for (const char of PALETTE_ORDER) {
    const info = TILES[char];

    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-item";
    button.dataset.tile = char;
    button.title = info.name;

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.textContent = info.letter || "·";

    // У пустой клетки белый фон — делаем рамку темнее
    swatch.style.background = info.color;
    swatch.style.color = info.textColor;

    if (char === ".") {
      swatch.style.borderColor = "#94a3b8";
      swatch.style.textShadow = "none";
    }

    const name = document.createElement("span");
    name.className = "palette-name";
    name.textContent = info.name;

    button.appendChild(swatch);
    button.appendChild(name);

    button.addEventListener("click", () => {
      selectedTile = char;
      setTool("paint");
      updateTileHint();
    });

    paletteElement.appendChild(button);
  }

  updatePaletteActive();
  updateTileHint();
}

// Подсказка про выбранную клетку: название и что она делает.
function updateTileHint() {
  const info = TILES[selectedTile] || TILES["."];

  if (!tileHintElement) {
    return;
  }

  tileHintElement.textContent =
    `${info.letter || "·"} — ${info.name}. ${info.hint}`;
}

function updatePaletteActive() {
  const items = paletteElement.querySelectorAll(".palette-item");

  for (const item of items) {
    const active =
      (currentTool === "paint" || currentTool === "rect") &&
      item.dataset.tile === selectedTile;

    item.classList.toggle("active", active);
  }
}

function setTool(tool) {
  currentTool = tool;

  if (tool !== "select") {
    selection = null;
    selecting = false;
    updateSelectionInfo();
    updateSelectionButtons();
  }

  paintTool.classList.toggle("active", tool === "paint");
  eraseTool.classList.toggle("active", tool === "erase");
  rectTool.classList.toggle("active", tool === "rect");
  selectTool.classList.toggle("active", tool === "select");
  pasteBtn.classList.toggle("active", tool === "paste");

  updatePaletteActive();
  updatePosition(hoverCell);
  drawMap();
}

function updatePosition(cell) {
  if (!cell) {
    positionElement.textContent = "Клетка: —";
    return;
  }

  const char = grid[cell.y] ? grid[cell.y][cell.x] : ".";
  const info = TILES[char] || TILES["."];

  positionElement.textContent =
    `Клетка: ${cell.x + 1}, ${cell.y + 1} — ${info.name}`;
}

paintTool.addEventListener("click", () => setTool("paint"));
eraseTool.addEventListener("click", () => setTool("erase"));
rectTool.addEventListener("click", () => setTool("rect"));
selectTool.addEventListener("click", () => setTool("select"));

copyBtn.addEventListener("click", copySelection);
pasteBtn.addEventListener("click", enterPasteMode);
templateBtn.addEventListener("click", applyTemplate);

miniMap.addEventListener("pointerdown", event => {
  if (!grid.length || !grid[0]) {
    return;
  }

  const rect = miniMap.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return;
  }

  const x = Math.floor(
    ((event.clientX - rect.left) / rect.width) * grid[0].length
  );

  const y = Math.floor(
    ((event.clientY - rect.top) / rect.height) * grid.length
  );

  scrollToCell(
    Math.max(0, Math.min(grid[0].length - 1, x)),
    Math.max(0, Math.min(grid.length - 1, y))
  );
});

jumpStartBtn.addEventListener("click", () => {
  const start = findTile("P");

  if (start) {
    scrollToCell(start.x, start.y);
  }
});

jumpFinishBtn.addEventListener("click", () => {
  const finish = findTile("X");

  if (finish) {
    scrollToCell(finish.x, finish.y);
  }
});

mapScroll.addEventListener("scroll", drawMiniMap);
window.addEventListener("resize", drawMiniMap);

// ============================================
// ПРОВЕРКА УРОВНЯ
// ============================================

function findTile(char) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === char) {
        return { x: x, y: y };
      }
    }
  }

  return null;
}

function gridRows() {
  return rowsToStrings(grid);
}

function validateLevel() {
  return validateLevelRows(gridRows());
}

function updateStats() {
  const counts = countLevelTiles(gridRows());
  const width = grid[0] ? grid[0].length : 0;

  statsElement.textContent =
    `${width} × ${grid.length}` +
    ` · монет: ${counts.C || 0}` +
    ` · врагов: ${(counts.E || 0) + (counts.T || 0)}`;
}

// При рисовании проверяем с задержкой: полная проверка
// с достижимостью на каждую клетку тормозит большие карты.
function scheduleValidation() {
  clearTimeout(validationTimer);

  validationTimer = setTimeout(updateValidation, 150);
}

function updateValidation() {
  const result = validateLevel();

  validationElement.classList.remove("ok", "warn", "error");

  if (result.errors.length > 0) {
    validationElement.classList.add("error");
    validationElement.textContent = "Проверка: " + result.errors.join("; ");
    return;
  }

  if (result.warnings.length > 0) {
    validationElement.classList.add("warn");
    validationElement.textContent = "Проверка: " + result.warnings.join("; ");
    return;
  }

  validationElement.classList.add("ok");
  validationElement.textContent = "Проверка: всё хорошо";
}

// ============================================
// ЗАГРУЗКА, СОХРАНЕНИЕ, ТЕСТ
// ============================================

function applyGrid(rows, name, id, markDirty, biome, author, note, pack) {
  const cleanRows = normalizeLevelRows(rows);

  if (!cleanRows) {
    showToast("Карта не подходит: нужны строки одной длины (от 8 до 120 клеток).", "error");
    return false;
  }

  grid = cleanRows.map(row => row.split(""));

  levelId = id || null;
  levelBiome = biome === "snow" || biome === "castle"
    ? biome
    : "grass";
  levelAuthor = typeof author === "string" ? author : "";
  levelNote = typeof note === "string" ? note : "";
  levelPack = typeof pack === "string" ? pack : "";

  levelAuthorInput.value = levelAuthor;
  levelNoteInput.value = levelNote;
  levelPackInput.value = levelPack;
  biomeSelect.value = levelBiome;
  importedSettings = null;
  levelNameInput.value = name || "Мой уровень";

  levelWidthInput.value = grid[0].length;
  levelHeightInput.value = grid.length;

  resizeCanvasToGrid();
  drawMap();
  updateStats();
  updateValidation();
  updateUndoButtons();
  updateDeleteButton();
  updatePosition(null);
  clearSelectionState();
  drawMiniMap();
  scheduleDraftSave();

  dirty = Boolean(markDirty);

  return true;
}

function resetToNewLevel(askFirst, quiet) {
  if (
    askFirst &&
    dirty &&
    !confirm("Несохранённые изменения будут потеряны. Создать новый уровень?")
  ) {
    return;
  }

  const template = createTemplateGrid(24, 12);

  undoStack = [];
  redoStack = [];
  levelId = null;
  clearEditorDraft();

  applyGrid(rowsToStrings(template), "Мой уровень", null, false, "grass", "", "", "");

  loadSelect.value = "";
  updateUndoButtons();

  if (!quiet) {
    showToast("Новый уровень создан");
  }
}

function refreshLoadOptions(selectedValue) {
  const previous = selectedValue === undefined ? loadSelect.value : selectedValue;

  loadSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "— выбери уровень —";
  loadSelect.appendChild(placeholder);

  const builtinGroup = document.createElement("optgroup");
  builtinGroup.label = "Готовые уровни";

  LEVELS.forEach((rows, index) => {
    const option = document.createElement("option");
    option.value = `builtin:${index}`;
    option.textContent = `${index + 1}. ${LEVEL_NAMES[index]}`;
    builtinGroup.appendChild(option);
  });

  loadSelect.appendChild(builtinGroup);

  const customLevels = getCustomLevels();
  const customGroup = document.createElement("optgroup");
  customGroup.label = "Мои уровни";

  if (customLevels.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Пока нет сохранённых уровней";
    option.disabled = true;
    customGroup.appendChild(option);
  } else {
    for (const level of customLevels) {
      const option = document.createElement("option");
      option.value = `custom:${level.id}`;
      option.textContent = level.pack ? `${level.pack} — ${level.name}` : level.name;
      customGroup.appendChild(option);
    }
  }

  loadSelect.appendChild(customGroup);

  const hasPrevious = Array.from(loadSelect.options).some(
    option => option.value === previous
  );

  loadSelect.value = hasPrevious ? previous : "";
}

function loadSelectedLevel() {
  const value = loadSelect.value;

  if (!value) {
    showToast("Сначала выбери уровень в списке.", "error");
    return;
  }

  if (value.startsWith("builtin:")) {
    const index = Number(value.split(":")[1]);
    const rows = normalizeLevelRows(LEVELS[index]);

    if (!rows) {
      showToast("Не удалось прочитать готовый уровень.", "error");
      return;
    }

    if (dirty && !confirm("Несохранённые изменения будут потеряны. Загрузить уровень?")) {
      return;
    }

    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    const name = `${LEVEL_NAMES[index]} (копия)`;

    applyGrid(
      rows,
      name,
      null,
      true,
      LEVEL_BIOMES[index] || "grass",
      "",
      "",
      ""
    );
    showToast("Готовый уровень загружен. «Сохранить» создаст твою копию.");
    return;
  }

  if (value.startsWith("custom:")) {
    const id = value.slice("custom:".length);
    const level = getCustomLevel(id);

    if (!level) {
      showToast("Уровень не найден. Обнови список.", "error");
      refreshLoadOptions("");
      return;
    }

    if (dirty && !confirm("Несохранённые изменения будут потеряны. Загрузить уровень?")) {
      return;
    }

    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    applyGrid(
      level.rows,
      level.name,
      level.id,
      false,
      level.biome || "grass",
      level.author,
      level.note,
      level.pack
    );
    showToast(`Загружен уровень «${level.name}».`);
  }
}

function saveCurrentLevel() {
  const result = validateLevel();

  if (result.errors.length > 0) {
    updateValidation();
    showToast("Нельзя сохранить: " + result.errors.join("; "), "error");
    return;
  }

  const name = levelNameInput.value.trim() || "Мой уровень";
  const rows = rowsToStrings(grid);

  const saved = saveCustomLevel({
    id: levelId,
    name: name,
    rows: rows,
    biome: levelBiome,
    author: levelAuthor,
    note: levelNote,
    pack: levelPack
  });

  if (!saved) {
    showToast("Не удалось сохранить уровень в браузере. Проверь настройки.", "error");
    return;
  }

  levelId = saved.id;
  levelNameInput.value = saved.name;
  levelAuthor = saved.author;
  levelNote = saved.note;
  levelPack = saved.pack;
  levelAuthorInput.value = saved.author;
  levelNoteInput.value = saved.note;
  levelPackInput.value = saved.pack;
  dirty = false;

  if (draftTimer) {
    clearTimeout(draftTimer);
    draftTimer = null;
  }

  clearEditorDraft();
  updateSelectionButtons();

  // Настройки, пришедшие вместе с импортированным JSON,
  // привязываем к новому id уровня.
  if (importedSettings) {
    saveLevelSettings(`custom:${saved.id}`, importedSettings);
    importedSettings = null;
  }

  refreshLoadOptions(`custom:${saved.id}`);
  updateDeleteButton();

  if (result.warnings.length > 0) {
    showToast("Сохранено, но есть замечания: " + result.warnings.join("; "), "warn");
  } else if (!saved.author) {
    showToast(
      `Уровень «${saved.name}» сохранён без автора: впиши ник, чтобы его увидели в списке.`,
      "warn"
    );
  } else {
    showToast(`Уровень «${saved.name}» сохранён.`, "success");
  }
}

function testCurrentLevel() {
  const result = validateLevel();

  if (result.errors.length > 0) {
    updateValidation();
    showToast("Перед проверкой исправь: " + result.errors.join("; "), "error");
    return;
  }

  const name = levelNameInput.value.trim() || "Проверка уровня";
  const rows = rowsToStrings(grid);

  if (!saveTestLevel({ name: name, rows: rows, biome: levelBiome, author: levelAuthor, note: levelNote, pack: levelPack })) {
    showToast("Не удалось подготовить уровень к проверке.", "error");
    return;
  }

  const testWindow = window.open("index.html?test=1", "_blank");

  if (!testWindow) {
    // Некоторые браузеры не открывают файл из файла в новой вкладке:
    // тогда проверяем здесь же (черновик уже сохранён).
    showToast("Открываю проверку в этой вкладке.", "warn");
    window.location.href = "index.html?test=1";
    return;
  }

  showToast("Проверка открыта в новой вкладке.", "success");
}

// ============================================
// ОТМЕНА И ВОЗВРАТ
// ============================================

function updateUndoButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function undo() {
  if (undoStack.length === 0) {
    return;
  }

  redoStack.push(snapshotGrid());

  const previous = undoStack.pop();

  applyGrid(
    previous,
    levelNameInput.value,
    levelId,
    true,
    levelBiome,
    levelAuthor,
    levelNote,
    levelPack
  );
  showToast("Действие отменено");
}

function redo() {
  if (redoStack.length === 0) {
    return;
  }

  undoStack.push(snapshotGrid());

  const next = redoStack.pop();

  applyGrid(
    next,
    levelNameInput.value,
    levelId,
    true,
    levelBiome,
    levelAuthor,
    levelNote,
    levelPack
  );
  showToast("Действие возвращено");
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// ============================================
// РАЗМЕР, НОВЫЙ, УДАЛЕНИЕ
// ============================================

function applyResize() {
  const width = Math.round(
    Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(levelWidthInput.value) || 24))
  );

  const height = Math.round(
    Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Number(levelHeightInput.value) || 12))
  );

  const oldWidth = grid[0].length;
  const oldHeight = grid.length;

  if (width === oldWidth && height === oldHeight) {
    showToast("Размер не изменился.");
    return;
  }

  const before = snapshotGrid();
  const nextGrid = [];

  for (let y = 0; y < height; y++) {
    const row = new Array(width).fill(".");

    for (let x = 0; x < width; x++) {
      if (y < oldHeight && x < oldWidth) {
        row[x] = grid[y][x];
      }
    }

    nextGrid.push(row);
  }

  grid = nextGrid;

  undoStack.push(before);
  redoStack = [];

  levelWidthInput.value = width;
  levelHeightInput.value = height;

  resizeCanvasToGrid();
  drawMap();
  updateStats();
  updateValidation();
  updateUndoButtons();
  updatePosition(null);
  clearSelectionState();
  drawMiniMap();
  scheduleDraftSave();

  dirty = true;

  showToast(`Новый размер: ${width} × ${height}`);
}

function updateDeleteButton() {
  deleteBtn.disabled = !(levelId && getCustomLevel(levelId));
}

function deleteCurrentLevel() {
  if (!levelId) {
    return;
  }

  const level = getCustomLevel(levelId);

  if (!level) {
    updateDeleteButton();
    return;
  }

  if (!confirm(`Удалить уровень «${level.name}» из браузера?`)) {
    return;
  }

  if (!deleteCustomLevel(levelId)) {
    showToast("Не удалось удалить уровень.", "error");
    return;
  }

  levelId = null;
  dirty = true;

  refreshLoadOptions("");
  updateDeleteButton();

  showToast("Уровень удалён. Нажми «Сохранить», если хочешь вернуть его.", "success");
}

// ============================================
// ЭКСПОРТ И ИМПОРТ JSON
// ============================================

function safeFileName(name) {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Zа-яА-Я0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned || "level";
}

function exportCurrentLevel() {
  const name = levelNameInput.value.trim() || "Мой уровень";

  const data = {
    version: 1,
    name: name,
    biome: levelBiome,
    author: levelAuthor,
    note: levelNote,
    pack: levelPack,
    rows: rowsToStrings(grid),
    updatedAt: Date.now()
  };

  if (levelId) {
    const settings = getLevelSettings(`custom:${levelId}`);

    if (settings) {
      data.settings = settings;
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFileName(name)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast("Файл JSON скачан.", "success");
}

function exportPack() {
  const levels = sortLevelsByPack(getCustomLevels());

  if (levels.length === 0) {
    showToast("Своих уровней пока нет — пак будет пустым.", "error");
    return;
  }

  if (!confirm(`В пак попадут все свои уровни (${levels.length}). Скачать?`)) {
    return;
  }

  const entries = levels.map(level => ({
    ...level,
    settings: getLevelSettings(`custom:${level.id}`)
  }));

  const pack = buildPack(entries, "Мои уровни", "");
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFileName(pack.name)}_pack.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast(`Пак из ${entries.length} уровней скачан.`, "success");
}

function importFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let data;

    try {
      data = JSON.parse(String(reader.result));
    } catch {
      showToast("Это не JSON-файл уровня.", "error");
      return;
    }

    if (dirty && !confirm("Несохранённые изменения будут потеряны. Загрузить файл?")) {
      return;
    }

    // Пак: { type: "pack", levels: [...] } или просто массив уровней
    const isPack =
      Array.isArray(data) ||
      (data && Array.isArray(data.levels));

    if (isPack) {
      const { pack, errors } = parsePack(data);

      if (!pack) {
        showToast(
          "В файле нет подходящих уровней. " + errors.join("; "),
          "error"
        );
        return;
      }

      const existing = getCustomLevels();
      const saved = [];
      let skipped = 0;

      for (const [index, item] of pack.levels.entries()) {
        const duplicate = existing.some(
          level =>
            level.name === item.name &&
            level.rows.join("\n") === item.rows.join("\n")
        );

        if (duplicate) {
          skipped += 1;
          continue;
        }

        const level = saveCustomLevel({
          name: item.name,
          rows: item.rows,
          biome: item.biome,
          author: item.author,
          note: item.note,
          pack: item.pack || pack.name,
          order: Number.isInteger(item.order) ? item.order : index,
          imported: true
        });

        if (!level) {
          skipped += 1;
          continue;
        }

        if (item.settings) {
          saveLevelSettings(`custom:${level.id}`, item.settings);
        }

        saved.push(level);
      }

      if (saved.length === 0) {
        showToast(
          `Пак «${pack.name}» не добавлен: нет новых уровней. ` +
            `Пропущено: ${skipped + errors.length}.`,
          "warn"
        );
        return;
      }

      undoStack = [];
      redoStack = [];
      refreshLoadOptions(`custom:${saved[0].id}`);

      applyGrid(
        saved[0].rows,
        saved[0].name,
        saved[0].id,
        false,
        saved[0].biome || "grass",
        saved[0].author,
        saved[0].note,
        saved[0].pack
      );
      loadSelect.value = `custom:${saved[0].id}`;
      updateUndoButtons();

      const problems = skipped + errors.length;

      showToast(
        `Пак «${pack.name}»: добавлено уровней — ${saved.length}` +
          (problems > 0
            ? `, пропущено ${problems} (уже есть или не читаются).`
            : "."),
        problems > 0 ? "warn" : "success"
      );
      return;
    }

    const clean = sanitizeLevel(data);

    if (!clean) {
      showToast("В файле нет подходящей карты уровня.", "error");
      return;
    }

    undoStack = [];
    redoStack = [];

    applyGrid(
      clean.rows,
      clean.name,
      null,
      true,
      clean.biome || "grass",
      clean.author,
      clean.note,
      clean.pack
    );
    importedSettings = sanitizeSettingsOverrides(data && data.settings);
    loadSelect.value = "";

    updateUndoButtons();
    showToast(`Уровень «${clean.name}» загружен из файла.`, "success");
  };

  reader.onerror = () => {
    showToast("Не удалось прочитать файл.", "error");
  };

  reader.readAsText(file);
}

// ============================================
// ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ
// ============================================

function showToast(message, type) {
  toastElement.textContent = message;
  toastElement.className = "toast visible";

  if (type) {
    toastElement.classList.add(type);
  }

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("visible");
  }, 3400);
}

// ============================================
// КНОПКИ И ГОРЯЧИЕ КЛАВИШИ
// ============================================

document.getElementById("newBtn").addEventListener("click", () => {
  resetToNewLevel(true);
});

document.getElementById("saveBtn").addEventListener("click", saveCurrentLevel);
document.getElementById("testBtn").addEventListener("click", testCurrentLevel);
document.getElementById("resizeBtn").addEventListener("click", applyResize);
document.getElementById("loadBtn").addEventListener("click", loadSelectedLevel);
document.getElementById("deleteBtn").addEventListener("click", deleteCurrentLevel);
document.getElementById("exportBtn").addEventListener("click", exportCurrentLevel);
document.getElementById("exportPackBtn").addEventListener("click", exportPack);
document.getElementById("importBtn").addEventListener("click", () => importInput.click());

importInput.addEventListener("change", () => {
  const file = importInput.files && importInput.files[0];

  if (file) {
    importFromFile(file);
  }

  importInput.value = "";
});

levelNameInput.addEventListener("input", () => {
  dirty = true;
  scheduleDraftSave();
});

// Автор, описание и пак живут в состоянии редактора и в черновике
function bindMetaField(input, assign) {
  input.addEventListener("input", () => {
    assign(input.value);
    dirty = true;
    scheduleDraftSave();
  });
}

bindMetaField(levelAuthorInput, value => {
  levelAuthor = value;
});

bindMetaField(levelNoteInput, value => {
  levelNote = value;
});

bindMetaField(levelPackInput, value => {
  levelPack = value;
});

biomeSelect.addEventListener("change", () => {
  levelBiome =
    biomeSelect.value === "snow" || biomeSelect.value === "castle"
      ? biomeSelect.value
      : "grass";

  dirty = true;
  scheduleDraftSave();
  showToast(
    levelBiome === "snow"
      ? "Выбран снежный биом."
      : levelBiome === "castle"
        ? "Выбран биом замка."
        : "Выбран обычный биом.",
    "success"
  );
});

window.addEventListener("keydown", event => {
  const tag = (event.target.tagName || "").toLowerCase();

  if (tag === "input" || tag === "textarea" || tag === "select") {
    return;
  }

  const ctrl = event.ctrlKey || event.metaKey;

  if (ctrl && event.code === "KeyZ") {
    event.preventDefault();

    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }

    return;
  }

  if (ctrl && event.code === "KeyY") {
    event.preventDefault();
    redo();
    return;
  }

  if (ctrl && event.code === "KeyS") {
    event.preventDefault();
    saveCurrentLevel();
    return;
  }

  if (ctrl && event.code === "KeyC") {
    event.preventDefault();
    copySelection();
    return;
  }

  if (ctrl && event.code === "KeyV") {
    event.preventDefault();
    enterPasteMode();
    return;
  }

  if (ctrl && event.code === "KeyX") {
    event.preventDefault();
    cutSelection();
    return;
  }

  if (event.code === "Escape") {
    setTool("paint");
    showToast("Выделение и режим вставки сброшены.");
    return;
  }

  if (event.code === "Delete" || event.code === "Backspace") {
    if (selection) {
      event.preventDefault();
      deleteSelection();
    }

    return;
  }

  if (event.code === "KeyB") {
    setTool("paint");
  }

  if (event.code === "KeyE") {
    setTool("erase");
  }

  if (event.code === "KeyR") {
    setTool("rect");
  }

  if (event.code === "KeyS") {
    setTool("select");
  }
});

// Предупреждаем, если уходим со страницы с несохранённой картой
window.addEventListener("beforeunload", event => {
  if (!dirty) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

// ============================================
// ЗАПУСК
// ============================================

buildPalette();
buildTemplateOptions();
refreshLoadOptions();

const restoredDraft = getEditorDraft();

if (restoredDraft) {
  undoStack = [];
  redoStack = [];
  applyGrid(
    restoredDraft.rows,
    restoredDraft.name,
    restoredDraft.levelId,
    true,
    restoredDraft.biome || "grass",
    restoredDraft.author,
    restoredDraft.note,
    restoredDraft.pack
  );
  loadSelect.value = "";
  showToast(
    "Черновик восстановлен. Не забудь сохранить уровень.",
    "warn"
  );
} else {
  resetToNewLevel(false, true);
}

updateUndoButtons();
updateSelectionButtons();
updateSelectionInfo();
drawMiniMap();
