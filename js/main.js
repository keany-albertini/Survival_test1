import { state, QUICKBAR_ORDER, TOOL_DATA } from "./data.js?v=14";
import { Renderer } from "./render.js?v=16";
import { interact, craft, useItem, equipTool, equipArmor } from "./harvest.js?v=14";
import { hunt, updateAnimals } from "./fauna.js?v=14";
import { getSmartTarget } from "./world.js?v=14";
import { updateSurvival } from "./survival.js?v=14";
import { saveGame, loadGame } from "./save.js?v=14";
import {
  startPlacement, cancelPlacement, placeCurrent,
  updateBuildPreview, isBuildMode, getNearestBuilding, isPlayerBlockedByWall
} from "./building.js?v=16";
import { fireBow, setAim, updateProjectiles } from "./combat.js?v=14";
import {
  openChest, closeChest, depositItem, withdrawItem
} from "./storage.js?v=14";
import {
  ui, configureUI, showToast, updateUI, updatePrompt,
  isPanelOpen, toggleInventory, openInventory, openChestPanel, closePanels
} from "./ui.js?v=14";

const canvas = document.getElementById("gameCanvas");
const renderer = new Renderer(canvas);
const keys = Object.create(null);
const joystick = { x: 0, y: 0, pointerId: null };
const aimTouch = { active: false, pointerId: null };
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
  },
  depositItem: (id, amount) => refreshAction(() => depositItem(id, amount)),
  withdrawItem: (id, amount) => refreshAction(() => withdrawItem(id, amount)),
  closeChest
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
    const moveX = v.x * speed * dt;
    const moveY = v.y * speed * dt;
    const nextX = state.player.x + moveX;
    const nextY = state.player.y + moveY;

    // Collision séparée par axe : le joueur est bloqué par les murs,
    // mais peut continuer à glisser naturellement le long de leur surface.
    if (!isPlayerBlockedByWall(nextX, state.player.y)) {
      state.player.x = nextX;
    }
    if (!isPlayerBlockedByWall(state.player.x, nextY)) {
      state.player.y = nextY;
    }

    if (moving) {
      if (state.equipped !== "bow" || !aimTouch.active) {
        state.player.facingX = v.x;
        state.player.facingY = v.y;
        state.player.aimX = v.x;
        state.player.aimY = v.y;
      }
      state.player.walkPhase = (state.player.walkPhase || 0) + dt * (6 + v.strength * 6);
    }
  }

  state.player.moving = moving && !isPanelOpen();

  updateSurvival(dt, state.player.moving, sprinting && !isPanelOpen());
  updateAnimals(dt);
  updateProjectiles(dt, showToast);

  const smoothing = 1 - Math.pow(.0009, dt);
  const cameraLead = 26;
  const targetCameraX = state.player.x + (state.player.facingX || 0) * cameraLead;
  const targetCameraY = state.player.y + (state.player.facingY || 0) * cameraLead;
  state.camera.x += (targetCameraX - state.camera.x) * smoothing;
  state.camera.y += (targetCameraY - state.camera.y) * smoothing;

  if (isBuildMode()) updateBuildPreview();

  updatePrompt();
  uiClock += dt;
  if (uiClock > .12 || state.gameOver) {
    uiClock = 0;
    updateUI();
  }
}

function openNearbyChest() {
  const chest = getNearestBuilding(62, "chest");
  if (!chest) return false;
  if (!openChest(chest.id)) return false;
  openChestPanel();
  return true;
}

function smartAction() {
  if (isPanelOpen() || state.gameOver) return;

  if (isBuildMode()) {
    refreshAction(() => placeCurrent(showToast));
    return;
  }

  if (openNearbyChest()) return;

  if (state.equipped === "bow") {
    refreshAction(() => fireBow(showToast));
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
  aimTouch.active = false;
  aimTouch.pointerId = null;
  ui.touchAction.classList.remove("aiming");
});

document.getElementById("inventoryButton").addEventListener("click", () => toggleInventory("inventory"));
document.getElementById("touchInventory").addEventListener("click", () => toggleInventory("inventory"));
document.getElementById("closeChestButton").addEventListener("click", closePanels);
document.getElementById("buildCancelButton").addEventListener("click", () => {
  refreshAction(() => cancelPlacement(showToast));
});

document.getElementById("restartButton").addEventListener("click", () => {
  const point = state.respawnPoint || { x: 0, y: 0 };

  state.player.x = point.x;
  state.player.y = point.y;
  state.player.health = 75;
  state.player.hunger = 60;
  state.player.thirst = 60;
  state.player.stamina = 100;
  state.player.actionTimer = 0;
  state.player.actionType = null;
  state.projectiles = [];
  state.openChestId = null;
  state.gameOver = false;
  state.buildMode = null;
  state.buildPreview = null;

  state.camera.x = point.x;
  state.camera.y = point.y;

  closePanels();
  saveGame();
  updateUI();
  showToast(state.respawnPoint ? "Réapparition au lit." : "Réapparition au point de départ.");
});

document.querySelectorAll(".close-panel").forEach(button => {
  if (button.id === "closeChestButton") return;
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

function aimFromActionPointer(event) {
  const rect = ui.touchAction.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  if (Math.hypot(dx, dy) < 8) return;
  setAim(dx, dy);
}

ui.touchAction.addEventListener("pointerdown", event => {
  event.preventDefault();

  const nearbyChest = getNearestBuilding(62, "chest");
  if (state.equipped === "bow" && !nearbyChest && !isBuildMode() && !isPanelOpen()) {
    aimTouch.active = true;
    aimTouch.pointerId = event.pointerId;
    ui.touchAction.classList.add("aiming");
    try { ui.touchAction.setPointerCapture(event.pointerId); } catch (_) {}
    aimFromActionPointer(event);
    return;
  }

  smartAction();
});

ui.touchAction.addEventListener("pointermove", event => {
  if (!aimTouch.active || event.pointerId !== aimTouch.pointerId) return;
  event.preventDefault();
  aimFromActionPointer(event);
});

function finishBowAim(event) {
  if (!aimTouch.active) return;
  if (event.pointerId !== undefined && aimTouch.pointerId !== null && event.pointerId !== aimTouch.pointerId) return;

  aimTouch.active = false;
  aimTouch.pointerId = null;
  ui.touchAction.classList.remove("aiming");
  refreshAction(() => fireBow(showToast));
}

ui.touchAction.addEventListener("pointerup", finishBowAim);
ui.touchAction.addEventListener("pointercancel", event => {
  aimTouch.active = false;
  aimTouch.pointerId = null;
  ui.touchAction.classList.remove("aiming");
});

canvas.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || state.equipped !== "bow" || isPanelOpen()) return;
  const rect = canvas.getBoundingClientRect();
  const playerScreen = renderer.screen(state.player.x, state.player.y);
  const mx = event.clientX - rect.left;
  const my = event.clientY - rect.top;
  setAim(mx - playerScreen.x, my - playerScreen.y);
});

canvas.addEventListener("pointerdown", event => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  if (state.equipped === "bow") refreshAction(() => fireBow(showToast));
  else smartAction();
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