import {
  state, ITEM_DATA, TOOL_DATA, QUICKBAR_ORDER, ARMOR_DATA, RECIPES, RESOURCE_INFO, RESOURCE_DATA
} from "./data.js?v=17";
import { canAfford } from "./harvest.js?v=17";
import { getSmartTarget } from "./world.js?v=17";
import { getNearestBuilding } from "./building.js?v=17";
import { getOpenChest } from "./storage.js?v=17";
import { getOpenCampfire } from "./cooking.js?v=17";
import { SKILL_DATA, getSkillProgress } from "./skills.js?v=17";

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
  chestPanel: document.getElementById("chestPanel"),
  chestPlayerGrid: document.getElementById("chestPlayerGrid"),
  chestStorageGrid: document.getElementById("chestStorageGrid"),
  campfirePanel: document.getElementById("campfirePanel"),
  campfireRawCount: document.getElementById("campfireRawCount"),
  campfireCookedCount: document.getElementById("campfireCookedCount"),
  campfireStatus: document.getElementById("campfireStatus"),
  campfireProgress: document.getElementById("campfireProgress"),
  campfireCookButton: document.getElementById("campfireCookButton"),
  campfireCollectButton: document.getElementById("campfireCollectButton"),
  inventoryGrid: document.getElementById("inventoryGrid"),
  craftList: document.getElementById("craftList"),
  equipmentSlots: document.getElementById("equipmentSlots"),
  skillsList: document.getElementById("skillsList"),
  deathScreen: document.getElementById("deathScreen"),
  deathMessage: document.getElementById("deathMessage"),
  touchAction: document.getElementById("touchAction"),
  touchActionIcon: document.getElementById("touchActionIcon"),
  touchActionLabel: document.getElementById("touchActionLabel"),
  buildCancelButton: document.getElementById("buildCancelButton"),
  tabs: Array.from(document.querySelectorAll(".inventory-tab")),
  tabPanels: {
    inventory: document.getElementById("inventoryTabInventory"),
    craft: document.getElementById("inventoryTabCraft"),
    equipment: document.getElementById("inventoryTabEquipment"),
    skills: document.getElementById("inventoryTabSkills")
  }
};

let toastTimer = 0;
let useHandler = null;
let craftHandler = null;
let equipToolHandler = null;
let equipArmorHandler = null;
let placeItemHandler = null;
let depositHandler = null;
let withdrawHandler = null;
let closeChestHandler = null;
let closeCampfireHandler = null;
let cookMeatHandler = null;
let collectCookedHandler = null;
let activeTab = "inventory";
let quickbarSignature = "";
let inventorySignature = "";
let craftSignature = "";
let equipmentSignature = "";
let skillsSignature = "";
let chestSignature = "";
let campfireSignature = "";

export function configureUI(handlers) {
  useHandler = handlers.useItem;
  craftHandler = handlers.craft;
  equipToolHandler = handlers.equipTool;
  equipArmorHandler = handlers.equipArmor;
  placeItemHandler = handlers.placeItem;
  depositHandler = handlers.depositItem;
  withdrawHandler = handlers.withdrawItem;
  closeChestHandler = handlers.closeChest;
  closeCampfireHandler = handlers.closeCampfire;
  cookMeatHandler = handlers.cookMeat;
  collectCookedHandler = handlers.collectCooked;

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
  return ui.inventoryPanel.classList.contains("open") || ui.chestPanel.classList.contains("open") || ui.campfirePanel.classList.contains("open");
}

export function openInventory(tab = "inventory") {
  closeChestPanel();
  closeCampfirePanel();
  setInventoryTab(tab);
  ui.inventoryPanel.classList.add("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "false");
  updateUI();
}

export function openChestPanel() {
  closeCampfirePanel();
  ui.inventoryPanel.classList.remove("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "true");
  ui.chestPanel.classList.add("open");
  ui.chestPanel.setAttribute("aria-hidden", "false");
  chestSignature = "";
  campfireSignature = "";
  updateUI();
}

export function closeChestPanel() {
  ui.chestPanel.classList.remove("open");
  ui.chestPanel.setAttribute("aria-hidden", "true");
  closeChestHandler?.();
}

export function openCampfirePanel() {
  ui.inventoryPanel.classList.remove("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "true");
  ui.chestPanel.classList.remove("open");
  ui.chestPanel.setAttribute("aria-hidden", "true");
  ui.campfirePanel.classList.add("open");
  ui.campfirePanel.setAttribute("aria-hidden", "false");
  campfireSignature = "";
  updateUI();
}

export function closeCampfirePanel() {
  ui.campfirePanel.classList.remove("open");
  ui.campfirePanel.setAttribute("aria-hidden", "true");
  closeCampfireHandler?.();
}

export function closePanels() {
  ui.inventoryPanel.classList.remove("open");
  ui.inventoryPanel.setAttribute("aria-hidden", "true");
  closeChestPanel();
  closeCampfirePanel();
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
  if (tab === "skills") skillsSignature = "";
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

function renderSkills() {
  const signature = JSON.stringify(state.skills);
  if (signature === skillsSignature) return;
  skillsSignature = signature;
  ui.skillsList.innerHTML = "";

  for (const [id, data] of Object.entries(SKILL_DATA)) {
    const progress = getSkillProgress(id);
    const card = document.createElement("article");
    card.className = "skill-card";
    card.innerHTML =
      '<div class="skill-head"><span class="skill-icon">' + data.icon + '</span><div><strong>' +
      data.label + '</strong><small>Niveau ' + progress.level + '</small></div><b>' +
      progress.xp + '/' + progress.needed + ' XP</b></div>' +
      '<div class="skill-bar"><i style="width:' + progress.percent.toFixed(1) + '%"></i></div>' +
      '<p>' + data.description + '</p>';
    ui.skillsList.appendChild(card);
  }
}

function renderChest() {
  const chest = getOpenChest();
  if (!chest) {
    closeChestPanel();
    return;
  }

  const signature = JSON.stringify({ inventory: state.inventory, storage: chest.storage || {}, chestId: chest.id });
  if (signature === chestSignature) return;
  chestSignature = signature;

  const makeRow = (id, count, side) => {
    const data = ITEM_DATA[id];
    if (!data || count <= 0) return null;

    const row = document.createElement("div");
    row.className = "storage-item";
    row.innerHTML =
      '<div class="storage-item-main"><span>' + data.icon + '</span><div><strong>' +
      data.label + '</strong><small>x' + count + '</small></div></div>' +
      '<div class="storage-actions">' +
      '<button type="button" data-one>1</button>' +
      '<button type="button" data-all>Tout</button>' +
      '</div>';

    row.querySelector("[data-one]").addEventListener("click", () => {
      if (side === "player") depositHandler?.(id, 1);
      else withdrawHandler?.(id, 1);
      chestSignature = "";
      updateUI();
    });

    row.querySelector("[data-all]").addEventListener("click", () => {
      if (side === "player") depositHandler?.(id, Infinity);
      else withdrawHandler?.(id, Infinity);
      chestSignature = "";
      updateUI();
    });

    return row;
  };

  ui.chestPlayerGrid.innerHTML = "";
  ui.chestStorageGrid.innerHTML = "";

  let playerCount = 0;
  for (const [id, count] of Object.entries(state.inventory)) {
    const row = makeRow(id, count || 0, "player");
    if (!row) continue;
    playerCount++;
    ui.chestPlayerGrid.appendChild(row);
  }

  let chestCount = 0;
  for (const [id, count] of Object.entries(chest.storage || {})) {
    const row = makeRow(id, count || 0, "chest");
    if (!row) continue;
    chestCount++;
    ui.chestStorageGrid.appendChild(row);
  }

  if (!playerCount) ui.chestPlayerGrid.innerHTML = '<div class="storage-empty">Inventaire vide</div>';
  if (!chestCount) ui.chestStorageGrid.innerHTML = '<div class="storage-empty">Coffre vide</div>';
}

function renderCampfire() {
  const campfire = getOpenCampfire();
  if (!campfire) {
    closeCampfirePanel();
    return;
  }

  const cooking = campfire.cooking || { remaining: 0, total: 5, ready: 0 };
  const signature = JSON.stringify({
    raw: state.inventory.meat || 0,
    cooked: state.inventory.cooked_meat || 0,
    remaining: Math.round((cooking.remaining || 0) * 10) / 10,
    ready: cooking.ready || 0,
    id: campfire.id
  });
  if (signature === campfireSignature) return;
  campfireSignature = signature;

  const remaining = Math.max(0, Number(cooking.remaining) || 0);
  const total = Math.max(1, Number(cooking.total) || 5);
  const ready = Math.max(0, Math.floor(Number(cooking.ready) || 0));
  const cookingNow = remaining > 0;
  const progress = cookingNow ? Math.max(0, Math.min(100, (1 - remaining / total) * 100)) : (ready > 0 ? 100 : 0);

  ui.campfireRawCount.textContent = String(state.inventory.meat || 0);
  ui.campfireCookedCount.textContent = String(ready);
  ui.campfireProgress.style.width = progress.toFixed(1) + "%";
  ui.campfireStatus.textContent = cookingNow
    ? "Cuisson en cours · " + remaining.toFixed(1) + " s"
    : ready > 0
      ? "Viande cuite prête à récupérer."
      : "Le feu est prêt.";

  ui.campfireCookButton.disabled = cookingNow || (state.inventory.meat || 0) <= 0;
  ui.campfireCookButton.textContent = cookingNow ? "Cuisson..." : "Cuire 1 viande";
  ui.campfireCollectButton.disabled = ready <= 0;
  ui.campfireCollectButton.textContent = ready > 0 ? "Récupérer x" + ready : "Rien à récupérer";
}

function renderQuickbar() {
  const signature = JSON.stringify({
    equipped: state.equipped,
    tools: state.tools,
    arrows: state.inventory.arrows,
    berries: state.inventory.berries,
    cooked_meat: state.inventory.cooked_meat,
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
  skillsSignature = "";
  chestSignature = "";
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

  const nearbyCampfire = (!isPanelOpen() && !state.gameOver) ? getNearestBuilding(68, "campfire") : null;
  if (nearbyCampfire) {
    ui.touchAction.classList.add("ready");
    ui.touchAction.classList.remove("danger");
    ui.touchActionIcon.textContent = "🔥";
    ui.touchActionLabel.textContent = "Cuisiner";
    ui.prompt.textContent = "ACTION — Utiliser le feu de camp";
    ui.prompt.classList.add("visible");
    return;
  }

  const nearbyChest = (!isPanelOpen() && !state.gameOver) ? getNearestBuilding(62, "chest") : null;
  if (nearbyChest) {
    ui.touchAction.classList.add("ready");
    ui.touchAction.classList.remove("danger");
    ui.touchActionIcon.textContent = "📦";
    ui.touchActionLabel.textContent = "Ouvrir";
    ui.prompt.textContent = "ACTION — Ouvrir le coffre";
    ui.prompt.classList.add("visible");
    return;
  }

  if (!isPanelOpen() && !state.gameOver && state.equipped === "bow") {
    ui.touchAction.classList.add("ready");
    ui.touchAction.classList.remove("danger");
    ui.touchActionIcon.textContent = "🏹";
    ui.touchActionLabel.textContent = "Tirer";
    ui.prompt.textContent = "ARC — Visez puis tirez";
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
  if (state.gameOver && ui.deathMessage) {
    ui.deathMessage.textContent = state.respawnPoint
      ? "Vous réapparaîtrez au dernier lit posé."
      : "Aucun lit posé : réapparition au point de départ.";
  }

  renderQuickbar();

  if (ui.chestPanel.classList.contains("open")) renderChest();
  if (ui.campfirePanel.classList.contains("open")) renderCampfire();

  if (ui.inventoryPanel.classList.contains("open")) {
    if (activeTab === "inventory") renderInventory();
    else if (activeTab === "craft") renderCraft();
    else if (activeTab === "equipment") renderEquipment();
    else if (activeTab === "skills") renderSkills();
  }
}
