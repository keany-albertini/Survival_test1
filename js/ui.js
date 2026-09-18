import {
  state, ITEM_DATA, TOOL_DATA, QUICKBAR_ORDER, ARMOR_DATA, RECIPES, RESOURCE_INFO, RESOURCE_DATA
} from "./data.js?v=10";
import { canAfford } from "./harvest.js?v=10";
import { getSmartTarget } from "./world.js?v=10";

export const ui = {
  healthCircle: document.getElementById("healthCircle"),
  hungerCircle: document.getElementById("hungerCircle"),
  thirstCircle: document.getElementById("thirstCircle"),
  staminaCircle: document.getElementById("staminaCircle"),
  healthText: document.getElementById("healthText"),
  hungerText: document.getElementById("hungerText"),
  thirstText: document.getElementById("thirstText"),
  staminaText: document.getElementById("staminaText"),
  dayText: document.getElementById("dayText"),
  timeText: document.getElementById("timeText"),
  coordsText: document.getElementById("coordsText"),
  prompt: document.getElementById("interactionPrompt"),
  toast: document.getElementById("toast"),
  quickbar: document.getElementById("quickbar"),
  inventoryPanel: document.getElementById("inventoryPanel"),
  inventoryGrid: document.getElementById("inventoryGrid"),
  craftList: document.getElementById("craftList"),
  equipmentSlots: document.getElementById("equipmentSlots"),
  deathScreen: document.getElementById("deathScreen"),
  touchAction: document.getElementById("touchAction"),
  touchActionIcon: document.getElementById("touchActionIcon"),
  touchActionLabel: document.getElementById("touchActionLabel"),
  buildCancelButton: document.getElementById("buildCancelButton"),
  tabs: Array.from(document.querySelectorAll(".inventory-tab")),
  tabPanels: {
    inventory: document.getElementById("inventoryTabInventory"),
    craft: document.getElementById("inventoryTabCraft"),
    equipment: document.getElementById("inventoryTabEquipment")
  }
};

let toastTimer = 0;
let useHandler = null;
let craftHandler = null;
let equipToolHandler = null;
let equipArmorHandler = null;
let placeItemHandler = null;
let activeTab = "inventory";
let quickbarSignature = "";
let inventorySignature = "";
let craftSignature = "";
let equipmentSignature = "";

export function configureUI(handlers) {
  useHandler = handlers.useItem;
  craftHandler = handlers.craft;
  equipToolHandler = handlers.equipTool;
  equipArmorHandler = handlers.equipArmor;
  placeItemHandler = handlers.placeItem;

  for (const button of ui.tabs) {
    button.addEventListener("click", () => setInventoryTab(button.dataset.tab));
  }
}

export function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("visible"), 1350);
}

export function isPanelOpen() {
  return ui.inventoryPanel.classList.contains("open");
}

export function openInventory(tab = "inventory") {
  setInventoryTab(tab);
  ui.inventoryPanel.classList.add("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "false");
  updateUI();
}

export function closePanels() {
  ui.inventoryPanel.classList.remove("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "true");
}

export function toggleInventory(tab = activeTab) {
  if (isPanelOpen() && activeTab === tab) closePanels();
  else openInventory(tab);
}

export function setInventoryTab(tab) {
  if (!ui.tabPanels[tab]) tab = "inventory";
  activeTab = tab;

  for (const button of ui.tabs) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }
  for (const [name, panel] of Object.entries(ui.tabPanels)) {
    panel.classList.toggle("active", name === tab);
  }

  if (tab === "inventory") inventorySignature = "";
  if (tab === "craft") craftSignature = "";
  if (tab === "equipment") equipmentSignature = "";
  if (isPanelOpen()) updateUI();
}

function toolCard(id, data) {
  const owned = state.tools[id];
  const card = document.createElement("div");
  card.className = "item-card";

  card.innerHTML =
    '<div class="item-top"><span class="icon">' + data.icon + '</span><div><strong>' +
    data.label + '</strong><small>' + (owned ? (state.equipped === id ? "En main" : "Fabriqué") : "Non fabriqué") +
    '</small></div></div><small>Équipement de la barre rapide.</small>' +
    (owned ? '<button type="button">' + (state.equipped === id ? "Ranger" : "Équiper") + '</button>' : "");

  card.querySelector("button")?.addEventListener("click", () => {
    equipToolHandler?.(id);
    invalidateAll();
    updateUI();
  });
  return card;
}

function renderInventory() {
  const signature = JSON.stringify({
    tools: state.tools,
    equipped: state.equipped,
    inventory: state.inventory,
    armor: state.armor,
    buildMode: state.buildMode
  });
  if (signature === inventorySignature) return;
  inventorySignature = signature;

  ui.inventoryGrid.innerHTML = "";

  for (const [id, data] of Object.entries(TOOL_DATA)) {
    if (!state.tools[id]) continue;
    ui.inventoryGrid.appendChild(toolCard(id, data));
  }

  for (const [id, data] of Object.entries(ITEM_DATA)) {
    const count = state.inventory[id] || 0;
    if (count <= 0) continue;

    const card = document.createElement("div");
    card.className = "item-card";

    let action = "";
    if (data.usable && count > 0) {
      action = '<button type="button" data-use="' + id + '">Utiliser</button>';
    } else if (data.armorSlot && count > 0) {
      const equipped = state.armor[data.armorSlot] === id;
      action = '<button type="button" data-armor="' + id + '">' + (equipped ? "Retirer" : "Équiper") + '</button>';
    } else if (data.placeable && count > 0) {
      action = '<button type="button" data-place="' + id + '">Placer</button>';
    }

    card.innerHTML =
      '<div class="item-top"><span class="icon">' + data.icon + '</span><div><strong>' +
      data.label + '</strong><small>x' + count + '</small></div></div><small>' +
      data.description + '</small>' + action;

    card.querySelector("[data-use]")?.addEventListener("click", () => {
      useHandler?.(id);
      invalidateAll();
      updateUI();
    });

    card.querySelector("[data-armor]")?.addEventListener("click", () => {
      equipArmorHandler?.(id);
      invalidateAll();
      updateUI();
    });

    card.querySelector("[data-place]")?.addEventListener("click", () => {
      placeItemHandler?.(id);
      invalidateAll();
      updateUI();
    });

    ui.inventoryGrid.appendChild(card);
  }
}

function renderCraft() {
  const signature = JSON.stringify({ tools: state.tools, inventory: state.inventory });
  if (signature === craftSignature) return;
  craftSignature = signature;
  ui.craftList.innerHTML = "";

  let lastCategory = "";
  for (const recipe of RECIPES) {
    if (recipe.category !== lastCategory) {
      lastCategory = recipe.category;
      const heading = document.createElement("h3");
      heading.className = "recipe-category";
      heading.textContent = lastCategory;
      ui.craftList.appendChild(heading);
    }

    const ownedTool = recipe.tool && state.tools[recipe.id];
    const affordable = canAfford(recipe.cost);
    const row = document.createElement("article");
    row.className = "recipe";

    const cost = Object.entries(recipe.cost).map(([id, amount]) => {
      const item = ITEM_DATA[id];
      const have = state.inventory[id] || 0;
      return '<span>' + (item?.icon || "•") + ' ' + have + '/' + amount + '</span>';
    }).join("");

    row.innerHTML =
      '<div class="recipe-head"><span class="recipe-icon">' + recipe.icon + '</span><div><h3>' +
      recipe.label + '</h3><p>' + recipe.description + '</p></div></div>' +
      '<div class="recipe-cost">' + cost + '</div><button type="button" ' +
      ((!affordable || ownedTool) ? "disabled" : "") + '>' +
      (ownedTool ? "Déjà fabriqué" : "Fabriquer") + '</button>';

    row.querySelector("button").addEventListener("click", () => {
      craftHandler?.(recipe.id);
      invalidateAll();
      updateUI();
    });

    ui.craftList.appendChild(row);
  }
}

function renderEquipment() {
  const signature = JSON.stringify({
    armor: state.armor,
    inventory: {
      leather_helmet: state.inventory.leather_helmet,
      leather_chest: state.inventory.leather_chest,
      leather_legs: state.inventory.leather_legs,
      leather_boots: state.inventory.leather_boots
    }
  });
  if (signature === equipmentSignature) return;
  equipmentSignature = signature;
  ui.equipmentSlots.innerHTML = "";

  const slots = [
    ["head","Tête","🪖"],
    ["chest","Torse","🥋"],
    ["legs","Jambes","👖"],
    ["feet","Pieds","🥾"]
  ];

  for (const [slot, label, icon] of slots) {
    const equippedId = state.armor[slot];
    const equippedData = equippedId ? ARMOR_DATA[equippedId] : null;

    const box = document.createElement("div");
    box.className = "equipment-slot";

    const available = Object.entries(ARMOR_DATA)
      .filter(([, data]) => data.slot === slot)
      .filter(([id]) => (state.inventory[id] || 0) > 0);

    let buttons = "";
    if (equippedData) {
      buttons = '<button type="button" class="secondary" data-armor="' + equippedId + '">Retirer</button>';
    } else if (available.length) {
      const [id, data] = available[0];
      buttons = '<button type="button" data-armor="' + id + '">Équiper ' + data.label + '</button>';
    }

    box.innerHTML =
      '<div class="equipment-slot-head"><strong>' + icon + ' ' + label + '</strong><span>' +
      (equippedData ? equippedData.label : "Vide") + '</span></div>' + buttons;

    box.querySelector("[data-armor]")?.addEventListener("click", event => {
      equipArmorHandler?.(event.currentTarget.dataset.armor);
      invalidateAll();
      updateUI();
    });

    ui.equipmentSlots.appendChild(box);
  }
}

function renderQuickbar() {
  const signature = JSON.stringify({
    equipped: state.equipped,
    tools: state.tools,
    arrows: state.inventory.arrows,
    berries: state.inventory.berries,
    meat: state.inventory.meat,
    water: state.inventory.water,
    bandage: state.inventory.bandage
  });
  if (signature === quickbarSignature) return;
  quickbarSignature = signature;
  ui.quickbar.innerHTML = "";

  for (const id of QUICKBAR_ORDER) {
    const isTool = Boolean(TOOL_DATA[id]);
    const data = isTool ? TOOL_DATA[id] : ITEM_DATA[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-slot " + (isTool ? "tool-slot" : "consumable");

    if (isTool) {
      const owned = state.tools[id];
      if (!owned) continue;
      if (state.equipped === id) button.classList.add("selected");

      const ammo = id === "bow"
        ? '<span class="quick-count">' + (state.inventory.arrows || 0) + '</span>'
        : "";

      button.innerHTML =
        '<span class="quick-icon">' + data.icon + '</span><small>' + data.label + '</small>' + ammo;

      button.addEventListener("click", () => {
        equipToolHandler?.(id);
        invalidateAll();
        updateUI();
      });
    } else {
      const count = state.inventory[id] || 0;
      if (count <= 0) continue;
      button.innerHTML =
        '<span class="quick-icon">' + data.icon + '</span><small>' + data.label + '</small>' +
        '<span class="quick-count">' + count + '</span>';

      button.addEventListener("click", () => {
        if (count <= 0) {
          showToast("Vous n'avez plus de " + data.label.toLowerCase() + ".");
          return;
        }
        useHandler?.(id);
        invalidateAll();
        updateUI();
      });
    }

    ui.quickbar.appendChild(button);
  }
}

function invalidateAll() {
  quickbarSignature = "";
  inventorySignature = "";
  craftSignature = "";
  equipmentSignature = "";
}

function resourceAction(resource) {
  const map = {
    pond: { icon: "💧", label: "Eau" },
    branch: { icon: "🪵", label: "Ramasser" },
    fiber: { icon: "🌿", label: "Récolter" },
    stone: { icon: "🪨", label: "Ramasser" },
    large_rock: { icon: "⛏️", label: "Rocher" },
    copper_ore: { icon: "🟠", label: "Cuivre" },
    tin_ore: { icon: "⚪", label: "Étain" },
    ore: { icon: "⛏️", label: "Métal" },
    gold_ore: { icon: "🟡", label: "Or" },
    berries: { icon: "🫐", label: "Cueillir" },
    tree: { icon: "🌲", label: "Arbre" }
  };
  return map[resource.type] || { icon:"✋", label:RESOURCE_INFO[resource.type]?.prompt || "Action" };
}

export function updatePrompt() {
  const buildMode = Boolean(state.buildMode);
  ui.buildCancelButton.hidden = !buildMode;

  if (buildMode) {
    const preview = state.buildPreview;
    ui.touchAction.classList.toggle("ready", Boolean(preview?.valid));
    ui.touchAction.classList.toggle("danger", Boolean(preview && !preview.valid));
    ui.touchActionIcon.textContent = preview?.valid ? "🔨" : "⛔";
    ui.touchActionLabel.textContent = preview?.valid ? "Poser" : "Bloqué";
    ui.prompt.textContent = preview?.valid
      ? "CONSTRUCTION — Action pour poser"
      : "CONSTRUCTION — " + (preview?.reason || "Placement impossible");
    ui.prompt.classList.add("visible");
    return;
  }

  const target = (!isPanelOpen() && !state.gameOver) ? getSmartTarget() : null;
  ui.touchAction.classList.toggle("ready", Boolean(target));
  ui.touchAction.classList.toggle("danger", target?.type === "animal");

  if (!target) {
    ui.prompt.classList.remove("visible");
    ui.prompt.textContent = "";
    ui.touchActionIcon.textContent = "✋";
    ui.touchActionLabel.textContent = "Action";
    return;
  }

  if (target.type === "animal") {
    ui.prompt.textContent = "ACTION — Attaquer";
    ui.touchActionIcon.textContent = "⚔️";
    ui.touchActionLabel.textContent = "Attaquer";
  } else {
    const action = resourceAction(target.value);
    const config = RESOURCE_DATA[target.value.type];
    const hits = state.resourceHits[target.value.id] || 0;
    const progress = config?.tool && config.hits > 1 ? " " + hits + "/" + config.hits : "";
    ui.prompt.textContent = "ACTION — " + action.label + progress;
    ui.touchActionIcon.textContent = action.icon;
    ui.touchActionLabel.textContent = action.label;
  }
  ui.prompt.classList.add("visible");
}

function updateCircle(id, value) {
  const pct = Math.max(0, Math.min(100, value));
  ui[id + "Circle"].style.setProperty("--pct", pct.toFixed(1) + "%");
  ui[id + "Text"].textContent = Math.round(pct) + "%";
}

export function updateUI() {
  updateCircle("health", state.player.health);
  updateCircle("hunger", state.player.hunger);
  updateCircle("thirst", state.player.thirst);
  updateCircle("stamina", state.player.stamina);

  const totalMinutes = Math.floor(state.dayProgress * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  ui.dayText.textContent = "Jour " + state.dayCount;
  ui.timeText.textContent = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  ui.coordsText.textContent = Math.round(state.player.x) + ", " + Math.round(state.player.y);
  ui.deathScreen.hidden = !state.gameOver;

  renderQuickbar();

  if (isPanelOpen()) {
    if (activeTab === "inventory") renderInventory();
    else if (activeTab === "craft") renderCraft();
    else if (activeTab === "equipment") renderEquipment();
  }
}
