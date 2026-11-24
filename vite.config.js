import { defineConfig } from "vite";

// Три страницы проекта собираются как отдельные входные точки.
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        editor: "editor.html",
        settings: "settings.html"
      }
    }
  }
});
