import { state, hashRand, clamp } from "./data.js?v=12";
import { getChunksForView, getAnimalState } from "./world.js?v=12";

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
    } else if (item.type === "stone") {
      ctx.fillStyle = "#777b70";
      ctx.beginPath(); ctx.moveTo(-9,4); ctx.lineTo(-6,-6); ctx.lineTo(3,-9); ctx.lineTo(10,-3); ctx.lineTo(8,6); ctx.lineTo(-3,8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.13)";
      ctx.beginPath(); ctx.moveTo(-5,-5); ctx.lineTo(3,-8); ctx.lineTo(6,-4); ctx.lineTo(-2,-1); ctx.closePath(); ctx.fill();
    } else if (["large_rock","copper_ore","tin_ore","ore","gold_ore"].includes(item.type)) {
      const base = item.type === "large_rock" ? "#6f736d" : "#555d59";
      ctx.fillStyle = base;
      ctx.beginPath(); ctx.moveTo(-22,9); ctx.lineTo(-17,-12); ctx.lineTo(2,-19); ctx.lineTo(21,-7); ctx.lineTo(18,12); ctx.lineTo(-7,16); ctx.closePath(); ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.beginPath(); ctx.moveTo(-14,-10); ctx.lineTo(2,-17); ctx.lineTo(9,-10); ctx.lineTo(-4,-5); ctx.closePath(); ctx.fill();

      const veinColors = {
        copper_ore: "#b56f45",
        tin_ore: "#c9cfcb",
        ore: "#9a7250",
        gold_ore: "#d9b449"
      };
      if (veinColors[item.type]) {
        ctx.strokeStyle = veinColors[item.type];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12,-5); ctx.lineTo(-3,0); ctx.lineTo(4,-8);
        ctx.moveTo(2,6); ctx.lineTo(10,1); ctx.lineTo(15,6);
        ctx.stroke();
      }

      const hits = state.resourceHits[item.id] || 0;
      if (hits > 0) {
        ctx.strokeStyle = "rgba(30,30,26,.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2,-2); ctx.lineTo(-7,4); ctx.lineTo(-3,9);
        if (hits > 2) { ctx.moveTo(4,-4); ctx.lineTo(8,3); ctx.lineTo(3,8); }
        ctx.stroke();
      }
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

  building(building, preview = false) {
    const ctx = this.ctx;
    const p = this.screen(building.x, building.y);
    const type = building.type;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (preview) {
      ctx.globalAlpha = .62;
      ctx.strokeStyle = building.valid ? "#b9ef94" : "#ef8f82";
      ctx.fillStyle = building.valid ? "rgba(121,210,104,.18)" : "rgba(222,79,72,.18)";
      ctx.lineWidth = 2;
    }

    if (type === "wood_foundation") {
      if (preview) {
        ctx.fillRect(-34, -25, 68, 50);
        ctx.strokeRect(-34, -25, 68, 50);
      }

      ctx.fillStyle = preview ? "rgba(132,91,54,.76)" : "#765233";
      ctx.strokeStyle = preview ? ctx.strokeStyle : "#3e2d20";
      ctx.lineWidth = preview ? 2 : 2;
      ctx.beginPath();
      ctx.moveTo(-32,-23); ctx.lineTo(32,-23); ctx.lineTo(32,23); ctx.lineTo(-32,23); ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.strokeStyle = preview ? "rgba(230,250,215,.52)" : "#a7794c";
      ctx.lineWidth = 1.4;
      for (let x = -24; x <= 24; x += 12) {
        ctx.beginPath(); ctx.moveTo(x,-22); ctx.lineTo(x,22); ctx.stroke();
      }
      ctx.strokeStyle = preview ? "rgba(20,30,20,.25)" : "#4a3423";
      ctx.beginPath(); ctx.moveTo(-31,0); ctx.lineTo(31,0); ctx.stroke();
    } else if (type === "wood_wall") {
      if (building.orientation === "v") {
        if (preview) {
          ctx.fillRect(-7,-25,14,50); ctx.strokeRect(-7,-25,14,50);
        }
        ctx.fillStyle = preview ? "rgba(125,86,52,.78)" : "#6e4a2e";
        ctx.fillRect(-5,-24,10,48);
        ctx.fillStyle = preview ? "rgba(180,130,85,.78)" : "#a16f43";
        for (let y=-20; y<=16; y+=9) ctx.fillRect(-8,y,16,4);
        ctx.fillStyle = "#3c2a1c";
        ctx.fillRect(-7,-26,4,52); ctx.fillRect(3,-26,4,52);
      } else {
        if (preview) {
          ctx.fillRect(-34,-7,68,14); ctx.strokeRect(-34,-7,68,14);
        }
        ctx.fillStyle = preview ? "rgba(125,86,52,.78)" : "#6e4a2e";
        ctx.fillRect(-32,-5,64,10);
        ctx.fillStyle = preview ? "rgba(180,130,85,.78)" : "#a16f43";
        for (let x=-28; x<=24; x+=11) ctx.fillRect(x,-8,4,16);
        ctx.fillStyle = "#3c2a1c";
        ctx.fillRect(-34,-7,5,14); ctx.fillRect(29,-7,5,14);
      }
    } else if (type === "campfire") {
      if (preview) {
        ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = "#77756b";
      for (let i=0;i<8;i++) {
        const a=i/8*Math.PI*2;
        ctx.beginPath(); ctx.arc(Math.cos(a)*13,Math.sin(a)*8,5,0,Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle="#5d3924"; ctx.lineWidth=5;
      ctx.beginPath(); ctx.moveTo(-10,5);ctx.lineTo(10,-5);ctx.moveTo(-10,-5);ctx.lineTo(10,5);ctx.stroke();
      ctx.fillStyle="#e48d32"; ctx.beginPath(); ctx.moveTo(0,-17);ctx.quadraticCurveTo(12,-2,0,6);ctx.quadraticCurveTo(-11,-3,0,-17);ctx.fill();
      ctx.fillStyle="#f1c75c"; ctx.beginPath(); ctx.moveTo(0,-10);ctx.quadraticCurveTo(6,-1,0,3);ctx.quadraticCurveTo(-5,-1,0,-10);ctx.fill();
    } else if (type === "workbench") {
      if (preview) { ctx.fillRect(-28,-18,56,36); ctx.strokeRect(-28,-18,56,36); }
      ctx.fillStyle="#65452d"; ctx.fillRect(-26,-13,52,14);
      ctx.fillStyle="#9a7047";
      for(let x=-24;x<24;x+=12) ctx.fillRect(x,-12,10,12);
      ctx.fillStyle="#473121"; ctx.fillRect(-22,1,5,17);ctx.fillRect(17,1,5,17);
      ctx.fillStyle="#8e9390"; ctx.fillRect(-5,-18,18,4);
    } else if (type === "forge") {
      if (preview) { ctx.fillRect(-28,-24,56,48); ctx.strokeRect(-28,-24,56,48); }
      ctx.fillStyle="#585a55"; ctx.beginPath(); ctx.ellipse(0,0,25,18,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#343631";ctx.beginPath();ctx.arc(0,-2,13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#d86832";ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#6b6c67";ctx.fillRect(13,-25,8,25);
    } else if (type === "bed") {
      if (preview) { ctx.fillRect(-29,-18,58,36); ctx.strokeRect(-29,-18,58,36); }
      ctx.fillStyle="#5a3e2a";ctx.fillRect(-27,-15,54,30);
      ctx.fillStyle="#a79872";ctx.fillRect(-23,-12,46,24);
      ctx.fillStyle="#d5caa7";ctx.fillRect(-20,-10,14,20);
      ctx.strokeStyle="#3b2a1d";ctx.lineWidth=3;ctx.strokeRect(-27,-15,54,30);
    } else if (type === "chest") {
      if (preview) { ctx.fillRect(-22,-18,44,36); ctx.strokeRect(-22,-18,44,36); }
      ctx.fillStyle="#76502f";ctx.fillRect(-20,-10,40,24);
      ctx.fillStyle="#8e6037";ctx.beginPath();ctx.ellipse(0,-10,20,9,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#3c2a1b";ctx.lineWidth=2;ctx.strokeRect(-20,-10,40,24);
      ctx.fillStyle="#c49a4e";ctx.fillRect(-3,-1,6,8);
    }

    if (preview && type !== "wood_foundation" && type !== "wood_wall") {
      ctx.strokeStyle = building.valid ? "#b9ef94" : "#ef8f82";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.stroke();
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

    const hasHelmet = state.armor.head === "leather_helmet";
    const hasChest = state.armor.chest === "leather_chest";
    const hasLegs = state.armor.legs === "leather_legs";
    const hasBoots = state.armor.feet === "leather_boots";

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    ctx.fillStyle = "rgba(10,14,10,.26)";
    ctx.beginPath();
    ctx.ellipse(1, 9, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jambes
    ctx.strokeStyle = hasLegs ? "#5b402d" : "#29312b";
    ctx.lineWidth = hasLegs ? 7 : 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-6 - step, 7);
    ctx.moveTo(5, -2);
    ctx.lineTo(6 + step, 7);
    ctx.stroke();

    // Bottes
    ctx.fillStyle = hasBoots ? "#6a4528" : "#3a2c20";
    ctx.beginPath();
    ctx.ellipse(-7 - step, 8, hasBoots ? 6 : 5.5, hasBoots ? 4 : 3.4, -.18, 0, Math.PI * 2);
    ctx.ellipse(7 + step, 8, hasBoots ? 6 : 5.5, hasBoots ? 4 : 3.4, .18, 0, Math.PI * 2);
    ctx.fill();
    if (hasBoots) {
      ctx.strokeStyle = "#32251b";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-11-step,8); ctx.lineTo(-3-step,8);
      ctx.moveTo(3+step,8); ctx.lineTo(11+step,8);
      ctx.stroke();
    }

    // Sac à dos
    ctx.fillStyle = "#5b432d";
    ctx.beginPath();
    ctx.ellipse(-8 - faceX * 2, -10 - faceY, 7, 11, -.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2d251d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-8 - faceX * 2, -10 - faceY, 5, .2, Math.PI - .1);
    ctx.stroke();

    // Torse
    ctx.fillStyle = hasChest ? "#6b4b31" : "#445b43";
    ctx.beginPath();
    ctx.ellipse(0, -10, hasChest ? 12.5 : 11.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hasChest) {
      ctx.fillStyle = "#8a6544";
      ctx.beginPath();
      ctx.moveTo(-8,-18); ctx.lineTo(8,-18); ctx.lineTo(10,-5); ctx.lineTo(0,-1); ctx.lineTo(-10,-5); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3c2a1c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0,-18); ctx.lineTo(0,-3);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#617257";
      ctx.beginPath();
      ctx.ellipse(0, -12, 7.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ceinture
    ctx.fillStyle = "#493a29";
    ctx.fillRect(-10, -3, 20, 3);
    ctx.fillStyle = "#b58b4e";
    ctx.fillRect(-2, -3, 4, 3);

    // Sangle
    ctx.strokeStyle = "#392f24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -19);
    ctx.lineTo(7, -2);
    ctx.stroke();

    const actionProgress = pl.actionTimer > 0 ? 1 - Math.min(1, pl.actionTimer / .34) : 0;
    const actionSwing = pl.actionTimer > 0 ? Math.sin(actionProgress * Math.PI) * 9 : 0;
    const armSwing = pl.moving ? Math.sin(phase) * 2.5 : 0;
    ctx.strokeStyle = "#c9976d";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.lineTo(-12 + armSwing, -4);
    ctx.moveTo(8, -15);
    ctx.lineTo(12 - armSwing + actionSwing * .35, -4 - actionSwing * .55);
    ctx.stroke();

    ctx.strokeStyle = hasChest ? "#6b4b31" : "#3b4f3c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.lineTo(-10 + armSwing * .4, -10);
    ctx.moveTo(8, -15);
    ctx.lineTo(10 - armSwing * .4 + actionSwing * .2, -10 - actionSwing * .3);
    ctx.stroke();

    ctx.fillStyle = "#c9976d";
    ctx.fillRect(-3, -25, 6, 7);

    const headX = faceX * 1.5;
    const headY = -29 + faceY * .7;
    ctx.fillStyle = "#d6a47a";
    ctx.beginPath();
    ctx.arc(headX, headY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#bd8965";
    ctx.beginPath();
    ctx.arc(headX - 8.5, headY, 2.2, 0, Math.PI * 2);
    ctx.arc(headX + 8.5, headY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b2b20";
    ctx.beginPath();
    ctx.arc(headX, headY - 2.5, 8.8, Math.PI, Math.PI * 2);
    ctx.lineTo(headX + 7, headY - 2);
    ctx.quadraticCurveTo(headX + 2, headY - 8, headX - 7, headY - 3);
    ctx.fill();

    if (hasHelmet) {
      ctx.fillStyle = "#745138";
      ctx.beginPath();
      ctx.arc(headX, headY - 3, 9.8, Math.PI, Math.PI * 2);
      ctx.lineTo(headX + 9, headY - 1);
      ctx.lineTo(headX - 9, headY - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3c2a1d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(headX-7,headY-5); ctx.lineTo(headX+7,headY-5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#8c493e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headX - 8, headY - 1);
      ctx.lineTo(headX + 8, headY - 1);
      ctx.stroke();
    }

    const eyeOffsetX = faceX * 2.2;
    const eyeOffsetY = faceY * 1.2;
    ctx.fillStyle = "#1c1d18";
    ctx.beginPath();
    ctx.arc(headX - 2.5 + eyeOffsetX, headY + eyeOffsetY, 1, 0, Math.PI * 2);
    ctx.arc(headX + 2.5 + eyeOffsetX, headY + eyeOffsetY, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7d6a43";
    ctx.beginPath();
    ctx.moveTo(-6, -21); ctx.lineTo(6, -21); ctx.lineTo(2, -17); ctx.lineTo(-2, -17); ctx.closePath();
    ctx.fill();

    // Équipement en main
    if (state.equipped === "spear") {
      ctx.strokeStyle = "#6a4728"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(9,-12); ctx.lineTo(19+faceX*18,-22+faceY*18); ctx.stroke();
      ctx.fillStyle = "#aab0a7";
      ctx.beginPath(); ctx.moveTo(19+faceX*18,-26+faceY*18); ctx.lineTo(15+faceX*18,-19+faceY*18); ctx.lineTo(23+faceX*18,-19+faceY*18); ctx.closePath(); ctx.fill();
    } else if (state.equipped === "axe") {
      const swingY = actionSwing;
      ctx.strokeStyle = "#6a4728"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10,-12); ctx.lineTo(16 + swingY*.25,-28 + swingY*.8); ctx.stroke();
      ctx.fillStyle = "#8d9490";
      ctx.beginPath(); ctx.moveTo(13+swingY*.25,-30+swingY*.8); ctx.lineTo(22+swingY*.25,-34+swingY*.8); ctx.lineTo(22+swingY*.25,-28+swingY*.8); ctx.lineTo(15+swingY*.25,-25+swingY*.8); ctx.closePath(); ctx.fill();
    } else if (state.equipped === "pickaxe") {
      const swingY = actionSwing;
      ctx.strokeStyle = "#6a4728"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10,-12); ctx.lineTo(17+swingY*.25,-29+swingY*.8); ctx.stroke();
      ctx.strokeStyle = "#929894"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10+swingY*.25,-31+swingY*.8); ctx.lineTo(24+swingY*.25,-28+swingY*.8); ctx.stroke();
    } else if (state.equipped === "sword") {
      ctx.strokeStyle = "#6a4728"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(15,-18); ctx.stroke();
      ctx.strokeStyle = "#c7cfca"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(15,-18); ctx.lineTo(23+faceX*8,-30+faceY*8); ctx.stroke();
      ctx.strokeStyle = "#8f6a3f"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(11,-19); ctx.lineTo(19,-15); ctx.stroke();
    } else if (state.equipped === "bow") {
      ctx.strokeStyle = "#8a5b31"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(15,-17,13,-1.15,1.15); ctx.stroke();
      ctx.strokeStyle = "#d2c5a4"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20,-29); ctx.lineTo(20,-5); ctx.stroke();
    } else if (state.equipped === "shield") {
      ctx.fillStyle = "#755235";
      ctx.beginPath(); ctx.ellipse(13,-11,9,12,.15,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#a88455"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(13,-11,7,10,.15,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle = "#a88455"; ctx.beginPath(); ctx.arc(13,-11,2,0,Math.PI*2); ctx.fill();
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

    for (const building of state.buildings) {
      if (!this.visible(building.x, building.y, 120)) continue;
      drawables.push({
        y: building.type === "wood_foundation" ? building.y - 12 : building.y,
        kind: "building",
        value: building
      });
    }

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
      else if (d.kind === "building") this.building(d.value);
      else this.player();
    }

    if (state.buildPreview && this.visible(state.buildPreview.x, state.buildPreview.y, 120)) {
      this.building(state.buildPreview, true);
    }

    this.night();
  }
}
