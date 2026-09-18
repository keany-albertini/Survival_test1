import { state, ITEM_DATA, TOOL_DATA, QUICKBAR_ORDER, RECIPES, RESOURCE_INFO } from "./data.js?v=6";
import { canAfford } from "./harvest.js?v=6";
import { getSmartTarget } from "./world.js?v=6";

export const ui = {
  healthBar: document.getElementById("healthBar"),
  hungerBar: document.getElementById("hungerBar"),
  thirstBar: document.getElementById("thirstBar"),
  staminaBar: document.getElementById("staminaBar"),
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
  craftPanel: document.getElementById("craftPanel"),
  inventoryGrid: document.getElementById("inventoryGrid"),
  craftList: document.getElementById("craftList"),
  deathScreen: document.getElementById("deathScreen"),
  touchAction: document.getElementById("touchAction"),
  touchActionIcon: document.getElementById("touchActionIcon"),
  touchActionLabel: document.getElementById("touchActionLabel"),
  quick: {
    branch: document.getElementById("quickBranch"),
    fiber: document.getElementById("quickFiber"),
    stone: document.getElementById("quickStone"),
    ore: document.getElementById("quickOre"),
    meat: document.getElementById("quickMeat")
  }
};

let toastTimer = 0;
let useHandler = null;
let craftHandler = null;
let equipHandler = null;

export function configureUI(handlers) {
  useHandler = handlers.useItem;
  craftHandler = handlers.craft;
  equipHandler = handlers.equipTool;
}

export function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("visible"), 1350);
}

export function isPanelOpen() {
  return ui.inventoryPanel.classList.contains("open") || ui.craftPanel.classList.contains("open");
}

export function setPanel(panel, open) {
  for (const p of [ui.inventoryPanel, ui.craftPanel]) {
    if (p !== panel) {
      p.classList.remove("open");
      p.setAttribute("aria-hidden", "true");
    }
  }
  panel.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) updateUI();
}

export function togglePanel(panel) {
  setPanel(panel, !panel.classList.contains("open"));
}

export function closePanels() {
  setPanel(ui.inventoryPanel, false);
  setPanel(ui.craftPanel, false);
}

function toolCard(id, data) {
  const owned = state.tools[id];
  const card = document.createElement("div");
  card.className = "item-card";
  card.innerHTML =
    '<div class="item-top"><span class="icon">' + data.icon + '</span><div><strong>' +
    data.label + '</strong><small>' + (owned ? (state.equipped === id ? "En main" : "Fabriqué") : "Non fabriqué") +
    '</small></div></div><small>Outil équipable dans la barre rapide.</small>' +
    (owned ? '<button type="button">' + (state.equipped === id ? "Ranger" : "Équiper") + '</button>' : "");
  const button = card.querySelector("button");
  if (button) button.addEventListener("click", () => {
    if (equipHandler) equipHandler(id);
    updateUI();
  });
  return card;
}

function renderInventory() {
  ui.inventoryGrid.innerHTML = "";

  for (const [id, data] of Object.entries(TOOL_DATA)) {
    ui.inventoryGrid.appendChild(toolCard(id, data));
  }

  for (const [id, data] of Object.entries(ITEM_DATA)) {
    const count = state.inventory[id] || 0;
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-top"><span class="icon">' + data.icon + '</span><div><strong>' +
      data.label + '</strong><small>x' + count + '</small></div></div><small>' +
      data.description + '</small>' +
      (data.usable && count > 0 ? '<button type="button" data-use="' + id + '">Utiliser</button>' : "");

    const button = card.querySelector("[data-use]");
    if (button) button.addEventListener("click", () => {
      if (useHandler) useHandler(id);
      updateUI();
    });
    ui.inventoryGrid.appendChild(card);
  }
}

function renderCraft() {
  ui.craftList.innerHTML = "";

  for (const recipe of RECIPES) {
    const owned = recipe.tool && state.tools[recipe.id];
    const affordable = canAfford(recipe.cost);
    const row = document.createElement("article");
    row.className = "recipe";

    const cost = Object.entries(recipe.cost).map(([id, amount]) => {
      const item = ITEM_DATA[id];
      return '<span>' + item.icon + ' ' + (state.inventory[id] || 0) + '/' + amount + '</span>';
    }).join("");

    row.innerHTML =
      '<div class="recipe-head"><span class="recipe-icon">' + recipe.icon + '</span><div><h3>' +
      recipe.label + '</h3><p>' + recipe.description + '</p></div></div>' +
      '<div class="recipe-cost">' + cost + '</div><button type="button" ' +
      ((!affordable || owned) ? "disabled" : "") + '>' + (owned ? "Déjà fabriqué" : "Fabriquer") + '</button>';

    row.querySelector("button").addEventListener("click", () => {
      if (craftHandler) craftHandler(recipe.id);
      updateUI();
    });
    ui.craftList.appendChild(row);
  }
}

function renderQuickbar() {
  ui.quickbar.innerHTML = "";

  for (const id of QUICKBAR_ORDER) {
    const isTool = Boolean(TOOL_DATA[id]);
    const data = isTool ? TOOL_DATA[id] : ITEM_DATA[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-slot " + (isTool ? "tool-slot" : "consumable");

    if (isTool) {
      const owned = state.tools[id];
      if (!owned) button.classList.add("locked");
      if (state.equipped === id) button.classList.add("selected");
      button.innerHTML =
        '<span class="quick-icon">' + data.icon + '</span><small>' + data.label + '</small>';
      button.setAttribute("aria-label", owned ? "Équiper " + data.label : data.label + " non fabriqué");
      button.addEventListener("click", () => {
        if (equipHandler) equipHandler(id);
        updateUI();
      });
    } else {
      const count = state.inventory[id] || 0;
      if (count <= 0) button.classList.add("empty");
      button.innerHTML =
        '<span class="quick-icon">' + data.icon + '</span><small>' + data.label + '</small>' +
        '<span class="quick-count">' + count + '</span>';
      button.setAttribute("aria-label", "Utiliser " + data.label + ", quantité " + count);
      button.addEventListener("click", () => {
        if (count <= 0) {
          showToast("Vous n'avez plus de " + data.label.toLowerCase() + ".");
          return;
        }
        if (useHandler) useHandler(id);
        updateUI();
      });
    }

    ui.quickbar.appendChild(button);
  }
}

function resourceAction(resource) {
  const map = {
    pond: { icon: "💧", label: "Eau" },
    branch: { icon: "🪵", label: "Ramasser" },
    fiber: { icon: "🌿", label: "Récolter" },
    stone: { icon: "🪨", label: "Ramasser" },
    ore: { icon: "⛏️", label: "Minerai" },
    berries: { icon: "🫐", label: "Cueillir" },
    tree: { icon: "🌲", label: "Arbre" }
  };
  const action = map[resource.type] || { icon: "✋", label: "Action" };
  return { ...action, prompt: RESOURCE_INFO[resource.type]?.prompt || "Interagir" };
}

export function updatePrompt() {
  const disabled = isPanelOpen() || state.gameOver;
  const target = disabled ? null : getSmartTarget();

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
    const name = target.value.type === "deer" ? "petit cerf" : "lapin";
    ui.prompt.textContent = "ACTION — " + name;
    ui.touchActionIcon.textContent = "⚔️";
    ui.touchActionLabel.textContent = "Attaquer";
  } else {
    const action = resourceAction(target.value);
    ui.prompt.textContent = "ACTION — " + action.label;
    ui.touchActionIcon.textContent = action.icon;
    ui.touchActionLabel.textContent = action.label;
  }

  ui.prompt.classList.add("visible");
}

export function updateUI() {
  for (const id of ["health","hunger","thirst","stamina"]) {
    const value = Math.max(0, Math.min(100, state.player[id]));
    ui[id + "Bar"].style.width = value.toFixed(1) + "%";
    ui[id + "Text"].textContent = Math.round(value);
  }

  for (const id of Object.keys(ui.quick)) ui.quick[id].textContent = state.inventory[id] || 0;

  const totalMinutes = Math.floor(state.dayProgress * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  ui.dayText.textContent = "Jour " + state.dayCount;
  ui.timeText.textContent = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  ui.coordsText.textContent = Math.round(state.player.x) + ", " + Math.round(state.player.y);
  ui.deathScreen.hidden = !state.gameOver;

  renderQuickbar();
  if (ui.inventoryPanel.classList.contains("open")) renderInventory();
  if (ui.craftPanel.classList.contains("open")) renderCraft();
}
