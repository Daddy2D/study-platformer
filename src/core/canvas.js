// ============================================
// CANVAS
// ============================================

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// Пиксель-арт должен оставаться чётким
ctx.imageSmoothingEnabled = false;
