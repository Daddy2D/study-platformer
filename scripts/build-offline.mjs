// ============================================
// СБОРКА ДЛЯ РАЗДАЧИ (file://)
// ============================================
// Делает три самодостаточных HTML-файла: игра, редактор и настройки.
// Скрипты собраны в один обычный (не модульный) файл, стили и картинки
// вложены внутрь. Такой комплект открывается двойным щелчком по
// index.html без сервера и без установки чего-либо.

import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const OUT_DIR = "dist-offline";
const SPRITES_DIR = "public/sprites";
const TOKENS_CSS = "docs/design/tokens.css";

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif"
};

const PAGES = [
  { html: "index.html", entry: "src/main.js", css: null, tokens: true },
  { html: "editor.html", entry: "src/editor-main.js", css: "src/styles/editor.css" },
  { html: "settings.html", entry: "src/settings-main.js", css: "src/styles/settings.css" }
];

// Картинки превращаем в data URL: игра не зависит от папки sprites
function spriteReplacements() {
  return fs
    .readdirSync(SPRITES_DIR)
    .map(name => {
      const mime = MIME[path.extname(name)] || "application/octet-stream";
      const data = fs.readFileSync(path.join(SPRITES_DIR, name)).toString("base64");

      return {
        needle: `sprites/${name}`,
        replacement: `data:${mime};base64,${data}`
      };
    });
}

async function bundle(entry) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    target: ["es2020"],
    minify: true,
    legalComments: "none",
    charset: "utf8",
    outdir: OUT_DIR,
    write: false
  });

  return result.outputFiles.find(file => file.path.endsWith(".js")).text;
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sprites = spriteReplacements();
  const tokens = fs.readFileSync(TOKENS_CSS, "utf8");
  const report = [];

  for (const page of PAGES) {
    let script = await bundle(page.entry);

    for (const sprite of sprites) {
      script = script.split(sprite.needle).join(sprite.replacement);
    }

    // Внутри <script> не должно встретиться </script>
    script = script.replace(/<\/script/gi, "<\\/script");

    let html = fs.readFileSync(page.html, "utf8");
    const before = html;

    html = html.replace(
      /<script type="module" src="[^"]+"><\/script>/,
      `<script>\n${script}\n</script>`
    );

    if (html === before) {
      throw new Error(`не нашёл скрипт точки входа в ${page.html}`);
    }

    if (page.css) {
      // В офлайне @import некуда вести: токены вставляем в тот же <style>.
      const css = fs
        .readFileSync(page.css, "utf8")
        .replace(/@import\s+["'][^"']*tokens\.css["'];?\s*/g, "");

      html = html.replace(
        "</head>",
        `  <style>\n${tokens}\n${css}\n</style>\n</head>`
      );
    } else if (page.tokens) {
      // Игре токены нужны для рамки канваса и тач-кнопок.
      html = html.replace(
        "</head>",
        `  <style>\n${tokens}\n</style>\n</head>`
      );
    }

    const target = path.join(OUT_DIR, page.html);

    if (page.html === "index.html" && !html.includes('id="touchControls"')) {
      throw new Error("в index.html пропала разметка экранных кнопок");
    }

    fs.writeFileSync(target, html, "utf8");
    report.push(`${page.html} — ${Math.round(html.length / 1024)} КБ`);
  }

  // Пак испытаний уже внутри игры, но кладём JSON рядом:
  // его можно перенести на другой компьютер.
  const packSource = path.join("src", "data", "challenge-pack.json");

  if (fs.existsSync(packSource)) {
    fs.copyFileSync(packSource, path.join(OUT_DIR, "Испытания.json"));
    report.push("Испытания.json — пак уровней (50)");
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "README.txt"),
    [
      "Мини-платформер",
      "",
      "1. Распакуй папку целиком.",
      "2. Открой index.html двойным щелчком.",
      "3. Редактор уровней открывается из меню игры.",
      "",
      "Рядом лежит Испытания.json — пак из 50 уровней разной сложности.",
      "Они уже стоят в игре: меню «Мои уровни» → группа «Испытания».",
      "JSON нужен, только чтобы перенести пак на другой компьютер:",
      "редактор → «Загрузить JSON» → выбери файл.",
      "",
      "Свои уровни, настройки и прогресс сохраняются в браузере на этом компьютере.",
      "Чтобы перенести уровень, скачай его из редактора кнопкой «Скачать JSON».",
      ""
    ].join("\r\n"),
    "utf8"
  );

  console.log("Готово: " + OUT_DIR);
  console.log(report.join("\n"));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
