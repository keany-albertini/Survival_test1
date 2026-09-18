import { state, distance } from "./data.js?v=9";
import { getNearbyAnimals } from "./world.js?v=9";
import { addItem } from "./harvest.js?v=9";
import { saveGame } from "./save.js?v=9";

export function hunt(notify) {
  if (state.gameOver) return false;

  if (state.equipped === "bow" && (state.inventory.arrows || 0) <= 0) {
    notify("L'arc est vide : fabriquez des flèches.");
    return false;
  }

  const range = state.equipped === "bow" ? 160 : state.equipped === "spear" ? 90 : 50;
  let target = null;
  let best = range;

  for (const animal of getNearbyAnimals()) {
    const d = distance(state.player.x, state.player.y, animal.x, animal.y);
    if (d < best) {
      best = d;
      target = animal;
    }
  }

  if (!target) {
    notify(state.equipped === "bow" ? "Aucun animal à portée de l'arc." : "Approchez-vous davantage.");
    return false;
  }

  if (state.equipped === "bow") {
    state.inventory.arrows -= 1;
  }

  let damage = 1;
  if (state.equipped === "bow") damage = 2;
  else if (state.equipped === "sword") damage = 2.5;
  else if (state.equipped === "spear") damage = 2;
  else if (state.equipped === "axe") damage = 1.4;
  else if (state.equipped === "pickaxe") damage = 1.2;
  else if (state.equipped === "shield") damage = .8;

  target.hp -= damage;
  target.hurtTimer = .28;

  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  const knockback = state.equipped === "bow" ? 8 : 20;
  target.x += dx / len * knockback;
  target.y += dy / len * knockback;

  if (target.hp <= 0) {
    state.deadAnimals.add(target.id);
    const meat = target.type === "deer" ? 4 : 2;
    const hide = target.type === "deer" ? 2 : 1;
    addItem("meat", meat);
    addItem("hide", hide);
    notify((target.type === "deer" ? "Petit cerf" : "Lapin") + " chassé : +" + meat + " viande, +" + hide + " peau.");
  } else if (state.equipped === "bow") {
    notify("Flèche tirée — " + state.inventory.arrows + " restantes.");
  } else {
    notify("Touché ! " + Math.max(0, target.hp).toFixed(1) + "/" + target.maxHp + " PV");
  }

  saveGame();
  return true;
}

export function updateAnimals(dt) {
  for (const animal of getNearbyAnimals()) {
    if (animal.hurtTimer > 0) animal.hurtTimer -= dt;
    animal.wanderTimer -= dt;

    const dx = animal.x - state.player.x;
    const dy = animal.y - state.player.y;
    const d = Math.hypot(dx, dy) || 1;

    if (d < 155) {
      const speed = animal.type === "deer" ? 118 : 96;
      animal.vx = dx / d * speed;
      animal.vy = dy / d * speed;
    } else if (animal.wanderTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = animal.type === "deer" ? 30 : 24;
      animal.vx = Math.cos(angle) * speed;
      animal.vy = Math.sin(angle) * speed;
      animal.wanderTimer = 1.5 + Math.random() * 3;
    }

    animal.vx *= Math.pow(.985, dt * 60);
    animal.vy *= Math.pow(.985, dt * 60);
    animal.x += animal.vx * dt;
    animal.y += animal.vy * dt;
  }
}
