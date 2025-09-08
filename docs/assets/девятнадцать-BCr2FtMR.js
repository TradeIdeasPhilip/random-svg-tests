import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as n}from"./client-misc-B8CxQsfg.js";/* empty css              */import{p as C,P as L,c as B}from"./path-shape-Cey3Rpwf.js";import{m as P}from"./misc-BHUyxQfl.js";const b=n.getById("go",HTMLButtonElement),x=n.getById("source",HTMLTextAreaElement),q=n.getById("result",HTMLElement),H=n.getById("pathInfo",HTMLDivElement),g=n.getById("sampleCode",HTMLSelectElement),v=[{name:"Custom",code:""},{name:"Simple Ellipse",code:`// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
const angle = t * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);`},{name:"Square",code:`// Square from Polar Form
const θ = t * Math.PI * 2;
const r = 1/(Math.abs(Math.cos(θ) - Math.sin(θ)) + Math.abs(Math.cos(θ) + Math.sin(θ)));
const x = r * Math.cos(θ);
const y = r * Math.sin(θ);`},{name:"Cusps",code:`// This pushes the limits of my graphing software.
// This software is aimed at smooth curves.

// Once around the circle.
const θ = t * Math.PI * 2;

// The first input is the number of cusps, 1-10
const cuspCount = Math.round(support.input(0)*9.999+0.5);

// Far left looks like a cloud, cusps pointing inward.
// Far right looks like a star, cusps pointing outward.
// Dead center is smooth, no cusps.
const amplitude = 2 * (support.input(1) - 0.5);

const r = 2 - amplitude * Math.abs(Math.sin(t * Math.PI * cuspCount));
const x = r * Math.cos(θ);
const y = r * Math.sin(θ);`},{name:"Circle with Wavy Edge",code:`// Make sure you use enough segments.
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
const y = ySum;`}];x.addEventListener("input",()=>{b.disabled=!1,v[0].code=x.value,g.selectedIndex=0});g.innerText="";v.forEach((s,t)=>{const e=document.createElement("option");e.innerText=s.name,g.appendChild(e),s.default&&(g.selectedIndex=t,x.value=s.code)});class T{static#t=n.getById("error",HTMLDivElement);static display(t){this.#t.innerText=t}static displayError(t){t instanceof k?this.#t.innerHTML=`Unable to access <code>support.input(${t.requestedIndex})</code>.  Only ${f.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${t.requestedIndex+1})">Add More</button>`:this.display(t.message)}static clear(){this.display("")}}class h{#t;get svgElement(){return this.#t}#e;get pathElement(){return this.#e}constructor(t){this.#t=n.selectorQuery(t,SVGSVGElement),this.#e=n.selectorQuery("path:not([data-skip-auto-fill])",SVGPathElement,this.#t),h.all.add(this)}static all=new Set;#s=NaN;get recommendedWidth(){return this.#s}#n(){const t=this.#e.getBBox(),e=this.#t.viewBox.baseVal;e.x=t.x,e.y=t.y,e.width=t.width,e.height=t.height,e.width==0?e.height!=0&&(e.width=e.height/10,e.x-=e.width/2):e.height==0&&(e.height=e.width/10,e.y-=e.height/2);const d=t.width/t.height,c=300,a=c*d;this.#t.style.height=c+"px",this.#t.style.width=a+"px",this.#s=Math.max(e.width,e.height)/100,this.#t.style.setProperty("--recommended-width",this.#s.toString())}setPathShape(t){this.#e.setAttribute("d",t.rawPath),this.#n()}static setPathShape(t){this.all.forEach(e=>e.setPathShape(t))}static pathElement(){return P.pickAny(h.all).#e}deAnimate(t=this.#e){t.getAnimations().forEach(e=>e.cancel())}}new h("#filledSample");new h("#outlineSample");class F extends h{constructor(){super("#chasingPathsSample")}setPathShape(t){super.setPathShape(t);const e=this.pathElement,d=1500,c=Date.now()/d%1;this.deAnimate();const a=e.getTotalLength();e.style.strokeDasharray=`0 ${a} ${a} 0`,e.animate([{strokeDashoffset:0},{strokeDashoffset:-2*a}],{iterations:1/0,duration:d,iterationStart:c})}}new F;class R extends h{constructor(){super("#dancingAntsSample")}setPathShape(t){super.setPathShape(t);const e=this.pathElement,d=250;this.deAnimate();const c=e.getTotalLength(),a=Date.now()/d%1,p=4*this.recommendedWidth,m=p*10<c?c/Math.round(c/p):p;e.style.strokeDasharray=`0 ${m}`,e.animate([{strokeDashoffset:0},{strokeDashoffset:-m}],{iterations:1/0,duration:d,iterationStart:a})}}new R;class O extends h{constructor(){super("#tauFollowingPathSample");let t=!0;new n.AnimationLoop(()=>{const e=t?"0 0":"center";this.svgElement.style.offsetAnchor=e,t=!t})}setPathShape(t){super.setPathShape(t),this.svgElement.style.setProperty("--css-path",t.cssPath)}}new O;new h("#textPathSample");class E extends h{static doItSoon(){console.warn("placeholder")}#t;constructor(){super("#clipAndMaskSupport"),this.#t=n.selectorQuery("mask > path",SVGPathElement,this.svgElement);const t=new ResizeObserver(()=>E.doItSoon());[this.#e,this.#s].forEach(e=>{e.decode().then(()=>E.doItSoon()),t.observe(e)}),this.#o.addEventListener("click",()=>{if(this.#a===void 0)throw new Error("wtf");n.download("ParametricPath.svg",this.#a)})}get measurablePath(){return this.pathElement}#e=n.getById("clipPathSample",HTMLImageElement);#s=n.getById("maskSample",HTMLImageElement);#n=n.getById("maskSample2",HTMLImageElement);#a;#o=n.getById("download",HTMLButtonElement);setPathShape(t){super.setPathShape(t);const e=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.svgElement.getAttribute("viewBox")}" preserveAspectRatio="xMidYMid meet"><path d="${t.rawPath}" stroke="red" fill-opacity="0.5" fill="black" stroke-width="${this.recommendedWidth*4}"/></svg>`,c=`url('${`data:image/svg+xml;base64,${btoa(e)}`}')`;this.#n.style.maskImage=c,this.#a=e,this.#o.disabled=!1;const a=this.measurablePath.getBBox(),p=C(a,{x:0,y:0,height:this.#e.clientHeight,width:this.#e.clientWidth},"srcRect fits completely into destRect"),m=t.transform(p);this.#e.style.clipPath=m.cssPath,this.#t.setAttribute("d",m.rawPath);const I=p.a,M=this.recommendedWidth*I*8;this.#t.style.strokeWidth=M.toString();const o=507;this.deAnimate(this.#t);const i=this.#t.getTotalLength(),l=Date.now()/o%1,u=16*this.recommendedWidth*I,y=u*10<i?i/Math.round(i/u):u;this.#t.style.strokeDasharray=`${M} ${y-M}`,this.#t.animate([{strokeDashoffset:0},{strokeDashoffset:-y}],{iterations:1/0,duration:o,iterationStart:l})}}new E;const f=[];class k extends Error{constructor(t){super(`Unable to access support.input(${t}).  Only ${f.length} input sliders currently exist.`),this.requestedIndex=t}}const $={input(s){if(!Number.isSafeInteger(s)||s<0)throw new RangeError(`invalid ${s}`);if(s>=f.length)throw new k(s);return f[s]}},N=n.getById("inputs",HTMLDivElement);function S(){b.disabled=!1;const s=f.length,t=.5,e=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${t}" step="any" oninput="copyNewInput(this, ${s})" />
      <code>support.input(${s})</code> =
      <span>${t.toString().padEnd(7,"0")}</span>
    </div>`;N.insertAdjacentHTML("beforeend",e),f.push(t)}window.addMoreInputs=(s,t)=>{for(s.disabled=!0;f.length<t;)S()};n.selectorQuery("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{S()});S();S();{let s=function(o){h.setPathShape(o);const i=h.pathElement(),l=i.getBBox();console.log(l),H.innerText=`Path length = ${i.getTotalLength()}.  Bounding box = {top: ${l.y}, left: ${l.x}, height: ${l.height}, width: ${l.width}}`,q.innerText=i.outerHTML};const t=n.getById("segmentCountInput",HTMLInputElement),e=n.getById("startAtInput",HTMLInputElement);window.showPathShape=s;const d=()=>{T.clear();const o=`"use strict";
`+x.value+`
return { x, y };`;let i;try{i=new Function("t /* A value between 0 and 1, inclusive. */","support",o)}catch(r){if(r instanceof SyntaxError){T.displayError(r);return}else throw r}const l=e.valueAsNumber,u=r=>{r=(r+l)%1;const w=i(r,$);if(!(Number.isFinite(w.x)&&Number.isFinite(w.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(w)} when t=${r}.`);return w};let y;try{y=L.parametric(u,t.valueAsNumber),window.parametricToPath=new B(u)}catch(r){if(r instanceof Error){T.displayError(r);return}else throw r}s(y)};let c=!1;const a=()=>{b.disabled=!0,c||(c=!0,requestAnimationFrame(()=>{c=!1,d()}))};E.doItSoon=a,b.addEventListener("click",a);const p=n.getById("segmentCountSpan",HTMLSpanElement),m=()=>{p.innerText=t.value.padStart(3,P.FIGURE_SPACE)};m(),t.addEventListener("input",()=>{m(),a()});const I=n.getById("startAtSpan",HTMLSpanElement),M=()=>{I.innerText=e.valueAsNumber.toFixed(5)};M(),e.addEventListener("input",()=>{M(),a()}),window.copyNewInput=(o,i)=>{f[i]=o.valueAsNumber;const l=P.assertClass(o.parentElement?.lastElementChild,HTMLSpanElement);l.innerText=o.valueAsNumber.toFixed(5),a()};{const o=()=>{const i=v[g.selectedIndex];x.value=i.code,a()};g.addEventListener("change",o),n.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{g.selectedIndex=(g.selectedIndex+1)%v.length,o()})}{const o=n.getById("codeSamplesHolder",HTMLDivElement),i=n.getById("segmentCountHolder",HTMLDivElement),l=`<div>
        <div data-description>
          <button class="show-this">Show This</button><span></span>
        </div>
        <pre data-code-snippet></pre></div>`;v.forEach((u,y)=>{if(y>0){o.insertAdjacentHTML("beforeend",l);const r=o.lastElementChild,w=n.selectorQuery("span",HTMLSpanElement,r);w.innerText=u.name;const A=n.selectorQuery("pre",HTMLPreElement,r);A.innerText=u.code,n.selectorQuery("button",HTMLButtonElement,r).addEventListener("click",()=>{x.value=u.code,a(),i.scrollIntoView({behavior:"smooth"})})}})}a()}{const s=n.getById("hide-text",HTMLInputElement);s.addEventListener("click",()=>{s.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}{const s=n.getById("smaller-samples",HTMLInputElement);s.addEventListener("click",()=>{s.checked?document.documentElement.dataset.smallerSamples="requested":delete document.documentElement.dataset.smallerSamples})}
