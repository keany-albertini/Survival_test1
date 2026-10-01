import assert from 'node:assert/strict';
import {LAND_SIZE,LAND_SDF} from '../js/everwild/v7-land.js';
import {REGIONS,landDistance,outerHeight,ISLANDS} from '../js/everwild/geography.js';
const visited=new Set(),areas=[];
for(let i=0;i<LAND_SDF.length;i++){if(LAND_SDF[i]<=0||visited.has(i))continue;let count=0,q=[i];visited.add(i);while(q.length){const n=q.pop();count++;const x=n%LAND_SIZE,z=Math.floor(n/LAND_SIZE);for(const [a,b] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]){if(a<0||b<0||a>=LAND_SIZE||b>=LAND_SIZE)continue;const t=b*LAND_SIZE+a;if(LAND_SDF[t]>0&&!visited.has(t)){visited.add(t);q.push(t);}}}areas.push(count);}
assert.equal(areas.length,6,'one continent and exactly five detached islands');assert.equal(ISLANDS.length,5);
for(const r of REGIONS){assert(landDistance(r.x,r.z)>2,`${r.id}: destination on safe land (${landDistance(r.x,r.z)})`);assert(Number.isFinite(outerHeight(r.x,r.z)));}
assert(REGIONS.find(r=>r.id==='snow').x>100,'glacial north points to the right');
assert(outerHeight(65,-30)>outerHeight(-4,4)+10,'Vantuman rises above plains');
assert(landDistance(240,-240)<0,'ocean separates land at world corners');
console.log('PASS: V7 six landmasses, five islands, safe destinations, northern glacier to the right and Vantuman relief. Land fraction:',(visited.size/LAND_SDF.length).toFixed(3));
