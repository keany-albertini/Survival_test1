import { state, clamp } from "./data.js?v=19";
import { getChunksForView, getAnimalState } from "./world.js?v=19";
import {
  drawGround, drawDecor, drawPond, drawResource, drawBuilding,
  drawSeasonGrade, drawSeasonAtmosphere
} from "./art.js?v=19";
import { getSeasonState } from "./seasons.js?v=19";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.viewW = innerWidth;
    this.viewH = innerHeight;
    this.resize();
    addEventListener("resize", () => this.resize());
  }

  resize() {
    this.viewW = innerWidth;
    this.viewH = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(this.viewW * dpr));
    this.canvas.height = Math.max(1, Math.floor(this.viewH * dpr));
    this.canvas.style.width = this.viewW + "px";
    this.canvas.style.height = this.viewH + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  screen(x, y) {
    return { x: x - state.camera.x + this.viewW / 2, y: y - state.camera.y + this.viewH / 2 };
  }

  visible(x, y, margin = 100) {
    const p = this.screen(x, y);
    return p.x > -margin && p.y > -margin && p.x < this.viewW + margin && p.y < this.viewH + margin;
  }

  biomeColor(x, y) {
    const season = getSeasonState();
    const p = season.palette;
    const v = Math.sin(x / 760) + Math.cos(y / 860) + Math.sin((x + y) / 1240) * .65;
    if (v > 1.25) return p.groundLight;
    if (v < -1.10) return p.groundDark;
    return p.ground;
  }

    ground() {
    drawGround(this.ctx, (x,y) => this.screen(x,y), state.camera, this.viewW, this.viewH);
  }

    grass(item) {
    drawDecor(this.ctx, this.screen(item.x, item.y), item);
  }

    pond(item) {
    drawPond(this.ctx, this.screen(item.x, item.y), item);
  }

    resource(item) {
    drawResource(this.ctx, this.screen(item.x, item.y), item);
  }

    animal(animal) {
    const ctx = this.ctx;
    const p = this.screen(animal.x, animal.y);
    const season = getSeasonState();
    ctx.save();
    ctx.translate(p.x, p.y);
    if (animal.hurtTimer > 0) ctx.globalAlpha = .62;

    ctx.fillStyle = "rgba(10,14,10,.20)";
    ctx.beginPath();
    ctx.ellipse(1,7,animal.type === "deer" ? 23 : 15,animal.type === "deer" ? 7 : 5.5,0,0,Math.PI*2);
    ctx.fill();

    if (animal.type === "deer") {
      const winter = season.id === "winter";
      const bodyDark = winter ? "#6b5b4a" : "#6f5035";
      const body = winter ? "#8a745e" : "#8a6540";
      const bodyLight = winter ? "#aa9276" : "#ab8051";

      ctx.strokeStyle = bodyDark;
      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10,-1); ctx.lineTo(-11,10);
      ctx.moveTo(7,-2); ctx.lineTo(10,10);
      ctx.stroke();

      ctx.fillStyle = bodyDark;
      ctx.beginPath();
      ctx.ellipse(-1,-9,21,11,-.03,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(-2,-11,19,9.5,-.04,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = bodyLight;
      ctx.globalAlpha = .45;
      ctx.beginPath();
      ctx.ellipse(-6,-15,11,4,-.10,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = animal.hurtTimer > 0 ? .62 : 1;

      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(10,-15); ctx.lineTo(15,-29); ctx.lineTo(20,-27); ctx.lineTo(15,-11); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18,-30,7,6,-.12,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = bodyLight;
      ctx.beginPath();
      ctx.ellipse(20,-32,4.5,2.5,-.2,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "#3d3024";
      ctx.beginPath(); ctx.arc(22,-31,1.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#2b241d";
      ctx.beginPath(); ctx.ellipse(25,-28,2,1.5,0,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(15,-34);ctx.lineTo(12,-41);ctx.lineTo(18,-36);ctx.closePath();ctx.fill();
      ctx.beginPath();
      ctx.moveTo(21,-35);ctx.lineTo(25,-41);ctx.lineTo(24,-34);ctx.closePath();ctx.fill();

      ctx.strokeStyle = "#5a4632";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(15,-36);ctx.lineTo(12,-46);ctx.moveTo(12,-43);ctx.lineTo(8,-47);
      ctx.moveTo(20,-36);ctx.lineTo(22,-46);ctx.moveTo(22,-43);ctx.lineTo(26,-47);
      ctx.stroke();

      ctx.fillStyle = "#d8c4a0";
      ctx.beginPath();
      ctx.ellipse(-21,-10,4,3,0,0,Math.PI*2);
      ctx.fill();
    } else {
      const winter = season.id === "winter";
      const furDark = winter ? "#8d887d" : "#9c8d76";
      const fur = winter ? "#cbc6b9" : "#b8aa92";
      const furLight = winter ? "#ece9df" : "#d6cab4";

      ctx.fillStyle = furDark;
      ctx.beginPath();
      ctx.ellipse(-4,-3,13,8,-.12,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-5,-5,12,7,-.12,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = furLight;
      ctx.globalAlpha = .62;
      ctx.beginPath();
      ctx.ellipse(-8,-7,7,3,-.2,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = animal.hurtTimer > 0 ? .62 : 1;

      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(8,-10,7,0,Math.PI*2);
      ctx.fill();

      ctx.strokeStyle = furDark;
      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(6,-15);ctx.quadraticCurveTo(4,-24,7,-29);
      ctx.moveTo(11,-15);ctx.quadraticCurveTo(14,-24,15,-28);
      ctx.stroke();

      ctx.strokeStyle = "#d6b7ad";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(7,-17);ctx.lineTo(7,-27);
      ctx.moveTo(11,-17);ctx.lineTo(14,-26);
      ctx.stroke();

      ctx.fillStyle = "#201d19";
      ctx.beginPath();ctx.arc(11,-11,1.15,0,Math.PI*2);ctx.fill();
      ctx.fillStyle = "#eee7db";
      ctx.beginPath();ctx.arc(12,-11.5,.35,0,Math.PI*2);ctx.fill();

      ctx.fillStyle = "#eee9dc";
      ctx.beginPath();ctx.arc(-16,-4,4,0,Math.PI*2);ctx.fill();
    }

    ctx.restore();
  }

    building(building, preview = false) {
    drawBuilding(this.ctx, this.screen(building.x, building.y), building, preview);
  }

    projectile(projectile) {
    const ctx = this.ctx;
    const p = this.screen(projectile.x, projectile.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(projectile.rotation);

    ctx.strokeStyle = "#6a4728";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.fillStyle = "#c7cfca";
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(6, -3.5);
    ctx.lineTo(7, 0);
    ctx.lineTo(6, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#d9d2b5";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-13, -3);
    ctx.moveTo(-9, 0);
    ctx.lineTo(-13, 3);
    ctx.stroke();

    ctx.restore();
  }

  player() {
    const ctx = this.ctx;
    const p = this.screen(state.player.x, state.player.y);
    const pl = state.player;
    const phase = pl.walkPhase || 0;
    const faceX = pl.facingX || 0;
    const faceY = pl.facingY || 1;
    const absX = Math.abs(faceX);
    const absY = Math.abs(faceY);
    const direction = absX > absY
      ? (faceX < 0 ? "left" : "right")
      : (faceY < 0 ? "up" : "down");

    const side = direction === "left" || direction === "right";
    const back = direction === "up";
    const flip = direction === "left" ? -1 : 1;

    const walk = pl.moving ? Math.sin(phase) : 0;
    const step = walk * 3.4;
    const bob = pl.moving ? -Math.abs(Math.sin(phase)) * 1.3 : 0;

    const actionDuration = pl.actionType === "shoot" ? .38 : pl.actionType === "gather" ? .30 : .34;
    const actionProgress = pl.actionTimer > 0
      ? 1 - Math.min(1, pl.actionTimer / actionDuration)
      : 0;
    const actionPulse = pl.actionTimer > 0 ? Math.sin(actionProgress * Math.PI) : 0;
    const toolSwing = ["chop","mine"].includes(pl.actionType) ? actionPulse * 11 : 0;
    const gatherReach = pl.actionType === "gather" ? actionPulse : 0;
    const shootKick = pl.actionType === "shoot" ? actionPulse : 0;

    const hasHelmet = state.armor.head === "leather_helmet";
    const hasChest = state.armor.chest === "leather_chest";
    const hasLegs = state.armor.legs === "leather_legs";
    const hasBoots = state.armor.feet === "leather_boots";

    ctx.save();
    ctx.translate(p.x, p.y + bob + gatherReach * 4);

    if (side && flip < 0) ctx.scale(-1, 1);

    // Ombre
    ctx.fillStyle = "rgba(10,14,10,.26)";
    ctx.beginPath();
    ctx.ellipse(0, 9, side ? 15 : 18, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jambes
    ctx.strokeStyle = hasLegs ? "#5b402d" : "#29312b";
    ctx.lineCap = "round";
    ctx.lineWidth = hasLegs ? 7 : 6;
    ctx.beginPath();
    if (side) {
      ctx.moveTo(-2, -1);
      ctx.lineTo(-3 - step, 8);
      ctx.moveTo(4, -1);
      ctx.lineTo(7 + step, 7);
    } else {
      ctx.moveTo(-5, -2);
      ctx.lineTo(-6 - step, 7);
      ctx.moveTo(5, -2);
      ctx.lineTo(6 + step, 7);
    }
    ctx.stroke();

    // Bottes
    ctx.fillStyle = hasBoots ? "#6a4528" : "#3a2c20";
    ctx.beginPath();
    if (side) {
      ctx.ellipse(-4-step, 8, 5.5, 3.4, -.1, 0, Math.PI * 2);
      ctx.ellipse(8+step, 7, 5.5, 3.4, .1, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-7-step, 8, 5.5, 3.4, -.18, 0, Math.PI * 2);
      ctx.ellipse(7+step, 8, 5.5, 3.4, .18, 0, Math.PI * 2);
    }
    ctx.fill();

    // Sac à dos : plus visible quand on regarde vers le haut
    ctx.fillStyle = "#5b432d";
    ctx.beginPath();
    if (back) {
      ctx.ellipse(0, -11, 10, 13, 0, 0, Math.PI * 2);
    } else if (side) {
      ctx.ellipse(-8, -10, 6.5, 11, -.12, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-8, -10, 7, 11, -.15, 0, Math.PI * 2);
    }
    ctx.fill();

    // Torse
    ctx.fillStyle = hasChest ? "#6b4b31" : "#445b43";
    ctx.beginPath();
    ctx.ellipse(0, -10, side ? 9.5 : 11.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hasChest) {
      ctx.fillStyle = "#8a6544";
      ctx.beginPath();
      ctx.moveTo(side ? -6 : -8,-18);
      ctx.lineTo(side ? 6 : 8,-18);
      ctx.lineTo(side ? 7 : 10,-5);
      ctx.lineTo(0,-1);
      ctx.lineTo(side ? -7 : -10,-5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#617257";
      ctx.beginPath();
      ctx.ellipse(0, -12, side ? 6 : 7.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ceinture
    ctx.fillStyle = "#493a29";
    ctx.fillRect(side ? -8 : -10, -3, side ? 16 : 20, 3);
    ctx.fillStyle = "#b58b4e";
    ctx.fillRect(-2, -3, 4, 3);

    // Bras
    const armWalk = pl.moving ? walk * 2.4 : 0;
    ctx.strokeStyle = "#c9976d";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();

    if (gatherReach > 0) {
      // Les deux mains descendent vers l'objet ramassé
      ctx.moveTo(-7, -15);
      ctx.lineTo(-7 + gatherReach * 5, -4 + gatherReach * 8);
      ctx.moveTo(7, -15);
      ctx.lineTo(7 - gatherReach * 5, -4 + gatherReach * 8);
    } else if (side) {
      ctx.moveTo(-5, -15);
      ctx.lineTo(-8 + armWalk, -4);
      ctx.moveTo(5, -15);
      ctx.lineTo(10 - armWalk + toolSwing * .25, -5 - toolSwing * .55);
    } else {
      ctx.moveTo(-8, -15);
      ctx.lineTo(-12 + armWalk, -4);
      ctx.moveTo(8, -15);
      ctx.lineTo(12 - armWalk + toolSwing * .25, -4 - toolSwing * .55);
    }
    ctx.stroke();

    // Manches
    ctx.strokeStyle = hasChest ? "#6b4b31" : "#3b4f3c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(side ? -5 : -8, -15);
    ctx.lineTo(side ? -7 : -10, -10 + gatherReach * 2);
    ctx.moveTo(side ? 5 : 8, -15);
    ctx.lineTo(side ? 7 : 10, -10 - toolSwing * .25 + gatherReach * 2);
    ctx.stroke();

    // Cou + tête
    ctx.fillStyle = "#c9976d";
    ctx.fillRect(-3, -25, 6, 7);

    const headX = side ? 2 : 0;
    const headY = -29;
    ctx.fillStyle = "#d6a47a";
    ctx.beginPath();
    ctx.arc(headX, headY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Oreilles
    ctx.fillStyle = "#bd8965";
    if (!side) {
      ctx.beginPath();
      ctx.arc(headX - 8.5, headY, 2.2, 0, Math.PI * 2);
      ctx.arc(headX + 8.5, headY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(headX + 7.5, headY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheveux / casque
    if (hasHelmet) {
      ctx.fillStyle = "#745138";
      ctx.beginPath();
      ctx.arc(headX, headY - 3, 9.8, Math.PI, Math.PI * 2);
      ctx.lineTo(headX + 9, headY - 1);
      ctx.lineTo(headX - 9, headY - 1);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#3b2b20";
      ctx.beginPath();
      ctx.arc(headX, headY - 2.5, 8.8, Math.PI, Math.PI * 2);
      ctx.lineTo(headX + 7, headY - 2);
      ctx.quadraticCurveTo(headX + 2, headY - 8, headX - 7, headY - 3);
      ctx.fill();
    }

    // Visage directionnel
    ctx.fillStyle = "#1c1d18";
    if (!back && !side) {
      ctx.beginPath();
      ctx.arc(-2.5, headY + 1, 1, 0, Math.PI * 2);
      ctx.arc(2.5, headY + 1, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (side) {
      ctx.beginPath();
      ctx.arc(headX + 4.5, headY, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a16f55";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headX + 7, headY + 2);
      ctx.lineTo(headX + 9, headY + 3);
      ctx.stroke();
    } else {
      // Dos de la tête : mèche basse
      ctx.fillStyle = "#3b2b20";
      ctx.beginPath();
      ctx.arc(0, headY + 2, 7.5, 0, Math.PI);
      ctx.fill();
    }

    // Foulard
    ctx.fillStyle = "#7d6a43";
    ctx.beginPath();
    ctx.moveTo(-6, -21);
    ctx.lineTo(6, -21);
    ctx.lineTo(2, -17);
    ctx.lineTo(-2, -17);
    ctx.closePath();
    ctx.fill();

    // Équipement en main
    if (state.equipped === "spear") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8,-12);
      ctx.lineTo(18 + toolSwing*.2,-24 + toolSwing*.5);
      ctx.stroke();
      ctx.fillStyle = "#aab0a7";
      ctx.beginPath();
      ctx.moveTo(18,-28);
      ctx.lineTo(14,-21);
      ctx.lineTo(22,-21);
      ctx.closePath();
      ctx.fill();
    } else if (state.equipped === "axe") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(9,-12);
      ctx.lineTo(15 + toolSwing*.28,-28 + toolSwing*.85);
      ctx.stroke();
      ctx.fillStyle = "#8d9490";
      ctx.beginPath();
      ctx.moveTo(12+toolSwing*.28,-30+toolSwing*.85);
      ctx.lineTo(21+toolSwing*.28,-34+toolSwing*.85);
      ctx.lineTo(21+toolSwing*.28,-28+toolSwing*.85);
      ctx.lineTo(14+toolSwing*.28,-25+toolSwing*.85);
      ctx.closePath();
      ctx.fill();
    } else if (state.equipped === "pickaxe") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(9,-12);
      ctx.lineTo(16+toolSwing*.28,-29+toolSwing*.85);
      ctx.stroke();
      ctx.strokeStyle = "#929894";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(9+toolSwing*.28,-31+toolSwing*.85);
      ctx.lineTo(23+toolSwing*.28,-28+toolSwing*.85);
      ctx.stroke();
    } else if (state.equipped === "sword") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8,-10);
      ctx.lineTo(14,-18);
      ctx.stroke();
      ctx.strokeStyle = "#c7cfca";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14,-18);
      ctx.lineTo(25,-31);
      ctx.stroke();
    } else if (state.equipped === "bow") {
      // Arc orienté exactement vers la visée
      const angle = Math.atan2(pl.aimY || faceY, pl.aimX || faceX);
      ctx.save();

      // Annule le miroir latéral avant rotation monde
      if (side && flip < 0) ctx.scale(-1,1);

      ctx.translate(0, -13);
      ctx.rotate(angle);
      const recoil = shootKick * 4;

      ctx.strokeStyle = "#8a5b31";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(13,-13);
      ctx.quadraticCurveTo(24-recoil,0,13,13);
      ctx.stroke();

      ctx.strokeStyle = "#d2c5a4";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(13,-13);
      ctx.lineTo(8-recoil,0);
      ctx.lineTo(13,13);
      ctx.stroke();

      // Flèche encoched pendant l'animation de tir
      if (pl.actionType === "shoot" && pl.actionTimer > .20) {
        ctx.strokeStyle = "#6a4728";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(7-recoil,0);
        ctx.lineTo(25,0);
        ctx.stroke();
        ctx.fillStyle = "#c7cfca";
        ctx.beginPath();
        ctx.moveTo(28,0);
        ctx.lineTo(23,-3);
        ctx.lineTo(23,3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    } else if (state.equipped === "shield") {
      ctx.fillStyle = "#755235";
      ctx.beginPath();
      ctx.ellipse(12,-11,9,12,.15,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = "#a88455";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(12,-11,7,10,.15,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }

  night() {
    const ctx = this.ctx;
    const season = getSeasonState();
    const daylight = Math.sin(state.dayProgress * Math.PI * 2 - Math.PI / 2) * .5 + .5;
    const baseMax = season.id === "winter" ? .36 : .32;
    const darkness = clamp((baseMax + .02) - daylight * (baseMax + .02), 0, baseMax);

    if (darkness > .01) {
      const player = this.screen(state.player.x, state.player.y);
      const radius = Math.max(220, Math.min(this.viewW, this.viewH) * .42);
      const shade = ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, radius);
      const rgb = season.id === "autumn" ? "24,25,38" : season.id === "winter" ? "17,29,45" : "16,24,42";
      shade.addColorStop(0, "rgba(" + rgb + "," + (darkness * .15).toFixed(3) + ")");
      shade.addColorStop(.46, "rgba(" + rgb + "," + (darkness * .50).toFixed(3) + ")");
      shade.addColorStop(1, "rgba(" + rgb + "," + darkness.toFixed(3) + ")");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    if (darkness > .035) {
      const now = performance.now() * .006;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const building of state.buildings) {
        if (building.type !== "campfire" || !this.visible(building.x, building.y, 180)) continue;
        const p = this.screen(building.x, building.y);
        const flicker = 86 + Math.sin(now + building.x * .01 + building.y * .013) * 10;
        const glow = ctx.createRadialGradient(p.x, p.y - 5, 4, p.x, p.y - 5, flicker);
        glow.addColorStop(0, "rgba(255,218,118,.35)");
        glow.addColorStop(.36, "rgba(255,150,55,.17)");
        glow.addColorStop(1, "rgba(255,120,35,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 5, flicker, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

    render() {
    this.ground();
    const chunks = getChunksForView(state.camera, this.viewW, this.viewH, 1);

    for (const chunk of chunks) {
      for (const d of chunk.decor) {
        if (!this.visible(d.x,d.y,30)) continue;
        if (d.type === "grass" || d.type === "flower") this.grass(d);
      }
      for (const r of chunk.resources) if (r.type === "pond" && this.visible(r.x,r.y,80)) this.pond(r);
    }

    const drawables = [];

    for (const projectile of state.projectiles) {
      if (this.visible(projectile.x, projectile.y, 80)) {
        drawables.push({ y:projectile.y, kind:"projectile", value:projectile });
      }
    }

    for (const building of state.buildings) {
      if (!this.visible(building.x, building.y, 120)) continue;
      drawables.push({
        y: building.type === "wood_foundation" ? building.y - 12 : building.y,
        kind: "building",
        value: building
      });
    }

    for (const chunk of chunks) {
      for (const d of chunk.decor) {
        if ((d.type === "bush" || d.type === "fern") && this.visible(d.x,d.y,60)) {
          drawables.push({ y:d.y, kind:"decor", value:d });
        }
      }
      for (const r of chunk.resources) {
        if (r.type === "pond" || state.removedResources.has(r.id) || !this.visible(r.x,r.y,110)) continue;
        drawables.push({ y:r.y, kind:"resource", value:r });
      }
      for (const def of chunk.animals) {
        if (state.deadAnimals.has(def.id)) continue;
        const animal = getAnimalState(def);
        if (this.visible(animal.x,animal.y,100)) drawables.push({ y:animal.y, kind:"animal", value:animal });
      }
    }
    drawables.push({ y:state.player.y + 1, kind:"player" });
    drawables.sort((a,b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === "resource") this.resource(d.value);
      else if (d.kind === "decor") this.grass(d.value);
      else if (d.kind === "animal") this.animal(d.value);
      else if (d.kind === "building") this.building(d.value);
      else if (d.kind === "projectile") this.projectile(d.value);
      else this.player();
    }

    if (state.buildPreview && this.visible(state.buildPreview.x, state.buildPreview.y, 120)) {
      this.building(state.buildPreview, true);
    }

    drawSeasonGrade(this.ctx, this.viewW, this.viewH);
    this.night();
    drawSeasonAtmosphere(this.ctx, this.viewW, this.viewH);
  }
}
