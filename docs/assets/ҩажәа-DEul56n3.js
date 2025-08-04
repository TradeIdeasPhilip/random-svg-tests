import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as a}from"./client-misc-B8CxQsfg.js";/* empty css              */import{d as N,P as R,Q as k}from"./path-shape-CZZKMsju.js";import{d as Q,m as $}from"./utility-DH3fWvUB.js";import{m as E}from"./misc-BHUyxQfl.js";import{l as D}from"./math-to-path-DHD-XsCZ.js";import{f as U,c as j}from"./hershey-fonts-CIXmbKQE.js";import{s as Y,a as K,g as X,t as _,b as W}from"./fourier-samples-T7ShhrQn.js";import"./letters-base-Diwx_0WQ.js";const y={input(n){if(!Number.isSafeInteger(n)||n<0)throw new RangeError(`invalid ${n}`);if(n>=P.length)throw new H(n);return P[n]},ease(n){return(1-Math.cos(Math.PI*n))/2},makeTSplitter:$,makeTSplitterA:Q,lerpPoints:D,lerp:E.lerp,makeLinear:E.makeLinear,random:n=>{if(typeof n!="string")throw new RangeError("Invalid seed.  Expecting a string.");return E.Random.fromString(n)},referencePath:new N,samples:W,cursiveLetters:j,futuraLLetters:U,sampleCount:200,maxKeyframes:10},F=a.getById("go",HTMLButtonElement),S=a.getById("source",HTMLTextAreaElement),v=a.getById("sampleCode",HTMLSelectElement),C=[{name:"Custom",code:""},{name:"Polygons and Stars",code:`const numberOfPoints = 5;
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
}`},{name:"Cusps",code:`// This pushes the limits of my graphing software.
// This software is aimed at smooth curves.

// The first input is the number of cusps, 1-10
const cuspCount = Math.round(support.input(0)*9.999+0.5);

// Second input:  
//   Far left looks like a cloud, cusps pointing inward.
//   Far right looks like a star, cusps pointing outward.
//   Dead center is smooth, no cusps.
const amplitude = 2 * (support.input(1) - 0.5);


function f(t) {
  // Once around the circle.
  const θ = t * Math.PI * 2;

  const r = 2 - amplitude * Math.abs(Math.sin(t * Math.PI * cuspCount));
  const x = r * Math.cos(θ);
  const y = r * Math.sin(θ);
  return { x, y };
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
return {x, y};}`}];function B(n,t){const o=n.getBBox(),s=t.viewBox.baseVal;s.x=o.x,s.y=o.y,s.width=o.width,s.height=o.height;const l=o.width/o.height,c=300,u=c*l;t.style.height=c+"px",t.style.width=u+"px";const r=Math.max(s.width,s.height)/100;return t.style.setProperty("--recommended-stroke-width",r.toString()),{recommendedStrokeWidth:r}}class J{static#e=new this;#n=a.getById("distanceVsT",SVGSVGElement);#t=a.selectorQuery("circle[data-distance]",SVGCircleElement,this.#n);#o=a.selectorQuery("path",SVGPathElement,this.#n);#s=a.selectorQuery("circle[data-t]",SVGCircleElement);constructor(){new a.AnimationLoop(t=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){t%=5e3;const s=t/5e3,l=s*100;this.#t.style.offsetDistance=l+"%",this.#t.style.display="";const{x:c,y:u}=this.f(s);this.#s.cx.baseVal.value=c,this.#s.cy.baseVal.value=u,this.#s.style.display=""}})}f;update(t,o){this.#o.setAttribute("d",o),B(this.#o,this.#n),this.f=t,this.#t.style.offsetPath=R.cssifyPath(o)}static update(t,o){this.#e.update(t,o)}}class z{static#e=new this;#n=a.getById("requestedVsReconstructed",SVGSVGElement);#t;#o;#s=a.selectorQuery("[data-using] [data-circles]",HTMLTableCellElement);#a=a.selectorQuery("[data-using] [data-amplitude]",HTMLTableCellElement);#l=a.selectorQuery("[data-adding] [data-circles]",HTMLTableCellElement);#r=a.selectorQuery("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=a.selectorQuery("[data-available] [data-circles]",HTMLTableCellElement);#i=a.selectorQuery("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,...this.#o]=a.selectorQueryAll("path",SVGPathElement,2,1/0,this.#n)}#c;update(t,o){this.#c?.();const s=[];this.#c=()=>{s.forEach(i=>i.cancel())},this.#t.setAttribute("d",o),B(this.#t,this.#n);const l=Y(K(t)),c=X({pauseTime:750,addTime:500,maxGroupsToDisplay:y.maxKeyframes,terms:l}),u=50/c.at(-1).startTime,r={duration:c.at(-1).endTime*3,iterations:1/0};this.#o.forEach((i,h)=>{let p=-1/0,x="";const I=c.map(({offset:b,usingCircles:M})=>{if(M!=p){let T=function(g){if(g.commands.length<2)throw new Error("wtf");const[d,...w]=g.commands,m=w.pop();if(!(d instanceof k&&m instanceof k))throw new Error("wtf");if(d.x0==m.x&&d.y0==m.y)return g;const A=(d.x0+m.x)/2,q=(d.y0+m.y)/2,G=k.controlPoints(A,q,d.x1,d.y1,d.x,d.y),V=k.controlPoints(m.x0,m.y0,m.x1,m.y1,A,q);return new R([G,...w,V])};const e=_(l,M),f=R.parametric(e,y.sampleCount+h);x=T(f).cssPath,p=M}return{offset:b,d:x,easing:"ease-in-out"}});s.push(i.animate(I,r))});{const i=(h,p,x)=>{const I=e=>`'${e.toString().padStart(4,E.FIGURE_SPACE)}'`;let b;const M=new Array;x.forEach(({offset:e,circles:f})=>{b!==void 0&&M.push({offset:e,content:b});const g=b=I(f);M.push({offset:e,content:g})}),s.push(h.animate(M,{pseudoElement:"::after",...r}));const T=x.flatMap(({offset:e,circles:f},g,d)=>{function w(A=f){return A==0?.25:1}if(e==0||e==1)return[{offset:e,opacity:w()}];const m=d[g-1].circles;return m==f?[]:[{offset:e-u,opacity:w(m)},{offset:e,opacity:0},{offset:e+u,opacity:w()}]});[h,p].forEach(e=>s.push(e.animate(T,r)))};i(this.#s,this.#a,c.map(({offset:h,usingCircles:p})=>({offset:h,circles:p}))),i(this.#l,this.#r,c.map(({offset:h,addingCircles:p})=>({offset:h,circles:p}))),i(this.#u,this.#i,c.map(({offset:h,availableCircles:p})=>({offset:h,circles:p})))}{let i=function(e){let f;const g=new Array;return c.forEach(d=>{const{offset:w}=d,m=e(d);f!==void 0&&g.push({offset:w,content:f});const A=f=p(m);g.push({offset:w,content:A})}),g};const h=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,p=e=>(e<0&&(e=0),h(e)),x=i(e=>e.usingAmplitude),I=i(e=>e.addingAmplitude),b=i(e=>e.availableAmplitude),M=[...x,...I,...b];let T=0;M.forEach(e=>{const[,f,g]=/^([0-9]+)\.([0-9]+)$/.exec(e.content);switch(f.length){case 3:break;case 2:{e.content=E.FIGURE_SPACE+e.content;break}case 1:{e.content=E.FIGURE_SPACE+E.FIGURE_SPACE+e.content;break}default:throw console.warn({beforeDecimalPoint:f,afterDecimalPoint:g,keyframe:e}),new Error("wtf")}T=Math.max(T,e.content.length)}),M.forEach(e=>{e.content=`'${(e.content+"%").padEnd(T+1,E.FIGURE_SPACE)}'`}),s.push(this.#a.animate(x,{pseudoElement:"::after",...r})),s.push(this.#r.animate(I,{pseudoElement:"::after",...r})),s.push(this.#i.animate(b,{pseudoElement:"::after",...r}))}}static update(t,o){this.#e.update(t,o)}}S.addEventListener("input",()=>{F.disabled=!1,C[0].code=S.value,v.selectedIndex=0});v.innerText="";C.forEach((n,t)=>{const o=document.createElement("option");o.innerText=n.name,v.appendChild(o),n.default&&(v.selectedIndex=t,S.value=n.code)});class L{static#e=a.getById("error",HTMLDivElement);static display(t){this.#e.innerText=t}static displayError(t){t instanceof H?this.#e.innerHTML=`Unable to access <code>support.input(${t.requestedIndex})</code>.  Only ${P.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${t.requestedIndex+1})">Add More</button>`:this.display(t.message)}static clear(){this.display("")}}function Z(n){try{return R.parametric(n,y.sampleCount)}catch(t){if(t instanceof Error){L.displayError(t);return}else throw t}}const P=[];class H extends Error{constructor(t){super(`Unable to access support.input(${t}).  Only ${P.length} input sliders currently exist.`),this.requestedIndex=t}}const tt=a.getById("inputs",HTMLDivElement);function O(){F.disabled=!1;const n=P.length,t=.5,o=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${t}" step="0.00001" oninput="copyNewInput(this, ${n})" />
      <code>support.input(${n})</code> =
      <span>${t.toString().padEnd(7,"0")}</span>
    </div>`;tt.insertAdjacentHTML("beforeend",o),P.push(t)}window.addMoreInputs=(n,t)=>{for(n.disabled=!0;P.length<t;)O()};a.selectorQuery("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{O()});O();O();{const n=()=>{L.clear();const s=`"use strict";
`+S.value+`
return f;`;let l;try{l=new Function("support",s)}catch(r){if(r instanceof SyntaxError){L.displayError(r);return}else throw r}let c;y.referencePath.clear(),y.sampleCount=200,y.maxKeyframes=10;try{c=l(y)}catch(r){if(r instanceof Error){L.displayError(r);return}else throw r}const u=r=>{const i=c(r,y);if(!(Number.isFinite(i.x)&&Number.isFinite(i.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(i)} when t=${r}.`);return i};if(y.referencePath.empty){const r=Z(u);if(!r)return;y.referencePath.d=r.rawPath}J.update(u,y.referencePath.d),z.update(u,y.referencePath.d)};let t=!1;const o=()=>{F.disabled=!0,t||(t=!0,requestAnimationFrame(()=>{t=!1,n()}))};F.addEventListener("click",o),window.copyNewInput=(s,l)=>{P[l]=s.valueAsNumber;const c=E.assertClass(s.parentElement?.lastElementChild,HTMLSpanElement);c.innerText=s.valueAsNumber.toFixed(5),o()};{const s=()=>{const l=C[v.selectedIndex];S.value=l.code,o()};v.addEventListener("change",s),a.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{v.selectedIndex=(v.selectedIndex+1)%C.length,s()})}{const s=a.getById("codeSamplesHolder",HTMLDivElement),l=a.getById("inputsGroup",HTMLDivElement),c=`<div>
            <div data-description>
              <button class="show-this">Show This</button><span></span>
            </div>
            <pre data-code-snippet></pre></div>`;C.forEach((u,r)=>{if(r>0){s.insertAdjacentHTML("beforeend",c);const i=s.lastElementChild,h=a.selectorQuery("span",HTMLSpanElement,i);h.innerText=u.name;const p=a.selectorQuery("pre",HTMLPreElement,i);p.innerText=u.code,a.selectorQuery("button",HTMLButtonElement,i).addEventListener("click",()=>{S.value=u.code,o(),l.scrollIntoView({behavior:"smooth"})})}})}o()}{const n=a.getById("hide-text",HTMLInputElement);n.addEventListener("click",()=>{n.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
