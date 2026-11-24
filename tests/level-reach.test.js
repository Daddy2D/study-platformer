import { describe, expect, it } from "vitest";
import { isFinishReachable } from "../src/core/level-reach.js";

function reachable(rows) {
  return isFinishReachable(rows).reachable;
}

describe("isFinishReachable", () => {
  it("находит финиш на ровной земле", () => {
    const rows = [
      "..........",
      ".P.....X..",
      "GGGGGGGGGG",
      "GGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("перепрыгивает узкую яму", () => {
    const rows = [
      "............",
      ".P........X.",
      "GGGGGG...GGG",
      "GGGGGG...GGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("не перепрыгивает широкую яму", () => {
    const rows = [
      "......................",
      ".P.................X..",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("поднимается по ступенькам", () => {
    const rows = [
      "............",
      "......X.....",
      "....GGGG....",
      "............",
      "..GGG.......",
      ".P..........",
      "GGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("не запрыгивает на высокий уступ без ступенек", () => {
    const rows = [
      "......X.....",
      "......GGGG..",
      "............",
      "............",
      "............",
      "............",
      "............",
      ".P..........",
      "GGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("поднимается по лестнице", () => {
    const rows = [
      "..............",
      "......X.......",
      "..GGGGGGG.....",
      "......H.......",
      "......H.......",
      "......H.......",
      ".P....H.......",
      "GGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("использует батут", () => {
    const rows = [
      "......X.......",
      "......GGG.....",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      ".P...B........",
      "GGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("использует платформу над ямой", () => {
    const rows = [
      "......................",
      ".P........M.........X.",
      "GGGGGGGGG.......GGGGGG",
      "GGGGGGGGG.......GGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("не прыгает сквозь потолок", () => {
    const rows = [
      "..........X.........",
      "GGGGGGGGGGGGGGGGGGGG",
      "....................",
      ".P..................",
      "GGGGGGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("закрытая дверь без ключа перекрывает путь", () => {
    const rows = [
      ".....G..........",
      "................",
      ".P...D.....X.....",
      "GGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("лестница за стеной не помогает", () => {
    const rows = [
      "GGGGGGGGGGG",
      ".PGH.....X.",
      "GGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("стена из разрушаемых блоков не проходима", () => {
    const rows = [
      ".....R......",
      ".....R......",
      ".....R......",
      ".P...R....X.",
      "GGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("один разрушаемый блок с проходом снизу — проходим", () => {
    const rows = [
      "............",
      ".....R......",
      ".P........X.",
      "GGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("дверь с ключом пропускает", () => {
    const rows = [
      ".....G..........",
      "................",
      ".P..KD.....X.....",
      "GGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(true);
  });

  it("не находит финиш, висящий в воздухе далеко от платформ", () => {    const rows = [
      "................",
      "..............X.",
      "................",
      "................",
      "................",
      "................",
      "................",
      ".P..............",
      "GGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGG"
    ];

    expect(reachable(rows)).toBe(false);
  });

  it("сообщает причину, когда нет старта", () => {
    const result = isFinishReachable(["....", "....", "....", "...."]);

    expect(result.reachable).toBe(false);
    expect(typeof result.reason).toBe("string");
  });
});
