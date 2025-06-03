import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as o}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{p as T,P as k}from"./path-shape-fljILaqi.js";import{b as M}from"./utility-B93Kn6t6.js";import{m as E}from"./misc-wGF4FraP.js";const w=o.getById("go",HTMLButtonElement),f=o.getById("source",HTMLTextAreaElement),C=o.getById("result",HTMLElement),u=o.getById("sampleCode",HTMLSelectElement),x=[{name:"Custom",code:""},{name:"Simple Ellipse",code:`// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
// Use the second slider to change the starting point on the ellipse.
// This doesn't matter in a static ellipse, but it can be important in some animations and other special cases.
const angle = (t + support.input(1)) * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);`},{name:"Circle with Wavy Edge",code:`// Make sure you use enough segments.
// This includes a lot of inflection points, which means you need a lot of segments.
const height = 1;
const width = height;
const angle = t * 2 * Math.PI;
const adjustmentAngle = angle * 8;
const adjustmentFactor = Math.sin(adjustmentAngle)/10+1;
const x = width * Math.cos(angle) * adjustmentFactor;
const y = height * Math.sin(angle) * adjustmentFactor;`},{name:"Lissajous Curves",default:!0,code:`const a = 1; // Amplitude in x-direction
const b = 1; // Amplitude in y-direction
const freqX = 3; // Frequency in x-direction
const freqY = 2; // Frequency in y-direction
const phase = Math.PI / 2; // Phase difference
const angle = t * 2 * Math.PI;
const x = a * Math.sin(freqX * angle + phase);
const y = b * Math.sin(freqY * angle);

// This works well with my approximations.
// There are only two inflection points and they are both in regions where the path is almost linear.`},{name:"Hypocycloid / Astroid",code:`const R = 1; // Radius of the large circle
const r = R / 4; // Radius of the small circle (astroid case)
const angle = t * 2 * Math.PI;
const x = (R - r) * Math.cos(angle) + r * Math.cos((R - r) / r * angle);
const y = (R - r) * Math.sin(angle) - r * Math.sin((R - r) / r * angle);

// The sharp corners in this curve push my model to its limits.
// However, it does a decent job as long as you use enough segments.`},{name:"Bell Curve",code:`// Number of standard deviations in each direction:
const right = support.input(0) * 5;
const left = - right;
const width = right - left;
const x = t * width + left;
const height = support.input(1) * 4 + 1;
// Negate this.
// This program works with normal graphics notation where lower values of y are higher on the display.
// Normal algebra-class graphs show lower values of y lower on the screen.
const y = - height * Math.exp(-x*x);`},{name:"Spirograph Curve (⟟)",code:`// Spirograph Curve (⟟) - A general Spirograph pattern with adjustable parameters
// Sliders: rolling circle radius (⟟), pen distance (⟠), number of turns (⟡)
const R = 1.0; // Fixed circle radius
const r = support.input(0) * 2 - 1; // Rolling circle radius: -1 to 1 (⟟). Negative for inside, positive for outside
const d = support.input(1) * 2; // Pen distance from rolling circle center: 0 to 2 (⟠)
const numTurns = support.input(2) * 10; // Number of turns: 0 to 10 (⟡)
const angle = t * 2 * Math.PI * numTurns;

// Determine if rolling inside (hypotrochoid) or outside (epitrochoid)
const k = r < 0 ? (R - r) / r : (R + r) / r; // Frequency ratio
const baseRadius = r < 0 ? (R - r) : (R + r); // Base radius for the rolling circle's center

// Parametric equations
const x = baseRadius * Math.cos(angle) + (r < 0 ? d : -d) * Math.cos(k * angle);
const y = baseRadius * Math.sin(angle) - (r < 0 ? d : -d) * Math.sin(k * angle);`},{name:"Archimedean Spiral with Oscillation",code:`const scale = 1; // Overall scale of the spiral
const turns = 3; // Number of full rotations
const waveFreq = 10; // Frequency of the oscillation
const waveAmp = 0.1; // Amplitude of the oscillation
const angle = t * 2 * Math.PI * turns;
const radius = scale * t; // Linear growth for Archimedean spiral
const wave = waveAmp * Math.sin(t * 2 * Math.PI * waveFreq);
const x = radius * Math.cos(angle) * (1 + wave);
const y = radius * Math.sin(angle) * (1 + wave);`},{name:"Heart Curve ♡",code:`const scale = 1;
const angle = t * 2 * Math.PI;
const x = scale * (16 * Math.pow(Math.sin(angle), 3));
const algebraClassY = scale * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
const y = - algebraClassY;`},{name:"Butterfly Curve",code:`const scale = 0.2;
const angle = t * 24 * Math.PI * support.input(0); // More rotations for complexity
const e = Math.exp(1);
const x = scale * Math.sin(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
const y = scale * Math.cos(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));

// This will require a lot of segments to display correctly.`},{name:"Hollow Star ☆",code:`const scale = 1; // Overall scale of the star
const points = 5; // Number of star points
const innerRadius = 0.4; // Radius of the inner points (controls star shape)
const roundness = 0.1; // Amplitude of the oscillation for rounding
const angle = t * 2 * Math.PI; // Full circle
const starAngle = angle * points; // Angle scaled for 5 points
const radius = scale * (1 - innerRadius * (Math.cos(starAngle) + 1) / 2); // Base star shape
const rounding = roundness * Math.sin(starAngle); // Oscillation for rounding
const x = (radius + rounding) * Math.cos(angle);
const y = (radius + rounding) * Math.sin(angle);

// According to Wikipedia, if it's hollow inside, it's a star.
// If you can see the lines crossing each other, it's a pentagram.`},{name:"Rotating Ellipse",code:`const r1 = 0.5; // Short radius of the ellipse
const r2 = 1.0; // Long radius of the ellipse
const phase = support.input(0) * Math.PI; // First slider: Rotation angle in radians (0 to π)
const angle = t * 2 * Math.PI; // Full circle

// Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);

// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);

// I used this formula as a starting place for the rounded pentagram.`},{name:"Rounded Pentagram ⛤, Heptagram, etc.",code:`const r1 = 0.5 * support.input(0); // Short radius of the ellipse. Top slider will adjust it.
const r2 = 1.0; // Long radius of the ellipse
const phase = Math.PI * t; // The reference ellipse will make one half complete rotation during the tracing process.
const numberOfTrips = support.input(1) * 10;  // Effective range is 0 to 10 
const angle = t * 2 * Math.PI * numberOfTrips; // Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);

// The top slider controls the amount of curvature in the output.
// The second slider controls the number of lobes.
// Try values like 0.05, 0.15, 0.25, …, 0.95 for closed shapes.`},{name:"Cardioid with Nodal Loops (क⋏)",code:`// Cardioid with Nodal Loops (क⋏) - A heart-shaped curve with adjustable loops
// Slider adjusts the number of nodal loops (⋰)
const r = 0.5; // Radius of the base circles for the cardioid
const nodalFreq = Math.round(support.input(0) * 10); // Frequency of nodal loops (⋰). First slider: 0 to 10
const nodalAmp = 0.1; // Amplitude of the nodal loops
const angle = t * 2 * Math.PI; // Full circle

// Base cardioid: point on a circle rolling around another circle
const xCardioid = r * (2 * Math.cos(angle) - Math.cos(2 * angle));
const yCardioid = r * (2 * Math.sin(angle) - Math.sin(2 * angle));

// Add nodal loops along the curve
const nodalOffset = nodalAmp * Math.sin(nodalFreq * angle);
const x = xCardioid + nodalOffset * Math.cos(angle);
const y = yCardioid + nodalOffset * Math.sin(angle);`},{name:"Lissajous Śpiral (श)",code:`// Lissajous Śpiral (श) - A spiraling Lissajous curve with adjustable frequency
// Slider adjusts the frequency ratio (⟐)
const scale = 1.0; // Base scale of the curve
const freqRatio = 1 + support.input(0) * 4; // Frequency ratio x:y (⟐). First slider: 1 to 5
const spiralFactor = t; // Linearly increasing amplitude for spiral effect
const angle = t * 2 * Math.PI; // Full circle

// Lissajous curve with spiraling amplitude
const x = scale * spiralFactor * Math.cos(angle);
const y = scale * spiralFactor * Math.sin(freqRatio * angle);`},{name:"Squaring the Circle",code:`// This will trace out the shape of a dog tag using epicycles.
// Use the first slider to choose how many circles to use in
// this approximation, from 1 to 20.

// I was originally trying to use epicycles to create a square.
// But I ran into the Gibbs Phenomenon,
// so this a square where two of the sides bulge out some.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
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
}`},{name:"A Better Square",code:`// Inspired by https://www.youtube.com/watch?v=t99CmgJAXbg
// Square Orbits Part 1: Moon Orbits

const R = 0.573; // Match our first circle's radius
const moonRadius = (7 / 45) * R;
const planetAngle = t * 2 * Math.PI; // Frequency 1
const moonAngle = -3 * planetAngle; // Frequency 3, opposite direction
const planetX = R * Math.cos(planetAngle);
const planetY = R * Math.sin(planetAngle);
const moonX = moonRadius * Math.cos(moonAngle);
const moonY = moonRadius * Math.sin(moonAngle);
const x = (planetX + moonX) * 1.2;
const y = (planetY + moonY) * 1.2;`},{name:"Fourier square wave",code:`// Use the first slider to choose how many sine waves to use in
// this approximation, from 1 to 20.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
let ySum = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const amplitude = (4 / Math.PI) / n;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = 2 * Math.PI * 2.5 * t + Math.PI / 2; // 2.5 cycles, shift for vertical center
  ySum += factor * amplitude * Math.sin(n * baseAngle);
}
const x = (t * 5) - 2.5; // Span x from -2.5 to 2.5
const y = ySum;`}];f.addEventListener("input",()=>{w.disabled=!1,x[0].code=f.value,u.selectedIndex=0});u.innerText="";x.forEach((s,t)=>{const e=document.createElement("option");e.innerText=s.name,u.appendChild(e),s.default&&(u.selectedIndex=t,f.value=s.code)});class I{static#t=o.getById("error",HTMLDivElement);static display(t){this.#t.innerText=t}static displayError(t){t instanceof P?this.#t.innerHTML=`Unable to access <code>support.input(${t.requestedIndex})</code>.  Only ${p.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${t.requestedIndex+1})">Add More</button>`:this.display(t.message)}static clear(){this.display("")}}class h{#t;get svgElement(){return this.#t}#e;get pathElement(){return this.#e}constructor(t){this.#t=M(t,SVGSVGElement),this.#e=M("path:not([data-skip-auto-fill])",SVGPathElement,this.#t),h.all.add(this)}static all=new Set;#s=NaN;get recommendedWidth(){return this.#s}#n(){const t=this.#e.getBBox(),e=this.#t.viewBox.baseVal;e.x=t.x,e.y=t.y,e.width=t.width,e.height=t.height;const n=t.width/t.height,r=300,l=r*n;this.#t.style.height=r+"px",this.#t.style.width=l+"px",this.#s=Math.max(e.width,e.height)/100,this.#t.style.setProperty("--recommended-width",this.#s.toString())}setPathShape(t){this.#e.setAttribute("d",t.rawPath),this.#n()}static setPathShape(t){this.all.forEach(e=>e.setPathShape(t))}static getOuterHTML(){return E.pickAny(h.all).#e.outerHTML}deAnimate(t=this.#e){t.getAnimations().forEach(e=>e.cancel())}}new h("#filledSample");new h("#outlineSample");class L extends h{constructor(){super("#chasingPathsSample")}setPathShape(t){super.setPathShape(t);const e=this.pathElement,n=1500,r=Date.now()/n%1;this.deAnimate();const l=e.getTotalLength();e.style.strokeDasharray=`0 ${l} ${l} 0`,e.animate([{strokeDashoffset:0},{strokeDashoffset:-2*l}],{iterations:1/0,duration:n,iterationStart:r})}}new L;class R extends h{constructor(){super("#dancingAntsSample")}setPathShape(t){super.setPathShape(t);const e=this.pathElement,n=250;this.deAnimate();const r=e.getTotalLength(),l=Date.now()/n%1,a=4*this.recommendedWidth,c=a*10<r?r/Math.round(r/a):a;e.style.strokeDasharray=`0 ${c}`,e.animate([{strokeDashoffset:0},{strokeDashoffset:-c}],{iterations:1/0,duration:n,iterationStart:l})}}new R;class B extends h{constructor(){super("#tauFollowingPathSample");let t=!0;new o.AnimationLoop(()=>{const e=t?"0 0":"center";this.svgElement.style.offsetAnchor=e,t=!t})}setPathShape(t){super.setPathShape(t),this.svgElement.style.setProperty("--css-path",t.cssPath)}}new B;new h("#textPathSample");class y extends h{static doItSoon(){console.warn("placeholder")}#t;constructor(){super("#clipAndMaskSupport"),this.#t=M("mask > path",SVGPathElement,this.svgElement);const t=new ResizeObserver(()=>y.doItSoon());[this.#e,this.#s].forEach(e=>{e.decode().then(()=>y.doItSoon()),t.observe(e)})}get measurablePath(){return this.pathElement}#e=o.getById("clipPathSample",HTMLImageElement);#s=o.getById("maskSample",HTMLImageElement);#n=o.getById("maskSample2",HTMLImageElement);setPathShape(t){super.setPathShape(t);const e=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.svgElement.getAttribute("viewBox")}" preserveAspectRatio="xMidYMid meet"><path d="${t.rawPath}" stroke="red" fill-opacity="0.5" fill="black" stroke-width="${this.recommendedWidth*4}"/></svg>`,r=`url('${`data:image/svg+xml;base64,${btoa(e)}`}')`;this.#n.style.maskImage=r;const l=this.measurablePath.getBBox(),a=T(l,{x:0,y:0,height:this.#e.clientHeight,width:this.#e.clientWidth},"srcRect fits completely into destRect"),c=t.transform(a);this.#e.style.clipPath=c.cssPath,this.#t.setAttribute("d",c.rawPath);const g=a.a,m=this.recommendedWidth*g*8;this.#t.style.strokeWidth=m.toString();const i=507;this.deAnimate(this.#t);const d=this.#t.getTotalLength(),A=Date.now()/i%1,b=16*this.recommendedWidth*g,S=b*10<d?d/Math.round(d/b):b;this.#t.style.strokeDasharray=`${m} ${S-m}`,this.#t.animate([{strokeDashoffset:0},{strokeDashoffset:-S}],{iterations:1/0,duration:i,iterationStart:A})}}new y;const p=[];class P extends Error{constructor(t){super(`Unable to access support.input(${t}).  Only ${p.length} input sliders currently exist.`),this.requestedIndex=t}}const F={input(s){if(!Number.isSafeInteger(s)||s<0)throw new RangeError(`invalid ${s}`);if(s>=p.length)throw new P(s);return p[s]}},q=o.getById("inputs",HTMLDivElement);function v(){w.disabled=!1;const s=p.length,t=.5,e=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${t}" step="0.00001" oninput="copyNewInput(this, ${s})" />
      <code>support.input(${s})</code> =
      <span>${t.toString().padEnd(7,"0")}</span>
    </div>`;q.insertAdjacentHTML("beforeend",e),p.push(t)}window.addMoreInputs=(s,t)=>{for(s.disabled=!0;p.length<t;)v()};M("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{v()});v();v();{const s=o.getById("segmentCountInput",HTMLInputElement),t=()=>{I.clear();const a=`"use strict";
`+f.value+`
return { x, y };`;let c;try{c=new Function("t /* A value between 0 and 1, inclusive. */","support",a)}catch(i){if(i instanceof SyntaxError){I.displayError(i);return}else throw i}const g=i=>{const d=c(i,F);if(!(Number.isFinite(d.x)&&Number.isFinite(d.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(d)} when t=${i}.`);return d};let m;try{m=k.parametric(g,s.valueAsNumber)}catch(i){if(i instanceof Error){I.displayError(i);return}else throw i}h.setPathShape(m),C.innerText=h.getOuterHTML()};let e=!1;const n=()=>{w.disabled=!0,e||(e=!0,requestAnimationFrame(()=>{e=!1,t()}))};y.doItSoon=n,w.addEventListener("click",n);const r=o.getById("segmentCountSpan",HTMLSpanElement),l=()=>{r.innerText=s.value.padStart(3,E.FIGURE_SPACE)};l(),s.addEventListener("change",()=>{l(),n()}),window.copyNewInput=(a,c)=>{p[c]=a.valueAsNumber;const g=E.assertClass(a.parentElement?.lastElementChild,HTMLSpanElement);g.innerText=a.valueAsNumber.toFixed(5),n()};{const a=()=>{const c=x[u.selectedIndex];f.value=c.code,n()};u.addEventListener("change",a),o.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{u.selectedIndex=(u.selectedIndex+1)%x.length,a()})}n()}{const s=o.getById("hide-text",HTMLInputElement);s.addEventListener("click",()=>{s.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
