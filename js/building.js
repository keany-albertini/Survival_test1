import { state, BUILDING_DATA, ITEM_DATA, distance } from "./data.js?v=9";
import { saveGame } from "./save.js?v=9";

const FOUNDATION_W = 64;
const FOUNDATION_H = 46;
let nextBuildingId = Date.now();

function idForBuilding() {
  nextBuildingId += 1;
  return "b" + nextBuildingId;
}

export function isBuildMode() {
  return Boolean(state.buildMode);
}

export function startPlacement(itemId, notify) {
  const item = ITEM_DATA[itemId];
  if (!item?.placeable || !BUILDING_DATA[item.placeable]) {
    notify("Cet objet ne peut pas être placé.");
    return false;
  }
  if ((state.inventory[itemId] || 0) <= 0) {
    notify("Vous n'avez plus cet objet.");
    return false;
  }

  state.buildMode = item.placeable;
  updateBuildPreview();
  notify("Mode construction : " + BUILDING_DATA[state.buildMode].label);
  return true;
}

export function cancelPlacement(notify) {
  if (!state.buildMode) return false;
  state.buildMode = null;
  state.buildPreview = null;
  notify?.("Construction annulée.");
  return true;
}

function foundationEdges(foundation) {
  return [
    { edge: "top", x: foundation.x, y: foundation.y - FOUNDATION_H / 2, orientation: "h" },
    { edge: "bottom", x: foundation.x, y: foundation.y + FOUNDATION_H / 2, orientation: "h" },
    { edge: "left", x: foundation.x - FOUNDATION_W / 2, y: foundation.y, orientation: "v" },
    { edge: "right", x: foundation.x + FOUNDATION_W / 2, y: foundation.y, orientation: "v" }
  ];
}

function wallEdgeOccupied(foundationId, edge) {
  return state.buildings.some(b =>
    b.type === "wood_wall" &&
    b.parentId === foundationId &&
    b.edge === edge
  );
}

function nearestFoundationEdge(x, y, maxDistance = 76) {
  let best = null;
  let bestDistance = maxDistance;

  for (const foundation of state.buildings.filter(b => b.type === "wood_foundation")) {
    for (const edge of foundationEdges(foundation)) {
      if (wallEdgeOccupied(foundation.id, edge.edge)) continue;
      const d = distance(x, y, edge.x, edge.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = { ...edge, foundation };
      }
    }
  }
  return best;
}

function overlapsBuilding(x, y, footprint, ignoreWalls = true) {
  for (const building of state.buildings) {
    if (ignoreWalls && building.type === "wood_wall") continue;
    const other = BUILDING_DATA[building.type];
    const minDistance = Math.max(24, (footprint + (other?.footprint || 36)) * .42);
    if (distance(x, y, building.x, building.y) < minDistance) return true;
  }
  return false;
}

export function updateBuildPreview() {
  if (!state.buildMode) {
    state.buildPreview = null;
    return null;
  }

  const data = BUILDING_DATA[state.buildMode];
  const p = state.player;
  const facingLen = Math.hypot(p.facingX, p.facingY) || 1;
  const fx = p.facingX / facingLen;
  const fy = p.facingY / facingLen;
  let x = p.x + fx * 82;
  let y = p.y + fy * 82;
  let valid = true;
  let reason = "";
  let orientation = "h";
  let parentId = null;
  let edge = null;

  if (data.snap === "grid") {
    x = Math.round(x / FOUNDATION_W) * FOUNDATION_W;
    y = Math.round(y / FOUNDATION_H) * FOUNDATION_H;
    if (overlapsBuilding(x, y, data.footprint)) {
      valid = false;
      reason = "Une construction occupe déjà cet emplacement.";
    }
  } else if (data.snap === "foundation-edge") {
    const snap = nearestFoundationEdge(x, y);
    if (!snap) {
      valid = false;
      reason = "Le mur doit s'accrocher à une fondation bois.";
    } else {
      x = snap.x;
      y = snap.y;
      orientation = snap.orientation;
      parentId = snap.foundation.id;
      edge = snap.edge;
    }
  } else {
    x = Math.round(x / 8) * 8;
    y = Math.round(y / 8) * 8;
    if (overlapsBuilding(x, y, data.footprint)) {
      valid = false;
      reason = "Emplacement occupé.";
    }
  }

  if (distance(p.x, p.y, x, y) > 120) {
    valid = false;
    reason = "Trop loin du survivant.";
  }

  state.buildPreview = {
    type: state.buildMode,
    itemId: data.itemId,
    x, y, orientation, parentId, edge, valid, reason
  };

  return state.buildPreview;
}

export function placeCurrent(notify) {
  const preview = updateBuildPreview();
  if (!preview) return false;

  if (!preview.valid) {
    notify(preview.reason || "Placement impossible.");
    return false;
  }

  if ((state.inventory[preview.itemId] || 0) <= 0) {
    cancelPlacement();
    notify("Vous n'avez plus cet objet.");
    return false;
  }

  const building = {
    id: idForBuilding(),
    type: preview.type,
    x: preview.x,
    y: preview.y,
    orientation: preview.orientation,
    parentId: preview.parentId,
    edge: preview.edge
  };

  state.buildings.push(building);
  state.inventory[preview.itemId] -= 1;
  saveGame();

  notify(BUILDING_DATA[preview.type].label + " placé.");

  if ((state.inventory[preview.itemId] || 0) <= 0) {
    state.buildMode = null;
    state.buildPreview = null;
  } else {
    updateBuildPreview();
  }
  return true;
}

export function getNearestBuilding(maxDistance = 64) {
  let best = null;
  let bestDistance = maxDistance;
  for (const building of state.buildings) {
    const d = distance(state.player.x, state.player.y, building.x, building.y);
    if (d < bestDistance) {
      best = building;
      bestDistance = d;
    }
  }
  return best;
}
