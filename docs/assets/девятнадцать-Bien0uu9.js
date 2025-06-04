import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as a}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{p as k,P as A}from"./path-shape-fljILaqi.js";import{b as M}from"./utility-B93Kn6t6.js";import{m as T}from"./misc-wGF4FraP.js";const v=a.getById("go",HTMLButtonElement),w=a.getById("source",HTMLTextAreaElement),C=a.getById("result",HTMLElement),L=a.getById("pathInfo",HTMLDivElement),f=a.getById("sampleCode",HTMLSelectElement),x=[{name:"Custom",code:""},{name:"Simple Ellipse",code:`// The height can be anything convenient to you.
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
// But I ran into some issues.
// See "A Better Square" for my second attempt, which worked much better.

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
}`},{name:"A Better Square",code:`// Draw a series of approximations of a square.
// Each is created from looking at the first n items in the complex Fourier series for a square.
// The demo interpolates when n is not an integer.
//
// I computed this list using the “Square with Easing” example at
// https://tradeideasphilip.github.io/random-svg-tests/complex-fourier-series.html
const circles = [
    {
        "frequency": 1,
        "amplitude": 0.6002108774487057,
        "phase": -2.356194490192345
    },
    {
        "frequency": -3,
        "amplitude": 0.12004217545570839,
        "phase": -2.356194490192345
    },
    {
        "frequency": 5,
        "amplitude": 0.017148882159337513,
        "phase": 0.7853981633974483
    },
    {
        "frequency": -7,
        "amplitude": 0.0057162939963831035,
        "phase": -2.356194490192344
    },
    {
        "frequency": 9,
        "amplitude": 0.0025983153910070288,
        "phase": 0.7853981633974468
    },
    {
        "frequency": -11,
        "amplitude": 0.0013990928373741655,
        "phase": -2.356194490192343
    },
    {
        "frequency": 13,
        "amplitude": 0.0008394556343162563,
        "phase": 0.7853981633974426
    },
    {
        "frequency": -15,
        "amplitude": 0.000543177105018045,
        "phase": -2.3561944901923386
    },
    {
        "frequency": 17,
        "amplitude": 0.00037164742117819677,
        "phase": 0.7853981633974505
    },
    {
        "frequency": -19,
        "amplitude": 0.0002654623706666915,
        "phase": -2.3561944901923475
    }
];

const numberOfCircles = 1 + (circles.length-1) * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
let x = 0;
let y = 0;
for (let k = 0; k < circlesToConsider; k++) {
const { frequency, amplitude, phase } = circles[k];
      const angle = 2 * Math.PI * frequency * t + phase;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
      x += factor * amplitude * Math.cos(angle);
      y += factor * amplitude * Math.sin(angle);
}`},{name:"Fourier square wave",code:`// Use the first slider to choose how many sine waves to use in
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
const y = ySum;`}];w.addEventListener("input",()=>{v.disabled=!1,x[0].code=w.value,f.selectedIndex=0});f.innerText="";x.forEach((s,e)=>{const t=document.createElement("option");t.innerText=s.name,f.appendChild(t),s.default&&(f.selectedIndex=e,w.value=s.code)});class S{static#e=a.getById("error",HTMLDivElement);static display(e){this.#e.innerText=e}static displayError(e){e instanceof P?this.#e.innerHTML=`Unable to access <code>support.input(${e.requestedIndex})</code>.  Only ${y.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${e.requestedIndex+1})">Add More</button>`:this.display(e.message)}static clear(){this.display("")}}class d{#e;get svgElement(){return this.#e}#t;get pathElement(){return this.#t}constructor(e){this.#e=M(e,SVGSVGElement),this.#t=M("path:not([data-skip-auto-fill])",SVGPathElement,this.#e),d.all.add(this)}static all=new Set;#s=NaN;get recommendedWidth(){return this.#s}#n(){const e=this.#t.getBBox(),t=this.#e.viewBox.baseVal;t.x=e.x,t.y=e.y,t.width=e.width,t.height=e.height;const o=e.width/e.height,c=300,h=c*o;this.#e.style.height=c+"px",this.#e.style.width=h+"px",this.#s=Math.max(t.width,t.height)/100,this.#e.style.setProperty("--recommended-width",this.#s.toString())}setPathShape(e){this.#t.setAttribute("d",e.rawPath),this.#n()}static setPathShape(e){this.all.forEach(t=>t.setPathShape(e))}static pathElement(){return T.pickAny(d.all).#t}deAnimate(e=this.#t){e.getAnimations().forEach(t=>t.cancel())}}new d("#filledSample");new d("#outlineSample");class B extends d{constructor(){super("#chasingPathsSample")}setPathShape(e){super.setPathShape(e);const t=this.pathElement,o=1500,c=Date.now()/o%1;this.deAnimate();const h=t.getTotalLength();t.style.strokeDasharray=`0 ${h} ${h} 0`,t.animate([{strokeDashoffset:0},{strokeDashoffset:-2*h}],{iterations:1/0,duration:o,iterationStart:c})}}new B;class q extends d{constructor(){super("#dancingAntsSample")}setPathShape(e){super.setPathShape(e);const t=this.pathElement,o=250;this.deAnimate();const c=t.getTotalLength(),h=Date.now()/o%1,n=4*this.recommendedWidth,i=n*10<c?c/Math.round(c/n):n;t.style.strokeDasharray=`0 ${i}`,t.animate([{strokeDashoffset:0},{strokeDashoffset:-i}],{iterations:1/0,duration:o,iterationStart:h})}}new q;class H extends d{constructor(){super("#tauFollowingPathSample");let e=!0;new a.AnimationLoop(()=>{const t=e?"0 0":"center";this.svgElement.style.offsetAnchor=t,e=!e})}setPathShape(e){super.setPathShape(e),this.svgElement.style.setProperty("--css-path",e.cssPath)}}new H;new d("#textPathSample");class E extends d{static doItSoon(){console.warn("placeholder")}#e;constructor(){super("#clipAndMaskSupport"),this.#e=M("mask > path",SVGPathElement,this.svgElement);const e=new ResizeObserver(()=>E.doItSoon());[this.#t,this.#s].forEach(t=>{t.decode().then(()=>E.doItSoon()),e.observe(t)})}get measurablePath(){return this.pathElement}#t=a.getById("clipPathSample",HTMLImageElement);#s=a.getById("maskSample",HTMLImageElement);#n=a.getById("maskSample2",HTMLImageElement);setPathShape(e){super.setPathShape(e);const t=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.svgElement.getAttribute("viewBox")}" preserveAspectRatio="xMidYMid meet"><path d="${e.rawPath}" stroke="red" fill-opacity="0.5" fill="black" stroke-width="${this.recommendedWidth*4}"/></svg>`,c=`url('${`data:image/svg+xml;base64,${btoa(t)}`}')`;this.#n.style.maskImage=c;const h=this.measurablePath.getBBox(),n=k(h,{x:0,y:0,height:this.#t.clientHeight,width:this.#t.clientWidth},"srcRect fits completely into destRect"),i=e.transform(n);this.#t.style.clipPath=i.cssPath,this.#e.setAttribute("d",i.rawPath);const m=n.a,u=this.recommendedWidth*m*8;this.#e.style.strokeWidth=u.toString();const g=507;this.deAnimate(this.#e);const l=this.#e.getTotalLength(),r=Date.now()/g%1,p=16*this.recommendedWidth*m,I=p*10<l?l/Math.round(l/p):p;this.#e.style.strokeDasharray=`${u} ${I-u}`,this.#e.animate([{strokeDashoffset:0},{strokeDashoffset:-I}],{iterations:1/0,duration:g,iterationStart:r})}}new E;const y=[];class P extends Error{constructor(e){super(`Unable to access support.input(${e}).  Only ${y.length} input sliders currently exist.`),this.requestedIndex=e}}const F={input(s){if(!Number.isSafeInteger(s)||s<0)throw new RangeError(`invalid ${s}`);if(s>=y.length)throw new P(s);return y[s]}},R=a.getById("inputs",HTMLDivElement);function b(){v.disabled=!1;const s=y.length,e=.5,t=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${e}" step="0.00001" oninput="copyNewInput(this, ${s})" />
      <code>support.input(${s})</code> =
      <span>${e.toString().padEnd(7,"0")}</span>
    </div>`;R.insertAdjacentHTML("beforeend",t),y.push(e)}window.addMoreInputs=(s,e)=>{for(s.disabled=!0;y.length<e;)b()};M("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{b()});b();b();{const s=a.getById("segmentCountInput",HTMLInputElement),e=()=>{S.clear();const n=`"use strict";
`+w.value+`
return { x, y };`;let i;try{i=new Function("t /* A value between 0 and 1, inclusive. */","support",n)}catch(r){if(r instanceof SyntaxError){S.displayError(r);return}else throw r}const m=r=>{const p=i(r,F);if(!(Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(p)} when t=${r}.`);return p};let u;try{u=A.parametric(m,s.valueAsNumber)}catch(r){if(r instanceof Error){S.displayError(r);return}else throw r}d.setPathShape(u);const g=d.pathElement(),l=g.getBBox();console.log(l),L.innerText=`Path length = ${g.getTotalLength()}.  Bounding box = {top: ${l.y}, left: ${l.x}, height: ${l.height}, width: ${l.width}}`,C.innerText=g.outerHTML};let t=!1;const o=()=>{v.disabled=!0,t||(t=!0,requestAnimationFrame(()=>{t=!1,e()}))};E.doItSoon=o,v.addEventListener("click",o);const c=a.getById("segmentCountSpan",HTMLSpanElement),h=()=>{c.innerText=s.value.padStart(3,T.FIGURE_SPACE)};h(),s.addEventListener("change",()=>{h(),o()}),window.copyNewInput=(n,i)=>{y[i]=n.valueAsNumber;const m=T.assertClass(n.parentElement?.lastElementChild,HTMLSpanElement);m.innerText=n.valueAsNumber.toFixed(5),o()};{const n=()=>{const i=x[f.selectedIndex];w.value=i.code,o()};f.addEventListener("change",n),a.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{f.selectedIndex=(f.selectedIndex+1)%x.length,n()})}{const n=a.getById("codeSamplesHolder",HTMLDivElement),i=a.getById("segmentCountHolder",HTMLDivElement),m=`<div>
        <div data-description>
          <button class="show-this">Show This</button><span></span>
        </div>
        <pre data-code-snippet></pre></div>`;x.forEach((u,g)=>{if(g>0){n.insertAdjacentHTML("beforeend",m);const l=n.lastElementChild,r=M("span",HTMLSpanElement,l);r.innerText=u.name;const p=M("pre",HTMLPreElement,l);p.innerText=u.code,M("button",HTMLButtonElement,l).addEventListener("click",()=>{w.value=u.code,o(),i.scrollIntoView({behavior:"smooth"})})}})}o()}{const s=a.getById("hide-text",HTMLInputElement);s.addEventListener("click",()=>{s.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}{const s=a.getById("smaller-samples",HTMLInputElement);s.addEventListener("click",()=>{s.checked?document.documentElement.dataset.smallerSamples="requested":delete document.documentElement.dataset.smallerSamples})}
