import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as b}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as k,Q as S}from"./path-shape-fljILaqi.js";import{b as T,s as ut}from"./utility-D9E8BDCl.js";import{m as q}from"./misc-wGF4FraP.js";var O,W;function Y(){if(W)return O;W=1;var a=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},i=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return O={add:a,subtract:s,multiply:i,magnitude:t},O}var H,K;function Z(){if(K)return H;K=1;var a=Y(),s={},i=function(n,o){var r=-2*Math.PI*(n/o);return s[o]=s[o]||{},s[o][n]=s[o][n]||[Math.cos(r),Math.sin(r)],s[o][n]},t=function(n){var o=n.map(a.magnitude);return o.slice(0,o.length/2)},e=function(n,o){var r=o/n.length,f=n.slice(0,n.length/2);return f.map(function(c,g){return g*r})};return H={fftMag:t,fftFreq:e,exponent:i},H}var h={},j;function dt(){if(j)return h;j=1;var a=32;h.INT_BITS=a,h.INT_MAX=2147483647,h.INT_MIN=-1<<a-1,h.sign=function(t){return(t>0)-(t<0)},h.abs=function(t){var e=t>>a-1;return(t^e)-e},h.min=function(t,e){return e^(t^e)&-(t<e)},h.max=function(t,e){return t^(t^e)&-(t<e)},h.isPow2=function(t){return!(t&t-1)&&!!t},h.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},h.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},h.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}h.countTrailingZeros=s,h.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},h.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},h.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var i=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,o=e,r=7;for(n>>>=1;n;n>>>=1)o<<=1,o|=n&1,--r;t[e]=o<<r&255}}(i),h.reverse=function(t){return i[t&255]<<24|i[t>>>8&255]<<16|i[t>>>16&255]<<8|i[t>>>24&255]},h.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},h.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},h.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},h.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},h.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},h}var _,z;function X(){if(z)return _;z=1;var a=Y(),s=Z(),i=dt();return _={fft:function t(e){var n=[],o=e.length;if(o==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var r=t(e.filter(x)),f=t(e.filter(l)),c=0;c<o/2;c++){var g=r[c],p=a.multiply(s.exponent(c,o),f[c]);n[c]=a.add(g,p),n[c+o/2]=a.subtract(g,p)}function x(u,m){return m%2==0}function l(u,m){return m%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=i.countTrailingZeros(e),o=0;o<e;o++){var r=i.reverse(o)>>>i.INT_BITS-n;if(r>o){var f=[t[o],0];t[o]=t[r],t[r]=f}else t[r]=[t[r],0]}for(var c=2;c<=e;c+=c)for(var g=0;g<c/2;g++)for(var p=s.exponent(g,c),x=0;x<e/c;x++){var l=a.multiply(p,t[x*c+g+c/2]);t[x*c+g+c/2]=a.subtract(t[x*c+g],l),t[x*c+g]=a.add(t[x*c+g],l)}}},_}var $,tt;function ht(){if(tt)return $;tt=1;var a=X().fft;return $={ifft:function(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=a(t),o=[],r=0;r<n.length;r++)o[r]=[n[r][1]/n.length,n[r][0]/n.length];return o}},$}var V,et;function at(){if(et)return V;et=1;var a=Y(),s=Z(),i=function(t){for(var e=[],n=t.length,o=0;o<n;o++){e[o]=[0,0];for(var r=0;r<n;r++){var f=s.exponent(o*r,n),c;Array.isArray(t[r])?c=a.multiply(t[r],f):c=a.multiply([t[r],0],f),e[o]=a.add(e[o],c)}}return e};return V=i,V}var G,nt;function ft(){if(nt)return G;nt=1;var a=at();function s(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=a(t),o=[],r=0;r<n.length;r++)o[r]=[n[r][1]/n.length,n[r][0]/n.length];return o}return G=s,G}var U,st;function pt(){return st||(st=1,U={fft:X().fft,ifft:ht().ifft,fftInPlace:X().fftInPlace,util:Z(),dft:at(),idft:ft()}),U}var mt=pt();function gt(a,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const i=[];for(let n=0;n<s;n++){const o=n/s,r=a(o);i.push([r.x,r.y])}const t=mt.fft(i),e=[];for(let n=0;n<s;n++){const[o,r]=t[n],f=Math.sqrt(o*o+r*r)/s,c=Math.atan2(r,o),g=n<=s/2?n:n-s;e.push({frequency:g,amplitude:f,phase:c})}return e.sort((n,o)=>o.amplitude-n.amplitude),e}function Mt(a,s){return i=>{let t=0,e=0;for(let n=0;n<Math.min(s,a.length);n++){const{frequency:o,amplitude:r,phase:f}=a[n],c=2*Math.PI*o*i+f;t+=r*Math.cos(c),e+=r*Math.sin(c)}return{x:t,y:e}}}function wt(a){let s=0;a.forEach(n=>s+=n.amplitude);const i=s/1e7,t=a.filter(n=>n.amplitude>i);let e=0;return t.forEach(n=>e+=n.amplitude),console.log(`Removed ${a.length-t.length} of ${a.length} leaving ${t.length} terms.`),console.log(`Removed ${s-e} of ${s} leaving ${e} amplitude.`),t}const ot=120,L=b.getById("go",HTMLButtonElement),R=b.getById("source",HTMLTextAreaElement),C=b.getById("sampleCode",HTMLSelectElement),B=[{name:"Custom",code:""},{name:"Square",default:!0,code:`if (t < 0.25) {
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
const y = - height * Math.exp(-x*x);`},{name:"Archimedean Spiral with Oscillation",code:`const scale = 1; // Overall scale of the spiral
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
// Try values like 0.05, 0.15, 0.25, …, 0.95 for closed shapes.`},{name:"Squaring the Circle",code:`// This will trace out the shape of a dog tag using epicycles.
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
const y = ySum;`}];function it(a,s){const i=a.getBBox(),t=s.viewBox.baseVal;t.x=i.x,t.y=i.y,t.width=i.width,t.height=i.height;const e=i.width/i.height,n=300,o=n*e;s.style.height=n+"px",s.style.width=o+"px";const r=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",r.toString()),{recommendedStrokeWidth:r}}class xt{static#e=new this;#n=b.getById("distanceVsT",SVGSVGElement);#t=T("circle[data-distance]",SVGCircleElement,this.#n);#a=T("path",SVGPathElement,this.#n);#s=T("circle[data-t]",SVGCircleElement);constructor(){new b.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:o}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=o,this.#s.style.display=""}})}f;update(s,i){this.#a.setAttribute("d",i.rawPath),it(this.#a,this.#n),this.f=s,this.#t.style.offsetPath=i.cssPath}static update(s,i){this.#e.update(s,i)}}class yt{static#e=new this;#n=b.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=T("[data-using] [data-circles]",HTMLTableCellElement);#o=T("[data-using] [data-amplitude]",HTMLTableCellElement);#l=T("[data-adding] [data-circles]",HTMLTableCellElement);#i=T("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=T("[data-available] [data-circles]",HTMLTableCellElement);#r=T("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#a]=ut("path",SVGPathElement,2,2,this.#n)}#c;update(s,i){this.#c?.();const t=[];this.#c=()=>{t.forEach(l=>l.cancel())},this.#t.setAttribute("d",i.rawPath),it(this.#t,this.#n);const e=gt(s),n=wt(e);console.log({originalTerms:e,nonZeroTerms:n}),window.nonZeroTerms=n,window.originalTerms=e;let o=0;n.forEach(l=>o+=l.amplitude);const r=10;let f=0;const c=500,g=250,p=n.slice(0,r-1).flatMap((l,u)=>{const m=l.amplitude/o*100,M={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u,usingAmplitude:f,addingCircles:1,addingAmplitude:m};f+=m;const F={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u+1,usingAmplitude:f,addingCircles:0,addingAmplitude:0};return u==0?[F]:[M,F]});{const l=p.at(-1),u=n.length-l.usingCircles;u>0&&p.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:l.usingCircles,usingAmplitude:l.usingAmplitude,addingCircles:u,addingAmplitude:100-l.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}{let l=0;p.forEach(M=>{const F=M.addingCircles?g:c,E=l+F;M.startTime=l,M.endTime=E,l=E}),p.forEach(M=>{M.offset=M.startTime/l});const m={...p.at(-1),startTime:l,offset:1};p.push(m)}console.log(p);const x={duration:p.at(-1).endTime*3,iterations:1/0};{let l=-1/0,u="";const m=p.map(({offset:M,usingCircles:F})=>{if(F!=l){let E=function(y){if(y.commands.length<2)throw new Error("wtf");const[w,...N]=y.commands,A=N.pop();if(!(w instanceof S&&A instanceof S))throw new Error("wtf");if(w.x0==A.x&&w.y0==A.y)return y;const J=(w.x0+A.x)/2,Q=(w.y0+A.y)/2,ct=S.controlPoints(J,Q,w.x1,w.y1,w.x,w.y),lt=S.controlPoints(A.x0,A.y0,A.x1,A.y1,J,Q);return new k([ct,...N,lt])};const I=Mt(n,F),d=k.parametric(I,ot);u=E(d).cssPath,l=F}return{offset:M,d:u,easing:"ease-in-out"}});t.push(this.#a.animate(m,x))}{const l=(u,m,M)=>{const F=I=>`'${I.toString().padStart(4,q.FIGURE_SPACE)}'`,E=M.map(({offset:I,circles:d})=>{const y=F(d);return{offset:I,content:y}});console.log(E),t.push(u.animate(E,{pseudoElement:"::after",...x}))};l(this.#s,this.#o,p.map(({offset:u,usingCircles:m})=>({offset:u,circles:m}))),l(this.#l,this.#i,p.map(({offset:u,addingCircles:m})=>({offset:u,circles:m}))),l(this.#u,this.#r,p.map(({offset:u,usingCircles:m,addingCircles:M})=>({offset:u,circles:n.length-m-M})))}{const l=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,u=d=>(d<0&&(d=0),l(d)),m=p.map(({offset:d,usingAmplitude:y})=>{const w=u(y);return{offset:d,content:w}}),M=p.map(({offset:d,addingAmplitude:y})=>{const w=u(y);return{offset:d,content:w}}),F=p.map(({offset:d,usingAmplitude:y,addingAmplitude:w})=>{const N=u(100-y-w);return{offset:d,content:N}}),E=[...m,...M,...F];let I=0;E.forEach(d=>{const[,y,w]=/^([0-9]+)\.([0-9]+)$/.exec(d.content);switch(y.length){case 3:break;case 2:{d.content=q.FIGURE_SPACE+d.content;break}case 1:{d.content=q.FIGURE_SPACE+q.FIGURE_SPACE+d.content;break}default:throw console.warn({beforeDecimalPoint:y,afterDecimalPoint:w,keyframe:d}),new Error("wtf")}I=Math.max(I,d.content.length)}),E.forEach(d=>{d.content=`'${(d.content+"%").padEnd(I+1,q.FIGURE_SPACE)}'`}),t.push(this.#o.animate(m,{pseudoElement:"::after",...x})),t.push(this.#i.animate(M,{pseudoElement:"::after",...x})),t.push(this.#r.animate(F,{pseudoElement:"::after",...x}))}}static update(s,i){this.#e.update(s,i)}}R.addEventListener("input",()=>{L.disabled=!1,B[0].code=R.value,C.selectedIndex=0});C.innerText="";B.forEach((a,s)=>{const i=document.createElement("option");i.innerText=a.name,C.appendChild(i),a.default&&(C.selectedIndex=s,R.value=a.code)});class D{static#e=b.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof rt?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${P.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function Ft(a){try{return k.parametric(a,ot)}catch(s){if(s instanceof Error){D.displayError(s);return}else throw s}}const P=[];class rt extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${P.length} input sliders currently exist.`),this.requestedIndex=s}}const Et={input(a){if(!Number.isSafeInteger(a)||a<0)throw new RangeError(`invalid ${a}`);if(a>=P.length)throw new rt(a);return P[a]}},Tt=b.getById("inputs",HTMLDivElement);function v(){L.disabled=!1;const a=P.length,s=.5,i=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${a})" />
      <code>support.input(${a})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;Tt.insertAdjacentHTML("beforeend",i),P.push(s)}window.addMoreInputs=(a,s)=>{for(a.disabled=!0;P.length<s;)v()};T("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{v()});v();v();{const a=()=>{D.clear();const t=`"use strict";
`+R.value+`
return { x, y };`;let e;try{e=new Function("t /* A value between 0 and 1, inclusive. */","support",t)}catch(r){if(r instanceof SyntaxError){D.displayError(r);return}else throw r}const n=r=>{const f=e(r,Et);if(!(Number.isFinite(f.x)&&Number.isFinite(f.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(f)} when t=${r}.`);return f},o=Ft(n);o&&(xt.update(n,o),yt.update(n,o))};let s=!1;const i=()=>{L.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,a()}))};L.addEventListener("click",i),window.copyNewInput=(t,e)=>{P[e]=t.valueAsNumber;const n=q.assertClass(t.parentElement?.lastElementChild,HTMLSpanElement);n.innerText=t.valueAsNumber.toFixed(5),i()};{const t=()=>{const e=B[C.selectedIndex];R.value=e.code,i()};C.addEventListener("change",t),b.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{C.selectedIndex=(C.selectedIndex+1)%B.length,t()})}i()}{const a=b.getById("hide-text",HTMLInputElement);a.addEventListener("click",()=>{a.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
