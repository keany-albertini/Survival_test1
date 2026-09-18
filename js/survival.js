import { state, clamp } from "./data.js?v=9";

export function updateSurvival(dt, moving, sprinting) {
  state.dayProgress += dt / 300;
  if (state.dayProgress >= 1) {
    state.dayProgress -= 1;
    state.dayCount += 1;
  }

  state.player.hunger = clamp(state.player.hunger - dt * .085, 0, 100);
  state.player.thirst = clamp(state.player.thirst - dt * .13, 0, 100);

  if (sprinting && moving) {
    state.player.stamina = clamp(state.player.stamina - dt * 20, 0, 100);
  } else {
    state.player.stamina = clamp(state.player.stamina + dt * 13, 0, 100);
  }

  if (state.player.hunger <= 0 || state.player.thirst <= 0) {
    const both = state.player.hunger <= 0 && state.player.thirst <= 0;
    state.player.health = clamp(state.player.health - dt * (both ? 5 : 2.5), 0, 100);
  } else if (state.player.hunger > 65 && state.player.thirst > 65) {
    state.player.health = clamp(state.player.health + dt * .45, 0, 100);
  }

  if (state.player.health <= 0) state.gameOver = true;
}
