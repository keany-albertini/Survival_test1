import { CHUNK_SIZE, state, hashRand, distance } from "./data.js?v=13";

function chunkKey(cx, cy) { return cx + ":" + cy; }
function objectId(cx, cy, kind, i) { return cx + ":" + cy + ":" + kind + ":" + i; }

export function generateChunk(cx, cy) {
  const key = chunkKey(cx, cy);
  if (state.chunkCache.has(key)) return state.chunkCache.get(key);

  const resources = [];
  const decor = [];
  const animals = [];
  const baseX = cx * CHUNK_SIZE;
  const baseY = cy * CHUNK_SIZE;
  const resourceCount = 20 + Math.floor(hashRand(cx, cy, 401) * 10);

  for (let i = 0; i < resourceCount; i++) {
    const x = baseX + 30 + hashRand(cx, cy, i * 5 + 1) * (CHUNK_SIZE - 60);
    const y = baseY + 30 + hashRand(cx, cy, i * 5 + 2) * (CHUNK_SIZE - 60);
    const roll = hashRand(cx, cy, i * 5 + 3);

    let type = "branch";
    if (roll < .18) type = "branch";
    else if (roll < .34) type = "fiber";
    else if (roll < .48) type = "stone";
    else if (roll < .58) type = "berries";
    else if (roll < .70) type = "tree";
    else if (roll < .79) type = "large_rock";
    else if (roll < .86) type = "copper_ore";
    else if (roll < .91) type = "tin_ore";
    else if (roll < .97) type = "ore";
    else type = "gold_ore";

    resources.push({
      id: objectId(cx, cy, "r", i),
      type, x, y,
      variant: Math.floor(hashRand(cx, cy, i * 5 + 4) * 4)
    });
  }

  if (hashRand(cx, cy, 997) > .55) {
    resources.push({
      id: objectId(cx, cy, "pond", 0), type: "pond",
      x: baseX + 80 + hashRand(cx, cy, 998) * (CHUNK_SIZE - 160),
      y: baseY + 90 + hashRand(cx, cy, 999) * (CHUNK_SIZE - 180), variant: 0
    });
  }

  const decorCount = 12 + Math.floor(hashRand(cx, cy, 222) * 10);
  for (let i = 0; i < decorCount; i++) {
    decor.push({
      id: objectId(cx, cy, "d", i),
      type: hashRand(cx, cy, 500 + i) > .35 ? "grass" : "flower",
      x: baseX + hashRand(cx, cy, 600 + i * 2) * CHUNK_SIZE,
      y: baseY + hashRand(cx, cy, 601 + i * 2) * CHUNK_SIZE,
      variant: Math.floor(hashRand(cx, cy, 700 + i) * 3)
    });
  }

  const animalCount = 1 + Math.floor(hashRand(cx, cy, 333) * 3);
  for (let i = 0; i < animalCount; i++) {
    animals.push({
      id: objectId(cx, cy, "a", i),
      type: hashRand(cx, cy, 810 + i) > .72 ? "deer" : "rabbit",
      x: baseX + 60 + hashRand(cx, cy, 820 + i * 3) * (CHUNK_SIZE - 120),
      y: baseY + 60 + hashRand(cx, cy, 821 + i * 3) * (CHUNK_SIZE - 120)
    });
  }

  if (cx === 0 && cy === 0) {
    resources.push(
      { id: "starter:branch", type: "branch", x: 78, y: 38, variant: 0 },
      { id: "starter:fiber", type: "fiber", x: -94, y: 46, variant: 1 },
      { id: "starter:stone", type: "stone", x: 42, y: -96, variant: 0 },
      { id: "starter:berries", type: "berries", x: -74, y: -84, variant: 2 },
      { id: "starter:tree", type: "tree", x: 132, y: 40, variant: 1 },
      { id: "starter:rock", type: "large_rock", x: 160, y: 110, variant: 0 },
      { id: "starter:copper", type: "copper_ore", x: -165, y: 112, variant: 1 },
      { id: "starter:pond", type: "pond", x: 190, y: -122, variant: 0 }
    );
  }

  const chunk = { cx, cy, resources, decor, animals };
  state.chunkCache.set(key, chunk);
  return chunk;
}

export function getChunksForView(camera, viewW, viewH, extra = 1) {
  const left = camera.x - viewW / 2 - CHUNK_SIZE * extra;
  const right = camera.x + viewW / 2 + CHUNK_SIZE * extra;
  const top = camera.y - viewH / 2 - CHUNK_SIZE * extra;
  const bottom = camera.y + viewH / 2 + CHUNK_SIZE * extra;
  const chunks = [];
  for (let cy = Math.floor(top / CHUNK_SIZE); cy <= Math.floor(bottom / CHUNK_SIZE); cy++) {
    for (let cx = Math.floor(left / CHUNK_SIZE); cx <= Math.floor(right / CHUNK_SIZE); cx++) {
      chunks.push(generateChunk(cx, cy));
    }
  }
  return chunks;
}

export function getChunksNear(x, y, radius = 1) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cy = Math.floor(y / CHUNK_SIZE);
  const result = [];
  for (let yy = cy - radius; yy <= cy + radius; yy++) {
    for (let xx = cx - radius; xx <= cx + radius; xx++) result.push(generateChunk(xx, yy));
  }
  return result;
}

export function getAnimalState(def) {
  if (state.animalStates.has(def.id)) return state.animalStates.get(def.id);
  const isDeer = def.type === "deer";
  const animal = {
    id: def.id, type: def.type, x: def.x, y: def.y, vx: 0, vy: 0,
    hp: isDeer ? 4 : 1, maxHp: isDeer ? 4 : 1,
    wanderTimer: hashRand(Math.floor(def.x), Math.floor(def.y), 91) * 2,
    hurtTimer: 0
  };
  state.animalStates.set(def.id, animal);
  return animal;
}

export function getNearbyAnimals(x = state.player.x, y = state.player.y) {
  const result = [];
  for (const chunk of getChunksNear(x, y, 1)) {
    for (const def of chunk.animals) {
      if (!state.deadAnimals.has(def.id)) result.push(getAnimalState(def));
    }
  }
  return result;
}

export function getNearestResource(maxDistance = 76) {
  const p = state.player;
  let nearest = null;
  let best = maxDistance;

  for (const chunk of getChunksNear(p.x, p.y, 1)) {
    for (const resource of chunk.resources) {
      if (resource.type !== "pond" && state.removedResources.has(resource.id)) continue;
      const d = distance(p.x, p.y, resource.x, resource.y);
      if (d < best) {
        best = d;
        nearest = resource;
      }
    }
  }
  return nearest;
}

export function getNearestAnimal(maxDistance = state.equipped === "bow" ? 160 : state.equipped === "spear" ? 90 : 50) {
  const p = state.player;
  let nearest = null;
  let best = maxDistance;

  for (const animal of getNearbyAnimals()) {
    const d = distance(p.x, p.y, animal.x, animal.y);
    if (d < best) {
      best = d;
      nearest = animal;
    }
  }
  return nearest;
}

export function getSmartTarget() {
  const p = state.player;
  const resource = getNearestResource();
  const animal = getNearestAnimal();

  if (!resource && !animal) return null;
  if (!resource) return { type: "animal", value: animal };
  if (!animal) return { type: "resource", value: resource };

  const resourceDistance = distance(p.x, p.y, resource.x, resource.y);
  const animalDistance = distance(p.x, p.y, animal.x, animal.y);

  return animalDistance + 4 < resourceDistance
    ? { type: "animal", value: animal }
    : { type: "resource", value: resource };
}
