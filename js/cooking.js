import { state } from "./data.js?v=19";
import { saveGame } from "./save.js?v=19";

let openCampfireId = null;
const COOK_TIME = 5;

function ensureCooking(campfire) {
  if (!campfire.cooking || typeof campfire.cooking !== "object") {
    campfire.cooking = { remaining: 0, total: COOK_TIME, ready: 0 };
  }
  campfire.cooking.total = COOK_TIME;
  campfire.cooking.remaining = Math.max(0, Number(campfire.cooking.remaining) || 0);
  campfire.cooking.ready = Math.max(0, Math.floor(Number(campfire.cooking.ready) || 0));
  return campfire.cooking;
}

export function openCampfire(id) {
  const campfire = state.buildings.find(b => b.id === id && b.type === "campfire");
  if (!campfire) return false;
  ensureCooking(campfire);
  openCampfireId = campfire.id;
  return true;
}

export function closeCampfire() {
  openCampfireId = null;
}

export function getOpenCampfire() {
  if (!openCampfireId) return null;
  const campfire = state.buildings.find(b => b.id === openCampfireId && b.type === "campfire") || null;
  if (!campfire) {
    openCampfireId = null;
    return null;
  }
  ensureCooking(campfire);
  return campfire;
}

export function startCookingMeat(notify) {
  const campfire = getOpenCampfire();
  if (!campfire) return false;

  const cooking = ensureCooking(campfire);
  if (cooking.remaining > 0) {
    notify?.("Une viande est déjà en train de cuire.");
    return false;
  }
  if ((state.inventory.meat || 0) <= 0) {
    notify?.("Vous n'avez pas de viande crue.");
    return false;
  }

  state.inventory.meat -= 1;
  cooking.remaining = COOK_TIME;
  cooking.total = COOK_TIME;
  saveGame();
  notify?.("Viande mise sur le feu.");
  return true;
}

export function collectCookedMeat(notify) {
  const campfire = getOpenCampfire();
  if (!campfire) return false;

  const cooking = ensureCooking(campfire);
  if (cooking.ready <= 0) {
    notify?.("Aucune viande cuite à récupérer.");
    return false;
  }

  const amount = cooking.ready;
  state.inventory.cooked_meat = (state.inventory.cooked_meat || 0) + amount;
  cooking.ready = 0;
  saveGame();
  notify?.("+" + amount + " viande" + (amount > 1 ? "s" : "") + " cuite" + (amount > 1 ? "s" : "") + ".");
  return true;
}

export function updateCooking(dt, notify) {
  for (const campfire of state.buildings) {
    if (campfire.type !== "campfire") continue;
    const cooking = ensureCooking(campfire);
    if (cooking.remaining <= 0) continue;

    cooking.remaining = Math.max(0, cooking.remaining - dt);
    if (cooking.remaining <= 0) {
      cooking.ready += 1;
      if (openCampfireId === campfire.id) notify?.("La viande est cuite !");
      saveGame();
    }
  }
}
