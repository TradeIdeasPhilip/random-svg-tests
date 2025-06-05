import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as f}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as J}from"./path-shape-fljILaqi.js";import{b as I,s as j}from"./utility-D9E8BDCl.js";import{m as A}from"./misc-wGF4FraP.js";var q,k;function O(){if(k)return q;k=1;var o=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},i=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return q={add:o,subtract:s,multiply:i,magnitude:t},q}var P,H;function $(){if(H)return P;H=1;var o=O(),s={},i=function(n,a){var r=-2*Math.PI*(n/a);return s[a]=s[a]||{},s[a][n]=s[a][n]||[Math.cos(r),Math.sin(r)],s[a][n]},t=function(n){var a=n.map(o.magnitude);return a.slice(0,a.length/2)},e=function(n,a){var r=a/n.length,h=n.slice(0,n.length/2);return h.map(function(l,d){return d*r})};return P={fftMag:t,fftFreq:e,exponent:i},P}var c={},_;function W(){if(_)return c;_=1;var o=32;c.INT_BITS=o,c.INT_MAX=2147483647,c.INT_MIN=-1<<o-1,c.sign=function(t){return(t>0)-(t<0)},c.abs=function(t){var e=t>>o-1;return(t^e)-e},c.min=function(t,e){return e^(t^e)&-(t<e)},c.max=function(t,e){return t^(t^e)&-(t<e)},c.isPow2=function(t){return!(t&t-1)&&!!t},c.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},c.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},c.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}c.countTrailingZeros=s,c.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},c.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},c.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var i=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,a=e,r=7;for(n>>>=1;n;n>>>=1)a<<=1,a|=n&1,--r;t[e]=a<<r&255}}(i),c.reverse=function(t){return i[t&255]<<24|i[t>>>8&255]<<16|i[t>>>16&255]<<8|i[t>>>24&255]},c.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},c.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},c.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},c.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},c.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},c}var C,X;function N(){if(X)return C;X=1;var o=O(),s=$(),i=W();return C={fft:function t(e){var n=[],a=e.length;if(a==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var r=t(e.filter(u)),h=t(e.filter(p)),l=0;l<a/2;l++){var d=r[l],g=o.multiply(s.exponent(l,a),h[l]);n[l]=o.add(d,g),n[l+a/2]=o.subtract(d,g)}function u(x,y){return y%2==0}function p(x,y){return y%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=i.countTrailingZeros(e),a=0;a<e;a++){var r=i.reverse(a)>>>i.INT_BITS-n;if(r>a){var h=[t[a],0];t[a]=t[r],t[r]=h}else t[r]=[t[r],0]}for(var l=2;l<=e;l+=l)for(var d=0;d<l/2;d++)for(var g=s.exponent(d,l),u=0;u<e/l;u++){var p=o.multiply(g,t[u*l+d+l/2]);t[u*l+d+l/2]=o.subtract(t[u*l+d],p),t[u*l+d]=o.add(t[u*l+d],p)}}},C}var S,V;function Q(){if(V)return S;V=1;var o=N().fft;return S={ifft:function(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}},S}var R,U;function Z(){if(U)return R;U=1;var o=O(),s=$(),i=function(t){for(var e=[],n=t.length,a=0;a<n;a++){e[a]=[0,0];for(var r=0;r<n;r++){var h=s.exponent(a*r,n),l;Array.isArray(t[r])?l=o.multiply(t[r],h):l=o.multiply([t[r],0],h),e[a]=o.add(e[a],l)}}return e};return R=i,R}var v,G;function K(){if(G)return v;G=1;var o=Z();function s(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}return v=s,v}var L,Y;function z(){return Y||(Y=1,L={fft:N().fft,ifft:Q().ifft,fftInPlace:N().fftInPlace,util:$(),dft:Z(),idft:K()}),L}var tt=z();function et(o,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const i=[];for(let n=0;n<s;n++){const a=n/s,r=o(a);i.push([r.x,r.y])}const t=tt.fft(i),e=[];for(let n=0;n<s;n++){const[a,r]=t[n],h=Math.sqrt(a*a+r*r)/s,l=Math.atan2(r,a),d=n<=s/2?n:n-s;e.push({frequency:d,amplitude:h,phase:l})}return e.sort((n,a)=>a.amplitude-n.amplitude),e}function nt(o,s){return i=>{let t=0,e=0;for(let n=0;n<Math.min(s,o.length);n++){const{frequency:a,amplitude:r,phase:h}=o[n],l=2*Math.PI*a*i+h;t+=r*Math.cos(l),e+=r*Math.sin(l)}return{x:t,y:e}}}function st(o){let s=0;o.forEach(n=>s+=n.amplitude);const i=s/1e7,t=o.filter(n=>n.amplitude>i);let e=0;return t.forEach(n=>e+=n.amplitude),console.log(`Removed ${o.length-t.length} of ${o.length} leaving ${t.length} terms.`),console.log(`Removed ${s-e} of ${s} leaving ${e} amplitude.`),t}const b=f.getById("go",HTMLButtonElement),w=f.getById("source",HTMLTextAreaElement),m=f.getById("sampleCode",HTMLSelectElement),E=[{name:"Custom",code:""},{name:"Square",default:!0,code:`if (t < 0.25) {
  return {x: t*4 -0.5, y:-0.5};
} else if(t<0.5) {
  return {x:0.5, y: t*4-1.5};
} else if(t<0.75) {
  return {x: 2.5-t*4, y:0.5};
} else {
  return {x:-0.5, y: 3.5-t*4};
}`},{name:"Square with Easing",code:`// This takes -1/2 to -1/2, 0 to 0, and 1/2 to 1/2.
// However it starts moving slowly, speeds up in the middle, and slows down again at the end.
function ease(t) {
  return Math.cos((t-0.5)*Math.PI)/2; 
}

let x =0;
let y=0;
 
if (t < 0.25) {
  x = t*4-0.5;
  y = -0.5;
} else if(t<0.5) {
  x = 0.5;
  y = t*4-1.5;
} else if(t<0.75) {
  x = 2.5-t*4;
  y = 0.5;
} else {
  x= -0.5; 
  y= 3.5-t*4;
}
x = ease(x);
y = ease(y);`},{name:"Simple Ellipse",code:`// The height can be anything convenient to you.
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
const y = height * Math.sin(angle) * adjustmentFactor;`},{name:"Lissajous Curves",code:`const a = 1; // Amplitude in x-direction
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
const y = ySum;`}];function at(o,s){const i=o.getBBox(),t=s.viewBox.baseVal;t.x=i.x,t.y=i.y,t.width=i.width,t.height=i.height;const e=i.width/i.height,n=300,a=n*e;s.style.height=n+"px",s.style.width=a+"px";const r=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",r.toString()),{recommendedStrokeWidth:r}}class ot{static#t=new this;#e=I("circle[data-distance]",SVGCircleElement);#n=I("circle[data-t]",SVGCircleElement);constructor(){new f.AnimationLoop(s=>{if(this.#e.style.display="none",this.#n.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#e.style.offsetDistance=e+"%",this.#e.style.display="";const{x:n,y:a}=this.f(t);this.#n.cx.baseVal.value=n,this.#n.cy.baseVal.value=a,this.#n.style.display=""}})}f;static update(s,i){this.#t.f=s,this.#t.#e.style.offsetPath=i}}w.addEventListener("input",()=>{b.disabled=!1,E[0].code=w.value,m.selectedIndex=0});m.innerText="";E.forEach((o,s)=>{const i=document.createElement("option");i.innerText=o.name,m.appendChild(i),o.default&&(m.selectedIndex=s,w.value=o.code)});class B{static#t=f.getById("error",HTMLDivElement);static display(s){this.#t.innerText=s}static displayError(s){s instanceof D?this.#t.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${M.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}class F{#t;get svgElement(){return this.#t}#e;get pathElement(){return this.#e}constructor(s){this.#t=s,this.#e=I("path:not([data-skip-auto-fill])",SVGPathElement,this.#t),F.all.add(this)}static all=new Set;setPathShape(s){this.#e.setAttribute("d",s.rawPath),at(this.pathElement,this.svgElement)}}j("svg.outlineSample",SVGSVGElement).map(o=>new F(o));const M=[];class D extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${M.length} input sliders currently exist.`),this.requestedIndex=s}}const rt={input(o){if(!Number.isSafeInteger(o)||o<0)throw new RangeError(`invalid ${o}`);if(o>=M.length)throw new D(o);return M[o]}},it=f.getById("inputs",HTMLDivElement);function T(){b.disabled=!1;const o=M.length,s=.5,i=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${o})" />
      <code>support.input(${o})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;it.insertAdjacentHTML("beforeend",i),M.push(s)}window.addMoreInputs=(o,s)=>{for(o.disabled=!0;M.length<s;)T()};I("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{T()});T();T();{const o=f.getById("segmentCountInput",HTMLInputElement),s=()=>{B.clear();const a=`"use strict";
`+w.value+`
return { x, y };`;let r;try{r=new Function("t /* A value between 0 and 1, inclusive. */","support",a)}catch(u){if(u instanceof SyntaxError){B.displayError(u);return}else throw u}const h=u=>{const p=r(u,rt);if(!(Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(p)} when t=${u}.`);return p},l=[h],d=et(h),g=st(d);for(let u=1;u<F.all.size;u++)l.push(nt(g,u));console.log({toPlot:l,originalTerms:d,nonZeroTerms:g}),window.toPlot=l,window.nonZeroTerms=g,window.originalTerms=d;for(const[u,p]of A.zip(F.all,l)){let x;try{x=J.parametric(p,o.valueAsNumber)}catch(y){if(y instanceof Error){B.displayError(y);return}else throw y}u.setPathShape(x),p==h&&ot.update(h,x.cssPath)}};let i=!1;const t=()=>{b.disabled=!0,i||(i=!0,requestAnimationFrame(()=>{i=!1,s()}))};b.addEventListener("click",t);const e=f.getById("segmentCountSpan",HTMLSpanElement),n=()=>{e.innerText=o.value.padStart(3,A.FIGURE_SPACE)};n(),o.addEventListener("change",()=>{n(),t()}),window.copyNewInput=(a,r)=>{M[r]=a.valueAsNumber;const h=A.assertClass(a.parentElement?.lastElementChild,HTMLSpanElement);h.innerText=a.valueAsNumber.toFixed(5),t()};{const a=()=>{const r=E[m.selectedIndex];w.value=r.code,t()};m.addEventListener("change",a),f.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{m.selectedIndex=(m.selectedIndex+1)%E.length,a()})}t()}{const o=f.getById("hide-text",HTMLInputElement);o.addEventListener("click",()=>{o.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
