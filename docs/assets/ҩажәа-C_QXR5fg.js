import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as A}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as Z,Q as O}from"./path-shape-fljILaqi.js";import{b as I,s as dt}from"./utility-D9E8BDCl.js";import{m as L}from"./misc-wGF4FraP.js";var G,j;function Q(){if(j)return G;j=1;var o=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},i=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return G={add:o,subtract:s,multiply:i,magnitude:t},G}var U,z;function W(){if(z)return U;z=1;var o=Q(),s={},i=function(n,a){var r=-2*Math.PI*(n/a);return s[a]=s[a]||{},s[a][n]=s[a][n]||[Math.cos(r),Math.sin(r)],s[a][n]},t=function(n){var a=n.map(o.magnitude);return a.slice(0,a.length/2)},e=function(n,a){var r=a/n.length,f=n.slice(0,n.length/2);return f.map(function(l,y){return y*r})};return U={fftMag:t,fftFreq:e,exponent:i},U}var h={},tt;function ht(){if(tt)return h;tt=1;var o=32;h.INT_BITS=o,h.INT_MAX=2147483647,h.INT_MIN=-1<<o-1,h.sign=function(t){return(t>0)-(t<0)},h.abs=function(t){var e=t>>o-1;return(t^e)-e},h.min=function(t,e){return e^(t^e)&-(t<e)},h.max=function(t,e){return t^(t^e)&-(t<e)},h.isPow2=function(t){return!(t&t-1)&&!!t},h.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},h.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},h.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}h.countTrailingZeros=s,h.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},h.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},h.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var i=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,a=e,r=7;for(n>>>=1;n;n>>>=1)a<<=1,a|=n&1,--r;t[e]=a<<r&255}}(i),h.reverse=function(t){return i[t&255]<<24|i[t>>>8&255]<<16|i[t>>>16&255]<<8|i[t>>>24&255]},h.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},h.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},h.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},h.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},h.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},h}var $,et;function J(){if(et)return $;et=1;var o=Q(),s=W(),i=ht();return $={fft:function t(e){var n=[],a=e.length;if(a==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var r=t(e.filter(F)),f=t(e.filter(b)),l=0;l<a/2;l++){var y=r[l],g=o.multiply(s.exponent(l,a),f[l]);n[l]=o.add(y,g),n[l+a/2]=o.subtract(y,g)}function F(u,d){return d%2==0}function b(u,d){return d%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=i.countTrailingZeros(e),a=0;a<e;a++){var r=i.reverse(a)>>>i.INT_BITS-n;if(r>a){var f=[t[a],0];t[a]=t[r],t[r]=f}else t[r]=[t[r],0]}for(var l=2;l<=e;l+=l)for(var y=0;y<l/2;y++)for(var g=s.exponent(y,l),F=0;F<e/l;F++){var b=o.multiply(g,t[F*l+y+l/2]);t[F*l+y+l/2]=o.subtract(t[F*l+y],b),t[F*l+y]=o.add(t[F*l+y],b)}}},$}var k,nt;function ft(){if(nt)return k;nt=1;var o=J().fft;return k={ifft:function(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}},k}var X,st;function it(){if(st)return X;st=1;var o=Q(),s=W(),i=function(t){for(var e=[],n=t.length,a=0;a<n;a++){e[a]=[0,0];for(var r=0;r<n;r++){var f=s.exponent(a*r,n),l;Array.isArray(t[r])?l=o.multiply(t[r],f):l=o.multiply([t[r],0],f),e[a]=o.add(e[a],l)}}return e};return X=i,X}var D,at;function pt(){if(at)return D;at=1;var o=it();function s(i){for(var t=[],e=0;e<i.length;e++)t[e]=[i[e][1],i[e][0]];for(var n=o(t),a=[],r=0;r<n.length;r++)a[r]=[n[r][1]/n.length,n[r][0]/n.length];return a}return D=s,D}var Y,ot;function mt(){return ot||(ot=1,Y={fft:J().fft,ifft:ft().ifft,fftInPlace:J().fftInPlace,util:W(),dft:it(),idft:pt()}),Y}var gt=mt();function yt(o,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const i=[];for(let n=0;n<s;n++){const a=n/s,r=o(a);i.push([r.x,r.y])}const t=gt.fft(i),e=[];for(let n=0;n<s;n++){const[a,r]=t[n],f=Math.sqrt(a*a+r*r)/s,l=Math.atan2(r,a),y=n<=s/2?n:n-s;e.push({frequency:y,amplitude:f,phase:l})}return e.sort((n,a)=>a.amplitude-n.amplitude),e}function Mt(o,s){return i=>{let t=0,e=0;for(let n=0;n<Math.min(s,o.length);n++){const{frequency:a,amplitude:r,phase:f}=o[n],l=2*Math.PI*a*i+f;t+=r*Math.cos(l),e+=r*Math.sin(l)}return{x:t,y:e}}}function wt(o){let s=0;o.forEach(n=>s+=n.amplitude);const i=s/1e7,t=o.filter(n=>n.amplitude>i);let e=0;return t.forEach(n=>e+=n.amplitude),t}const rt=120,H=A.getById("go",HTMLButtonElement),v=A.getById("source",HTMLTextAreaElement),N=A.getById("sampleCode",HTMLSelectElement),_=[{name:"Custom",code:""},{name:"Square",default:!0,code:`if (t < 0.25) {
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
const y = ySum;`}];function ct(o,s){const i=o.getBBox(),t=s.viewBox.baseVal;t.x=i.x,t.y=i.y,t.width=i.width,t.height=i.height;const e=i.width/i.height,n=300,a=n*e;s.style.height=n+"px",s.style.width=a+"px";const r=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",r.toString()),{recommendedStrokeWidth:r}}class xt{static#e=new this;#n=A.getById("distanceVsT",SVGSVGElement);#t=I("circle[data-distance]",SVGCircleElement,this.#n);#a=I("path",SVGPathElement,this.#n);#s=I("circle[data-t]",SVGCircleElement);constructor(){new A.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:a}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=a,this.#s.style.display=""}})}f;update(s,i){this.#a.setAttribute("d",i.rawPath),ct(this.#a,this.#n),this.f=s,this.#t.style.offsetPath=i.cssPath}static update(s,i){this.#e.update(s,i)}}class Ft{static#e=new this;#n=A.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=I("[data-using] [data-circles]",HTMLTableCellElement);#o=I("[data-using] [data-amplitude]",HTMLTableCellElement);#l=I("[data-adding] [data-circles]",HTMLTableCellElement);#i=I("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=I("[data-available] [data-circles]",HTMLTableCellElement);#r=I("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#a]=dt("path",SVGPathElement,2,2,this.#n)}#c;update(s,i){this.#c?.();const t=[];this.#c=()=>{t.forEach(u=>u.cancel())},this.#t.setAttribute("d",i.rawPath),ct(this.#t,this.#n);const e=yt(s),n=wt(e);window.nonZeroTerms=n,window.originalTerms=e;let a=0;n.forEach(u=>a+=u.amplitude);const r=10;let f=0;const l=750,y=500,g=n.slice(0,r-1).flatMap((u,d)=>{const M=u.amplitude/a*100,m={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:d,usingAmplitude:f,addingCircles:1,addingAmplitude:M};f+=M;const w={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:d+1,usingAmplitude:f,addingCircles:0,addingAmplitude:0};return d==0?[w]:[m,w]});{const u=g.at(-1),d=n.length-u.usingCircles;d>0&&g.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u.usingCircles,usingAmplitude:u.usingAmplitude,addingCircles:d,addingAmplitude:100-u.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}let F=NaN;{let u=0;g.forEach(m=>{const w=m.addingCircles?y:l,E=u+w;m.startTime=u,m.endTime=E,u=E}),g.forEach(m=>{m.offset=m.startTime/u}),F=50/u;const M={...g.at(-1),startTime:u,offset:1};g.push(M)}console.log("script",g);const b={duration:g.at(-1).endTime*3,iterations:1/0};{let u=-1/0,d="";const M=g.map(({offset:m,usingCircles:w})=>{if(w!=u){let E=function(c){if(c.commands.length<2)throw new Error("wtf");const[p,...T]=c.commands,x=T.pop();if(!(p instanceof O&&x instanceof O))throw new Error("wtf");if(p.x0==x.x&&p.y0==x.y)return c;const P=(p.x0+x.x)/2,S=(p.y0+x.y)/2,B=O.controlPoints(P,S,p.x1,p.y1,p.x,p.y),ut=O.controlPoints(x.x0,x.y0,x.x1,x.y1,P,S);return new Z([B,...T,ut])};const C=Mt(n,w),q=Z.parametric(C,rt);d=E(q).cssPath,u=w}return{offset:m,d,easing:"ease-in-out"}});t.push(this.#a.animate(M,b)),console.log("d",M)}{const u=(d,M,m)=>{const w=c=>`'${c.toString().padStart(4,L.FIGURE_SPACE)}'`;let E;const C=new Array;m.forEach(({offset:c,circles:p})=>{E!==void 0&&C.push({offset:c,content:E});const T=E=w(p);C.push({offset:c,content:T})}),console.log("circles text",C),t.push(d.animate(C,{pseudoElement:"::after",...b}));const q=m.flatMap(({offset:c,circles:p},T,x)=>{function P(B=p){return B==0?.25:1}if(c==0||c==1)return[{offset:c,opacity:P()}];const S=x[T-1].circles;return S==p?[]:[{offset:c-F,opacity:P(S)},{offset:c,opacity:0},{offset:c+F,opacity:P()}]});[d,M].forEach(c=>t.push(c.animate(q,b))),console.log("opacity",q)};u(this.#s,this.#o,g.map(({offset:d,usingCircles:M})=>({offset:d,circles:M}))),u(this.#l,this.#i,g.map(({offset:d,addingCircles:M})=>({offset:d,circles:M}))),u(this.#u,this.#r,g.map(({offset:d,usingCircles:M,addingCircles:m})=>({offset:d,circles:n.length-M-m})))}{let u=function(c){let p;const T=new Array;return g.forEach(x=>{const{offset:P}=x,S=c(x);p!==void 0&&T.push({offset:P,content:p});const B=p=M(S);T.push({offset:P,content:B})}),T};const d=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,M=c=>(c<0&&(c=0),d(c)),m=u(c=>c.usingAmplitude),w=u(c=>c.addingAmplitude),E=u(c=>100-c.usingAmplitude-c.addingAmplitude),C=[...m,...w,...E];let q=0;C.forEach(c=>{const[,p,T]=/^([0-9]+)\.([0-9]+)$/.exec(c.content);switch(p.length){case 3:break;case 2:{c.content=L.FIGURE_SPACE+c.content;break}case 1:{c.content=L.FIGURE_SPACE+L.FIGURE_SPACE+c.content;break}default:throw console.warn({beforeDecimalPoint:p,afterDecimalPoint:T,keyframe:c}),new Error("wtf")}q=Math.max(q,c.content.length)}),C.forEach(c=>{c.content=`'${(c.content+"%").padEnd(q+1,L.FIGURE_SPACE)}'`}),t.push(this.#o.animate(m,{pseudoElement:"::after",...b})),t.push(this.#i.animate(w,{pseudoElement:"::after",...b})),t.push(this.#r.animate(E,{pseudoElement:"::after",...b})),console.log("amplitude text",{keyframesUsing:m,keyframesAdding:w,keyframesAvailable:E})}}static update(s,i){this.#e.update(s,i)}}v.addEventListener("input",()=>{H.disabled=!1,_[0].code=v.value,N.selectedIndex=0});N.innerText="";_.forEach((o,s)=>{const i=document.createElement("option");i.innerText=o.name,N.appendChild(i),o.default&&(N.selectedIndex=s,v.value=o.code)});class K{static#e=A.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof lt?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${R.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function Et(o){try{return Z.parametric(o,rt)}catch(s){if(s instanceof Error){K.displayError(s);return}else throw s}}const R=[];class lt extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${R.length} input sliders currently exist.`),this.requestedIndex=s}}const Tt={input(o){if(!Number.isSafeInteger(o)||o<0)throw new RangeError(`invalid ${o}`);if(o>=R.length)throw new lt(o);return R[o]}},bt=A.getById("inputs",HTMLDivElement);function V(){H.disabled=!1;const o=R.length,s=.5,i=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${o})" />
      <code>support.input(${o})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;bt.insertAdjacentHTML("beforeend",i),R.push(s)}window.addMoreInputs=(o,s)=>{for(o.disabled=!0;R.length<s;)V()};I("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{V()});V();V();{const o=()=>{K.clear();const t=`"use strict";
`+v.value+`
return { x, y };`;let e;try{e=new Function("t /* A value between 0 and 1, inclusive. */","support",t)}catch(r){if(r instanceof SyntaxError){K.displayError(r);return}else throw r}const n=r=>{const f=e(r,Tt);if(!(Number.isFinite(f.x)&&Number.isFinite(f.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(f)} when t=${r}.`);return f},a=Et(n);a&&(xt.update(n,a),Ft.update(n,a))};let s=!1;const i=()=>{H.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,o()}))};H.addEventListener("click",i),window.copyNewInput=(t,e)=>{R[e]=t.valueAsNumber;const n=L.assertClass(t.parentElement?.lastElementChild,HTMLSpanElement);n.innerText=t.valueAsNumber.toFixed(5),i()};{const t=()=>{const e=_[N.selectedIndex];v.value=e.code,i()};N.addEventListener("change",t),A.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{N.selectedIndex=(N.selectedIndex+1)%_.length,t()})}i()}{const o=A.getById("hide-text",HTMLInputElement);o.addEventListener("click",()=>{o.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
