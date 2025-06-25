import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as T}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as O,Q as F}from"./path-shape-7xuS1yUd.js";import{P as K,d as b,s as W,e as _,m as Q,R as z}from"./utility-DVoV3GgU.js";import{m as I}from"./misc-wGF4FraP.js";import{l as J}from"./math-to-path-BjxPr1Cw.js";import{f as Z,c as tt}from"./hershey-fonts-JBvTY-Dp.js";import{s as et,a as nt,t as st,b as at}from"./fourier-shared-CZ-69KWO.js";import"./letters-base-FcpdJLUI.js";const v={input(n){if(!Number.isSafeInteger(n)||n<0)throw new RangeError(`invalid ${n}`);if(n>=C.length)throw new D(n);return C[n]},ease(n){return(1-Math.cos(Math.PI*n))/2},makeTSplitter:Q,makeTSplitterA:_,lerpPoints:J,lerp:I.lerp,makeLinear:I.makeLinear,random:n=>{if(typeof n!="string")throw new RangeError("Invalid seed.  Expecting a string.");return z.fromString(n)},referencePath:new K,samples:at,cursiveLetters:tt,futuraLLetters:Z,sampleCount:200},q=T.getById("go",HTMLButtonElement),R=T.getById("source",HTMLTextAreaElement),S=T.getById("sampleCode",HTMLSelectElement),N=[{name:"Custom",code:""},{name:"Polygons and Stars",code:`const numberOfPoints = 5;
/**
 * 0 to make a polygon.
 * 1 to make a star, if numberOfPoints is odd and at least 5.
 * 2 to make a different star, if numberOfPoints is odd and at least 7.
 */ 
const skip = 1;
const rotate = 2 * Math.PI / numberOfPoints * (1 + skip);

/**
 * Create a random number generator.
 * Change the seed to get different values.
 * random() will return a number between 0 and 1.
 */
const random = support.random("My seed 2025");

/**
 * How much effect does the random number generator have.
 * Far left → no randomness at all.
 */
const amplitude = support.input(0);

function jiggle() {
  return (random()-0.5) * amplitude;
}

const corners = [];
for (let i = 0; i < numberOfPoints; i++) {
  const θ = i * rotate;
  corners.push({x: Math.cos(θ) + jiggle(), y: Math.sin(θ) + jiggle()});
}
//console.log(corners);
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], segment.t);
}`},{name:"Square",default:!0,code:`const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], segment.t);
}`},{name:"Square with Easing",code:`const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], support.ease(segment.t));
}`},{name:"SVG Path",code:`// Also consider support.samples.hilbert[0] ... support.samples.hilbert[3]
//   and support.samples.peanocurve[0] ... support.samples.peanocurve[2] 
support.referencePath.d = support.samples.likeShareAndSubscribe;
support.sampleCount = 2000;
const length = support.referencePath.length;
console.log({length});
function f(t) {
  // Copy the path as is.
  return support.referencePath.getPoint(t * length);
}`},{name:"Simple Ellipse",code:`// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
function f(t) {
// Use the second slider to change the starting point on the ellipse.
// This doesn't matter in a static ellipse, but it can be important in some animations and other special cases.
const angle = (t + support.input(1)) * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);
return {x, y};}`},{name:"Circle with Wavy Edge",code:`const height = 1;
const width = height;
function f(t) {
const angle = t * 2 * Math.PI;
const adjustmentAngle = angle * 8;
const adjustmentFactor = Math.sin(adjustmentAngle)/10+1;
const x = width * Math.cos(angle) * adjustmentFactor;
const y = height * Math.sin(angle) * adjustmentFactor;
return {x, y};}`},{name:"Lissajous Curves",code:`const a = 1; // Amplitude in x-direction
const b = 1; // Amplitude in y-direction
const freqX = 3; // Frequency in x-direction
const freqY = 2; // Frequency in y-direction
const phase = Math.PI / 2; // Phase difference
function f(t) {
const angle = t * 2 * Math.PI;
const x = a * Math.sin(freqX * angle + phase);
const y = b * Math.sin(freqY * angle);
return {x, y};}`},{name:"Hypocycloid / Astroid",code:`const R = 1; // Radius of the large circle
const r = R / 4; // Radius of the small circle (astroid case)
function f(t) {
const angle = t * 2 * Math.PI;
const x = (R - r) * Math.cos(angle) + r * Math.cos((R - r) / r * angle);
const y = (R - r) * Math.sin(angle) - r * Math.sin((R - r) / r * angle);
return {x, y};}`},{name:"Bell Curve",code:`// Number of standard deviations in each direction:
const right = support.input(0) * 5;
const left = - right;
const width = right - left;
const height = support.input(1) * 4 + 1;
function f(t) {
const x = t * width + left;
// Negate this.
// This program works with normal graphics notation where lower values of y are higher on the display.
// Normal algebra-class graphs show lower values of y lower on the screen.
const y = - height * Math.exp(-x*x);
return {x, y};}`},{name:"Archimedean Spiral with Oscillation",code:`const scale = 1; // Overall scale of the spiral
const turns = 3; // Number of full rotations
const waveFreq = 10; // Frequency of the oscillation
const waveAmp = 0.1; // Amplitude of the oscillation
function f(t) {
const angle = t * 2 * Math.PI * turns;
const radius = scale * t; // Linear growth for Archimedean spiral
const wave = waveAmp * Math.sin(t * 2 * Math.PI * waveFreq);
const x = radius * Math.cos(angle) * (1 + wave);
const y = radius * Math.sin(angle) * (1 + wave);
return {x, y};}`},{name:"Heart Curve ♡",code:`function f(t) {
const angle = t * 2 * Math.PI;
const x = 16 * Math.pow(Math.sin(angle), 3);
const algebraClassY = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
const y = - algebraClassY;
return {x, y};}`},{name:"Butterfly Curve",code:`const scale = 0.2;
function f(t) {
const angle = t * 24 * Math.PI * support.input(0); // More rotations for complexity
const e = Math.exp(1);
const x = scale * Math.sin(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
const y = - scale * Math.cos(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
return {x, y};}`},{name:"Hollow Star ☆",code:`const scale = 1; // Overall scale of the star
const points = 5; // Number of star points
const innerRadius = 0.4; // Radius of the inner points (controls star shape)
const roundness = 0.1; // Amplitude of the oscillation for rounding
function f(t) {
const angle = t * 2 * Math.PI; // Full circle
const starAngle = angle * points; // Angle scaled for 5 points
const radius = scale * (1 - innerRadius * (Math.cos(starAngle) + 1) / 2); // Base star shape
const rounding = roundness * Math.sin(starAngle); // Oscillation for rounding
const x = (radius + rounding) * Math.cos(angle);
const y = (radius + rounding) * Math.sin(angle);
return {x, y};}
// According to Wikipedia, if it's hollow inside, it's a star.
// If you can see the lines crossing each other, it's a pentagram.`},{name:"Rotating Ellipse",code:`const r1 = 0.5; // Short radius of the ellipse
const r2 = 1.0; // Long radius of the ellipse
const phase = support.input(0) * Math.PI; // First slider: Rotation angle in radians (0 to π)
function f(t) {
const angle = t * 2 * Math.PI; // Full circle

// Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);

// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);
return {x, y};}
// I used this formula as a starting place for the rounded pentagram.`},{name:"Rounded Pentagram ⛤, Heptagram, etc.",code:`const r1 = 0.5 * support.input(0); // Short radius of the ellipse. Top slider will adjust it.
const r2 = 1.0; // Long radius of the ellipse
function f(t) {
const phase = Math.PI * t; // The reference ellipse will make one half complete rotation during the tracing process.
const numberOfTrips = support.input(1) * 10;  // Effective range is 0 to 10 
const angle = t * 2 * Math.PI * numberOfTrips; // Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);
return {x, y};}
// The top slider controls the amount of curvature in the output.
// The second slider controls the number of lobes.
// Try values like 0.05, 0.15, 0.25, …, 0.95 for closed shapes.`},{name:"Squaring the Circle",code:`// This will trace out the shape of a dog tag using epicycles.
// Use the first slider to choose how many circles to use in
// this approximation, from 1 to 20.

// I was originally trying to use epicycles to create a square.
// But I ran into some problems,
// so this a square where two of the sides bulge out some.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
function f(t) {
let x = 0;
let y = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const radius = (4 * Math.sqrt(2)) / (Math.PI * Math.PI * n * n);
  const phase = k % 2 === 0 ? -Math.PI / 4 : Math.PI / 4;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = t * 2 * Math.PI;
  x += factor * radius * Math.cos(n * baseAngle + phase);
  y += factor * radius * Math.sin(n * baseAngle + phase);
}
return {x, y};}`},{name:"A Better Square",code:`// Inspired by https://www.youtube.com/watch?v=t99CmgJAXbg
// Square Orbits Part 1: Moon Orbits

const R = 0.573; // Match our first circle's radius
const moonRadius = (7 / 45) * R;
function f(t) {
const planetAngle = t * 2 * Math.PI; // Frequency 1
const moonAngle = -3 * planetAngle; // Frequency 3, opposite direction
const planetX = R * Math.cos(planetAngle);
const planetY = R * Math.sin(planetAngle);
const moonX = moonRadius * Math.cos(moonAngle);
const moonY = moonRadius * Math.sin(moonAngle);
const x = (planetX + moonX) * 1.2;
const y = (planetY + moonY) * 1.2;
return {x, y};}`},{name:"Fourier square wave",code:`// Use the first slider to choose how many sine waves to use in
// this approximation, from 1 to 20.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
function f(t) {
let ySum = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const amplitude = (4 / Math.PI) / n;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = 2 * Math.PI * 2.5 * t + Math.PI / 2; // 2.5 cycles, shift for vertical center
  ySum += factor * amplitude * Math.sin(n * baseAngle);
}
const x = (t * 5) - 2.5; // Span x from -2.5 to 2.5
const y = ySum;
return {x, y};}`}];function j(n,t){const o=n.getBBox(),a=t.viewBox.baseVal;a.x=o.x,a.y=o.y,a.width=o.width,a.height=o.height;const d=o.width/o.height,m=300,l=m*d;t.style.height=m+"px",t.style.width=l+"px";const u=Math.max(a.width,a.height)/100;return t.style.setProperty("--recommended-stroke-width",u.toString()),{recommendedStrokeWidth:u}}class ot{static#e=new this;#n=T.getById("distanceVsT",SVGSVGElement);#t=b("circle[data-distance]",SVGCircleElement,this.#n);#a=b("path",SVGPathElement,this.#n);#s=b("circle[data-t]",SVGCircleElement);constructor(){new T.AnimationLoop(t=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){t%=5e3;const a=t/5e3,d=a*100;this.#t.style.offsetDistance=d+"%",this.#t.style.display="";const{x:m,y:l}=this.f(a);this.#s.cx.baseVal.value=m,this.#s.cy.baseVal.value=l,this.#s.style.display=""}})}f;update(t,o){this.#a.setAttribute("d",o),j(this.#a,this.#n),this.f=t,this.#t.style.offsetPath=O.cssifyPath(o)}static update(t,o){this.#e.update(t,o)}}class it{static#e=new this;#n=T.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=b("[data-using] [data-circles]",HTMLTableCellElement);#o=b("[data-using] [data-amplitude]",HTMLTableCellElement);#l=b("[data-adding] [data-circles]",HTMLTableCellElement);#i=b("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=b("[data-available] [data-circles]",HTMLTableCellElement);#r=b("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,...this.#a]=W("path",SVGPathElement,2,1/0,this.#n)}#c;update(t,o){this.#c?.();const a=[];this.#c=()=>{a.forEach(s=>s.cancel())},this.#t.setAttribute("d",o),j(this.#t,this.#n);const d=et(nt(t));let m=0;d.forEach(s=>m+=s.amplitude);const l=d.map(s=>({here:s.amplitude/m*100,before:NaN,after:NaN}));{let s=0,r=0;l.forEach((c,i,g)=>{c.before=s,s+=c.here;const h=g.length-i-1,p=g[h];p.after=r,r+=p.here})}const u=10;let f=0;const V=750,G=500,x=new Array;for(let s=u-1;s>=0&&f<l.length;s--){let r=0,c=0,i=f;const g=l[i].before;for(;r+=l[i].here,c++,i++,!(i>=l.length);)if(s>0){const e=l[i].after/s;if(r>e)break}const h=l[i-1].after,p=l.length-i;x.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:f,usingAmplitude:g,addingCircles:c,addingAmplitude:r,availableAmplitude:h,availableCircles:p}),f+=c,x.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:f,usingAmplitude:g+r,addingCircles:0,addingAmplitude:0,availableAmplitude:h,availableCircles:p})}let $=NaN;{let s=0;x.forEach(i=>{const g=i.addingCircles?G:V,h=s+g;i.startTime=s,i.endTime=h,s=h}),x.forEach(i=>{i.offset=i.startTime/s}),$=50/s;const c={...x.at(-1),startTime:s,offset:1};x.push(c)}const L={duration:x.at(-1).endTime*3,iterations:1/0};this.#a.forEach((s,r)=>{let c=-1/0,i="";const g=x.map(({offset:h,usingCircles:p})=>{if(p!=c){let P=function(E){if(E.commands.length<2)throw new Error("wtf");const[y,...A]=E.commands,M=A.pop();if(!(y instanceof F&&M instanceof F))throw new Error("wtf");if(y.x0==M.x&&y.y0==M.y)return E;const k=(y.x0+M.x)/2,U=(y.y0+M.y)/2,Y=F.controlPoints(k,U,y.x1,y.y1,y.x,y.y),X=F.controlPoints(M.x0,M.y0,M.x1,M.y1,k,U);return new O([Y,...A,X])};const e=st(d,p),w=O.parametric(e,v.sampleCount+r);i=P(w).cssPath,c=p}return{offset:h,d:i,easing:"ease-in-out"}});a.push(s.animate(g,L))});{const s=(r,c,i)=>{const g=e=>`'${e.toString().padStart(4,I.FIGURE_SPACE)}'`;let h;const p=new Array;i.forEach(({offset:e,circles:w})=>{h!==void 0&&p.push({offset:e,content:h});const E=h=g(w);p.push({offset:e,content:E})}),a.push(r.animate(p,{pseudoElement:"::after",...L}));const P=i.flatMap(({offset:e,circles:w},E,y)=>{function A(k=w){return k==0?.25:1}if(e==0||e==1)return[{offset:e,opacity:A()}];const M=y[E-1].circles;return M==w?[]:[{offset:e-$,opacity:A(M)},{offset:e,opacity:0},{offset:e+$,opacity:A()}]});[r,c].forEach(e=>a.push(e.animate(P,L)))};s(this.#s,this.#o,x.map(({offset:r,usingCircles:c})=>({offset:r,circles:c}))),s(this.#l,this.#i,x.map(({offset:r,addingCircles:c})=>({offset:r,circles:c}))),s(this.#u,this.#r,x.map(({offset:r,availableCircles:c})=>({offset:r,circles:c})))}{let s=function(e){let w;const E=new Array;return x.forEach(y=>{const{offset:A}=y,M=e(y);w!==void 0&&E.push({offset:A,content:w});const k=w=c(M);E.push({offset:A,content:k})}),E};const r=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,c=e=>(e<0&&(e=0),r(e)),i=s(e=>e.usingAmplitude),g=s(e=>e.addingAmplitude),h=s(e=>e.availableAmplitude),p=[...i,...g,...h];let P=0;p.forEach(e=>{const[,w,E]=/^([0-9]+)\.([0-9]+)$/.exec(e.content);switch(w.length){case 3:break;case 2:{e.content=I.FIGURE_SPACE+e.content;break}case 1:{e.content=I.FIGURE_SPACE+I.FIGURE_SPACE+e.content;break}default:throw console.warn({beforeDecimalPoint:w,afterDecimalPoint:E,keyframe:e}),new Error("wtf")}P=Math.max(P,e.content.length)}),p.forEach(e=>{e.content=`'${(e.content+"%").padEnd(P+1,I.FIGURE_SPACE)}'`}),a.push(this.#o.animate(i,{pseudoElement:"::after",...L})),a.push(this.#i.animate(g,{pseudoElement:"::after",...L})),a.push(this.#r.animate(h,{pseudoElement:"::after",...L}))}}static update(t,o){this.#e.update(t,o)}}R.addEventListener("input",()=>{q.disabled=!1,N[0].code=R.value,S.selectedIndex=0});S.innerText="";N.forEach((n,t)=>{const o=document.createElement("option");o.innerText=n.name,S.appendChild(o),n.default&&(S.selectedIndex=t,R.value=n.code)});class B{static#e=T.getById("error",HTMLDivElement);static display(t){this.#e.innerText=t}static displayError(t){t instanceof D?this.#e.innerHTML=`Unable to access <code>support.input(${t.requestedIndex})</code>.  Only ${C.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${t.requestedIndex+1})">Add More</button>`:this.display(t.message)}static clear(){this.display("")}}function rt(n){try{return O.parametric(n,v.sampleCount)}catch(t){if(t instanceof Error){B.displayError(t);return}else throw t}}const C=[];class D extends Error{constructor(t){super(`Unable to access support.input(${t}).  Only ${C.length} input sliders currently exist.`),this.requestedIndex=t}}const ct=T.getById("inputs",HTMLDivElement);function H(){q.disabled=!1;const n=C.length,t=.5,o=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${t}" step="0.00001" oninput="copyNewInput(this, ${n})" />
      <code>support.input(${n})</code> =
      <span>${t.toString().padEnd(7,"0")}</span>
    </div>`;ct.insertAdjacentHTML("beforeend",o),C.push(t)}window.addMoreInputs=(n,t)=>{for(n.disabled=!0;C.length<t;)H()};b("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{H()});H();H();{const n=()=>{B.clear();const a=`"use strict";
`+R.value+`
return f;`;let d;try{d=new Function("support",a)}catch(u){if(u instanceof SyntaxError){B.displayError(u);return}else throw u}let m;v.referencePath.clear(),v.sampleCount=200;try{m=d(v)}catch(u){if(u instanceof Error){B.displayError(u);return}else throw u}const l=u=>{const f=m(u,v);if(!(Number.isFinite(f.x)&&Number.isFinite(f.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(f)} when t=${u}.`);return f};if(v.referencePath.empty){const u=rt(l);if(!u)return;v.referencePath.d=u.rawPath}ot.update(l,v.referencePath.d),it.update(l,v.referencePath.d)};let t=!1;const o=()=>{q.disabled=!0,t||(t=!0,requestAnimationFrame(()=>{t=!1,n()}))};q.addEventListener("click",o),window.copyNewInput=(a,d)=>{C[d]=a.valueAsNumber;const m=I.assertClass(a.parentElement?.lastElementChild,HTMLSpanElement);m.innerText=a.valueAsNumber.toFixed(5),o()};{const a=()=>{const d=N[S.selectedIndex];R.value=d.code,o()};S.addEventListener("change",a),T.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{S.selectedIndex=(S.selectedIndex+1)%N.length,a()})}{const a=T.getById("codeSamplesHolder",HTMLDivElement),d=T.getById("inputsGroup",HTMLDivElement),m=`<div>
            <div data-description>
              <button class="show-this">Show This</button><span></span>
            </div>
            <pre data-code-snippet></pre></div>`;N.forEach((l,u)=>{if(u>0){a.insertAdjacentHTML("beforeend",m);const f=a.lastElementChild,V=b("span",HTMLSpanElement,f);V.innerText=l.name;const G=b("pre",HTMLPreElement,f);G.innerText=l.code,b("button",HTMLButtonElement,f).addEventListener("click",()=>{R.value=l.code,o(),d.scrollIntoView({behavior:"smooth"})})}})}o()}{const n=T.getById("hide-text",HTMLInputElement);n.addEventListener("click",()=>{n.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
