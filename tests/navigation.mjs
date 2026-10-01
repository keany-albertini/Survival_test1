import assert from 'node:assert/strict';
import {isClear,canStep,nearestClear} from '../js/everwild/navigation.js';
// Exact regression: the premium rock originally loaded on the spawn.
const lateRock=[{x:-3.8,z:4.1,radius:.68}];
assert.equal(isClear(-4,4,lateRock),false);
assert.equal(canStep(-4.12,4,-4,4,lateRock),true,'can walk out of a late-loaded rock');
assert.equal(canStep(-3.9,4,-4,4,lateRock),false,'cannot move deeper into the rock');
const recovered=nearestClear(-4,4,lateRock);
assert(recovered);assert(isClear(recovered.x,recovered.z,lateRock,248,.5));
assert.equal(canStep(-3.8,4.1,-6,4.1,lateRock),false,'outside players cannot walk through the rock');
assert.equal(canStep(249,0,247,0,[]),false,'world bounds hold');
const crowded=[{x:0,z:0,radius:1},{x:1,z:0,radius:1},{x:-1,z:0,radius:1}];
const free=nearestClear(0,0,crowded,{land:(x,z)=>z>0});assert(free&&free.z>0);assert(isClear(free.x,free.z,crowded,248,.5));
assert.equal(nearestClear(0,0,[{x:0,z:0,radius:100}],{maxRadius:2}),null,'failed recovery does not invent a position');
console.log('PASS: late rock overlap, escape direction, safe relocation, collision blocking, world limits, crowded/land-only recovery.');
