import { state, SAVE_KEY, clamp } from "./data.js?v=13";

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
      armor: state.armor,
      skills: state.skills,
      buildings: state.buildings,
      respawnPoint: state.respawnPoint,
      resourceHits: state.resourceHits,
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

    if (typeof data.equipped === "string" && state.tools[data.equipped]) state.equipped = data.equipped;
    else state.equipped = null;

    if (data.armor && typeof data.armor === "object") {
      for (const slot of Object.keys(state.armor)) {
        const id = data.armor[slot];
        if (typeof id === "string" && (state.inventory[id] || 0) > 0) state.armor[slot] = id;
      }
    }

    if (data.skills && typeof data.skills === "object") {
      for (const id of Object.keys(state.skills)) {
        const saved = data.skills[id];
        if (!saved || typeof saved !== "object") continue;
        if (Number.isFinite(saved.level)) state.skills[id].level = Math.max(1, Math.floor(saved.level));
        if (Number.isFinite(saved.xp)) state.skills[id].xp = Math.max(0, Math.floor(saved.xp));
      }
    }

    if (Array.isArray(data.buildings)) {
      state.buildings = data.buildings.filter(b =>
        b && typeof b.id === "string" && typeof b.type === "string" &&
        Number.isFinite(b.x) && Number.isFinite(b.y)
      );
    }

    if (
      data.respawnPoint &&
      Number.isFinite(data.respawnPoint.x) &&
      Number.isFinite(data.respawnPoint.y)
    ) {
      state.respawnPoint = {
        x: data.respawnPoint.x,
        y: data.respawnPoint.y,
        bedId: typeof data.respawnPoint.bedId === "string" ? data.respawnPoint.bedId : null
      };
    }

    if (data.resourceHits && typeof data.resourceHits === "object") {
      for (const [id, hits] of Object.entries(data.resourceHits)) {
        if (Number.isFinite(hits) && hits > 0) state.resourceHits[id] = Math.floor(hits);
      }
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
  Object.assign(state.player, {
    x:0, y:0, health:100, hunger:100, thirst:100, stamina:100,
    facingX:0, facingY:1, actionTimer:0, actionType:null
  });
  for (const key of Object.keys(state.inventory)) state.inventory[key] = 0;
  for (const key of Object.keys(state.tools)) state.tools[key] = false;
  state.equipped = null;
  state.armor = { head:null, chest:null, legs:null, feet:null };
  state.skills = {
    woodcutting: { level:1, xp:0 },
    gathering: { level:1, xp:0 },
    mining: { level:1, xp:0 },
    crafting: { level:1, xp:0 }
  };
  state.buildings = [];
  state.respawnPoint = null;
  state.buildMode = null;
  state.buildPreview = null;
  state.resourceHits = {};
  state.removedResources.clear();
  state.deadAnimals.clear();
  state.animalStates.clear();
  state.dayCount = 1;
  state.dayProgress = .31;
  state.camera.x = 0;
  state.camera.y = 0;
  state.gameOver = false;
}
