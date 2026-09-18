import { state, RECIPES, ARMOR_DATA, RESOURCE_DATA, clamp, distance } from "./data.js?v=10";
import { getNearestResource } from "./world.js?v=10";
import { saveGame } from "./save.js?v=10";

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

  for (const [id, amount] of Object.entries(recipe.cost)) {
    state.inventory[id] -= amount;
  }

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

function faceResource(resource) {
  const dx = resource.x - state.player.x;
  const dy = resource.y - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  state.player.facingX = dx / len;
  state.player.facingY = dy / len;
}

function triggerHarvestAnimation(resourceType) {
  state.player.actionTimer = .34;
  state.player.actionType = resourceType === "tree" ? "chop" : "mine";
}

function completeResource(resource, config, notify) {
  for (const [id, amount] of Object.entries(config.yield || {})) {
    addItem(id, amount);
  }

  delete state.resourceHits[resource.id];
  state.removedResources.add(resource.id);

  const rewardText = Object.entries(config.yield || {})
    .map(([id, amount]) => {
      const labels = {
        branch: "branches",
        fiber: "fibres",
        stone: "pierre",
        berries: "baies",
        copper_ore: "cuivre",
        tin_ore: "étain",
        ore: "métal",
        gold_ore: "or"
      };
      return "+" + amount + " " + (labels[id] || id);
    })
    .join(", ");

  notify(rewardText || "Ressource récoltée.");
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

  const config = RESOURCE_DATA[resource.type];
  if (!config) {
    notify("Cette ressource n'est pas encore récoltable.");
    return false;
  }

  if (config.tool && state.equipped !== config.tool) {
    notify(config.tool === "axe" ? "Équipez la hache." : "Équipez la pioche.");
    return false;
  }

  faceResource(resource);

  if (!config.tool) {
    return completeResource(resource, config, notify);
  }

  triggerHarvestAnimation(resource.type);

  const currentHits = (state.resourceHits[resource.id] || 0) + 1;
  state.resourceHits[resource.id] = currentHits;

  if (currentHits >= config.hits) {
    return completeResource(resource, config, notify);
  }

  notify(
    (resource.type === "tree" ? "Coup de hache" : "Coup de pioche") +
    " " + currentHits + "/" + config.hits
  );

  saveGame();
  return true;
}
