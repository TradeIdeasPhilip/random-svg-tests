import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as b}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as J,Q as _}from"./path-shape-fljILaqi.js";import{b as I,s as ht,d as ft,m as pt}from"./utility-D9E8BDCl.js";import{m as q}from"./misc-wGF4FraP.js";import{l as mt}from"./math-to-path-BjxPr1Cw.js";var k,j;function Q(){if(j)return k;j=1;var a=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},o=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return k={add:a,subtract:s,multiply:o,magnitude:t},k}var G,z;function W(){if(z)return G;z=1;var a=Q(),s={},o=function(n,r){var i=-2*Math.PI*(n/r);return s[r]=s[r]||{},s[r][n]=s[r][n]||[Math.cos(i),Math.sin(i)],s[r][n]},t=function(n){var r=n.map(a.magnitude);return r.slice(0,r.length/2)},e=function(n,r){var i=r/n.length,d=n.slice(0,n.length/2);return d.map(function(l,x){return x*i})};return G={fftMag:t,fftFreq:e,exponent:o},G}var f={},tt;function gt(){if(tt)return f;tt=1;var a=32;f.INT_BITS=a,f.INT_MAX=2147483647,f.INT_MIN=-1<<a-1,f.sign=function(t){return(t>0)-(t<0)},f.abs=function(t){var e=t>>a-1;return(t^e)-e},f.min=function(t,e){return e^(t^e)&-(t<e)},f.max=function(t,e){return t^(t^e)&-(t<e)},f.isPow2=function(t){return!(t&t-1)&&!!t},f.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},f.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},f.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}f.countTrailingZeros=s,f.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},f.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},f.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var o=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,r=e,i=7;for(n>>>=1;n;n>>>=1)r<<=1,r|=n&1,--i;t[e]=r<<i&255}}(o),f.reverse=function(t){return o[t&255]<<24|o[t>>>8&255]<<16|o[t>>>16&255]<<8|o[t>>>24&255]},f.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},f.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},f.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},f.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},f.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},f}var $,et;function K(){if(et)return $;et=1;var a=Q(),s=W(),o=gt();return $={fft:function t(e){var n=[],r=e.length;if(r==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var i=t(e.filter(F)),d=t(e.filter(A)),l=0;l<r/2;l++){var x=i[l],g=a.multiply(s.exponent(l,r),d[l]);n[l]=a.add(x,g),n[l+r/2]=a.subtract(x,g)}function F(u,h){return h%2==0}function A(u,h){return h%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=o.countTrailingZeros(e),r=0;r<e;r++){var i=o.reverse(r)>>>o.INT_BITS-n;if(i>r){var d=[t[r],0];t[r]=t[i],t[i]=d}else t[i]=[t[i],0]}for(var l=2;l<=e;l+=l)for(var x=0;x<l/2;x++)for(var g=s.exponent(x,l),F=0;F<e/l;F++){var A=a.multiply(g,t[F*l+x+l/2]);t[F*l+x+l/2]=a.subtract(t[F*l+x],A),t[F*l+x]=a.add(t[F*l+x],A)}}},$}var X,nt;function xt(){if(nt)return X;nt=1;var a=K().fft;return X={ifft:function(o){for(var t=[],e=0;e<o.length;e++)t[e]=[o[e][1],o[e][0]];for(var n=a(t),r=[],i=0;i<n.length;i++)r[i]=[n[i][1]/n.length,n[i][0]/n.length];return r}},X}var D,st;function it(){if(st)return D;st=1;var a=Q(),s=W(),o=function(t){for(var e=[],n=t.length,r=0;r<n;r++){e[r]=[0,0];for(var i=0;i<n;i++){var d=s.exponent(r*i,n),l;Array.isArray(t[i])?l=a.multiply(t[i],d):l=a.multiply([t[i],0],d),e[r]=a.add(e[r],l)}}return e};return D=o,D}var Y,at;function yt(){if(at)return Y;at=1;var a=it();function s(o){for(var t=[],e=0;e<o.length;e++)t[e]=[o[e][1],o[e][0]];for(var n=a(t),r=[],i=0;i<n.length;i++)r[i]=[n[i][1]/n.length,n[i][0]/n.length];return r}return Y=s,Y}var Z,rt;function Mt(){return rt||(rt=1,Z={fft:K().fft,ifft:xt().ifft,fftInPlace:K().fftInPlace,util:W(),dft:it(),idft:yt()}),Z}var wt=Mt();function Ft(a,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const o=[];for(let n=0;n<s;n++){const r=n/s,i=a(r);o.push([i.x,i.y])}const t=wt.fft(o),e=[];for(let n=0;n<s;n++){const[r,i]=t[n],d=Math.sqrt(r*r+i*i)/s,l=Math.atan2(i,r),x=n<=s/2?n:n-s;e.push({frequency:x,amplitude:d,phase:l})}return e.sort((n,r)=>r.amplitude-n.amplitude),e}function Et(a,s){return o=>{let t=0,e=0;for(let n=0;n<Math.min(s,a.length);n++){const{frequency:r,amplitude:i,phase:d}=a[n],l=2*Math.PI*r*o+d;t+=i*Math.cos(l),e+=i*Math.sin(l)}return{x:t,y:e}}}function Tt(a){let s=0;a.forEach(n=>s+=n.amplitude);const o=s/1e7,t=a.filter(n=>n.amplitude>o);let e=0;return t.forEach(n=>e+=n.amplitude),t}const ct=200,H=b.getById("go",HTMLButtonElement),O=b.getById("source",HTMLTextAreaElement),N=b.getById("sampleCode",HTMLSelectElement),V=[{name:"Custom",code:""},{name:"Square",default:!0,code:`const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], segment.t);
}`},{name:"Square with Easing",code:`const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], support.ease(segment.t));
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
return {x, y};}`}];function lt(a,s){const o=a.getBBox(),t=s.viewBox.baseVal;t.x=o.x,t.y=o.y,t.width=o.width,t.height=o.height;const e=o.width/o.height,n=300,r=n*e;s.style.height=n+"px",s.style.width=r+"px";const i=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",i.toString()),{recommendedStrokeWidth:i}}class At{static#e=new this;#n=b.getById("distanceVsT",SVGSVGElement);#t=I("circle[data-distance]",SVGCircleElement,this.#n);#a=I("path",SVGPathElement,this.#n);#s=I("circle[data-t]",SVGCircleElement);constructor(){new b.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:r}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=r,this.#s.style.display=""}})}f;update(s,o){this.#a.setAttribute("d",o.rawPath),lt(this.#a,this.#n),this.f=s,this.#t.style.offsetPath=o.cssPath}static update(s,o){this.#e.update(s,o)}}class It{static#e=new this;#n=b.getById("requestedVsReconstructed",SVGSVGElement);#t;#a;#s=I("[data-using] [data-circles]",HTMLTableCellElement);#r=I("[data-using] [data-amplitude]",HTMLTableCellElement);#l=I("[data-adding] [data-circles]",HTMLTableCellElement);#o=I("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=I("[data-available] [data-circles]",HTMLTableCellElement);#i=I("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#a]=ht("path",SVGPathElement,2,2,this.#n)}#c;update(s,o){this.#c?.();const t=[];this.#c=()=>{t.forEach(u=>u.cancel())},this.#t.setAttribute("d",o.rawPath),lt(this.#t,this.#n);const e=Ft(s),n=Tt(e);window.nonZeroTerms=n,window.originalTerms=e;let r=0;n.forEach(u=>r+=u.amplitude);const i=10;let d=0;const l=750,x=500,g=n.slice(0,i-1).flatMap((u,h)=>{const y=u.amplitude/r*100,m={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:h,usingAmplitude:d,addingCircles:1,addingAmplitude:y};d+=y;const M={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:h+1,usingAmplitude:d,addingCircles:0,addingAmplitude:0};return h==0?[M]:[m,M]});{const u=g.at(-1),h=n.length-u.usingCircles;h>0&&g.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:u.usingCircles,usingAmplitude:u.usingAmplitude,addingCircles:h,addingAmplitude:100-u.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}let F=NaN;{let u=0;g.forEach(m=>{const M=m.addingCircles?x:l,E=u+M;m.startTime=u,m.endTime=E,u=E}),g.forEach(m=>{m.offset=m.startTime/u}),F=50/u;const y={...g.at(-1),startTime:u,offset:1};g.push(y)}console.log("script",g);const A={duration:g.at(-1).endTime*3,iterations:1/0};{let u=-1/0,h="";const y=g.map(({offset:m,usingCircles:M})=>{if(M!=u){let E=function(c){if(c.commands.length<2)throw new Error("wtf");const[p,...T]=c.commands,w=T.pop();if(!(p instanceof _&&w instanceof _))throw new Error("wtf");if(p.x0==w.x&&p.y0==w.y)return c;const P=(p.x0+w.x)/2,L=(p.y0+w.y)/2,B=_.controlPoints(P,L,p.x1,p.y1,p.x,p.y),dt=_.controlPoints(w.x0,w.y0,w.x1,w.y1,P,L);return new J([B,...T,dt])};const C=Et(n,M),S=J.parametric(C,ct);h=E(S).cssPath,u=M}return{offset:m,d:h,easing:"ease-in-out"}});t.push(this.#a.animate(y,A)),console.log("d",y)}{const u=(h,y,m)=>{const M=c=>`'${c.toString().padStart(4,q.FIGURE_SPACE)}'`;let E;const C=new Array;m.forEach(({offset:c,circles:p})=>{E!==void 0&&C.push({offset:c,content:E});const T=E=M(p);C.push({offset:c,content:T})}),console.log("circles text",C),t.push(h.animate(C,{pseudoElement:"::after",...A}));const S=m.flatMap(({offset:c,circles:p},T,w)=>{function P(B=p){return B==0?.25:1}if(c==0||c==1)return[{offset:c,opacity:P()}];const L=w[T-1].circles;return L==p?[]:[{offset:c-F,opacity:P(L)},{offset:c,opacity:0},{offset:c+F,opacity:P()}]});[h,y].forEach(c=>t.push(c.animate(S,A))),console.log("opacity",S)};u(this.#s,this.#r,g.map(({offset:h,usingCircles:y})=>({offset:h,circles:y}))),u(this.#l,this.#o,g.map(({offset:h,addingCircles:y})=>({offset:h,circles:y}))),u(this.#u,this.#i,g.map(({offset:h,usingCircles:y,addingCircles:m})=>({offset:h,circles:n.length-y-m})))}{let u=function(c){let p;const T=new Array;return g.forEach(w=>{const{offset:P}=w,L=c(w);p!==void 0&&T.push({offset:P,content:p});const B=p=y(L);T.push({offset:P,content:B})}),T};const h=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,y=c=>(c<0&&(c=0),h(c)),m=u(c=>c.usingAmplitude),M=u(c=>c.addingAmplitude),E=u(c=>100-c.usingAmplitude-c.addingAmplitude),C=[...m,...M,...E];let S=0;C.forEach(c=>{const[,p,T]=/^([0-9]+)\.([0-9]+)$/.exec(c.content);switch(p.length){case 3:break;case 2:{c.content=q.FIGURE_SPACE+c.content;break}case 1:{c.content=q.FIGURE_SPACE+q.FIGURE_SPACE+c.content;break}default:throw console.warn({beforeDecimalPoint:p,afterDecimalPoint:T,keyframe:c}),new Error("wtf")}S=Math.max(S,c.content.length)}),C.forEach(c=>{c.content=`'${(c.content+"%").padEnd(S+1,q.FIGURE_SPACE)}'`}),t.push(this.#r.animate(m,{pseudoElement:"::after",...A})),t.push(this.#o.animate(M,{pseudoElement:"::after",...A})),t.push(this.#i.animate(E,{pseudoElement:"::after",...A})),console.log("amplitude text",{keyframesUsing:m,keyframesAdding:M,keyframesAvailable:E})}}static update(s,o){this.#e.update(s,o)}}O.addEventListener("input",()=>{H.disabled=!1,V[0].code=O.value,N.selectedIndex=0});N.innerText="";V.forEach((a,s)=>{const o=document.createElement("option");o.innerText=a.name,N.appendChild(o),a.default&&(N.selectedIndex=s,O.value=a.code)});class v{static#e=b.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof ut?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${R.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function bt(a){try{return J.parametric(a,ct)}catch(s){if(s instanceof Error){v.displayError(s);return}else throw s}}const R=[];class ut extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${R.length} input sliders currently exist.`),this.requestedIndex=s}}const ot={input(a){if(!Number.isSafeInteger(a)||a<0)throw new RangeError(`invalid ${a}`);if(a>=R.length)throw new ut(a);return R[a]},ease(a){return(1-Math.cos(Math.PI*a))/2},makeTSplitter:pt,makeTSplitterA:ft,lerpPoints:mt,lerp:q.lerp,makeLinear:q.makeLinear},Ct=b.getById("inputs",HTMLDivElement);function U(){H.disabled=!1;const a=R.length,s=.5,o=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${a})" />
      <code>support.input(${a})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;Ct.insertAdjacentHTML("beforeend",o),R.push(s)}window.addMoreInputs=(a,s)=>{for(a.disabled=!0;R.length<s;)U()};I("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{U()});U();U();{const a=()=>{v.clear();const t=`"use strict";
`+O.value+`
return f;`;let e;try{e=new Function("support",t)}catch(d){if(d instanceof SyntaxError){v.displayError(d);return}else throw d}let n;try{n=e(ot)}catch(d){if(d instanceof Error){v.displayError(d);return}else throw d}const r=d=>{const l=n(d,ot);if(!(Number.isFinite(l.x)&&Number.isFinite(l.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(l)} when t=${d}.`);return l},i=bt(r);i&&(At.update(r,i),It.update(r,i))};let s=!1;const o=()=>{H.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,a()}))};H.addEventListener("click",o),window.copyNewInput=(t,e)=>{R[e]=t.valueAsNumber;const n=q.assertClass(t.parentElement?.lastElementChild,HTMLSpanElement);n.innerText=t.valueAsNumber.toFixed(5),o()};{const t=()=>{const e=V[N.selectedIndex];O.value=e.code,o()};N.addEventListener("change",t),b.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{N.selectedIndex=(N.selectedIndex+1)%V.length,t()})}o()}{const a=b.getById("hide-text",HTMLInputElement);a.addEventListener("click",()=>{a.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
