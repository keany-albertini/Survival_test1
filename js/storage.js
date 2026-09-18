import { state, ITEM_DATA } from "./data.js?v=14";
import { saveGame } from "./save.js?v=14";

export function getOpenChest() {
  if (!state.openChestId) return null;
  const chest = state.buildings.find(b => b.id === state.openChestId && b.type === "chest");
  if (!chest) {
    state.openChestId = null;
    return null;
  }
  if (!chest.storage || typeof chest.storage !== "object") chest.storage = {};
  return chest;
}

export function openChest(chestId) {
  const chest = state.buildings.find(b => b.id === chestId && b.type === "chest");
  if (!chest) return false;
  if (!chest.storage || typeof chest.storage !== "object") chest.storage = {};
  state.openChestId = chestId;
  return true;
}

export function closeChest() {
  state.openChestId = null;
}

export function depositItem(id, amount = Infinity) {
  const chest = getOpenChest();
  if (!chest || !ITEM_DATA[id]) return false;

  const available = state.inventory[id] || 0;
  if (available <= 0) return false;

  const moved = Math.min(available, Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : available);

  for (const [slot, equippedId] of Object.entries(state.armor)) {
    if (equippedId === id && moved >= available) state.armor[slot] = null;
  }

  state.inventory[id] -= moved;
  chest.storage[id] = (chest.storage[id] || 0) + moved;
  saveGame();
  return moved;
}

export function withdrawItem(id, amount = Infinity) {
  const chest = getOpenChest();
  if (!chest || !ITEM_DATA[id]) return false;

  const available = chest.storage[id] || 0;
  if (available <= 0) return false;

  const moved = Math.min(available, Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : available);
  chest.storage[id] -= moved;
  if (chest.storage[id] <= 0) delete chest.storage[id];
  state.inventory[id] = (state.inventory[id] || 0) + moved;
  saveGame();
  return moved;
}
