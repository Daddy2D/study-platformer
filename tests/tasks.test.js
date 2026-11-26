import { describe, expect, it } from "vitest";
import { TASKS, getTaskProgress } from "../src/game/tasks.js";

const BASE = [
  "..........",
  ".P......X.",
  "GGGGGGGGGG",
  "GGGGGGGGGG"
];

function makeLevel(id, rows, author) {
  return {
    id: id,
    name: id,
    author: author || "",
    rows: rows || BASE
  };
}

function withTiles(chars) {
  const rows = BASE.slice();
  rows[1] = (".P" + chars).padEnd(9, ".") + "X";

  return rows;
}

function status(tasks, id) {
  return tasks.find(task => task.id === id);
}

describe("задания урока", () => {
  it("без уровней выполнено только пустое", () => {
    const tasks = getTaskProgress([], {});

    expect(tasks).toHaveLength(TASKS.length);
    expect(tasks.every(task => task.done === false)).toBe(true);
  });

  it("первый уровень закрывается любым сохранённым уровнем", () => {
    const tasks = getTaskProgress([makeLevel("lvl_1")], {});

    expect(status(tasks, "first-level").done).toBe(true);
    expect(status(tasks, "spring").done).toBe(false);
  });

  it("батут ищется в карте", () => {
    const tasks = getTaskProgress([makeLevel("lvl_1", withTiles("B"))], {});

    expect(status(tasks, "spring").done).toBe(true);
  });

  it("ключ и дверь должны быть в одном уровне", () => {
    const both = getTaskProgress([makeLevel("lvl_1", withTiles("KD"))], {});
    const onlyKey = getTaskProgress([makeLevel("lvl_2", withTiles("K"))], {});

    expect(status(both, "key-door").done).toBe(true);
    expect(status(onlyKey, "key-door").done).toBe(false);
  });

  it("босс, лестница и шипы", () => {
    const tasks = getTaskProgress([makeLevel("lvl_1", withTiles("ZHS"))], {});

    expect(status(tasks, "boss").done).toBe(true);
    expect(status(tasks, "ladder").done).toBe(true);
    expect(status(tasks, "spikes").done).toBe(true);
  });

  it("без врагов не закрывается, если есть E или T", () => {
    const clean = getTaskProgress([makeLevel("lvl_1")], {});
    const enemy = getTaskProgress([makeLevel("lvl_2", withTiles("E"))], {});

    expect(status(clean, "no-enemies").done).toBe(true);
    expect(status(enemy, "no-enemies").done).toBe(false);
  });

  it("прохождение и время берутся из результатов", () => {
    const levels = [makeLevel("lvl_1", BASE, "Влад")];
    const tasks = getTaskProgress(levels, {
      lvl_1: { completed: true, bestTimeFrames: 1800 }
    });

    expect(status(tasks, "finish").done).toBe(true);
    expect(status(tasks, "fast").done).toBe(true);
    expect(status(tasks, "finish").level.id).toBe("lvl_1");
  });

  it("медленное прохождение не закрывает задание на 30 секунд", () => {
    const levels = [makeLevel("lvl_1")];
    const tasks = getTaskProgress(levels, {
      lvl_1: { completed: true, bestTimeFrames: 1801 }
    });

    expect(status(tasks, "fast").done).toBe(false);
  });

  it("берёт первый подходящий уровень и его автора", () => {
    const levels = [
      makeLevel("lvl_1", BASE, ""),
      makeLevel("lvl_2", withTiles("B"), "Аня")
    ];

    const task = status(getTaskProgress(levels, {}), "spring");

    expect(task.done).toBe(true);
    expect(task.level.id).toBe("lvl_2");
    expect(task.level.author).toBe("Аня");
  });
});
