export const WORLD_SEED = 73191;
export const CHUNK_SIZE = 520;
export const SAVE_KEY = "survie-2d-prototype-v1";

export const ITEM_DATA = {
  branch: { label: "Branches", icon: "🪵", description: "Bois léger de fabrication." },
  fiber: { label: "Fibres", icon: "🌿", description: "Fibres végétales souples." },
  stone: { label: "Pierre", icon: "🪨", description: "Pierre brute ramassée ou extraite." },
  ore: { label: "Métal brut", icon: "⛏️", description: "Minerai métallique brut." },
  copper_ore: { label: "Cuivre", icon: "🟠", description: "Minerai de cuivre brut." },
  tin_ore: { label: "Étain", icon: "⚪", description: "Minerai d'étain brut." },
  gold_ore: { label: "Or", icon: "🟡", description: "Minerai d'or brut." },
  arrows: { label: "Flèches", icon: "➶", description: "Munitions pour l'arc." },
  berries: { label: "Baies", icon: "🫐", description: "Restaure faim et un peu de soif.", usable: true },
  meat: { label: "Viande", icon: "🥩", description: "Restaure un peu de faim.", usable: true },
  water: { label: "Eau", icon: "💧", description: "Restaure fortement la soif.", usable: true },
  hide: { label: "Peau", icon: "🟫", description: "Peau animale utile pour les armures." },
  bandage: { label: "Bandage", icon: "🩹", description: "Restaure 25 points de vie.", usable: true },

  campfire: { label: "Feu de camp", icon: "🔥", description: "Permettra de cuire les aliments.", placeable: "campfire" },
  workbench: { label: "Atelier", icon: "🛠️", description: "Établi pour les futurs crafts avancés.", placeable: "workbench" },
  forge: { label: "Forge", icon: "⚒️", description: "Forge pour le travail du métal.", placeable: "forge" },
  bed: { label: "Lit", icon: "🛏️", description: "Lit de survie pour une future réapparition.", placeable: "bed" },
  chest: { label: "Coffre", icon: "📦", description: "Coffre de stockage.", placeable: "chest" },
  wood_foundation: { label: "Fondation bois", icon: "▰", description: "Base de construction en bois.", placeable: "wood_foundation" },
  wood_wall: { label: "Mur bois", icon: "▥", description: "Mur en bois qui s'accroche aux fondations.", placeable: "wood_wall" },

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

export const BUILDING_DATA = {
  campfire: { itemId: "campfire", label: "Feu de camp", icon: "🔥", snap: "free", footprint: 34 },
  workbench: { itemId: "workbench", label: "Atelier", icon: "🛠️", snap: "free", footprint: 46 },
  forge: { itemId: "forge", label: "Forge", icon: "⚒️", snap: "free", footprint: 48 },
  bed: { itemId: "bed", label: "Lit", icon: "🛏️", snap: "free", footprint: 48 },
  chest: { itemId: "chest", label: "Coffre", icon: "📦", snap: "free", footprint: 36 },
  wood_foundation: { itemId: "wood_foundation", label: "Fondation bois", icon: "▰", snap: "grid", footprint: 62 },
  wood_wall: { itemId: "wood_wall", label: "Mur bois", icon: "▥", snap: "foundation-edge", footprint: 60 }
};

export const RESOURCE_DATA = {
  branch: { tool: null, hits: 1, yield: { branch: 2 }, label: "branches" },
  fiber: { tool: null, hits: 1, yield: { fiber: 3 }, label: "fibres" },
  stone: { tool: null, hits: 1, yield: { stone: 1 }, label: "petite pierre" },
  berries: { tool: null, hits: 1, yield: { berries: 3, fiber: 1 }, label: "baies" },
  tree: { tool: "axe", hits: 4, yield: { branch: 10 }, label: "arbre" },
  large_rock: { tool: "pickaxe", hits: 4, yield: { stone: 6 }, label: "gros rocher" },
  copper_ore: { tool: "pickaxe", hits: 4, yield: { copper_ore: 4 }, label: "filon de cuivre" },
  tin_ore: { tool: "pickaxe", hits: 4, yield: { tin_ore: 4 }, label: "filon d'étain" },
  ore: { tool: "pickaxe", hits: 5, yield: { ore: 4 }, label: "filon de métal" },
  gold_ore: { tool: "pickaxe", hits: 5, yield: { gold_ore: 3 }, label: "filon d'or" }
};

export const RECIPES = [
  { id: "axe", label: "Hache de pierre", icon: "🪓", category: "Outils", description: "Coupe les arbres en 4 coups.", cost: { branch: 5, stone: 3, fiber: 2 }, tool: true },
  { id: "pickaxe", label: "Pioche de pierre", icon: "⛏️", category: "Outils", description: "Extrait gros rochers, cuivre, étain, métal et or.", cost: { branch: 5, stone: 4, fiber: 2 }, tool: true },

  { id: "spear", label: "Lance", icon: "🔱", category: "Armes", description: "Bonne portée pour chasser.", cost: { branch: 4, stone: 2, fiber: 3 }, tool: true },
  { id: "bow", label: "Arc simple", icon: "🏹", category: "Armes", description: "Arme à distance. Nécessite des flèches.", cost: { branch: 7, fiber: 6 }, tool: true },
  { id: "arrows", label: "Flèches x5", icon: "➶", category: "Armes", description: "Fabrique 5 flèches pour l'arc.", cost: { branch: 2, stone: 1, fiber: 2 }, output: { arrows: 5 } },
  { id: "sword", label: "Épée rudimentaire", icon: "🗡️", category: "Armes", description: "Arme de mêlée puissante.", cost: { branch: 3, stone: 4, ore: 5 }, tool: true },
  { id: "shield", label: "Bouclier", icon: "🛡️", category: "Armes", description: "Bouclier de fortune.", cost: { branch: 8, hide: 2, fiber: 3 }, tool: true },

  { id: "bandage", label: "Bandage", icon: "🩹", category: "Survie", description: "Restaure de la vie.", cost: { fiber: 5 }, output: { bandage: 1 } },
  { id: "campfire", label: "Feu de camp", icon: "🔥", category: "Survie", description: "À crafter puis placer dans le monde.", cost: { branch: 8, stone: 6 }, output: { campfire: 1 } },
  { id: "bed", label: "Lit", icon: "🛏️", category: "Survie", description: "Lit simple à placer.", cost: { branch: 8, fiber: 10, hide: 3 }, output: { bed: 1 } },

  { id: "chest", label: "Coffre", icon: "📦", category: "Structures", description: "Coffre à poser dans votre base.", cost: { branch: 12, fiber: 4 }, output: { chest: 1 } },
  { id: "workbench", label: "Atelier", icon: "🛠️", category: "Structures", description: "Atelier à poser dans votre base.", cost: { branch: 14, stone: 8, fiber: 5 }, output: { workbench: 1 } },
  { id: "forge", label: "Forge", icon: "⚒️", category: "Structures", description: "Forge à poser pour le futur travail du métal.", cost: { stone: 16, ore: 8, branch: 6 }, output: { forge: 1 } },
  { id: "wood_foundation", label: "Fondation bois", icon: "▰", category: "Construction", description: "Première fondation de votre base.", cost: { branch: 12, fiber: 3 }, output: { wood_foundation: 1 } },
  { id: "wood_wall", label: "Mur bois", icon: "▥", category: "Construction", description: "Se fixe sur un bord libre d'une fondation.", cost: { branch: 9, fiber: 3 }, output: { wood_wall: 1 } },

  { id: "leather_helmet", label: "Coiffe en cuir", icon: "🪖", category: "Armures", description: "Armure légère de tête.", cost: { hide: 2, fiber: 2 }, output: { leather_helmet: 1 } },
  { id: "leather_chest", label: "Plastron en cuir", icon: "🥋", category: "Armures", description: "Armure légère du torse.", cost: { hide: 4, fiber: 4 }, output: { leather_chest: 1 } },
  { id: "leather_legs", label: "Jambières en cuir", icon: "👖", category: "Armures", description: "Armure légère pour les jambes.", cost: { hide: 3, fiber: 3 }, output: { leather_legs: 1 } },
  { id: "leather_boots", label: "Bottes en cuir", icon: "🥾", category: "Armures", description: "Armure légère pour les pieds.", cost: { hide: 2, fiber: 2 }, output: { leather_boots: 1 } }
];

export const RESOURCE_INFO = {
  branch: { prompt: "Ramasser les branches" },
  fiber: { prompt: "Récolter les fibres" },
  stone: { prompt: "Ramasser la petite pierre" },
  large_rock: { prompt: "Casser le gros rocher" },
  copper_ore: { prompt: "Extraire le cuivre" },
  tin_ore: { prompt: "Extraire l'étain" },
  ore: { prompt: "Extraire le métal" },
  gold_ore: { prompt: "Extraire l'or" },
  berries: { prompt: "Cueillir les baies" },
  tree: { prompt: "Couper l'arbre" },
  pond: { prompt: "Boire / remplir une gourde" }
};

export const state = {
  player: {
    x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100,
    facingX: 0, facingY: 1, actionTimer: 0, actionType: null
  },
  camera: { x: 0, y: 0 },
  inventory: {
    branch: 0, fiber: 0, stone: 0, ore: 0, copper_ore: 0, tin_ore: 0, gold_ore: 0,
    arrows: 0, berries: 0, meat: 0, water: 0, hide: 0, bandage: 0,
    campfire: 0, workbench: 0, forge: 0, bed: 0, chest: 0, wood_foundation: 0, wood_wall: 0,
    leather_helmet: 0, leather_chest: 0, leather_legs: 0, leather_boots: 0
  },
  tools: { axe: false, pickaxe: false, spear: false, bow: false, sword: false, shield: false },
  equipped: null,
  armor: { head: null, chest: null, legs: null, feet: null },

  buildings: [],
  buildMode: null,
  buildPreview: null,

  resourceHits: {},
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
