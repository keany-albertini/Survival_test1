import { state, RECIPES, ARMOR_DATA, clamp } from "./data.js?v=9";
import { getNearestResource } from "./world.js?v=9";
import { saveGame } from "./save.js?v=9";

export function addItem(id, amount) {
  state.inventory[id] = (state.inventory[id] || 0) + amount;
}

export function canAfford(cost) {
  return Object.entries(cost).every(([id, amount]) => (state.inventory[id] || 0) >= amount);
}

export function equipTool(id, notify) {
  if (!state.tools[id]) {
    notify("Cet équipement n'est pas encore fabriqué.");
    return false;
  }

  state.equipped = state.equipped === id ? null : id;
  notify(state.equipped ? "Équipé : " + idLabel(id) : "Mains libres.");
  saveGame();
  return true;
}

export function equipArmor(id, notify) {
  const data = ARMOR_DATA[id];
  if (!data || (state.inventory[id] || 0) <= 0) {
    notify("Cette pièce d'armure n'est pas dans votre inventaire.");
    return false;
  }

  const slot = data.slot;
  if (state.armor[slot] === id) {
    state.armor[slot] = null;
    notify(data.label + " retiré.");
  } else {
    state.armor[slot] = id;
    notify(data.label + " équipé.");
  }
  saveGame();
  return true;
}

function idLabel(id) {
  const labels = {
    axe: "hache", pickaxe: "pioche", spear: "lance",
    bow: "arc", sword: "épée", shield: "bouclier"
  };
  return labels[id] || id;
}

export function craft(recipeId, notify) {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;

  if (recipe.tool && state.tools[recipe.id]) {
    notify("Déjà fabriqué.");
    return false;
  }

  if (!canAfford(recipe.cost)) {
    notify("Il manque des ressources.");
    return false;
  }

  for (const [id, amount] of Object.entries(recipe.cost)) state.inventory[id] -= amount;

  if (recipe.tool) {
    state.tools[recipe.id] = true;
    state.equipped = recipe.id;
    notify(recipe.label + " fabriqué et équipé !");
  } else if (recipe.output) {
    for (const [id, amount] of Object.entries(recipe.output)) addItem(id, amount);
    notify(recipe.label + " fabriqué.");
  }

  saveGame();
  return true;
}

export function useItem(id, notify) {
  if ((state.inventory[id] || 0) <= 0 || state.gameOver) return false;

  if (id === "berries") {
    state.inventory.berries -= 1;
    state.player.hunger = clamp(state.player.hunger + 14, 0, 100);
    state.player.thirst = clamp(state.player.thirst + 4, 0, 100);
    notify("Vous mangez des baies.");
  } else if (id === "meat") {
    state.inventory.meat -= 1;
    state.player.hunger = clamp(state.player.hunger + 12, 0, 100);
    notify("Vous mangez de la viande.");
  } else if (id === "water") {
    state.inventory.water -= 1;
    state.player.thirst = clamp(state.player.thirst + 35, 0, 100);
    notify("Vous buvez de l'eau.");
  } else if (id === "bandage") {
    state.inventory.bandage -= 1;
    state.player.health = clamp(state.player.health + 25, 0, 100);
    notify("Bandage utilisé.");
  } else {
    return false;
  }

  saveGame();
  return true;
}

export function interact(notify) {
  if (state.gameOver) return false;
  const resource = getNearestResource();
  if (!resource) {
    notify("Rien à récolter à proximité.");
    return false;
  }

  if (resource.type === "pond") {
    state.player.thirst = clamp(state.player.thirst + 24, 0, 100);
    addItem("water", 2);
    notify("Vous buvez et récupérez +2 eau.");
    saveGame();
    return true;
  }

  if (resource.type === "ore" && state.equipped !== "pickaxe") {
    notify("Équipez la pioche.");
    return false;
  }

  if (resource.type === "tree" && state.equipped !== "axe") {
    notify("Équipez la hache.");
    return false;
  }

  if (resource.type === "branch") {
    const n = state.equipped === "axe" ? 4 : 2;
    addItem("branch", n);
    notify("+" + n + " branches");
  } else if (resource.type === "fiber") {
    addItem("fiber", 3);
    notify("+3 fibres");
  } else if (resource.type === "stone") {
    const n = state.equipped === "pickaxe" ? 3 : 1;
    addItem("stone", n);
    notify("+" + n + " pierre");
  } else if (resource.type === "ore") {
    addItem("ore", 3);
    notify("+3 minerai");
  } else if (resource.type === "berries") {
    addItem("berries", 3);
    addItem("fiber", 1);
    notify("+3 baies, +1 fibre");
  } else if (resource.type === "tree") {
    addItem("branch", 7);
    notify("+7 branches");
  }

  state.removedResources.add(resource.id);
  saveGame();
  return true;
}
