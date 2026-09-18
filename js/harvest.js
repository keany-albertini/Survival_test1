import { state, RECIPES, clamp } from "./data.js";
import { getNearestResource } from "./world.js";
import { saveGame } from "./save.js";

export function addItem(id, amount) {
  state.inventory[id] = (state.inventory[id] || 0) + amount;
}

export function canAfford(cost) {
  return Object.entries(cost).every(([id, amount]) => (state.inventory[id] || 0) >= amount);
}

export function craft(recipeId, notify) {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if (recipe.tool && state.tools[recipe.id]) { notify("Outil déjà fabriqué."); return false; }
  if (!canAfford(recipe.cost)) { notify("Il manque des ressources."); return false; }

  for (const [id, amount] of Object.entries(recipe.cost)) state.inventory[id] -= amount;

  if (recipe.tool) {
    state.tools[recipe.id] = true;
    notify(recipe.label + " fabriquée !");
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
    notify("Vous mangez quelques baies.");
  } else if (id === "meat") {
    state.inventory.meat -= 1;
    state.player.hunger = clamp(state.player.hunger + 10, 0, 100);
    notify("Viande crue mangée. La cuisson viendra ensuite.");
  } else if (id === "bandage") {
    state.inventory.bandage -= 1;
    state.player.health = clamp(state.player.health + 25, 0, 100);
    notify("Bandage utilisé.");
  } else return false;
  return true;
}

export function interact(notify) {
  if (state.gameOver) return false;
  const resource = getNearestResource();
  if (!resource) { notify("Rien à récolter à proximité."); return false; }

  if (resource.type === "pond") {
    state.player.thirst = clamp(state.player.thirst + 46, 0, 100);
    notify("Vous buvez de l'eau.");
    return true;
  }
  if (resource.type === "ore" && !state.tools.pickaxe) {
    notify("Il faut une pioche pour extraire le minerai.");
    return false;
  }
  if (resource.type === "tree" && !state.tools.axe) {
    notify("Il faut une hache pour couper cet arbre.");
    return false;
  }

  if (resource.type === "branch") {
    const n = state.tools.axe ? 4 : 2; addItem("branch", n); notify("+" + n + " branches");
  } else if (resource.type === "fiber") {
    addItem("fiber", 3); notify("+3 fibres");
  } else if (resource.type === "stone") {
    const n = state.tools.pickaxe ? 3 : 1; addItem("stone", n); notify("+" + n + " pierre");
  } else if (resource.type === "ore") {
    addItem("ore", 3); notify("+3 minerai");
  } else if (resource.type === "berries") {
    addItem("berries", 3); addItem("fiber", 1); notify("+3 baies, +1 fibre");
  } else if (resource.type === "tree") {
    addItem("branch", 7); notify("+7 branches");
  }

  state.removedResources.add(resource.id);
  return true;
}
