// ============================================
// СПРАЙТЫ
// ============================================

// Все картинки лежат в папке sprites.
// Если файла нет, игра нарисует простую цветную фигуру.
export const SPRITES = {
  sky: "sprites/sky.svg",
  cloud: "sprites/cloud.svg",
  player: "sprites/player.svg",
  ground: "sprites/ground.png",
  dirt: "sprites/dirt.svg",
  snowGround: "sprites/snowground.svg",
  snowDirt: "sprites/snowdirt.svg",
  castleGround: "sprites/castleground.svg",
  castleDirt: "sprites/castledirt.svg",
  coin: "sprites/coin.svg",
  enemy: "sprites/enemy.png",
  spike: "sprites/spike.svg",
  checkpoint: "sprites/checkpoint.svg",
  moving: "sprites/moving.svg",
  key: "sprites/key.svg",
  door: "sprites/door.svg",
  bullet: "sprites/bullet.svg",
  exit: "sprites/exit.svg",
  spring: "sprites/spring.svg",
  falling: "sprites/falling.svg",
  oneway: "sprites/oneway.svg",
  breakable: "sprites/breakable.svg",
  ladder: "sprites/ladder.svg",
  saw: "sprites/saw.svg",
  cannon: "sprites/cannon.svg",
  boss: "sprites/boss.svg",
  snowBoss: "sprites/snowboss.svg",
  castleBoss: "sprites/castleboss.svg"
};

export const IMAGES = {};

for (const [name, src] of Object.entries(SPRITES)) {
  const img = new Image();
  img.src = src;
  IMAGES[name] = img;
}
