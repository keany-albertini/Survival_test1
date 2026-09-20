import { state, distance } from "./data.js?v=17";
import { getNearbyAnimals } from "./world.js?v=17";
import { addItem } from "./harvest.js?v=17";
import { saveGame } from "./save.js?v=17";

export function setAim(x, y) {
  const len = Math.hypot(x, y);
  if (len < .01) return;
  state.player.aimX = x / len;
  state.player.aimY = y / len;
  state.player.facingX = state.player.aimX;
  state.player.facingY = state.player.aimY;
}

export function fireBow(notify) {
  if (state.equipped !== "bow") return false;
  if ((state.inventory.arrows || 0) <= 0) {
    notify("L'arc est vide : fabriquez des flèches.");
    return false;
  }
  if (state.player.actionTimer > .04) return false;

  const ax = state.player.aimX || state.player.facingX || 0;
  const ay = state.player.aimY || state.player.facingY || 1;
  const len = Math.hypot(ax, ay) || 1;
  const dx = ax / len;
  const dy = ay / len;

  state.inventory.arrows -= 1;
  state.player.actionTimer = .38;
  state.player.actionType = "shoot";
  state.player.facingX = dx;
  state.player.facingY = dy;

  state.projectiles.push({
    id: "arrow-" + Date.now() + "-" + Math.random().toString(36).slice(2),
    type: "arrow",
    x: state.player.x + dx * 22,
    y: state.player.y + dy * 22 - 10,
    vx: dx * 430,
    vy: dy * 430,
    rotation: Math.atan2(dy, dx),
    life: 1.05,
    damage: 2
  });

  notify("Flèche tirée — " + state.inventory.arrows + " restantes.");
  saveGame();
  return true;
}

function killAnimal(animal, notify) {
  state.deadAnimals.add(animal.id);
  const meat = animal.type === "deer" ? 4 : 2;
  const hide = animal.type === "deer" ? 2 : 1;
  addItem("meat", meat);
  addItem("hide", hide);
  notify((animal.type === "deer" ? "Petit cerf" : "Lapin") + " touché : +" + meat + " viande, +" + hide + " peau.");
  saveGame();
}

export function updateProjectiles(dt, notify) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    let remove = p.life <= 0;

    if (!remove && p.type === "arrow") {
      for (const animal of getNearbyAnimals(p.x, p.y)) {
        if (distance(p.x, p.y, animal.x, animal.y - 6) > 18) continue;
        animal.hp -= p.damage;
        animal.hurtTimer = .32;
        remove = true;
        if (animal.hp <= 0) killAnimal(animal, notify);
        break;
      }
    }

    if (remove) state.projectiles.splice(i, 1);
  }
}
