import { state, distance } from "./data.js";
import { getNearbyAnimals } from "./world.js";
import { addItem } from "./harvest.js";
import { saveGame } from "./save.js";

export function hunt(notify) {
  if (state.gameOver) return false;
  const range = state.tools.spear ? 88 : 45;
  let target = null;
  let best = range;

  for (const animal of getNearbyAnimals()) {
    const d = distance(state.player.x, state.player.y, animal.x, animal.y);
    if (d < best) { best = d; target = animal; }
  }

  if (!target) {
    notify(state.tools.spear ? "Aucun animal à portée de lance." : "Approchez-vous davantage.");
    return false;
  }

  target.hp -= state.tools.spear ? 2 : 1;
  target.hurtTimer = .28;
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  target.x += dx / len * 20;
  target.y += dy / len * 20;

  if (target.hp <= 0) {
    state.deadAnimals.add(target.id);
    const meat = target.type === "deer" ? 4 : 2;
    const hide = target.type === "deer" ? 2 : 1;
    addItem("meat", meat);
    addItem("hide", hide);
    notify((target.type === "deer" ? "Petit cerf" : "Lapin") + " chassé : +" + meat + " viande.");
    saveGame();
  } else {
    notify("Touché ! " + target.hp + "/" + target.maxHp + " PV");
  }
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
