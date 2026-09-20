import { state } from "./data.js?v=19";

export const DAYS_PER_SEASON = 3;

export const SEASONS = [
  {
    id: "spring", label: "Printemps", icon: "🌱",
    palette: {
      ground: "#718a55", groundLight: "#8fa56b", groundDark: "#526c45",
      soil: "#876f50", soilLight: "#aa8d66",
      leafDark: "#254d32", leaf: "#477b45", leafLight: "#82aa5b", leafAccent: "#a5c876",
      evergreenDark: "#203f34", evergreen: "#315c43", evergreenLight: "#52785a",
      flowerA: "#efe5c3", flowerB: "#d9c8ec", flowerC: "#f1c18e",
      water: "#397f91", waterLight: "#89c6c0",
      stoneDark: "#59615b", stone: "#777f77", stoneLight: "#a5aca2",
      woodDark: "#4b3020", wood: "#765036", woodLight: "#a2774d",
      overlay: "rgba(219,239,181,.035)"
    }
  },
  {
    id: "summer", label: "Été", icon: "☀️",
    palette: {
      ground: "#71864d", groundLight: "#98a95e", groundDark: "#4f6840",
      soil: "#90704a", soilLight: "#b28d5d",
      leafDark: "#1f432b", leaf: "#376a39", leafLight: "#6f9749", leafAccent: "#95b75a",
      evergreenDark: "#19382f", evergreen: "#28533b", evergreenLight: "#456f4d",
      flowerA: "#f0dfab", flowerB: "#d8b9e8", flowerC: "#e8aa72",
      water: "#32798d", waterLight: "#7fbebc",
      stoneDark: "#575e59", stone: "#737a72", stoneLight: "#9ca49a",
      woodDark: "#472d1d", wood: "#70492f", woodLight: "#9a6f45",
      overlay: "rgba(238,199,112,.045)"
    }
  },
  {
    id: "autumn", label: "Automne", icon: "🍂",
    palette: {
      ground: "#847f4d", groundLight: "#a89657", groundDark: "#605d3d",
      soil: "#8d6544", soilLight: "#b27e52",
      leafDark: "#673b29", leaf: "#a15432", leafLight: "#d17b36", leafAccent: "#e1a14c",
      evergreenDark: "#1f3b31", evergreen: "#31523b", evergreenLight: "#4e704d",
      flowerA: "#d7c99a", flowerB: "#b68aa8", flowerC: "#d78852",
      water: "#3b7480", waterLight: "#84acaa",
      stoneDark: "#595951", stone: "#76756b", stoneLight: "#9f9b8c",
      woodDark: "#492d1e", wood: "#71462e", woodLight: "#a06e43",
      overlay: "rgba(190,103,47,.07)"
    }
  },
  {
    id: "winter", label: "Hiver", icon: "❄️",
    palette: {
      ground: "#7d887b", groundLight: "#aeb8aa", groundDark: "#5d6a61",
      soil: "#786b5a", soilLight: "#9b8c76",
      leafDark: "#394a3d", leaf: "#536454", leafLight: "#768273", leafAccent: "#939d91",
      evergreenDark: "#18362f", evergreen: "#294c3d", evergreenLight: "#496959",
      flowerA: "#d5dde0", flowerB: "#cad1dc", flowerC: "#d9d4ca",
      water: "#527886", waterLight: "#b5d0d2",
      stoneDark: "#5e6462", stone: "#7b8180", stoneLight: "#adb4b2",
      woodDark: "#443126", wood: "#695040", woodLight: "#927462",
      snow: "#dce3dd", snowShade: "#bac8c7",
      overlay: "rgba(155,190,207,.075)"
    }
  }
];

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function parseHex(hex) {
  const value = String(hex || "#000000").replace("#", "");
  if (value.length !== 6) return [0,0,0];
  return [
    parseInt(value.slice(0,2),16),
    parseInt(value.slice(2,4),16),
    parseInt(value.slice(4,6),16)
  ];
}

function toHex(v) {
  return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
}

export function mixHex(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return "#" + toHex(ca[0] + (cb[0]-ca[0])*t) +
    toHex(ca[1] + (cb[1]-ca[1])*t) +
    toHex(ca[2] + (cb[2]-ca[2])*t);
}

function mixPalette(a, b, t) {
  const result = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "string" && av.startsWith("#") && typeof bv === "string" && bv.startsWith("#")) {
      result[key] = mixHex(av, bv, t);
    } else {
      result[key] = t < .5 ? (av ?? bv) : (bv ?? av);
    }
  }
  return result;
}

export function getSeasonState(dayCount = state.dayCount, dayProgress = state.dayProgress) {
  const totalDays = Math.max(0, (dayCount - 1) + dayProgress);
  const seasonFloat = totalDays / DAYS_PER_SEASON;
  const index = Math.floor(seasonFloat) % SEASONS.length;
  const phase = seasonFloat - Math.floor(seasonFloat);
  const nextIndex = (index + 1) % SEASONS.length;
  const transition = smoothstep(.72, 1, phase);
  const current = SEASONS[index];
  const next = SEASONS[nextIndex];

  return {
    index,
    id: current.id,
    label: current.label,
    icon: current.icon,
    phase,
    transition,
    nextId: next.id,
    nextLabel: next.label,
    palette: mixPalette(current.palette, next.palette, transition)
  };
}

export function getSeasonDay(dayCount = state.dayCount) {
  return ((Math.max(1, dayCount) - 1) % DAYS_PER_SEASON) + 1;
}
