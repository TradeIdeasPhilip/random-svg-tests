import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as M}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{c as $,P as F,Q as k}from"./path-shape-ZNbOYjhy.js";import{d as g,s as U,e as D,m as j,R as Y}from"./utility-D-kBkb6L.js";import{m as v}from"./misc-wGF4FraP.js";import{l as K}from"./math-to-path-BjxPr1Cw.js";import{f as X,c as _}from"./hershey-fonts-DsX624t6.js";import{s as Q,a as W,g as J,t as z,b as Z}from"./fourier-samples-BNlJMvyv.js";import"./letters-base-DU8plAKw.js";const y={input(n){if(!Number.isSafeInteger(n)||n<0)throw new RangeError(`invalid ${n}`);if(n>=T.length)throw new G(n);return T[n]},ease(n){return(1-Math.cos(Math.PI*n))/2},makeTSplitter:j,makeTSplitterA:D,lerpPoints:K,lerp:v.lerp,makeLinear:v.makeLinear,random:n=>{if(typeof n!="string")throw new RangeError("Invalid seed.  Expecting a string.");return Y.fromString(n)},referencePath:new $,samples:Z,cursiveLetters:_,futuraLLetters:X,sampleCount:200,maxKeyframes:10},O=M.getById("go",HTMLButtonElement),C=M.getById("source",HTMLTextAreaElement),P=M.getById("sampleCode",HTMLSelectElement),L=[{name:"Custom",code:""},{name:"Polygons and Stars",code:`const numberOfPoints = 5;
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
support.maxKeyframes = 30;
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
return {x, y};}`}];function H(n,t){const o=n.getBBox(),s=t.viewBox.baseVal;s.x=o.x,s.y=o.y,s.width=o.width,s.height=o.height;const c=o.width/o.height,i=300,l=i*c;t.style.height=i+"px",t.style.width=l+"px";const a=Math.max(s.width,s.height)/100;return t.style.setProperty("--recommended-stroke-width",a.toString()),{recommendedStrokeWidth:a}}class tt{static#e=new this;#n=M.getById("distanceVsT",SVGSVGElement);#t=g("circle[data-distance]",SVGCircleElement,this.#n);#o=g("path",SVGPathElement,this.#n);#s=g("circle[data-t]",SVGCircleElement);constructor(){new M.AnimationLoop(t=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){t%=5e3;const s=t/5e3,c=s*100;this.#t.style.offsetDistance=c+"%",this.#t.style.display="";const{x:i,y:l}=this.f(s);this.#s.cx.baseVal.value=i,this.#s.cy.baseVal.value=l,this.#s.style.display=""}})}f;update(t,o){this.#o.setAttribute("d",o),H(this.#o,this.#n),this.f=t,this.#t.style.offsetPath=F.cssifyPath(o)}static update(t,o){this.#e.update(t,o)}}class et{static#e=new this;#n=M.getById("requestedVsReconstructed",SVGSVGElement);#t;#o;#s=g("[data-using] [data-circles]",HTMLTableCellElement);#a=g("[data-using] [data-amplitude]",HTMLTableCellElement);#l=g("[data-adding] [data-circles]",HTMLTableCellElement);#r=g("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=g("[data-available] [data-circles]",HTMLTableCellElement);#i=g("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,...this.#o]=U("path",SVGPathElement,2,1/0,this.#n)}#c;update(t,o){this.#c?.();const s=[];this.#c=()=>{s.forEach(r=>r.cancel())},this.#t.setAttribute("d",o),H(this.#t,this.#n);const c=Q(W(t)),i=J({pauseTime:750,addTime:500,maxGroupsToDisplay:y.maxKeyframes,terms:c}),l=50/i.at(-1).startTime,a={duration:i.at(-1).endTime*3,iterations:1/0};this.#o.forEach((r,u)=>{let h=-1/0,w="";const A=i.map(({offset:b,usingCircles:x})=>{if(x!=h){let I=function(f){if(f.commands.length<2)throw new Error("wtf");const[d,...E]=f.commands,p=E.pop();if(!(d instanceof k&&p instanceof k))throw new Error("wtf");if(d.x0==p.x&&d.y0==p.y)return f;const S=(d.x0+p.x)/2,B=(d.y0+p.y)/2,V=k.controlPoints(S,B,d.x1,d.y1,d.x,d.y),N=k.controlPoints(p.x0,p.y0,p.x1,p.y1,S,B);return new F([V,...E,N])};const e=z(c,x),m=F.parametric(e,y.sampleCount+u);w=I(m).cssPath,h=x}return{offset:b,d:w,easing:"ease-in-out"}});s.push(r.animate(A,a))});{const r=(u,h,w)=>{const A=e=>`'${e.toString().padStart(4,v.FIGURE_SPACE)}'`;let b;const x=new Array;w.forEach(({offset:e,circles:m})=>{b!==void 0&&x.push({offset:e,content:b});const f=b=A(m);x.push({offset:e,content:f})}),s.push(u.animate(x,{pseudoElement:"::after",...a}));const I=w.flatMap(({offset:e,circles:m},f,d)=>{function E(S=m){return S==0?.25:1}if(e==0||e==1)return[{offset:e,opacity:E()}];const p=d[f-1].circles;return p==m?[]:[{offset:e-l,opacity:E(p)},{offset:e,opacity:0},{offset:e+l,opacity:E()}]});[u,h].forEach(e=>s.push(e.animate(I,a)))};r(this.#s,this.#a,i.map(({offset:u,usingCircles:h})=>({offset:u,circles:h}))),r(this.#l,this.#r,i.map(({offset:u,addingCircles:h})=>({offset:u,circles:h}))),r(this.#u,this.#i,i.map(({offset:u,availableCircles:h})=>({offset:u,circles:h})))}{let r=function(e){let m;const f=new Array;return i.forEach(d=>{const{offset:E}=d,p=e(d);m!==void 0&&f.push({offset:E,content:m});const S=m=h(p);f.push({offset:E,content:S})}),f};const u=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,h=e=>(e<0&&(e=0),u(e)),w=r(e=>e.usingAmplitude),A=r(e=>e.addingAmplitude),b=r(e=>e.availableAmplitude),x=[...w,...A,...b];let I=0;x.forEach(e=>{const[,m,f]=/^([0-9]+)\.([0-9]+)$/.exec(e.content);switch(m.length){case 3:break;case 2:{e.content=v.FIGURE_SPACE+e.content;break}case 1:{e.content=v.FIGURE_SPACE+v.FIGURE_SPACE+e.content;break}default:throw console.warn({beforeDecimalPoint:m,afterDecimalPoint:f,keyframe:e}),new Error("wtf")}I=Math.max(I,e.content.length)}),x.forEach(e=>{e.content=`'${(e.content+"%").padEnd(I+1,v.FIGURE_SPACE)}'`}),s.push(this.#a.animate(w,{pseudoElement:"::after",...a})),s.push(this.#r.animate(A,{pseudoElement:"::after",...a})),s.push(this.#i.animate(b,{pseudoElement:"::after",...a}))}}static update(t,o){this.#e.update(t,o)}}C.addEventListener("input",()=>{O.disabled=!1,L[0].code=C.value,P.selectedIndex=0});P.innerText="";L.forEach((n,t)=>{const o=document.createElement("option");o.innerText=n.name,P.appendChild(o),n.default&&(P.selectedIndex=t,C.value=n.code)});class R{static#e=M.getById("error",HTMLDivElement);static display(t){this.#e.innerText=t}static displayError(t){t instanceof G?this.#e.innerHTML=`Unable to access <code>support.input(${t.requestedIndex})</code>.  Only ${T.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${t.requestedIndex+1})">Add More</button>`:this.display(t.message)}static clear(){this.display("")}}function nt(n){try{return F.parametric(n,y.sampleCount)}catch(t){if(t instanceof Error){R.displayError(t);return}else throw t}}const T=[];class G extends Error{constructor(t){super(`Unable to access support.input(${t}).  Only ${T.length} input sliders currently exist.`),this.requestedIndex=t}}const st=M.getById("inputs",HTMLDivElement);function q(){O.disabled=!1;const n=T.length,t=.5,o=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${t}" step="0.00001" oninput="copyNewInput(this, ${n})" />
      <code>support.input(${n})</code> =
      <span>${t.toString().padEnd(7,"0")}</span>
    </div>`;st.insertAdjacentHTML("beforeend",o),T.push(t)}window.addMoreInputs=(n,t)=>{for(n.disabled=!0;T.length<t;)q()};g("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{q()});q();q();{const n=()=>{R.clear();const s=`"use strict";
`+C.value+`
return f;`;let c;try{c=new Function("support",s)}catch(a){if(a instanceof SyntaxError){R.displayError(a);return}else throw a}let i;y.referencePath.clear(),y.sampleCount=200,y.maxKeyframes=10;try{i=c(y)}catch(a){if(a instanceof Error){R.displayError(a);return}else throw a}const l=a=>{const r=i(a,y);if(!(Number.isFinite(r.x)&&Number.isFinite(r.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(r)} when t=${a}.`);return r};if(y.referencePath.empty){const a=nt(l);if(!a)return;y.referencePath.d=a.rawPath}tt.update(l,y.referencePath.d),et.update(l,y.referencePath.d)};let t=!1;const o=()=>{O.disabled=!0,t||(t=!0,requestAnimationFrame(()=>{t=!1,n()}))};O.addEventListener("click",o),window.copyNewInput=(s,c)=>{T[c]=s.valueAsNumber;const i=v.assertClass(s.parentElement?.lastElementChild,HTMLSpanElement);i.innerText=s.valueAsNumber.toFixed(5),o()};{const s=()=>{const c=L[P.selectedIndex];C.value=c.code,o()};P.addEventListener("change",s),M.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{P.selectedIndex=(P.selectedIndex+1)%L.length,s()})}{const s=M.getById("codeSamplesHolder",HTMLDivElement),c=M.getById("inputsGroup",HTMLDivElement),i=`<div>
            <div data-description>
              <button class="show-this">Show This</button><span></span>
            </div>
            <pre data-code-snippet></pre></div>`;L.forEach((l,a)=>{if(a>0){s.insertAdjacentHTML("beforeend",i);const r=s.lastElementChild,u=g("span",HTMLSpanElement,r);u.innerText=l.name;const h=g("pre",HTMLPreElement,r);h.innerText=l.code,g("button",HTMLButtonElement,r).addEventListener("click",()=>{C.value=l.code,o(),c.scrollIntoView({behavior:"smooth"})})}})}o()}{const n=M.getById("hide-text",HTMLInputElement);n.addEventListener("click",()=>{n.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
