import { state, hashRand } from "./data.js?v=19";
import { getSeasonState, mixHex } from "./seasons.js?v=19";

function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 1, cap = "round") {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function irregularBlob(ctx, seedA, seedB, rx, ry, color, rotation = 0) {
  const points = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rotation;
    const wobble = .78 + hashRand(seedA, seedB, 900 + i) * .34;
    points.push({
      x: Math.cos(a) * rx * wobble,
      y: Math.sin(a) * ry * (.84 + hashRand(seedB, seedA, 930 + i) * .28)
    });
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  const first = points[0];
  const last = points[points.length - 1];
  ctx.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const n = points[(i + 1) % points.length];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2);
  }
  ctx.closePath();
  ctx.fill();
}

function leaf(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function canopyCloud(ctx, centers, colors) {
  for (const c of centers) {
    ellipse(ctx, c[0], c[1], c[2], c[3], colors[0], c[4] || 0);
  }
  for (const c of centers) {
    ellipse(ctx, c[0] - c[2] * .12, c[1] - c[3] * .18, c[2] * .72, c[3] * .62, colors[1], c[4] || 0);
  }
  for (let i = 0; i < centers.length; i += 2) {
    const c = centers[i];
    ellipse(ctx, c[0] - c[2] * .22, c[1] - c[3] * .38, c[2] * .35, c[3] * .25, colors[2], c[4] || 0);
  }
}

function seasonalLeafPalette(variant = 0) {
  const season = getSeasonState();
  const p = season.palette;

  if (season.id === "autumn") {
    const sets = [
      ["#653422", "#a04a2b", "#d67932"],
      ["#704025", "#b75d2f", "#df963e"],
      ["#78452b", "#b96936", "#e3ad4d"],
      ["#653a2a", "#9d4e35", "#d17d3b"]
    ];
    return sets[variant % sets.length];
  }

  if (season.id === "winter") {
    return [mixHex(p.leafDark, "#485247", .5), mixHex(p.leaf, "#6f786d", .55), mixHex(p.leafLight, "#9ba49b", .55)];
  }

  return [
    mixHex(p.leafDark, variant % 2 ? "#203f2b" : p.leafDark, .35),
    mixHex(p.leaf, variant === 2 ? "#527d45" : p.leaf, .35),
    mixHex(p.leafLight, variant === 3 ? "#9ab969" : p.leafLight, .28)
  ];
}

export function drawGround(ctx, screen, camera, viewW, viewH) {
  const season = getSeasonState();
  const p = season.palette;
  const tile = 100;
  const left = camera.x - viewW / 2;
  const top = camera.y - viewH / 2;
  const startX = Math.floor(left / tile) * tile;
  const startY = Math.floor(top / tile) * tile;

  ctx.fillStyle = p.ground;
  ctx.fillRect(0, 0, viewW, viewH);

  for (let y = startY; y < top + viewH + tile; y += tile) {
    for (let x = startX; x < left + viewW + tile; x += tile) {
      const ix = Math.floor(x / tile);
      const iy = Math.floor(y / tile);
      const h = hashRand(ix, iy, 17);
      const h2 = hashRand(ix, iy, 18);
      const s = screen(x + tile / 2, y + tile / 2);

      ctx.save();
      ctx.translate(s.x, s.y);

      if (h > .22) {
        const patch = h > .78 ? p.soil : h > .52 ? p.groundLight : p.groundDark;
        ctx.globalAlpha = h > .78 ? .30 : .18;
        irregularBlob(ctx, ix, iy, 44 + h2 * 24, 29 + h * 18, patch, h * .7);
      }

      if (h2 > .57) {
        ctx.globalAlpha = .15;
        irregularBlob(ctx, ix + 11, iy - 7, 28 + h * 20, 17 + h2 * 12, p.soilLight, -.3);
      }

      ctx.globalAlpha = .38;
      const blades = 2 + Math.floor(h * 3);
      for (let i = 0; i < blades; i++) {
        const gx = -35 + hashRand(ix, iy, 120 + i) * 70;
        const gy = -26 + hashRand(ix, iy, 150 + i) * 52;
        const tall = 3 + hashRand(ix, iy, 180 + i) * 6;
        line(ctx, gx, gy + 2, gx - 2, gy - tall, p.groundDark, 1);
        line(ctx, gx, gy + 2, gx + 2.4, gy - tall * .8, p.groundLight, .8);
      }

      if (season.id === "spring" && h > .62) {
        ctx.globalAlpha = .62;
        ellipse(ctx, -18 + h2 * 20, 13, 1.4, 1.4, p.flowerA);
        ellipse(ctx, 17 - h * 10, -11, 1.2, 1.2, p.flowerB);
      } else if (season.id === "autumn") {
        ctx.globalAlpha = .42;
        for (let i = 0; i < 3; i++) {
          const lx = -31 + hashRand(ix, iy, 230 + i) * 62;
          const ly = -24 + hashRand(ix, iy, 260 + i) * 48;
          ellipse(ctx, lx, ly, 2.2, 1.1, i % 2 ? "#b96732" : "#d1973d", hashRand(ix, iy, 290 + i) * 2);
        }
      } else if (season.id === "winter") {
        ctx.globalAlpha = .55 + h2 * .14;
        irregularBlob(ctx, ix + 27, iy + 34, 45 + h * 16, 27 + h2 * 13, p.snow || "#dce3dd", -.15);
        ctx.globalAlpha = .20;
        irregularBlob(ctx, ix - 15, iy + 19, 33, 18, p.snowShade || "#bac8c7", .2);
      }

      ctx.restore();
    }
  }

  ctx.globalAlpha = 1;
}

export function drawDecor(ctx, pnt, item) {
  const season = getSeasonState();
  const p = season.palette;
  ctx.save();
  ctx.translate(pnt.x, pnt.y);

  if (item.type === "bush") {
    ellipse(ctx, 2, 4, 17, 7, "rgba(16,22,17,.16)");
    ctx.strokeStyle = p.woodDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2,3); ctx.lineTo(-10,-9);
    ctx.moveTo(1,3); ctx.lineTo(11,-10);
    ctx.moveTo(0,1); ctx.lineTo(0,-15);
    ctx.stroke();

    if (season.id === "winter") {
      ctx.strokeStyle = "#5f5041";
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3, 0);
        ctx.lineTo(i * 6, -12 - Math.abs(i) * 2);
        ctx.stroke();
      }
      ellipse(ctx, -7, -9, 7, 2.5, p.snow || "#dce3dd", -.2);
      ellipse(ctx, 7, -11, 8, 2.7, p.snow || "#dce3dd", .15);
    } else {
      const cols = seasonalLeafPalette(item.variant || 0);
      const leaves = [[-11,-7,7,5],[-4,-13,8,6],[5,-12,8,6],[12,-6,7,5],[-1,-5,10,6]];
      for (const l of leaves) leaf(ctx,l[0],l[1],l[2],l[3],cols[1],(l[0]+l[1])*.03);
      leaf(ctx,-7,-13,5,3.6,cols[2],-.5);
      leaf(ctx,5,-15,5,3.5,cols[2],.35);
      if (season.id === "autumn") {
        ellipse(ctx, 8,-7,1.4,1.4,"#8d3328");
        ellipse(ctx,-9,-5,1.3,1.3,"#b0472f");
      }
    }
  } else if (item.type === "fern") {
    ctx.strokeStyle = p.leafDark;
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      const dir = i * .16;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(i * 3, -5, i * 7, -17 + Math.abs(i));
      ctx.stroke();
      for (let j = 0; j < 3; j++) {
        const y = -4 - j * 4;
        leaf(ctx, i * (2.3 + j * 1.1), y, 3.5, 1.25, p.leaf, dir + (i < 0 ? -.7 : .7));
      }
    }
    if (season.id === "winter") {
      ctx.globalAlpha = .48;
      ellipse(ctx,0,-3,12,3,p.snow || "#dce3dd");
    }
  } else if (item.type === "flower") {
    ctx.strokeStyle = p.leafDark;
    ctx.lineWidth = 1;
    const count = 3 + (item.variant || 0);
    for (let i = 0; i < count; i++) {
      const x = (i - count/2) * 3 + 2;
      const y = -7 - (i % 2) * 4;
      line(ctx,x,3,x,y,p.leafDark,1);
      if (season.id !== "winter") {
        const color = i % 3 === 0 ? p.flowerA : i % 3 === 1 ? p.flowerB : p.flowerC;
        for (let a = 0; a < 4; a++) {
          const ang = a / 4 * Math.PI * 2;
          ellipse(ctx,x + Math.cos(ang)*2,y + Math.sin(ang)*2,1.6,1,color,ang);
        }
        ellipse(ctx,x,y,1.1,1.1,"#dfb85f");
      }
    }
  } else {
    ctx.strokeStyle = p.groundDark;
    ctx.lineWidth = 1.25;
    const count = 4 + (item.variant || 0);
    for (let i = 0; i < count; i++) {
      const x = (i - count/2) * 2.5;
      const bend = (i % 2 ? 1 : -1) * (2 + i * .2);
      ctx.beginPath();
      ctx.moveTo(x,4);
      ctx.quadraticCurveTo(x + bend,-5,x + bend*.5,-12 - (i%3)*2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawPond(ctx, pnt, item) {
  const season = getSeasonState();
  const p = season.palette;
  ctx.save();
  ctx.translate(pnt.x, pnt.y);

  ellipse(ctx, 2, 5, 56, 28, "rgba(18,27,25,.18)", -.08);

  const water = ctx.createLinearGradient(-40,-20,40,20);
  water.addColorStop(0, mixHex(p.water, "#193f4b", .22));
  water.addColorStop(.48, p.water);
  water.addColorStop(1, mixHex(p.waterLight, "#ffffff", .08));
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(0,0,52,27,-.08,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = "rgba(221,241,230,.38)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-7,-4,34,13,-.08,.15,Math.PI*.9);
  ctx.stroke();

  ctx.strokeStyle = "rgba(245,235,198,.38)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0,0,53,28,-.08,0,Math.PI*2);
  ctx.stroke();

  if (season.id === "spring" || season.id === "summer") {
    ellipse(ctx,-17,4,5,2.6,"#5e814f",-.15);
    ellipse(ctx,18,-6,4.5,2.3,"#6e9058",.18);
    ellipse(ctx,-15,2,1.3,1.3,"#e9d8a7");
  }

  if (season.id === "winter") {
    ctx.globalAlpha = .56;
    ctx.fillStyle = "#cbd8d7";
    ctx.beginPath();
    ctx.ellipse(0,0,47,22,-.08,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = .35;
    line(ctx,-26,-3,14,7,"#eef4f2",1.2);
    line(ctx,-8,-12,28,1,"#a6bec3",1);
  }

  ctx.restore();
}

function drawSmallStone(ctx, item) {
  const season = getSeasonState();
  const p = season.palette;
  const v = item.variant || 0;

  ellipse(ctx,1,5,12 + v,5.5,"rgba(15,19,16,.16)");

  const g = ctx.createLinearGradient(-8,-8,9,7);
  g.addColorStop(0,p.stoneLight);
  g.addColorStop(.48,p.stone);
  g.addColorStop(1,p.stoneDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10,2);
  ctx.quadraticCurveTo(-9,-5,-3,-8);
  ctx.quadraticCurveTo(5,-10,10,-4);
  ctx.quadraticCurveTo(13,2,7,6);
  ctx.quadraticCurveTo(-2,9,-10,2);
  ctx.fill();

  ctx.globalAlpha = .28;
  ellipse(ctx,-3,-4,5,2,p.stoneLight,-.25);
  ctx.globalAlpha = 1;
}

function drawRockCluster(ctx, item) {
  const season = getSeasonState();
  const p = season.palette;
  const variant = item.variant || 0;
  const vein = {
    copper_ore:"#c77945",
    tin_ore:"#d2d7d3",
    ore:"#927761",
    gold_ore:"#dfb94a"
  }[item.type];

  ellipse(ctx,3,13,29,9,"rgba(15,19,16,.22)");

  const rocks = variant % 2
    ? [[-10,2,17,18,-.12],[9,-2,18,21,.15],[18,8,11,12,.3]]
    : [[-12,5,16,15,-.18],[4,-3,19,22,.05],[18,7,12,13,.24]];

  for (let i = 0; i < rocks.length; i++) {
    const r = rocks[i];
    ctx.save();
    ctx.translate(r[0],r[1]);
    ctx.rotate(r[4]);

    const grad = ctx.createLinearGradient(-r[2],-r[3],r[2],r[3]);
    grad.addColorStop(0,p.stoneLight);
    grad.addColorStop(.42,p.stone);
    grad.addColorStop(1,p.stoneDark);
    irregularBlob(ctx, item.x + i * 7, item.y - i * 11, r[2], r[3], grad);
    ctx.restore();
  }

  ctx.globalAlpha = .30;
  irregularBlob(ctx, item.x + 33, item.y + 9, 12, 7, p.stoneLight, -.1);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(39,43,39,.50)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-8,-8); ctx.quadraticCurveTo(-3,-2,-6,8);
  ctx.moveTo(5,-15); ctx.quadraticCurveTo(2,-7,10,1);
  ctx.stroke();

  if (vein) {
    ctx.save();
    ctx.shadowColor = vein;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = vein;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-15,-2);
    ctx.quadraticCurveTo(-7,-7,-2,-1);
    ctx.quadraticCurveTo(4,5,10,-4);
    ctx.moveTo(5,7);
    ctx.quadraticCurveTo(12,2,18,8);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = .9;
    ctx.beginPath();
    ctx.moveTo(-13,-3); ctx.quadraticCurveTo(-7,-7,-2,-2);
    ctx.stroke();
  } else if (season.id !== "winter") {
    ctx.fillStyle = "#566b3d";
    ctx.globalAlpha = .62;
    ellipse(ctx,-9,-10,7,2.2,"#657c47",-.2);
    ellipse(ctx,9,-15,5,2,"#5c7543",.25);
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = .68;
    ellipse(ctx,-4,-16,19,4,p.snow || "#dce3dd",-.05);
    ctx.globalAlpha = 1;
  }

  const hits = state.resourceHits[item.id] || 0;
  if (hits > 0) {
    ctx.strokeStyle = "rgba(31,32,29,.72)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-1,-4); ctx.lineTo(-7,3); ctx.lineTo(-3,10);
    if (hits > 2) { ctx.moveTo(7,-7); ctx.lineTo(11,1); ctx.lineTo(5,8); }
    ctx.stroke();
  }
}

function drawBerryBush(ctx, item) {
  const season = getSeasonState();
  const p = season.palette;
  const v = item.variant || 0;
  const wind = Math.sin(performance.now() * .0014 + item.x * .017 + item.y * .011) * 1.3;

  ellipse(ctx,2,6,20,8,"rgba(17,22,17,.18)");
  ctx.strokeStyle = p.woodDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0,5); ctx.lineTo(-11,-14);
  ctx.moveTo(0,5); ctx.lineTo(13,-13);
  ctx.moveTo(0,4); ctx.lineTo(1,-21);
  ctx.stroke();

  if (season.id === "winter") {
    ctx.strokeStyle = "#604b3b";
    ctx.lineWidth = 1.4;
    for (let i=-3;i<=3;i++) {
      ctx.beginPath();
      ctx.moveTo(i*2,2);
      ctx.quadraticCurveTo(i*3,-7,i*6,-18+Math.abs(i));
      ctx.stroke();
    }
    ellipse(ctx,-8,-13,8,2.5,p.snow || "#dce3dd",-.12);
    ellipse(ctx,9,-14,9,2.8,p.snow || "#dce3dd",.18);
    return;
  }

  const cols = seasonalLeafPalette(v);
  const clusters=[[-13,-9,9,6],[-6,-17,10,7],[5,-18,10,7],[14,-10,9,6],[1,-8,12,8]];
  ctx.save();
  ctx.translate(wind, 0);
  for(const c of clusters) {
    leaf(ctx,c[0],c[1],c[2],c[3],cols[0],.1);
    leaf(ctx,c[0]-1,c[1]-2,c[2]*.75,c[3]*.72,cols[1],-.2);
  }
  leaf(ctx,-8,-19,6,3.5,cols[2],-.4);
  leaf(ctx,7,-20,6,3.5,cols[2],.3);
  ctx.restore();

  const berries = season.id === "autumn" ? "#8f2e2f" : "#4353a1";
  for(const b of [[-10,-11],[-2,-16],[8,-14],[12,-7],[1,-7],[-5,-7]]) {
    ellipse(ctx,b[0],b[1],2.2,2.2,berries);
    ellipse(ctx,b[0]-.6,b[1]-.7,.7,.7,"rgba(255,255,255,.35)");
  }
}

function drawConifer(ctx, item) {
  const season = getSeasonState();
  const p = season.palette;
  const v = item.variant || 0;
  const wind = Math.sin(performance.now() * .0011 + item.x * .012 + item.y * .009) * 1.5;

  ellipse(ctx,3,8,28,9,"rgba(15,20,16,.22)");
  line(ctx,0,7,0,-71,p.woodDark,8);
  line(ctx,-1,6,-1,-69,p.woodLight,2.2);

  const tiers = [
    {y:-20,w:27,h:27},
    {y:-38,w:24,h:29},
    {y:-56,w:20,h:28},
    {y:-72,w:15,h:23}
  ];

  for (let i=0;i<tiers.length;i++) {
    const t=tiers[i];
    const offset=(v-1.5)*(i%2?1.5:-1.2) + wind * (i + 1) * .28;
    ctx.fillStyle = p.evergreenDark;
    ctx.beginPath();
    ctx.moveTo(offset, t.y-t.h);
    ctx.quadraticCurveTo(-t.w*.30+offset,t.y-t.h*.45,-t.w+offset,t.y+3);
    ctx.quadraticCurveTo(-t.w*.32+offset,t.y-2,offset,t.y+7);
    ctx.quadraticCurveTo(t.w*.32+offset,t.y-2,t.w+offset,t.y+3);
    ctx.quadraticCurveTo(t.w*.30+offset,t.y-t.h*.45,offset,t.y-t.h);
    ctx.fill();

    ctx.fillStyle=p.evergreen;
    ctx.beginPath();
    ctx.moveTo(offset-1,t.y-t.h+4);
    ctx.quadraticCurveTo(-t.w*.18+offset,t.y-t.h*.40,-t.w*.66+offset,t.y);
    ctx.quadraticCurveTo(-t.w*.15+offset,t.y-3,offset,t.y+3);
    ctx.quadraticCurveTo(t.w*.22+offset,t.y-4,t.w*.62+offset,t.y);
    ctx.quadraticCurveTo(t.w*.22+offset,t.y-t.h*.45,offset-1,t.y-t.h+4);
    ctx.fill();

    if (i>0) {
      ctx.fillStyle=p.evergreenLight;
      ctx.globalAlpha=.55;
      ctx.beginPath();
      ctx.moveTo(offset-2,t.y-t.h+7);
      ctx.quadraticCurveTo(-t.w*.18+offset,t.y-t.h*.35,-t.w*.42+offset,t.y-2);
      ctx.lineTo(offset,t.y-3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha=1;
    }

    if (season.id === "winter") {
      ctx.globalAlpha=.72;
      ctx.fillStyle=p.snow || "#dce3dd";
      ctx.beginPath();
      ctx.moveTo(-t.w*.75+offset,t.y-2);
      ctx.quadraticCurveTo(offset,t.y+3,t.w*.68+offset,t.y-2);
      ctx.quadraticCurveTo(t.w*.28+offset,t.y+2,offset,t.y+4);
      ctx.quadraticCurveTo(-t.w*.34+offset,t.y+2,-t.w*.75+offset,t.y-2);
      ctx.fill();
      ctx.globalAlpha=1;
    }
  }
}

function drawDeciduousTree(ctx, item) {
  const season = getSeasonState();
  const p = season.palette;
  const v = item.variant || 0;
  const lean = (v - 1.5) * 2;
  const wind = Math.sin(performance.now() * .00115 + item.x * .014 + item.y * .01) * 1.7;

  ellipse(ctx,4,10,31,10,"rgba(15,20,16,.22)");

  ctx.strokeStyle=p.woodDark;
  ctx.lineCap="round";
  ctx.lineWidth=9;
  ctx.beginPath();
  ctx.moveTo(0,6);
  ctx.quadraticCurveTo(-2+lean,-27,2+lean,-51);
  ctx.stroke();

  ctx.strokeStyle=p.wood;
  ctx.lineWidth=5.5;
  ctx.beginPath();
  ctx.moveTo(-1,5);
  ctx.quadraticCurveTo(0+lean,-27,3+lean,-50);
  ctx.stroke();

  ctx.strokeStyle=p.woodDark;
  ctx.lineWidth=3.7;
  ctx.beginPath();
  ctx.moveTo(1+lean,-34); ctx.quadraticCurveTo(-11+lean,-44,-21+lean,-51);
  ctx.moveTo(2+lean,-39); ctx.quadraticCurveTo(13+lean,-49,23+lean,-55);
  ctx.moveTo(0+lean,-27); ctx.quadraticCurveTo(-9+lean,-34,-15+lean,-41);
  ctx.stroke();

  line(ctx,-2,4,-14,12,p.woodDark,3);
  line(ctx,3,4,15,11,p.woodDark,3);

  if (season.id === "winter") {
    ctx.strokeStyle="#66503d";
    ctx.lineWidth=2;
    for (const b of [[-20,-51,-29,-61],[22,-55,30,-66],[-14,-43,-25,-45],[14,-48,24,-47]]) {
      ctx.beginPath();
      ctx.moveTo(b[0]+lean,b[1]); ctx.lineTo(b[2]+lean,b[3]); ctx.stroke();
    }
    ctx.globalAlpha=.72;
    ellipse(ctx,-19+lean,-53,9,2.7,p.snow || "#dce3dd",-.18);
    ellipse(ctx,19+lean,-57,10,2.8,p.snow || "#dce3dd",.16);
    ellipse(ctx,1+lean,-50,8,2.4,p.snow || "#dce3dd");
    ctx.globalAlpha=1;
    return;
  }

  const cols=seasonalLeafPalette(v);
  let centers;
  if (v===0) centers=[[-21,-53,24,19,-.2],[2,-65,27,22,.05],[23,-55,23,18,.18],[-5,-84,21,17,-.08]];
  else if (v===2) centers=[[-14,-53,19,17,-.2],[9,-63,23,19,.08],[18,-78,18,15,.18],[-8,-79,17,15,-.1]];
  else centers=[[-20,-55,22,18,-.2],[3,-67,25,20,.05],[24,-58,20,17,.18],[0,-85,20,16,-.08]];
  ctx.save();
  ctx.translate(wind, 0);
  canopyCloud(ctx,centers,cols);
  ctx.restore();

  if (season.id === "spring" && (v===2 || v===3)) {
    ctx.globalAlpha=.82;
    const blossoms=v===2?"#f3e7d2":"#e9cadc";
    for(const b of [[-15,-61],[3,-74],[17,-63],[-3,-88],[11,-82]]) ellipse(ctx,b[0]+lean*.2,b[1],2.1,1.4,blossoms,.2);
    ctx.globalAlpha=1;
  }
}

export function drawResource(ctx, pnt, item) {
  const season = getSeasonState();
  const p = season.palette;
  ctx.save();
  ctx.translate(pnt.x,pnt.y);

  if(item.type==="branch") {
    ellipse(ctx,1,5,17,4,"rgba(15,20,16,.13)");
    line(ctx,-15,3,14,-6,p.woodDark,5);
    line(ctx,-10,-4,12,6,p.wood,4);
    line(ctx,-9,1,10,-5,p.woodLight,1.2);
    line(ctx,4,-3,10,-11,p.woodDark,2);
  } else if(item.type==="fiber") {
    ellipse(ctx,0,4,13,5,"rgba(15,20,16,.10)");
    ctx.strokeStyle=p.leafDark;
    ctx.lineWidth=2;
    for(let i=-4;i<=4;i++) {
      ctx.beginPath();
      ctx.moveTo(i*2,4);
      ctx.quadraticCurveTo(i*2.5,-7,i*5,-19-Math.abs(i));
      ctx.stroke();
    }
    leaf(ctx,-7,-9,6,2.4,p.leafLight,-.65);
    leaf(ctx,8,-12,6,2.4,p.leaf,.55);
  } else if(item.type==="stone") {
    drawSmallStone(ctx,item);
  } else if(["large_rock","copper_ore","tin_ore","ore","gold_ore"].includes(item.type)) {
    drawRockCluster(ctx,item);
  } else if(item.type==="berries") {
    drawBerryBush(ctx,item);
  } else if(item.type==="tree") {
    if((item.variant||0)===1) drawConifer(ctx,item);
    else drawDeciduousTree(ctx,item);
  }

  ctx.restore();
}

function plank(ctx,x,y,w,h,palette,seed,rotation=0) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation);
  ctx.fillStyle=palette.woodDark;
  ctx.beginPath();
  ctx.roundRect(-w/2,-h/2,w,h,2);
  ctx.fill();

  const grad=ctx.createLinearGradient(0,-h/2,0,h/2);
  grad.addColorStop(0,palette.woodLight);
  grad.addColorStop(.4,palette.wood);
  grad.addColorStop(1,mixHex(palette.wood,palette.woodDark,.35));
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.roundRect(-w/2+1,-h/2+1,w-2,h-2,1.5);
  ctx.fill();

  ctx.strokeStyle="rgba(58,35,22,.40)";
  ctx.lineWidth=.8;
  for(let i=0;i<2;i++) {
    const yy=-h*.18+i*h*.32 + (hashRand(seed,i,4)-.5)*1.6;
    ctx.beginPath();
    ctx.moveTo(-w*.38,yy);
    ctx.quadraticCurveTo(0,yy+(hashRand(seed,i,8)-.5)*2,w*.38,yy+.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCampfire(ctx,building,p) {
  const t=performance.now()*.006+building.x*.012+building.y*.009;
  const sway=Math.sin(t)*3;
  const pulse=1+Math.sin(t*1.7)*.08;

  ellipse(ctx,1,8,25,8,"rgba(18,14,10,.20)");
  for(let i=0;i<9;i++) {
    const a=i/9*Math.PI*2;
    const x=Math.cos(a)*15;
    const y=Math.sin(a)*8;
    ellipse(ctx,x,y,5.5,4.2,p.stone,i*.2);
    ellipse(ctx,x-1,y-1.4,3.4,1.5,p.stoneLight,i*.2);
  }

  line(ctx,-12,5,12,-5,p.woodDark,6);
  line(ctx,-11,-5,12,5,p.wood,6);
  line(ctx,-9,-4,8,4,p.woodLight,1.2);

  ctx.save();
  ctx.shadowColor="rgba(255,126,35,.72)";
  ctx.shadowBlur=14;
  ctx.fillStyle="#e85e29";
  ctx.beginPath();
  ctx.moveTo(-10,4);
  ctx.quadraticCurveTo(-13+sway,-9,-1+sway*.35,-25*pulse);
  ctx.quadraticCurveTo(9+sway*.2,-13,11,2);
  ctx.quadraticCurveTo(4,8,-10,4);
  ctx.fill();

  ctx.fillStyle="#f5a33b";
  ctx.beginPath();
  ctx.moveTo(-6,4);
  ctx.quadraticCurveTo(-7+sway*.25,-5,1,-17*pulse);
  ctx.quadraticCurveTo(7,-7,6,4);
  ctx.quadraticCurveTo(1,8,-6,4);
  ctx.fill();

  ctx.fillStyle="#ffdc6c";
  ctx.beginPath();
  ctx.moveTo(-2,4);
  ctx.quadraticCurveTo(-2,-1,2,-10*pulse);
  ctx.quadraticCurveTo(5,-1,3,5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for(let i=0;i<4;i++) {
    const phase=t*(1.4+i*.18)+i*1.6;
    ellipse(ctx,Math.sin(phase*2)*5,-8-((phase*7)%20),1.1,1.1,"rgba(255,194,75,.65)");
  }

  ctx.save();
  ctx.globalAlpha = .16;
  ctx.strokeStyle = "#d8d0bf";
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    const smoke = t * .55 + i * 1.7;
    ctx.beginPath();
    ctx.moveTo(i * 3 - 2, -24);
    ctx.bezierCurveTo(-7 + Math.sin(smoke) * 3, -33, 8 + Math.sin(smoke * 1.4) * 4, -42, Math.sin(smoke * .8) * 5, -52);
    ctx.stroke();
  }
  ctx.restore();

  if(building.cooking?.remaining>0) {
    line(ctx,-22,-18,22,-18,"#4c3424",2.5);
    ellipse(ctx,0,-18,8,4.5,"#8d3f2e");
    line(ctx,-4,-20,5,-16,"rgba(255,195,120,.35)",1);
  }
}

export function drawBuilding(ctx,pnt,building,preview=false) {
  const season=getSeasonState();
  const p=season.palette;
  const type=building.type;
  ctx.save();
  ctx.translate(pnt.x,pnt.y);

  if(preview) ctx.globalAlpha=.68;

  if(type==="wood_foundation") {
    ellipse(ctx,2,20,36,9,"rgba(16,13,10,.16)");
    ctx.fillStyle=p.woodDark;
    ctx.beginPath();
    ctx.moveTo(-34,-24);ctx.lineTo(34,-24);ctx.lineTo(34,24);ctx.lineTo(-34,24);ctx.closePath();
    ctx.fill();
    for(let x=-27,i=0;x<=27;x+=9,i++) plank(ctx,x,0,8,45,p,building.x+i,0);
    line(ctx,-33,0,33,0,"rgba(63,39,25,.50)",1.4);
  } else if(type==="wood_wall") {
    const vertical=building.orientation==="v";
    if(vertical) {
      ellipse(ctx,1,27,13,6,"rgba(16,13,10,.18)");
      for(let y=-23,i=0;y<=23;y+=9,i++) plank(ctx,0,y,18,7,p,building.y+i,0);
      line(ctx,-7,-29,-7,29,p.woodDark,5);
      line(ctx,7,-29,7,29,p.woodDark,5);
      line(ctx,-6,-28,-6,28,p.woodLight,1);
    } else {
      ellipse(ctx,1,7,39,6,"rgba(16,13,10,.18)");
      for(let x=-32,i=0;x<=32;x+=11,i++) plank(ctx,x,0,9,17,p,building.x+i,0);
      line(ctx,-37,-7,37,-7,p.woodDark,5);
      line(ctx,-37,7,37,7,p.woodDark,5);
      line(ctx,-36,-6,36,-6,p.woodLight,1);
    }
  } else if(type==="campfire") {
    drawCampfire(ctx,building,p);
  } else if(type==="workbench") {
    ellipse(ctx,1,15,31,7,"rgba(16,13,10,.18)");
    plank(ctx,0,-8,56,15,p,building.x,0);
    plank(ctx,-20,7,7,29,p,building.y,0);
    plank(ctx,20,7,7,29,p,building.y+4,0);
    line(ctx,-22,-14,20,-14,p.woodLight,1.4);
    line(ctx,-12,-17,11,-11,"#9aa29d",3);
    line(ctx,8,-17,15,-5,"#6f4a2e",2);
    ellipse(ctx,15,-5,3.2,2.5,"#909994");
  } else if(type==="forge") {
    ellipse(ctx,1,16,30,8,"rgba(14,13,12,.20)");
    for(let i=0;i<11;i++) {
      const a=i/11*Math.PI*2;
      ellipse(ctx,Math.cos(a)*20,Math.sin(a)*12,7,5,p.stone,a*.2);
      ellipse(ctx,Math.cos(a)*20-1,Math.sin(a)*12-1.5,4,1.5,p.stoneLight,a*.2);
    }
    ellipse(ctx,0,0,15,9,"#2b2d29");
    ellipse(ctx,0,1,10,6,"#c84e28");
    ellipse(ctx,-2,-1,6,3,"#f3a33e");
    ctx.fillStyle=p.stoneDark;
    ctx.beginPath();ctx.roundRect(12,-29,10,30,3);ctx.fill();
    ctx.fillStyle=p.stoneLight;ctx.fillRect(14,-27,3,25);
  } else if(type==="bed") {
    ellipse(ctx,1,17,31,7,"rgba(16,13,10,.18)");
    plank(ctx,0,0,58,34,p,building.x,0);
    ctx.fillStyle="#9c8f6b";
    ctx.beginPath();ctx.roundRect(-25,-13,50,26,5);ctx.fill();
    ctx.fillStyle="#c7b995";
    ctx.beginPath();ctx.roundRect(-21,-11,16,22,5);ctx.fill();
    ctx.fillStyle="#78664b";
    ctx.beginPath();ctx.moveTo(-4,-12);ctx.lineTo(24,-12);ctx.lineTo(24,12);ctx.lineTo(4,12);ctx.quadraticCurveTo(1,0,-4,-12);ctx.fill();
    line(ctx,-24,-13,24,-13,"rgba(255,255,255,.15)",1);
  } else if(type==="chest") {
    ellipse(ctx,1,15,24,7,"rgba(16,13,10,.18)");
    const opened=state.openChestId===building.id&&!preview;
    ctx.fillStyle=p.woodDark;
    ctx.beginPath();ctx.roundRect(-22,-10,44,25,5);ctx.fill();
    ctx.fillStyle=p.wood;
    ctx.beginPath();ctx.roundRect(-20,-8,40,21,4);ctx.fill();
    for(let y=-5;y<=8;y+=7) line(ctx,-18,y,18,y,p.woodLight,.9);
    ctx.strokeStyle="#4b4439";ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-21,-9,42,23,4);ctx.stroke();
    line(ctx,-13,-9,-13,14,"#4f493e",2);
    line(ctx,13,-9,13,14,"#4f493e",2);
    ctx.fillStyle="#c69b4f";ctx.beginPath();ctx.roundRect(-3,-2,6,8,2);ctx.fill();

    if(opened) {
      ctx.save();
      ctx.translate(0,-12);
      ctx.rotate(-.35);
      ctx.fillStyle=p.woodDark;
      ctx.beginPath();ctx.roundRect(-21,-8,42,10,4);ctx.fill();
      ctx.fillStyle=p.wood;ctx.fillRect(-19,-6,38,6);
      ctx.restore();
    } else {
      ctx.fillStyle=p.woodLight;
      ctx.globalAlpha=.32;
      ctx.beginPath();ctx.ellipse(0,-9,17,5,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.globalAlpha = preview ? .68 : 1;
    }
  }

  if (season.id === "winter" && !preview) {
    ctx.globalAlpha = .70;
    const snow = p.snow || "#dce3dd";
    if (type === "wood_foundation") {
      ellipse(ctx,-17,-22,15,2.5,snow,-.04);
      ellipse(ctx,16,-21,14,2.4,snow,.04);
    } else if (type === "wood_wall") {
      if (building.orientation === "v") {
        ellipse(ctx,0,-29,9,2.3,snow,0);
      } else {
        ellipse(ctx,0,-8,34,2.2,snow,0);
      }
    } else if (type === "workbench") {
      ellipse(ctx,0,-15,25,2.7,snow,0);
    } else if (type === "chest") {
      ellipse(ctx,0,-10,17,2.4,snow,0);
    } else if (type === "bed") {
      ellipse(ctx,3,-13,21,2.3,snow,0);
    } else if (type === "forge") {
      ellipse(ctx,-10,-13,10,2.4,snow,-.15);
      ellipse(ctx,17,-28,5,2,snow,0);
    }
    ctx.globalAlpha = 1;
  }

  if(preview) {
    ctx.globalAlpha=1;
    ctx.strokeStyle=building.valid?"#b9ef94":"#ef8f82";
    ctx.lineWidth=2;
    ctx.setLineDash([5,4]);
    if(type==="wood_wall") {
      if(building.orientation==="v") ctx.strokeRect(-10,-31,20,62);
      else ctx.strokeRect(-39,-10,78,20);
    } else if(type==="wood_foundation") {
      ctx.strokeRect(-35,-26,70,52);
    } else {
      ctx.beginPath();ctx.ellipse(0,0,31,24,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function drawSeasonGrade(ctx,viewW,viewH) {
  const season=getSeasonState();
  ctx.fillStyle=season.palette.overlay || "rgba(0,0,0,0)";
  ctx.fillRect(0,0,viewW,viewH);
}

export function drawSeasonAtmosphere(ctx,viewW,viewH) {
  const season=getSeasonState();
  const t=performance.now()/1000;
  const count=season.id==="winter"?42:season.id==="autumn"?20:season.id==="spring"?14:8;

  ctx.save();
  for(let i=0;i<count;i++) {
    const seed=hashRand(i,season.index,700);
    const x=((hashRand(i,season.index,701)*viewW + t*(season.id==="winter"?8:season.id==="autumn"?13:4)*(i%3+1))%(viewW+40))-20;
    const speed=season.id==="winter"?17+seed*18:season.id==="autumn"?22+seed*15:7+seed*7;
    const y=((hashRand(i,season.index,702)*viewH + t*speed)%(viewH+50))-25;
    const sway=Math.sin(t*(.7+seed)+i)*10;

    if(season.id==="winter") {
      ctx.globalAlpha=.35+seed*.45;
      ellipse(ctx,x+sway*.25,y,1.2+seed*1.5,1.2+seed*1.5,"#f0f4f1");
    } else if(season.id==="autumn") {
      ctx.globalAlpha=.25+seed*.35;
      ellipse(ctx,x+sway,y,2.4+seed*1.5,1.2+seed*.7,i%2?"#c36d31":"#d49a3e",t+seed*4);
    } else if(season.id==="spring") {
      ctx.globalAlpha=.16+seed*.22;
      ellipse(ctx,x+sway*.45,y,1.6,1,"#f0d8df",t*.4);
    } else {
      ctx.globalAlpha=.10+seed*.16;
      ellipse(ctx,x+sway*.2,y,1.1,1.1,"#f1ddb0");
    }
  }
  ctx.restore();
}
