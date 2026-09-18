import { state, QUICKBAR_ORDER, TOOL_DATA } from "./data.js?v=12";
import { Renderer } from "./render.js?v=12";
import { interact, craft, useItem, equipTool, equipArmor } from "./harvest.js?v=12";
import { hunt, updateAnimals } from "./fauna.js?v=12";
import { getSmartTarget } from "./world.js?v=12";
import { updateSurvival } from "./survival.js?v=12";
import { saveGame, loadGame, resetGame } from "./save.js?v=12";
import {
  startPlacement, cancelPlacement, placeCurrent,
  updateBuildPreview, isBuildMode
} from "./building.js?v=12";
import {
  ui, configureUI, showToast, updateUI, updatePrompt,
  isPanelOpen, toggleInventory, openInventory, closePanels
} from "./ui.js?v=12";

const canvas = document.getElementById("gameCanvas");
const renderer = new Renderer(canvas);
const keys = Object.create(null);
const joystick = { x: 0, y: 0, pointerId: null };
let lastTime = performance.now();
let uiClock = 0;

function refreshAction(action) {
  const changed = action();
  updateUI();
  return changed;
}

configureUI({
  useItem: id => refreshAction(() => useItem(id, showToast)),
  craft: id => refreshAction(() => craft(id, showToast)),
  equipTool: id => refreshAction(() => equipTool(id, showToast)),
  equipArmor: id => refreshAction(() => equipArmor(id, showToast)),
  placeItem: id => {
    const started = startPlacement(id, showToast);
    if (started) closePanels();
    updateUI();
  }
});

function inputVector() {
  let x = 0;
  let y = 0;

  if (keys.KeyA || keys.KeyQ || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.KeyZ || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;

  let strength = Math.hypot(x, y);
  if (strength > 0) {
    x /= strength;
    y /= strength;
    strength = 1;
  } else {
    x = joystick.x;
    y = joystick.y;
    strength = Math.min(1, Math.hypot(x, y));

    if (strength > .08) {
      x /= strength;
      y /= strength;
    } else {
      x = 0;
      y = 0;
      strength = 0;
    }
  }

  return { x, y, strength };
}

function update(dt) {
  if (state.gameOver) return;

  if (state.player.actionTimer > 0) {
    state.player.actionTimer = Math.max(0, state.player.actionTimer - dt);
    if (state.player.actionTimer <= 0) state.player.actionType = null;
  }

  const v = inputVector();
  const moving = v.strength > 0;
  const sprinting = (keys.ShiftLeft || keys.ShiftRight) && state.player.stamina > 2;
  const speed = (sprinting ? 232 : 156) * v.strength;

  if (!isPanelOpen()) {
    state.player.x += v.x * speed * dt;
    state.player.y += v.y * speed * dt;

    if (moving) {
      state.player.facingX = v.x;
      state.player.facingY = v.y;
      state.player.walkPhase = (state.player.walkPhase || 0) + dt * (6 + v.strength * 6);
    }
  }

  state.player.moving = moving && !isPanelOpen();

  updateSurvival(dt, state.player.moving, sprinting && !isPanelOpen());
  updateAnimals(dt);

  const smoothing = 1 - Math.pow(.0009, dt);
  state.camera.x += (state.player.x - state.camera.x) * smoothing;
  state.camera.y += (state.player.y - state.camera.y) * smoothing;

  if (isBuildMode()) updateBuildPreview();

  updatePrompt();
  uiClock += dt;
  if (uiClock > .12 || state.gameOver) {
    uiClock = 0;
    updateUI();
  }
}

function smartAction() {
  if (isPanelOpen() || state.gameOver) return;

  if (isBuildMode()) {
    refreshAction(() => placeCurrent(showToast));
    return;
  }

  const target = getSmartTarget();
  if (!target) {
    showToast("Rien à portée.");
    return;
  }

  if (target.type === "animal") refreshAction(() => hunt(showToast));
  else refreshAction(() => interact(showToast));
}

function activateQuickbarIndex(index) {
  const id = QUICKBAR_ORDER[index];
  if (!id) return;

  if (TOOL_DATA[id]) refreshAction(() => equipTool(id, showToast));
  else refreshAction(() => useItem(id, showToast));
}

addEventListener("keydown", event => {
  keys[event.code] = true;

  if (event.code === "KeyE" || event.code === "Space") {
    event.preventDefault();
    smartAction();
  } else if (event.code === "KeyI") {
    event.preventDefault();
    toggleInventory("inventory");
  } else if (event.code === "KeyC") {
    event.preventDefault();
    openInventory("craft");
  } else if (event.code === "Escape") {
    if (isBuildMode()) refreshAction(() => cancelPlacement(showToast));
    else closePanels();
  } else if (/^Digit[1-9]$/.test(event.code)) {
    activateQuickbarIndex(Number(event.code.slice(-1)) - 1);
  } else if (event.code === "Digit0") {
    activateQuickbarIndex(9);
  }
});

addEventListener("keyup", event => { keys[event.code] = false; });

addEventListener("blur", () => {
  for (const key of Object.keys(keys)) keys[key] = false;
  resetJoystick();
});

document.getElementById("inventoryButton").addEventListener("click", () => toggleInventory("inventory"));
document.getElementById("touchInventory").addEventListener("click", () => toggleInventory("inventory"));
document.getElementById("touchAction").addEventListener("click", smartAction);
document.getElementById("buildCancelButton").addEventListener("click", () => {
  refreshAction(() => cancelPlacement(showToast));
});

document.getElementById("restartButton").addEventListener("click", () => {
  resetGame();
  closePanels();
  updateUI();
  showToast("Nouveau monde créé.");
});

document.querySelectorAll(".close-panel").forEach(button => {
  button.addEventListener("click", closePanels);
});

const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");

function setJoystick(clientX, clientY) {
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const max = rect.width * .32;
  const len = Math.hypot(dx, dy);

  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }

  joystick.x = dx / max;
  joystick.y = dy / max;
  joystickKnob.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
}

function resetJoystick() {
  joystick.x = 0;
  joystick.y = 0;
  joystick.pointerId = null;
  joystickKnob.style.transform = "translate(0px,0px)";
}

joystickBase.addEventListener("pointerdown", event => {
  event.preventDefault();
  joystick.pointerId = event.pointerId;
  try { joystickBase.setPointerCapture(event.pointerId); } catch (_) {}
  setJoystick(event.clientX, event.clientY);
});

joystickBase.addEventListener("pointermove", event => {
  if (event.pointerId !== joystick.pointerId) return;
  event.preventDefault();
  setJoystick(event.clientX, event.clientY);
});

for (const eventName of ["pointerup","pointercancel","lostpointercapture"]) {
  joystickBase.addEventListener(eventName, event => {
    if (joystick.pointerId === null || event.pointerId === joystick.pointerId || eventName === "lostpointercapture") {
      resetJoystick();
    }
  });
}

canvas.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button === 0) smartAction();
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
showToast(loaded ? "Sauvegarde chargée." : "Explorez, récoltez et construisez.");
requestAnimationFrame(loop);