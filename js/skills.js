import { state } from "./data.js?v=19";

export const SKILL_DATA = {
  woodcutting: {
    label: "Abattage",
    icon: "🪓",
    description: "Progresse à chaque coup de hache porté sur un arbre."
  },
  gathering: {
    label: "Ramassage",
    icon: "🖐️",
    description: "Progresse quand vous ramassez à la main branches, fibres, pierres et baies."
  },
  mining: {
    label: "Minage",
    icon: "⛏️",
    description: "Progresse à chaque coup de pioche sur rochers et minerais."
  },
  crafting: {
    label: "Craft",
    icon: "🔨",
    description: "Progresse à chaque fabrication réussie."
  }
};

export function xpNeededForLevel(level) {
  return 40 + (level - 1) * 25;
}

export function addSkillXP(id, amount, notify) {
  const skill = state.skills[id];
  if (!skill || !Number.isFinite(amount) || amount <= 0) return false;

  skill.xp += amount;
  let leveled = false;

  while (skill.xp >= xpNeededForLevel(skill.level)) {
    skill.xp -= xpNeededForLevel(skill.level);
    skill.level += 1;
    leveled = true;
  }

  if (leveled && notify) {
    notify(SKILL_DATA[id].icon + " " + SKILL_DATA[id].label + " niveau " + skill.level + " !");
  }

  return leveled;
}

export function getSkillProgress(id) {
  const skill = state.skills[id];
  const needed = xpNeededForLevel(skill.level);
  return {
    level: skill.level,
    xp: skill.xp,
    needed,
    percent: Math.max(0, Math.min(100, skill.xp / needed * 100))
  };
}
