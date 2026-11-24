// ============================================
// СПИСОК ГОТОВЫХ УРОВНЕЙ И ИХ НАЗВАНИЯ
// ============================================

import { LEVEL_1 } from "./level1.js";
import { LEVEL_2 } from "./level2.js";
import { LEVEL_3 } from "./level3.js";
import { LEVEL_4 } from "./level4.js";
import { LEVEL_5 } from "./level5.js";
import { LEVEL_6 } from "./level6.js";
import { LEVEL_7 } from "./level7.js";
import { LEVEL_8 } from "./level8.js";
import { LEVEL_9 } from "./level9.js";
import { LEVEL_10 } from "./level10.js";
import { LEVEL_11 } from "./level11.js";
import { LEVEL_12 } from "./level12.js";
import { LEVEL_13 } from "./level13.js";
import { LEVEL_14 } from "./level14.js";
import { LEVEL_15 } from "./level15.js";
import { LEVEL_16 } from "./level16.js";

export const LEVELS = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8,
  LEVEL_9,
  LEVEL_10,
  LEVEL_11,
  LEVEL_12,
  LEVEL_13,
  LEVEL_14,
  LEVEL_15,
  LEVEL_16
];

export const LEVEL_NAMES = [
  "Зелёные холмы",
  "Шипастая тропа",
  "Ключ и платформа",
  "Стрелок в пещере",
  "Финальный рывок",
  "Логово босса",
  "Снежные вершины",
  "Каменный замок",
  "67",
  "Лёгкий",
  "Парашютист",
  "Майнкрафт",
  "Парашютист V2",
  "Пример мяса",
  "Мясокомбинат",
  "Максимальный 30Х30"
];

// Биом меняет фон, землю и погоду. У своих уровней по умолчанию "grass".
export const LEVEL_BIOMES = [
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "snow",
  "castle",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "castle",
  "castle"
];

// Тип босса: "default" — фиолетовый, "snow" — ледяной,
// "castle" — каменный страж.
export const LEVEL_BOSS_TYPES = [
  null,
  null,
  null,
  null,
  null,
  "default",
  "snow",
  "castle",
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
];

// Автор (ник ребёнка) и одна строка «чем интересен уровень».
// У готовых уровней игры автора нет. Ники детей вписываются позже.
export const LEVEL_META = [
  {
    author: "",
    note: "Первые прыжки, монеты и батут: знакомство с механиками."
  },
  {
    author: "",
    note: "Подъём по лестнице и падающий мост над шипами."
  },
  {
    author: "",
    note: "Ключ, дверь и секрет за разрушаемым блоком."
  },
  {
    author: "",
    note: "Стрелки, пушка и длинный подъём по платформам."
  },
  {
    author: "",
    note: "Все механики сразу: пилы, лестницы, двери и платформы."
  },
  {
    author: "",
    note: "Арена первого босса: три удара и две фазы."
  },
  {
    author: "",
    note: "Снежные вершины и Ледяной страж."
  },
  {
    author: "",
    note: "Каменный замок и Каменный страж."
  },
  {
    author: "",
    note: "Пол из шипов и подъём по островкам: одна ошибка — и падаешь."
  },
  {
    author: "",
    note: "Короткий маршрут с двумя ключами и дверью на вершине."
  },
  {
    author: "",
    note: "Спуск сверху вниз через шипы, батут и ключ с дверью."
  },
  {
    author: "",
    note: "Башня в стиле Майнкрафта и босс в конце."
  },
  {
    author: "",
    note: "Вторая версия «Парашютиста»: мягкая гравитация, батуты и пять жизней."
  },
  {
    author: "",
    note: "Высокая башня на сорок клеток: двери, враги и ловушки."
  },
  {
    author: "",
    note: "Завод: пилы на полу, двери с ключами и падающие платформы."
  },
  {
    author: "",
    note: "Самая большая карта пака: падающие платформы, шипы и босс."
  }
];
