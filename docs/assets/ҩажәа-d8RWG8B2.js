import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as w}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as U,Q as S}from"./path-shape-fljILaqi.js";import{b as I,s as ut}from"./utility-D9E8BDCl.js";import{m as q}from"./misc-wGF4FraP.js";var O,W;function Y(){if(W)return O;W=1;var o=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},r=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return O={add:o,subtract:s,multiply:r,magnitude:t},O}var H,K;function Z(){if(K)return H;K=1;var o=Y(),s={},r=function(n,a){var i=-2*Math.PI*(n/a);return s[a]=s[a]||{},s[a][n]=s[a][n]||[Math.cos(i),Math.sin(i)],s[a][n]},t=function(n){var a=n.map(o.magnitude);return a.slice(0,a.length/2)},e=function(n,a){var i=a/n.length,p=n.slice(0,n.length/2);return p.map(function(l,h){return h*i})};return H={fftMag:t,fftFreq:e,exponent:r},H}var d={},z;function dt(){if(z)return d;z=1;var o=32;d.INT_BITS=o,d.INT_MAX=2147483647,d.INT_MIN=-1<<o-1,d.sign=function(t){return(t>0)-(t<0)},d.abs=function(t){var e=t>>o-1;return(t^e)-e},d.min=function(t,e){return e^(t^e)&-(t<e)},d.max=function(t,e){return t^(t^e)&-(t<e)},d.isPow2=function(t){return!(t&t-1)&&!!t},d.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},d.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},d.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}d.countTrailingZeros=s,d.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},d.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},d.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var r=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,a=e,i=7;for(n>>>=1;n;n>>>=1)a<<=1,a|=n&1,--i;t[e]=a<<i&255}}(r),d.reverse=function(t){return r[t&255]<<24|r[t>>>8&255]<<16|r[t>>>16&255]<<8|r[t>>>24&255]},d.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},d.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},d.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},d.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},d.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},d}var _,tt;function D(){if(tt)return _;tt=1;var o=Y(),s=Z(),r=dt();return _={fft:function t(e){var n=[],a=e.length;if(a==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var i=t(e.filter(y)),p=t(e.filter(c)),l=0;l<a/2;l++){var h=i[l],f=o.multiply(s.exponent(l,a),p[l]);n[l]=o.add(h,f),n[l+a/2]=o.subtract(h,f)}function y(u,m){return m%2==0}function c(u,m){return m%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=r.countTrailingZeros(e),a=0;a<e;a++){var i=r.reverse(a)>>>r.INT_BITS-n;if(i>a){var p=[t[a],0];t[a]=t[i],t[i]=p}else t[i]=[t[i],0]}for(var l=2;l<=e;l+=l)for(var h=0;h<l/2;h++)for(var f=s.exponent(h,l),y=0;y<e/l;y++){var c=o.multiply(f,t[y*l+h+l/2]);t[y*l+h+l/2]=o.subtract(t[y*l+h],c),t[y*l+h]=o.add(t[y*l+h],c)}}},_}var $,et;function ht(){if(et)return $;et=1;var o=D().fft;return $={ifft:function(r){for(var t=[],e=0;e<r.length;e++)t[e]=[r[e][1],r[e][0]];for(var n=o(t),a=[],i=0;i<n.length;i++)a[i]=[n[i][1]/n.length,n[i][0]/n.length];return a}},$}var V,nt;function ot(){if(nt)return V;nt=1;var o=Y(),s=Z(),r=function(t){for(var e=[],n=t.length,a=0;a<n;a++){e[a]=[0,0];for(var i=0;i<n;i++){var p=s.exponent(a*i,n),l;Array.isArray(t[i])?l=o.multiply(t[i],p):l=o.multiply([t[i],0],p),e[a]=o.add(e[a],l)}}return e};return V=r,V}var k,st;function pt(){if(st)return k;st=1;var o=ot();function s(r){for(var t=[],e=0;e<r.length;e++)t[e]=[r[e][1],r[e][0]];for(var n=o(t),a=[],i=0;i<n.length;i++)a[i]=[n[i][1]/n.length,n[i][0]/n.length];return a}return k=s,k}var G,at;function ft(){return at||(at=1,G={fft:D().fft,ifft:ht().ifft,fftInPlace:D().fftInPlace,util:Z(),dft:ot(),idft:pt()}),G}var mt=ft();function gt(o,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const r=[];for(let n=0;n<s;n++){const a=n/s,i=o(a);r.push([i.x,i.y])}const t=mt.fft(r),e=[];for(let n=0;n<s;n++){const[a,i]=t[n],p=Math.sqrt(a*a+i*i)/s,l=Math.atan2(i,a),h=n<=s/2?n:n-s;e.push({frequency:h,amplitude:p,phase:l})}return e.sort((n,a)=>a.amplitude-n.amplitude),e}function Mt(o,s){return r=>{let t=0,e=0;for(let n=0;n<Math.min(s,o.length);n++){const{frequency:a,amplitude:i,phase:p}=o[n],l=2*Math.PI*a*r+p;t+=i*Math.cos(l),e+=i*Math.sin(l)}return{x:t,y:e}}}function yt(o){let s=0;o.forEach(n=>s+=n.amplitude);const r=s/1e7,t=o.filter(n=>n.amplitude>r);let e=0;return t.forEach(n=>e+=n.amplitude),console.log(`Removed ${o.length-t.length} of ${o.length} leaving ${t.length} terms.`),console.log(`Removed ${s-e} of ${s} leaving ${e} amplitude.`),t}const N=w.getById("go",HTMLButtonElement),R=w.getById("source",HTMLTextAreaElement),C=w.getById("sampleCode",HTMLSelectElement),L=w.getById("segmentCountInput",HTMLInputElement),v=[{name:"Custom",code:""},{name:"Square",default:!0,code:`if (t < 0.25) {
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
const y = ySum;`}];function rt(o,s){const r=o.getBBox(),t=s.viewBox.baseVal;t.x=r.x,t.y=r.y,t.width=r.width,t.height=r.height;const e=r.width/r.height,n=300,a=n*e;s.style.height=n+"px",s.style.width=a+"px";const i=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",i.toString()),{recommendedStrokeWidth:i}}class xt{static#e=new this;#n=w.getById("distanceVsT",SVGSVGElement);#t=I("circle[data-distance]",SVGCircleElement,this.#n);#a=I("path",SVGPathElement,this.#n);#s=I("circle[data-t]",SVGCircleElement);constructor(){new w.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:a}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=a,this.#s.style.display=""}})}f;update(s,r){this.#a.setAttribute("d",r.rawPath),rt(this.#a,this.#n),this.f=s,this.#t.style.offsetPath=r.cssPath}static update(s,r){this.#e.update(s,r)}}class wt{static#e=new this;#n=w.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=I("[data-using] [data-circles]",HTMLTableCellElement);#r=I("[data-using] [data-amplitude]",HTMLTableCellElement);#i=I("[data-adding] [data-circles]",HTMLTableCellElement);#l=I("[data-adding] [data-amplitude]",HTMLTableCellElement);#c=I("[data-available] [data-circles]",HTMLTableCellElement);#u=I("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#a]=ut("path",SVGPathElement,2,2,this.#n)}#o;update(s,r){this.#o?.();const t=[];this.#o=()=>{t.forEach(c=>c.cancel())},this.#t.setAttribute("d",r.rawPath),rt(this.#t,this.#n);const e=gt(s),n=yt(e);console.log({originalTerms:e,nonZeroTerms:n}),window.nonZeroTerms=n,window.originalTerms=e;let a=0;n.forEach(c=>a+=c.amplitude);const i=10;let p=0;const l=500,h=250,f=n.slice(0,i-1).flatMap((c,u)=>{const m=c.amplitude/a*100,g={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u,usingAmplitude:p,addingCircles:1,addingAmplitude:m};p+=m;const x={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u+1,usingAmplitude:p,addingCircles:0,addingAmplitude:0};return u==0?[x]:[g,x]});{const c=f.at(-1),u=n.length-c.usingCircles;u>0&&f.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:c.usingCircles,usingAmplitude:c.usingAmplitude,addingCircles:u,addingAmplitude:100-c.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}{let c=0;f.forEach(g=>{const x=g.addingCircles?h:l,T=c+x;g.startTime=c,g.endTime=T,c=T}),f.forEach(g=>{g.offset=g.startTime/c});const m={...f.at(-1),startTime:c,offset:1};f.push(m)}console.log(f);const y={duration:f.at(-1).endTime*3,iterations:1/0};{let c=-1/0,u="";const m=f.map(({offset:g,usingCircles:x})=>{if(x!=c){let T=function(F){if(F.commands.length<2)throw new Error("wtf");const[E,...J]=F.commands,A=J.pop();if(!(E instanceof S&&A instanceof S))throw new Error("wtf");if(E.x0==A.x&&E.y0==A.y)return F;const j=(E.x0+A.x)/2,Q=(E.y0+A.y)/2,lt=S.controlPoints(j,Q,E.x1,E.y1,E.x,E.y),ct=S.controlPoints(A.x0,A.y0,A.x1,A.y1,j,Q);return new U([lt,...J,ct])};const M=Mt(n,x),b=U.parametric(M,L.valueAsNumber);u=T(b).cssPath,c=x}return{offset:g,d:u,easing:"ease-in-out"}});t.push(this.#a.animate(m,y))}{const c=u=>`'${u.toString().padStart(4,q.FIGURE_SPACE)}'`;{const u=f.map(({offset:m,usingCircles:g})=>{const x=c(g);return{offset:m,content:x}});console.log(u),t.push(this.#s.animate(u,{pseudoElement:"::after",...y}))}{const u=f.map(({offset:m,addingCircles:g})=>{const x=c(g);return{offset:m,content:x}});console.log(u),t.push(this.#i.animate(u,{pseudoElement:"::after",...y}))}{const u=f.map(({offset:m,usingCircles:g,addingCircles:x})=>{const T=c(n.length-g-x);return{offset:m,content:T}});console.log(u),t.push(this.#c.animate(u,{pseudoElement:"::after",...y}))}}{const c=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,u=f.map(({offset:M,usingAmplitude:b})=>{const F=c(b);return{offset:M,content:F}}),m=f.map(({offset:M,addingAmplitude:b})=>{const F=c(b);return{offset:M,content:F}}),g=f.map(({offset:M,usingAmplitude:b,addingAmplitude:F})=>{const E=c(100-b-F);return{offset:M,content:E}}),x=[...u,...m,...g];let T=0;x.forEach(M=>{const[,b,F]=/^([0-9]+)\.([0-9]+)$/.exec(M.content);switch(b.length){case 3:break;case 2:{M.content=q.FIGURE_SPACE+M.content;break}case 1:{M.content=q.FIGURE_SPACE+q.FIGURE_SPACE+M.content;break}default:throw console.warn({beforeDecimalPoint:b,afterDecimalPoint:F,keyframe:M}),new Error("wtf")}T=Math.max(T,M.content.length)}),x.forEach(M=>{M.content=`'${(M.content+"%").padEnd(T+1,q.FIGURE_SPACE)}'`}),t.push(this.#r.animate(u,{pseudoElement:"::after",...y})),t.push(this.#l.animate(m,{pseudoElement:"::after",...y})),t.push(this.#u.animate(g,{pseudoElement:"::after",...y}))}}static update(s,r){this.#e.update(s,r)}}R.addEventListener("input",()=>{N.disabled=!1,v[0].code=R.value,C.selectedIndex=0});C.innerText="";v.forEach((o,s)=>{const r=document.createElement("option");r.innerText=o.name,C.appendChild(r),o.default&&(C.selectedIndex=s,R.value=o.code)});class X{static#e=w.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof it?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${P.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function Ft(o){try{return U.parametric(o,L.valueAsNumber)}catch(s){if(s instanceof Error){X.displayError(s);return}else throw s}}const P=[];class it extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${P.length} input sliders currently exist.`),this.requestedIndex=s}}const Et={input(o){if(!Number.isSafeInteger(o)||o<0)throw new RangeError(`invalid ${o}`);if(o>=P.length)throw new it(o);return P[o]}},Tt=w.getById("inputs",HTMLDivElement);function B(){N.disabled=!1;const o=P.length,s=.5,r=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${o})" />
      <code>support.input(${o})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;Tt.insertAdjacentHTML("beforeend",r),P.push(s)}window.addMoreInputs=(o,s)=>{for(o.disabled=!0;P.length<s;)B()};I("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{B()});B();B();{const o=()=>{X.clear();const n=`"use strict";
`+R.value+`
return { x, y };`;let a;try{a=new Function("t /* A value between 0 and 1, inclusive. */","support",n)}catch(l){if(l instanceof SyntaxError){X.displayError(l);return}else throw l}const i=l=>{const h=a(l,Et);if(!(Number.isFinite(h.x)&&Number.isFinite(h.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(h)} when t=${l}.`);return h},p=Ft(i);p&&(xt.update(i,p),wt.update(i,p))};let s=!1;const r=()=>{N.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,o()}))};N.addEventListener("click",r);const t=w.getById("segmentCountSpan",HTMLSpanElement),e=()=>{t.innerText=L.value.padStart(3,q.FIGURE_SPACE)};e(),L.addEventListener("change",()=>{e(),r()}),window.copyNewInput=(n,a)=>{P[a]=n.valueAsNumber;const i=q.assertClass(n.parentElement?.lastElementChild,HTMLSpanElement);i.innerText=n.valueAsNumber.toFixed(5),r()};{const n=()=>{const a=v[C.selectedIndex];R.value=a.code,r()};C.addEventListener("change",n),w.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{C.selectedIndex=(C.selectedIndex+1)%v.length,n()})}r()}{const o=w.getById("hide-text",HTMLInputElement);o.addEventListener("click",()=>{o.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
