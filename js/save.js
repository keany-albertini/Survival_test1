import { state, SAVE_KEY, clamp } from "./data.js?v=6";

export function saveGame() {
  try {
    const data = {
      player: {
        x: state.player.x, y: state.player.y, health: state.player.health,
        hunger: state.player.hunger, thirst: state.player.thirst, stamina: state.player.stamina
      },
      inventory: state.inventory,
      tools: state.tools,
      equipped: state.equipped,
      removedResources: Array.from(state.removedResources).slice(-3000),
      deadAnimals: Array.from(state.deadAnimals).slice(-1200),
      dayCount: state.dayCount,
      dayProgress: state.dayProgress
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    for (const key of ["x","y","health","hunger","thirst","stamina"]) {
      if (data.player && Number.isFinite(data.player[key])) state.player[key] = data.player[key];
    }

    for (const key of Object.keys(state.inventory)) {
      if (data.inventory && Number.isFinite(data.inventory[key])) {
        state.inventory[key] = Math.max(0, Math.floor(data.inventory[key]));
      }
    }

    for (const key of Object.keys(state.tools)) {
      if (data.tools) state.tools[key] = Boolean(data.tools[key]);
    }

    if (typeof data.equipped === "string" && state.tools[data.equipped]) {
      state.equipped = data.equipped;
    } else {
      state.equipped = null;
    }

    if (Array.isArray(data.removedResources)) data.removedResources.forEach(id => state.removedResources.add(id));
    if (Array.isArray(data.deadAnimals)) data.deadAnimals.forEach(id => state.deadAnimals.add(id));
    if (Number.isFinite(data.dayCount)) state.dayCount = Math.max(1, Math.floor(data.dayCount));
    if (Number.isFinite(data.dayProgress)) state.dayProgress = clamp(data.dayProgress, 0, .99999);

    state.camera.x = state.player.x;
    state.camera.y = state.player.y;
    return true;
  } catch (_) {
    return false;
  }
}

export function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  Object.assign(state.player, { x:0, y:0, health:100, hunger:100, thirst:100, stamina:100, facingX:0, facingY:1 });
  for (const key of Object.keys(state.inventory)) state.inventory[key] = 0;
  for (const key of Object.keys(state.tools)) state.tools[key] = false;
  state.equipped = null;
  state.removedResources.clear();
  state.deadAnimals.clear();
  state.animalStates.clear();
  state.dayCount = 1;
  state.dayProgress = .31;
  state.camera.x = 0;
  state.camera.y = 0;
  state.gameOver = false;
}
