export const WORLD_SEED = 73191;
export const CHUNK_SIZE = 520;
export const SAVE_KEY = "survie-2d-prototype-v1";

export const ITEM_DATA = {
  branch: { label: "Branches", icon: "🪵", description: "Bois léger de fabrication." },
  fiber: { label: "Fibres", icon: "🌿", description: "Fibres végétales souples." },
  stone: { label: "Pierre", icon: "🪨", description: "Pierre brute pour les outils." },
  ore: { label: "Minerai", icon: "⛏️", description: "Minerai métallique brut." },
  berries: { label: "Baies", icon: "🫐", description: "Restaure un peu faim et soif.", usable: true },
  meat: { label: "Viande", icon: "🥩", description: "Viande crue issue de la chasse.", usable: true },
  hide: { label: "Peau", icon: "🟫", description: "Peau animale pour les futurs crafts." },
  bandage: { label: "Bandage", icon: "🩹", description: "Restaure 25 points de vie.", usable: true }
};

export const RECIPES = [
  { id: "axe", label: "Hache de pierre", icon: "🪓", description: "Coupe les petits arbres et augmente le bois récolté.", cost: { branch: 5, stone: 3, fiber: 2 }, tool: true },
  { id: "pickaxe", label: "Pioche de pierre", icon: "⛏️", description: "Extrait le minerai et augmente la pierre récoltée.", cost: { branch: 5, stone: 4, fiber: 2 }, tool: true },
  { id: "spear", label: "Lance", icon: "🔱", description: "Augmente la portée et les dégâts pendant la chasse.", cost: { branch: 4, stone: 2, fiber: 3 }, tool: true },
  { id: "bandage", label: "Bandage", icon: "🩹", description: "Un soin simple fabriqué avec des fibres.", cost: { fiber: 5 }, output: { bandage: 1 } }
];

export const RESOURCE_INFO = {
  branch: { prompt: "Ramasser les branches" },
  fiber: { prompt: "Récolter les fibres" },
  stone: { prompt: "Ramasser la pierre" },
  ore: { prompt: "Extraire le minerai" },
  berries: { prompt: "Cueillir les baies" },
  tree: { prompt: "Couper le petit arbre" },
  pond: { prompt: "Boire" }
};

export const state = {
  player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100, facingX: 0, facingY: 1 },
  camera: { x: 0, y: 0 },
  inventory: { branch: 0, fiber: 0, stone: 0, ore: 0, berries: 0, meat: 0, hide: 0, bandage: 0 },
  tools: { axe: false, pickaxe: false, spear: false },
  removedResources: new Set(),
  deadAnimals: new Set(),
  chunkCache: new Map(),
  animalStates: new Map(),
  dayCount: 1,
  dayProgress: 0.31,
  gameOver: false
};

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function hashRand(a, b, c) {
  const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + WORLD_SEED * 0.013) * 43758.5453123;
  return n - Math.floor(n);
}
