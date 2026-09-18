export const WORLD_SEED = 73191;
export const CHUNK_SIZE = 520;
export const SAVE_KEY = "survie-2d-prototype-v1";

export const ITEM_DATA = {
  branch: { label: "Branches", icon: "🪵", description: "Bois léger de fabrication." },
  fiber: { label: "Fibres", icon: "🌿", description: "Fibres végétales souples." },
  stone: { label: "Pierre", icon: "🪨", description: "Pierre brute pour les outils." },
  ore: { label: "Minerai", icon: "⛏️", description: "Minerai métallique brut." },
  berries: { label: "Baies", icon: "🫐", description: "Restaure faim et un peu de soif.", usable: true },
  meat: { label: "Viande", icon: "🥩", description: "Restaure un peu de faim.", usable: true },
  water: { label: "Eau", icon: "💧", description: "Restaure fortement la soif.", usable: true },
  hide: { label: "Peau", icon: "🟫", description: "Peau animale utile pour les armures." },
  bandage: { label: "Bandage", icon: "🩹", description: "Restaure 25 points de vie.", usable: true },
  campfire: { label: "Feu de camp", icon: "🔥", description: "Objet à placer plus tard dans le monde." },
  workbench: { label: "Atelier", icon: "🛠️", description: "Établi de fabrication avancée, prêt à être placé plus tard." },
  leather_helmet: { label: "Coiffe en cuir", icon: "🪖", description: "Protection légère pour la tête.", armorSlot: "head" },
  leather_chest: { label: "Plastron en cuir", icon: "🥋", description: "Protection légère pour le torse.", armorSlot: "chest" },
  leather_legs: { label: "Jambières en cuir", icon: "👖", description: "Protection légère pour les jambes.", armorSlot: "legs" },
  leather_boots: { label: "Bottes en cuir", icon: "🥾", description: "Protection légère pour les pieds.", armorSlot: "feet" }
};

export const TOOL_DATA = {
  axe: { label: "Hache", icon: "🪓" },
  pickaxe: { label: "Pioche", icon: "⛏️" },
  spear: { label: "Lance", icon: "🔱" },
  bow: { label: "Arc", icon: "🏹" },
  sword: { label: "Épée", icon: "🗡️" },
  shield: { label: "Bouclier", icon: "🛡️" }
};

export const QUICKBAR_ORDER = ["axe","pickaxe","spear","bow","sword","shield","berries","meat","water","bandage"];

export const ARMOR_DATA = {
  leather_helmet: { label: "Coiffe en cuir", icon: "🪖", slot: "head" },
  leather_chest: { label: "Plastron en cuir", icon: "🥋", slot: "chest" },
  leather_legs: { label: "Jambières en cuir", icon: "👖", slot: "legs" },
  leather_boots: { label: "Bottes en cuir", icon: "🥾", slot: "feet" }
};

export const RECIPES = [
  { id: "axe", label: "Hache de pierre", icon: "🪓", category: "Outils", description: "Coupe les petits arbres et améliore le bois récolté.", cost: { branch: 5, stone: 3, fiber: 2 }, tool: true },
  { id: "pickaxe", label: "Pioche de pierre", icon: "⛏️", category: "Outils", description: "Extrait le minerai et améliore la pierre récoltée.", cost: { branch: 5, stone: 4, fiber: 2 }, tool: true },
  { id: "spear", label: "Lance", icon: "🔱", category: "Armes", description: "Bonne portée pour chasser.", cost: { branch: 4, stone: 2, fiber: 3 }, tool: true },
  { id: "bow", label: "Arc simple", icon: "🏹", category: "Armes", description: "Permet de chasser à plus longue distance.", cost: { branch: 7, fiber: 6 }, tool: true },
  { id: "sword", label: "Épée rudimentaire", icon: "🗡️", category: "Armes", description: "Arme de mêlée plus puissante.", cost: { branch: 3, stone: 4, ore: 5 }, tool: true },
  { id: "shield", label: "Bouclier", icon: "🛡️", category: "Armes", description: "Bouclier de fortune pour la défense future.", cost: { branch: 8, hide: 2, fiber: 3 }, tool: true },
  { id: "bandage", label: "Bandage", icon: "🩹", category: "Survie", description: "Un soin simple fabriqué avec des fibres.", cost: { fiber: 5 }, output: { bandage: 1 } },
  { id: "campfire", label: "Feu de camp", icon: "🔥", category: "Survie", description: "Premier objet de camp. La pose dans le monde viendra ensuite.", cost: { branch: 8, stone: 6 }, output: { campfire: 1 } },
  { id: "workbench", label: "Atelier", icon: "🛠️", category: "Structures", description: "Établi pour les futurs crafts avancés.", cost: { branch: 14, stone: 8, fiber: 5 }, output: { workbench: 1 } },
  { id: "leather_helmet", label: "Coiffe en cuir", icon: "🪖", category: "Armures", description: "Armure légère de tête.", cost: { hide: 2, fiber: 2 }, output: { leather_helmet: 1 } },
  { id: "leather_chest", label: "Plastron en cuir", icon: "🥋", category: "Armures", description: "Armure légère du torse.", cost: { hide: 4, fiber: 4 }, output: { leather_chest: 1 } },
  { id: "leather_legs", label: "Jambières en cuir", icon: "👖", category: "Armures", description: "Armure légère pour les jambes.", cost: { hide: 3, fiber: 3 }, output: { leather_legs: 1 } },
  { id: "leather_boots", label: "Bottes en cuir", icon: "🥾", category: "Armures", description: "Armure légère pour les pieds.", cost: { hide: 2, fiber: 2 }, output: { leather_boots: 1 } }
];

export const RESOURCE_INFO = {
  branch: { prompt: "Ramasser les branches" },
  fiber: { prompt: "Récolter les fibres" },
  stone: { prompt: "Ramasser la pierre" },
  ore: { prompt: "Extraire le minerai" },
  berries: { prompt: "Cueillir les baies" },
  tree: { prompt: "Couper le petit arbre" },
  pond: { prompt: "Boire / remplir une gourde" }
};

export const state = {
  player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100, facingX: 0, facingY: 1 },
  camera: { x: 0, y: 0 },
  inventory: {
    branch: 0, fiber: 0, stone: 0, ore: 0, berries: 0, meat: 0, water: 0, hide: 0, bandage: 0,
    campfire: 0, workbench: 0,
    leather_helmet: 0, leather_chest: 0, leather_legs: 0, leather_boots: 0
  },
  tools: { axe: false, pickaxe: false, spear: false, bow: false, sword: false, shield: false },
  equipped: null,
  armor: { head: null, chest: null, legs: null, feet: null },
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
