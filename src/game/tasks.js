// ============================================
// ЗАДАНИЯ УРОКА
// ============================================
// Каждое задание проверяется по своим уровням, созданным в этом
// браузере, и результатам их прохождения. Импортированные паки
// не считаются: задания — про то, что ребёнок сделал сам.

export const TASKS = [
  {
    id: "first-level",
    title: "Первый уровень",
    hint: "Сохрани уровень со стартом и финишем",
    check: level => hasTile(level, "P") && hasTile(level, "X")
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
    check: (level, result) =>
      hasTile(level, "Z") && Boolean(result && result.bossDefeated)
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
    hint: "Ни врагов E, ни стрелков T, ни босса Z",
    check: level =>
      !hasTile(level, "E") && !hasTile(level, "T") && !hasTile(level, "Z")
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

// Свои уровни — те, что созданы здесь, а не импортированы паками.
export function isOwnLevel(level) {
  return level.imported !== true;
}

// Возвращает задания с отметкой выполнения и уровнем,
// который это задание закрыл.
export function getTaskProgress(levels, results) {
  const own = levels.filter(isOwnLevel);

  return TASKS.map(task => {
    for (const level of own) {
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
