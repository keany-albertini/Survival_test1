import { state, hashRand, clamp } from "./data.js";
import { getChunksForView, getAnimalState } from "./world.js";

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
    const v = Math.sin(x / 760) + Math.cos(y / 860) + Math.sin((x + y) / 1240) * .65;
    if (v > 1.25) return "#8ea36a";
    if (v < -1.10) return "#55744c";
    return "#6f8f56";
  }

  ground() {
    const ctx = this.ctx;
    const tile = 120;
    const left = state.camera.x - this.viewW / 2;
    const top = state.camera.y - this.viewH / 2;
    const startX = Math.floor(left / tile) * tile;
    const startY = Math.floor(top / tile) * tile;
    ctx.fillStyle = this.biomeColor(state.camera.x, state.camera.y);
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    for (let y = startY; y < top + this.viewH + tile; y += tile) {
      for (let x = startX; x < left + this.viewW + tile; x += tile) {
        const p = this.screen(x, y);
        ctx.fillStyle = this.biomeColor(x + tile / 2, y + tile / 2);
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), tile + 1, tile + 1);
        const speck = hashRand(Math.floor(x / tile), Math.floor(y / tile), 17);
        if (speck > .63) {
          ctx.fillStyle = "rgba(239,244,214,.11)";
          ctx.beginPath();
          ctx.arc(p.x + 22 + speck * 58, p.y + 28 + speck * 41, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  grass(item) {
    const ctx = this.ctx;
    const p = this.screen(item.x, item.y);
    ctx.strokeStyle = item.type === "flower" ? "rgba(241,226,171,.55)" : "rgba(39,79,42,.52)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 3); ctx.lineTo(p.x - 3, p.y - 5);
    ctx.moveTo(p.x, p.y + 3); ctx.lineTo(p.x + 2, p.y - 7);
    ctx.moveTo(p.x, p.y + 2); ctx.lineTo(p.x + 5, p.y - 3);
    ctx.stroke();
    if (item.type === "flower") {
      ctx.fillStyle = item.variant === 0 ? "#e6d59e" : item.variant === 1 ? "#d5c7e7" : "#d9e8b2";
      ctx.beginPath(); ctx.arc(p.x + 2, p.y - 7, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  pond(item) {
    const ctx = this.ctx;
    const p = this.screen(item.x, item.y);
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = "rgba(42,102,122,.75)";
    ctx.beginPath(); ctx.ellipse(0, 0, 52, 27, -.08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(190,226,219,.34)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(-5, -3, 34, 14, -.08, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  resource(item) {
    const ctx = this.ctx;
    const p = this.screen(item.x, item.y);
    ctx.save(); ctx.translate(p.x, p.y);

    if (item.type === "branch") {
      ctx.strokeStyle = "#5b3d25"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-14, 3); ctx.lineTo(13, -5); ctx.moveTo(-9, -5); ctx.lineTo(11, 6); ctx.stroke();
      ctx.strokeStyle = "#83603a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(11, -5); ctx.stroke();
    } else if (item.type === "fiber") {
      ctx.strokeStyle = "#294e2b"; ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, 4); ctx.quadraticCurveTo(i * 4, -10, i * 7, -18 - Math.abs(i) * 2); ctx.stroke(); }
      ctx.fillStyle = "#678d43"; ctx.beginPath(); ctx.ellipse(-7, -9, 7, 3, -.7, 0, Math.PI * 2); ctx.ellipse(8, -12, 7, 3, .6, 0, Math.PI * 2); ctx.fill();
    } else if (item.type === "stone" || item.type === "ore") {
      ctx.fillStyle = item.type === "ore" ? "#5b625c" : "#777b70";
      ctx.beginPath(); ctx.moveTo(-16,6); ctx.lineTo(-11,-9); ctx.lineTo(4,-14); ctx.lineTo(16,-4); ctx.lineTo(13,8); ctx.lineTo(-5,12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.beginPath(); ctx.moveTo(-10,-7); ctx.lineTo(4,-12); ctx.lineTo(8,-6); ctx.lineTo(-4,-3); ctx.closePath(); ctx.fill();
      if (item.type === "ore") { ctx.fillStyle = "#b78d4d"; ctx.beginPath(); ctx.arc(-4,-4,2.5,0,Math.PI*2); ctx.arc(8,1,2,0,Math.PI*2); ctx.fill(); }
    } else if (item.type === "berries") {
      ctx.fillStyle = "#315f34"; ctx.beginPath(); ctx.arc(-6,-7,10,0,Math.PI*2); ctx.arc(7,-8,11,0,Math.PI*2); ctx.arc(1,-16,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#46519b"; [[-8,-8],[3,-14],[10,-6],[-1,-3]].forEach(b => { ctx.beginPath(); ctx.arc(b[0],b[1],2.4,0,Math.PI*2); ctx.fill(); });
    } else if (item.type === "tree") {
      ctx.fillStyle = "rgba(20,28,18,.18)"; ctx.beginPath(); ctx.ellipse(5,6,27,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#5b3f29"; ctx.fillRect(-5,-47,11,52);
      ctx.fillStyle = "#2f5a34"; ctx.beginPath(); ctx.arc(-12,-48,24,0,Math.PI*2); ctx.arc(12,-53,26,0,Math.PI*2); ctx.arc(0,-72,24,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(167,199,115,.15)"; ctx.beginPath(); ctx.arc(-7,-65,13,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  animal(animal) {
    const ctx = this.ctx;
    const p = this.screen(animal.x, animal.y);
    ctx.save(); ctx.translate(p.x, p.y);
    if (animal.hurtTimer > 0) ctx.globalAlpha = .6;
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath();
    ctx.ellipse(0,5,animal.type === "deer" ? 22 : 15,animal.type === "deer" ? 7 : 6,0,0,Math.PI*2); ctx.fill();

    if (animal.type === "deer") {
      ctx.strokeStyle = "#6d5135"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9,-2); ctx.lineTo(-10,9); ctx.moveTo(9,-2); ctx.lineTo(12,9); ctx.stroke();
      ctx.fillStyle = "#8a6743"; ctx.beginPath(); ctx.ellipse(-1,-10,20,11,0,0,Math.PI*2); ctx.fill(); ctx.fillRect(11,-21,6,15);
      ctx.beginPath(); ctx.arc(15,-24,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#151713"; ctx.beginPath(); ctx.arc(19,-25,1.2,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = "#b6aa91"; ctx.beginPath(); ctx.ellipse(-2,-4,12,8,-.15,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(9,-9,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#b6aa91"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(7,-15); ctx.lineTo(6,-26); ctx.moveTo(12,-15); ctx.lineTo(15,-25); ctx.stroke();
      ctx.fillStyle = "#151713"; ctx.beginPath(); ctx.arc(12,-10,1.2,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  player() {
    const ctx = this.ctx;
    const p = this.screen(state.player.x, state.player.y);
    const pl = state.player;
    const phase = pl.walkPhase || 0;
    const step = pl.moving ? Math.sin(phase) * 3.2 : 0;
    const bob = pl.moving ? Math.abs(Math.sin(phase)) * -1.2 : 0;
    const faceX = pl.facingX || 0;
    const faceY = pl.facingY || 1;

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    // Ombre au sol
    ctx.fillStyle = "rgba(10,14,10,.26)";
    ctx.beginPath();
    ctx.ellipse(1, 9, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jambes et bottes
    ctx.strokeStyle = "#29312b";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-6 - step, 7);
    ctx.moveTo(5, -2);
    ctx.lineTo(6 + step, 7);
    ctx.stroke();

    ctx.fillStyle = "#3a2c20";
    ctx.beginPath();
    ctx.ellipse(-7 - step, 8, 5.5, 3.4, -.18, 0, Math.PI * 2);
    ctx.ellipse(7 + step, 8, 5.5, 3.4, .18, 0, Math.PI * 2);
    ctx.fill();

    // Sac à dos derrière le corps
    ctx.fillStyle = "#5b432d";
    ctx.beginPath();
    ctx.ellipse(-8 - faceX * 2, -10 - faceY, 7, 11, -.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2d251d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-8 - faceX * 2, -10 - faceY, 5, .2, Math.PI - .1);
    ctx.stroke();

    // Corps / veste de survivant
    ctx.fillStyle = "#445b43";
    ctx.beginPath();
    ctx.ellipse(0, -10, 11.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gilet plus clair
    ctx.fillStyle = "#617257";
    ctx.beginPath();
    ctx.ellipse(0, -12, 7.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ceinture
    ctx.fillStyle = "#493a29";
    ctx.fillRect(-10, -3, 20, 3);
    ctx.fillStyle = "#b58b4e";
    ctx.fillRect(-2, -3, 4, 3);

    // Sangle du sac
    ctx.strokeStyle = "#392f24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -19);
    ctx.lineTo(7, -2);
    ctx.stroke();

    // Bras animés
    const armSwing = pl.moving ? Math.sin(phase) * 2.5 : 0;
    ctx.strokeStyle = "#c9976d";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.lineTo(-12 + armSwing, -4);
    ctx.moveTo(8, -15);
    ctx.lineTo(12 - armSwing, -4);
    ctx.stroke();

    // Manchettes
    ctx.strokeStyle = "#3b4f3c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.lineTo(-10 + armSwing * .4, -10);
    ctx.moveTo(8, -15);
    ctx.lineTo(10 - armSwing * .4, -10);
    ctx.stroke();

    // Cou
    ctx.fillStyle = "#c9976d";
    ctx.fillRect(-3, -25, 6, 7);

    // Tête
    const headX = faceX * 1.5;
    const headY = -29 + faceY * .7;
    ctx.fillStyle = "#d6a47a";
    ctx.beginPath();
    ctx.arc(headX, headY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Oreilles
    ctx.fillStyle = "#bd8965";
    ctx.beginPath();
    ctx.arc(headX - 8.5, headY, 2.2, 0, Math.PI * 2);
    ctx.arc(headX + 8.5, headY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Cheveux
    ctx.fillStyle = "#3b2b20";
    ctx.beginPath();
    ctx.arc(headX, headY - 2.5, 8.8, Math.PI, Math.PI * 2);
    ctx.lineTo(headX + 7, headY - 2);
    ctx.quadraticCurveTo(headX + 2, headY - 8, headX - 7, headY - 3);
    ctx.fill();

    // Bandeau de survivant
    ctx.strokeStyle = "#8c493e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX - 8, headY - 1);
    ctx.lineTo(headX + 8, headY - 1);
    ctx.stroke();
    ctx.fillStyle = "#8c493e";
    ctx.beginPath();
    ctx.moveTo(headX - 8, headY);
    ctx.lineTo(headX - 12, headY + 4);
    ctx.lineTo(headX - 8, headY + 3);
    ctx.closePath();
    ctx.fill();

    // Visage tourné dans la direction de marche
    const eyeOffsetX = faceX * 2.2;
    const eyeOffsetY = faceY * 1.2;
    ctx.fillStyle = "#1c1d18";
    ctx.beginPath();
    ctx.arc(headX - 2.5 + eyeOffsetX, headY + eyeOffsetY, 1, 0, Math.PI * 2);
    ctx.arc(headX + 2.5 + eyeOffsetX, headY + eyeOffsetY, 1, 0, Math.PI * 2);
    ctx.fill();

    // Petit foulard
    ctx.fillStyle = "#7d6a43";
    ctx.beginPath();
    ctx.moveTo(-6, -21);
    ctx.lineTo(6, -21);
    ctx.lineTo(2, -17);
    ctx.lineTo(-2, -17);
    ctx.closePath();
    ctx.fill();

    // Outil visible selon ce qui a été fabriqué
    if (state.equipped === "spear") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(9, -12);
      ctx.lineTo(19 + faceX * 18, -22 + faceY * 18);
      ctx.stroke();
      ctx.fillStyle = "#aab0a7";
      ctx.beginPath();
      ctx.moveTo(19 + faceX * 18, -26 + faceY * 18);
      ctx.lineTo(15 + faceX * 18, -19 + faceY * 18);
      ctx.lineTo(23 + faceX * 18, -19 + faceY * 18);
      ctx.closePath();
      ctx.fill();
    } else if (state.equipped === "axe") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -12);
      ctx.lineTo(16, -28);
      ctx.stroke();
      ctx.fillStyle = "#8d9490";
      ctx.beginPath();
      ctx.moveTo(13, -30);
      ctx.lineTo(22, -34);
      ctx.lineTo(22, -28);
      ctx.lineTo(15, -25);
      ctx.closePath();
      ctx.fill();
    } else if (state.equipped === "pickaxe") {
      ctx.strokeStyle = "#6a4728";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -12);
      ctx.lineTo(17, -29);
      ctx.stroke();
      ctx.strokeStyle = "#929894";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -31);
      ctx.lineTo(24, -28);
      ctx.stroke();
    }

    ctx.restore();
  }

  night() {
    const daylight = Math.sin(state.dayProgress * Math.PI * 2 - Math.PI / 2) * .5 + .5;
    const darkness = clamp(.60 - daylight * .60, 0, .56);
    if (darkness > .01) {
      this.ctx.fillStyle = "rgba(10,18,34," + darkness.toFixed(3) + ")";
      this.ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }

  render() {
    this.ground();
    const chunks = getChunksForView(state.camera, this.viewW, this.viewH, 1);
    for (const chunk of chunks) {
      for (const d of chunk.decor) if (this.visible(d.x,d.y,20)) this.grass(d);
      for (const r of chunk.resources) if (r.type === "pond" && this.visible(r.x,r.y,80)) this.pond(r);
    }

    const drawables = [];
    for (const chunk of chunks) {
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
      else if (d.kind === "animal") this.animal(d.value);
      else this.player();
    }
    this.night();
  }
}
