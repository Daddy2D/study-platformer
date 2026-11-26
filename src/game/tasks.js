// ============================================
// ЗАДАНИЯ УРОКА
// ============================================
// Каждое задание проверяется по сохранённым своим уровням
// и результатам их прохождения. Задание выполнено, если
// хотя бы один уровень подходит.

export const TASKS = [
  {
    id: "first-level",
    title: "Первый уровень",
    hint: "Сохрани уровень со стартом и финишем",
    check: () => true
  },
  {
    id: "spring",
    title: "Уровень с батутом",
    hint: "Поставь батут B и проверь прыжок",
    check: level => hasTile(level, "B")
  },
  {
    id: "key-door",
    title: "Ключ и дверь",
    hint: "Ключ K открывает дверь D",
    check: level => hasTile(level, "K") && hasTile(level, "D")
  },
  {
    id: "boss",
    title: "Уровень с боссом",
    hint: "Поставь босса Z и победи его",
    check: level => hasTile(level, "Z")
  },
  {
    id: "ladder",
    title: "Уровень с лестницей",
    hint: "Лестница H ведёт наверх",
    check: level => hasTile(level, "H")
  },
  {
    id: "no-enemies",
    title: "Без врагов",
    hint: "Ни одного врага E или стрелка T",
    check: level => !hasTile(level, "E") && !hasTile(level, "T")
  },
  {
    id: "spikes",
    title: "Уровень с шипами",
    hint: "Шипы S на пути, но прыжок спасает",
    check: level => hasTile(level, "S")
  },
  {
    id: "finish",
    title: "Пройди свой уровень",
    hint: "Дойди до финиша в своём уровне",
    check: (level, result) => Boolean(result && result.completed)
  },
  {
    id: "fast",
    title: "Быстрее 30 секунд",
    hint: "Пройди свой уровень за 30 секунд",
    check: (level, result) =>
      Boolean(result) &&
      result.bestTimeFrames !== null &&
      result.bestTimeFrames <= 30 * 60
  }
];

function hasTile(level, char) {
  return level.rows.some(row => row.includes(char));
}

// Возвращает задания с отметкой выполнения и уровнем,
// который это задание закрыл.
export function getTaskProgress(levels, results) {
  return TASKS.map(task => {
    for (const level of levels) {
      const result = (results && results[level.id]) || null;

      if (task.check(level, result)) {
        return {
          id: task.id,
          title: task.title,
          hint: task.hint,
          done: true,
          level: level,
          result: result
        };
      }
    }

    return {
      id: task.id,
      title: task.title,
      hint: task.hint,
      done: false,
      level: null,
      result: null
    };
  });
}
