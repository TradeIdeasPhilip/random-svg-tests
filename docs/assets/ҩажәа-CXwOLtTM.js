import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as w}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as Q}from"./path-shape-fljILaqi.js";import{b as F,s as st}from"./utility-D9E8BDCl.js";import{m as C}from"./misc-wGF4FraP.js";var v,D;function G(){if(D)return v;D=1;var o=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},i=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return v={add:o,subtract:s,multiply:i,magnitude:t},v}var L,X;function U(){if(X)return L;X=1;var o=G(),s={},i=function(n,a){var r=-2*Math.PI*(n/a);return s[a]=s[a]||{},s[a][n]=s[a][n]||[Math.cos(r),Math.sin(r)],s[a][n]},t=function(n){var a=n.map(o.magnitude);return a.slice(0,a.length/2)},e=function(n,a){var r=a/n.length,p=n.slice(0,n.length/2);return p.map(function(l,h){return h*r})};return L={fftMag:t,fftFreq:e,exponent:i},L}var d={},Y;function at(){if(Y)return d;Y=1;var o=32;d.INT_BITS=o,d.INT_MAX=2147483647,d.INT_MIN=-1<<o-1,d.sign=function(t){return(t>0)-(t<0)},d.abs=function(t){var e=t>>o-1;return(t^e)-e},d.min=function(t,e){return e^(t^e)&-(t<e)},d.max=function(t,e){return t^(t^e)&-(t<e)},d.isPow2=function(t){return!(t&t-1)&&!!t},d.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},d.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},d.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}d.countTrailingZeros=s,d.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},d.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},d.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var i=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,a=e,r=7;for(n>>>=1;n;n>>>=1)a<<=1,a|=n&1,--r;t[e]=a<<r&255}}(i),d.reverse=function(t){return i[t&255]<<24|i[t>>>8&255]<<16|i[t>>>16&255]<<8|i[t>>>24&255]},d.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},d.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},d.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},d.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},d.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},d}var B,Z;function V(){if(Z)return B;Z=1;var o=G(),s=U(),i=at();return B={fft:function t(e){var n=[],a=e.length;if(a==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var r=t(e.filter(g)),p=t(e.filter(u)),l=0;l<a/2;l++){var h=r[l],m=o.multiply(s.exponent(l,a),p[l]);n[l]=o.add(h,m),n[l+a/2]=o.subtract(h,m)}function g(c,f){return f%2==0}function u(c,f){return f%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=i.countTrailingZeros(e),a=0;a<e;a++){var r=i.reverse(a)>>>i.INT_BITS-n;if(r>a){var p=[t[a],0];t[a]=t[r],t[r]=p}else t[r]=[t[r],0]}for(var l=2;l<=e;l+=l)for(var h=0;h<l/2;h++)for(var m=s.exponent(h,l),g=0;g<e/l;g++){var u=o.multiply(m,t[g*l+h+l/2]);t[g*l+h+l/2]=o.subtract(t[g*l+h],u),t[g*l+h]=o.add(t[g*l+h],u)}}},B}var O,J;function ot(){if(J)return O;J=1;var o=V().fft;return O={ifft:function(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}},O}var H,j;function z(){if(j)return H;j=1;var o=G(),s=U(),i=function(t){for(var e=[],n=t.length,a=0;a<n;a++){e[a]=[0,0];for(var r=0;r<n;r++){var p=s.exponent(a*r,n),l;Array.isArray(t[r])?l=o.multiply(t[r],p):l=o.multiply([t[r],0],p),e[a]=o.add(e[a],l)}}return e};return H=i,H}var _,W;function it(){if(W)return _;W=1;var o=z();function s(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}return _=s,_}var $,K;function rt(){return K||(K=1,$={fft:V().fft,ifft:ot().ifft,fftInPlace:V().fftInPlace,util:U(),dft:z(),idft:it()}),$}var lt=rt();function ct(o,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const i=[];for(let n=0;n<s;n++){const a=n/s,r=o(a);i.push([r.x,r.y])}const t=lt.fft(i),e=[];for(let n=0;n<s;n++){const[a,r]=t[n],p=Math.sqrt(a*a+r*r)/s,l=Math.atan2(r,a),h=n<=s/2?n:n-s;e.push({frequency:h,amplitude:p,phase:l})}return e.sort((n,a)=>a.amplitude-n.amplitude),e}function ut(o,s){return i=>{let t=0,e=0;for(let n=0;n<Math.min(s,o.length);n++){const{frequency:a,amplitude:r,phase:p}=o[n],l=2*Math.PI*a*i+p;t+=r*Math.cos(l),e+=r*Math.sin(l)}return{x:t,y:e}}}function dt(o){let s=0;o.forEach(n=>s+=n.amplitude);const i=s/1e7,t=o.filter(n=>n.amplitude>i);let e=0;return t.forEach(n=>e+=n.amplitude),console.log(`Removed ${o.length-t.length} of ${o.length} leaving ${t.length} terms.`),console.log(`Removed ${s-e} of ${s} leaving ${e} amplitude.`),t}const q=w.getById("go",HTMLButtonElement),P=w.getById("source",HTMLTextAreaElement),T=w.getById("sampleCode",HTMLSelectElement),R=w.getById("segmentCountInput",HTMLInputElement),S=[{name:"Custom",code:""},{name:"Square",default:!0,code:`if (t < 0.25) {
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
const y = ySum;`}];function tt(o,s){const i=o.getBBox(),t=s.viewBox.baseVal;t.x=i.x,t.y=i.y,t.width=i.width,t.height=i.height;const e=i.width/i.height,n=300,a=n*e;s.style.height=n+"px",s.style.width=a+"px";const r=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",r.toString()),{recommendedStrokeWidth:r}}class ht{static#e=new this;#n=w.getById("distanceVsT",SVGSVGElement);#t=F("circle[data-distance]",SVGCircleElement,this.#n);#a=F("path",SVGPathElement,this.#n);#s=F("circle[data-t]",SVGCircleElement);constructor(){new w.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:a}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=a,this.#s.style.display=""}})}f;update(s,i){this.#a.setAttribute("d",i.rawPath),tt(this.#a,this.#n),this.f=s,this.#t.style.offsetPath=i.cssPath}static update(s,i){this.#e.update(s,i)}}class pt{static#e=new this;#n=w.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=F("[data-using] [data-circles]",HTMLTableCellElement);#i=F("[data-using] [data-amplitude]",HTMLTableCellElement);#r=F("[data-adding] [data-circles]",HTMLTableCellElement);#l=F("[data-adding] [data-amplitude]",HTMLTableCellElement);#c=F("[data-available] [data-circles]",HTMLTableCellElement);#u=F("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#a]=st("path",SVGPathElement,2,2,this.#n)}#o;update(s,i){this.#o?.();const t=[];this.#o=()=>{t.forEach(u=>u.cancel())},this.#t.setAttribute("d",i.rawPath),tt(this.#t,this.#n);const e=ct(s),n=dt(e);console.log({originalTerms:e,nonZeroTerms:n}),window.nonZeroTerms=n,window.originalTerms=e;let a=0;n.forEach(u=>a+=u.amplitude);const r=10;let p=0;const l=500,h=250,m=n.slice(0,r-1).flatMap((u,c)=>{const f=u.amplitude/a*100,y={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:c,usingAmplitude:p,addingCircles:1,addingAmplitude:f};p+=f;const x={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:c+1,usingAmplitude:p,addingCircles:0,addingAmplitude:0};return c==0?[x]:[y,x]});{const u=m.at(-1),c=n.length-u.usingCircles;c>0&&m.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u.usingCircles,usingAmplitude:u.usingAmplitude,addingCircles:c,addingAmplitude:100-u.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}{let u=0;m.forEach(c=>{const f=c.addingCircles?h:l,y=u+f;c.startTime=u,c.endTime=y,u=y}),m.forEach(c=>{c.offset=c.startTime/u})}console.log(m);const g={duration:m.at(-1).endTime*3,iterations:1/0};{let u=-1/0,c="";const f=m.map(({offset:y,usingCircles:x})=>{if(x!=u){const I=ut(n,x);c=Q.parametric(I,R.valueAsNumber).cssPath,u=x}return{offset:y,d:c,easing:"ease-in-out"}});t.push(this.#a.animate(f,g))}{const u=c=>`'${c.toString().padStart(4,C.FIGURE_SPACE)}'`;{const c=m.map(({offset:f,usingCircles:y})=>{const x=u(y);return{offset:f,content:x}});console.log(c),t.push(this.#s.animate(c,{pseudoElement:"::after",...g}))}{const c=m.map(({offset:f,addingCircles:y})=>{const x=u(y);return{offset:f,content:x}});console.log(c),t.push(this.#r.animate(c,{pseudoElement:"::after",...g}))}{const c=m.map(({offset:f,usingCircles:y,addingCircles:x})=>{const I=u(n.length-y-x);return{offset:f,content:I}});console.log(c),t.push(this.#c.animate(c,{pseudoElement:"::after",...g}))}}{const u=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,c=m.map(({offset:M,usingAmplitude:E})=>{const A=u(E);return{offset:M,content:A}}),f=m.map(({offset:M,addingAmplitude:E})=>{const A=u(E);return{offset:M,content:A}}),y=m.map(({offset:M,usingAmplitude:E,addingAmplitude:A})=>{const nt=u(100-E-A);return{offset:M,content:nt}}),x=[...c,...f,...y];let I=0;x.forEach(M=>{const[,E,A]=/^([0-9]+)\.([0-9]+)$/.exec(M.content);switch(E.length){case 3:break;case 2:{M.content=C.FIGURE_SPACE+M.content;break}case 1:{M.content=C.FIGURE_SPACE+C.FIGURE_SPACE+M.content;break}default:throw console.warn({beforeDecimalPoint:E,afterDecimalPoint:A,keyframe:M}),new Error("wtf")}I=Math.max(I,M.content.length)}),x.forEach(M=>{M.content=`'${M.content.padEnd(I)}'`}),t.push(this.#i.animate(c,{pseudoElement:"::after",...g})),t.push(this.#l.animate(f,{pseudoElement:"::after",...g})),t.push(this.#u.animate(y,{pseudoElement:"::after",...g}))}console.log(t)}static update(s,i){this.#e.update(s,i)}}P.addEventListener("input",()=>{q.disabled=!1,S[0].code=P.value,T.selectedIndex=0});T.innerText="";S.forEach((o,s)=>{const i=document.createElement("option");i.innerText=o.name,T.appendChild(i),o.default&&(T.selectedIndex=s,P.value=o.code)});class k{static#e=w.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof et?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${b.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function ft(o){try{return Q.parametric(o,R.valueAsNumber)}catch(s){if(s instanceof Error){k.displayError(s);return}else throw s}}const b=[];class et extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${b.length} input sliders currently exist.`),this.requestedIndex=s}}const mt={input(o){if(!Number.isSafeInteger(o)||o<0)throw new RangeError(`invalid ${o}`);if(o>=b.length)throw new et(o);return b[o]}},gt=w.getById("inputs",HTMLDivElement);function N(){q.disabled=!1;const o=b.length,s=.5,i=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${o})" />
      <code>support.input(${o})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;gt.insertAdjacentHTML("beforeend",i),b.push(s)}window.addMoreInputs=(o,s)=>{for(o.disabled=!0;b.length<s;)N()};F("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{N()});N();N();{const o=()=>{k.clear();const n=`"use strict";
`+P.value+`
return { x, y };`;let a;try{a=new Function("t /* A value between 0 and 1, inclusive. */","support",n)}catch(l){if(l instanceof SyntaxError){k.displayError(l);return}else throw l}const r=l=>{const h=a(l,mt);if(!(Number.isFinite(h.x)&&Number.isFinite(h.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(h)} when t=${l}.`);return h},p=ft(r);p&&(ht.update(r,p),pt.update(r,p))};let s=!1;const i=()=>{q.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,o()}))};q.addEventListener("click",i);const t=w.getById("segmentCountSpan",HTMLSpanElement),e=()=>{t.innerText=R.value.padStart(3,C.FIGURE_SPACE)};e(),R.addEventListener("change",()=>{e(),i()}),window.copyNewInput=(n,a)=>{b[a]=n.valueAsNumber;const r=C.assertClass(n.parentElement?.lastElementChild,HTMLSpanElement);r.innerText=n.valueAsNumber.toFixed(5),i()};{const n=()=>{const a=S[T.selectedIndex];P.value=a.code,i()};T.addEventListener("change",n),w.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{T.selectedIndex=(T.selectedIndex+1)%S.length,n()})}i()}{const o=w.getById("hide-text",HTMLInputElement);o.addEventListener("click",()=>{o.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
