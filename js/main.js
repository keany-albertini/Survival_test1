import { state } from "./data.js";
import { Renderer } from "./render.js";
import { interact, craft, useItem } from "./harvest.js";
import { hunt, updateAnimals } from "./fauna.js";
import { updateSurvival } from "./survival.js";
import { saveGame, loadGame, resetGame } from "./save.js";
import {
  ui, configureUI, showToast, updateUI, updatePrompt,
  isPanelOpen, togglePanel, closePanels, setPanel
} from "./ui.js";

const canvas = document.getElementById("gameCanvas");
const renderer = new Renderer(canvas);
const keys = Object.create(null);
const touch = { up:false, down:false, left:false, right:false };
let lastTime = performance.now();
let uiClock = 0;

function refreshAction(action) {
  const changed = action();
  updateUI();
  return changed;
}

configureUI({
  useItem: id => refreshAction(() => useItem(id, showToast)),
  craft: id => refreshAction(() => craft(id, showToast))
});

function inputVector() {
  let x = 0;
  let y = 0;
  if (keys.KeyA || keys.KeyQ || keys.ArrowLeft || touch.left) x -= 1;
  if (keys.KeyD || keys.ArrowRight || touch.right) x += 1;
  if (keys.KeyW || keys.KeyZ || keys.ArrowUp || touch.up) y -= 1;
  if (keys.KeyS || keys.ArrowDown || touch.down) y += 1;
  if (x || y) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

function update(dt) {
  if (state.gameOver) return;

  const v = inputVector();
  const moving = v.x !== 0 || v.y !== 0;
  const sprinting = (keys.ShiftLeft || keys.ShiftRight) && state.player.stamina > 2;
  const speed = sprinting ? 232 : 156;

  if (!isPanelOpen()) {
    state.player.x += v.x * speed * dt;
    state.player.y += v.y * speed * dt;
    if (moving) {
      state.player.facingX = v.x;
      state.player.facingY = v.y;
    }
  }

  updateSurvival(dt, moving && !isPanelOpen(), sprinting && !isPanelOpen());
  updateAnimals(dt);

  const smoothing = 1 - Math.pow(.0009, dt);
  state.camera.x += (state.player.x - state.camera.x) * smoothing;
  state.camera.y += (state.player.y - state.camera.y) * smoothing;

  updatePrompt();
  uiClock += dt;
  if (uiClock > .12 || state.gameOver) {
    uiClock = 0;
    updateUI();
  }
}

function doInteract() {
  if (isPanelOpen()) return;
  refreshAction(() => interact(showToast));
}

function doHunt() {
  if (isPanelOpen()) return;
  refreshAction(() => hunt(showToast));
}

addEventListener("keydown", event => {
  keys[event.code] = true;
  if (event.code === "KeyE") {
    event.preventDefault();
    doInteract();
  } else if (event.code === "Space") {
    event.preventDefault();
    doHunt();
  } else if (event.code === "KeyI") {
    event.preventDefault();
    togglePanel(ui.inventoryPanel);
  } else if (event.code === "KeyC") {
    event.preventDefault();
    togglePanel(ui.craftPanel);
  } else if (event.code === "Escape") {
    closePanels();
  }
});

addEventListener("keyup", event => { keys[event.code] = false; });
addEventListener("blur", () => {
  for (const key of Object.keys(keys)) keys[key] = false;
  for (const key of Object.keys(touch)) touch[key] = false;
});

document.getElementById("inventoryButton").addEventListener("click", () => togglePanel(ui.inventoryPanel));
document.getElementById("craftButton").addEventListener("click", () => togglePanel(ui.craftPanel));
document.getElementById("touchInteract").addEventListener("click", doInteract);
document.getElementById("touchAttack").addEventListener("click", doHunt);

document.getElementById("restartButton").addEventListener("click", () => {
  resetGame();
  closePanels();
  updateUI();
  showToast("Nouveau monde créé.");
});

document.querySelectorAll(".close-panel").forEach(button => {
  button.addEventListener("click", () => setPanel(document.getElementById(button.dataset.close), false));
});

document.querySelectorAll("[data-move]").forEach(button => {
  const dir = button.dataset.move;
  const down = event => {
    event.preventDefault();
    touch[dir] = true;
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  };
  const up = event => {
    event.preventDefault();
    touch[dir] = false;
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("lostpointercapture", () => { touch[dir] = false; });
});

canvas.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button === 0) doHunt();
});

addEventListener("beforeunload", saveGame);
setInterval(saveGame, 10000);

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  update(dt);
  renderer.render();
  requestAnimationFrame(loop);
}

const loaded = loadGame();
updateUI();
showToast(loaded ? "Sauvegarde chargée." : "Récoltez autour de vous avec E.");
requestAnimationFrame(loop);
