import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as b}from"./client-misc-ZHNZ3-cL.js";/* empty css              */import{P as J,Q as H}from"./path-shape-fljILaqi.js";import{b as F,s as ht,d as ft,m as pt}from"./utility-D9E8BDCl.js";import{m as S}from"./misc-wGF4FraP.js";import{l as mt}from"./math-to-path-BjxPr1Cw.js";var G,j;function Q(){if(j)return G;j=1;var a=function(e,n){return[e[0]+n[0],e[1]+n[1]]},s=function(e,n){return[e[0]-n[0],e[1]-n[1]]},o=function(e,n){return[e[0]*n[0]-e[1]*n[1],e[0]*n[1]+e[1]*n[0]]},t=function(e){return Math.sqrt(e[0]*e[0]+e[1]*e[1])};return G={add:a,subtract:s,multiply:o,magnitude:t},G}var U,z;function W(){if(z)return U;z=1;var a=Q(),s={},o=function(n,r){var i=-2*Math.PI*(n/r);return s[r]=s[r]||{},s[r][n]=s[r][n]||[Math.cos(i),Math.sin(i)],s[r][n]},t=function(n){var r=n.map(a.magnitude);return r.slice(0,r.length/2)},e=function(n,r){var i=r/n.length,u=n.slice(0,n.length/2);return u.map(function(l,m){return m*i})};return U={fftMag:t,fftFreq:e,exponent:o},U}var f={},tt;function gt(){if(tt)return f;tt=1;var a=32;f.INT_BITS=a,f.INT_MAX=2147483647,f.INT_MIN=-1<<a-1,f.sign=function(t){return(t>0)-(t<0)},f.abs=function(t){var e=t>>a-1;return(t^e)-e},f.min=function(t,e){return e^(t^e)&-(t<e)},f.max=function(t,e){return t^(t^e)&-(t<e)},f.isPow2=function(t){return!(t&t-1)&&!!t},f.log2=function(t){var e,n;return e=(t>65535)<<4,t>>>=e,n=(t>255)<<3,t>>>=n,e|=n,n=(t>15)<<2,t>>>=n,e|=n,n=(t>3)<<1,t>>>=n,e|=n,e|t>>1},f.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},f.popCount=function(t){return t=t-(t>>>1&1431655765),t=(t&858993459)+(t>>>2&858993459),(t+(t>>>4)&252645135)*16843009>>>24};function s(t){var e=32;return t&=-t,t&&e--,t&65535&&(e-=16),t&16711935&&(e-=8),t&252645135&&(e-=4),t&858993459&&(e-=2),t&1431655765&&(e-=1),e}f.countTrailingZeros=s,f.nextPow2=function(t){return t+=t===0,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},f.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},f.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var o=new Array(256);return function(t){for(var e=0;e<256;++e){var n=e,r=e,i=7;for(n>>>=1;n;n>>>=1)r<<=1,r|=n&1,--i;t[e]=r<<i&255}}(o),f.reverse=function(t){return o[t&255]<<24|o[t>>>8&255]<<16|o[t>>>16&255]<<8|o[t>>>24&255]},f.interleave2=function(t,e){return t&=65535,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e&=65535,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t|e<<1},f.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=(t|t>>>1)&858993459,t=(t|t>>>2)&252645135,t=(t|t>>>4)&16711935,t=(t|t>>>16)&65535,t<<16>>16},f.interleave3=function(t,e,n){return t&=1023,t=(t|t<<16)&4278190335,t=(t|t<<8)&251719695,t=(t|t<<4)&3272356035,t=(t|t<<2)&1227133513,e&=1023,e=(e|e<<16)&4278190335,e=(e|e<<8)&251719695,e=(e|e<<4)&3272356035,e=(e|e<<2)&1227133513,t|=e<<1,n&=1023,n=(n|n<<16)&4278190335,n=(n|n<<8)&251719695,n=(n|n<<4)&3272356035,n=(n|n<<2)&1227133513,t|n<<2},f.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=(t|t>>>2)&3272356035,t=(t|t>>>4)&251719695,t=(t|t>>>8)&4278190335,t=(t|t>>>16)&1023,t<<22>>22},f.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>s(t)+1},f}var $,et;function K(){if(et)return $;et=1;var a=Q(),s=W(),o=gt();return $={fft:function t(e){var n=[],r=e.length;if(r==1)return Array.isArray(e[0])?[[e[0][0],e[0][1]]]:[[e[0],0]];for(var i=t(e.filter(w)),u=t(e.filter(I)),l=0;l<r/2;l++){var m=i[l],g=a.multiply(s.exponent(l,r),u[l]);n[l]=a.add(m,g),n[l+r/2]=a.subtract(m,g)}function w(d,h){return h%2==0}function I(d,h){return h%2==1}return n},fftInPlace:function(t){for(var e=t.length,n=o.countTrailingZeros(e),r=0;r<e;r++){var i=o.reverse(r)>>>o.INT_BITS-n;if(i>r){var u=[t[r],0];t[r]=t[i],t[i]=u}else t[i]=[t[i],0]}for(var l=2;l<=e;l+=l)for(var m=0;m<l/2;m++)for(var g=s.exponent(m,l),w=0;w<e/l;w++){var I=a.multiply(g,t[w*l+m+l/2]);t[w*l+m+l/2]=a.subtract(t[w*l+m],I),t[w*l+m]=a.add(t[w*l+m],I)}}},$}var D,nt;function xt(){if(nt)return D;nt=1;var a=K().fft;return D={ifft:function(o){for(var t=[],e=0;e<o.length;e++)t[e]=[o[e][1],o[e][0]];for(var n=a(t),r=[],i=0;i<n.length;i++)r[i]=[n[i][1]/n.length,n[i][0]/n.length];return r}},D}var X,st;function it(){if(st)return X;st=1;var a=Q(),s=W(),o=function(t){for(var e=[],n=t.length,r=0;r<n;r++){e[r]=[0,0];for(var i=0;i<n;i++){var u=s.exponent(r*i,n),l;Array.isArray(t[i])?l=a.multiply(t[i],u):l=a.multiply([t[i],0],u),e[r]=a.add(e[r],l)}}return e};return X=o,X}var Y,rt;function Mt(){if(rt)return Y;rt=1;var a=it();function s(o){for(var t=[],e=0;e<o.length;e++)t[e]=[o[e][1],o[e][0]];for(var n=a(t),r=[],i=0;i<n.length;i++)r[i]=[n[i][1]/n.length,n[i][0]/n.length];return r}return Y=s,Y}var Z,at;function yt(){return at||(at=1,Z={fft:K().fft,ifft:xt().ifft,fftInPlace:K().fftInPlace,util:W(),dft:it(),idft:Mt()}),Z}var wt=yt();function Et(a,s=1024){if(Math.log2(s)%1!==0)throw new Error("numSamples must be a power of 2");const o=[];for(let n=0;n<s;n++){const r=n/s,i=a(r);o.push([i.x,i.y])}const t=wt.fft(o),e=[];for(let n=0;n<s;n++){const[r,i]=t[n],u=Math.sqrt(r*r+i*i)/s,l=Math.atan2(i,r),m=n<=s/2?n:n-s;e.push({frequency:m,amplitude:u,phase:l})}return e.sort((n,r)=>r.amplitude-n.amplitude),e}function Ft(a,s){return o=>{let t=0,e=0;for(let n=0;n<Math.min(s,a.length);n++){const{frequency:r,amplitude:i,phase:u}=a[n],l=2*Math.PI*r*o+u;t+=i*Math.cos(l),e+=i*Math.sin(l)}return{x:t,y:e}}}function Tt(a){let s=0;a.forEach(n=>s+=n.amplitude);const o=s/1e7,t=a.filter(n=>n.amplitude>o);let e=0;return t.forEach(n=>e+=n.amplitude),t}const ct=200,k=b.getById("go",HTMLButtonElement),B=b.getById("source",HTMLTextAreaElement),q=b.getById("sampleCode",HTMLSelectElement),O=[{name:"Custom",code:""},{name:"Polygons and Stars",code:`const numberOfPoints = 5;
const skip = 1;
const rotate = 2 * Math.PI / numberOfPoints * (1 + skip);

const corners = [];
for (let i = 0; i < numberOfPoints; i++) {
  const θ = i * rotate;
  corners.push({x: Math.cos(θ), y: Math.sin(θ)});
}
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
return {x, y};}`}];function lt(a,s){const o=a.getBBox(),t=s.viewBox.baseVal;t.x=o.x,t.y=o.y,t.width=o.width,t.height=o.height;const e=o.width/o.height,n=300,r=n*e;s.style.height=n+"px",s.style.width=r+"px";const i=Math.max(t.width,t.height)/100;return s.style.setProperty("--recommended-stroke-width",i.toString()),{recommendedStrokeWidth:i}}class bt{static#e=new this;#n=b.getById("distanceVsT",SVGSVGElement);#t=F("circle[data-distance]",SVGCircleElement,this.#n);#r=F("path",SVGPathElement,this.#n);#s=F("circle[data-t]",SVGCircleElement);constructor(){new b.AnimationLoop(s=>{if(this.#t.style.display="none",this.#s.style.display="none",this.f){s%=5e3;const t=s/5e3,e=t*100;this.#t.style.offsetDistance=e+"%",this.#t.style.display="";const{x:n,y:r}=this.f(t);this.#s.cx.baseVal.value=n,this.#s.cy.baseVal.value=r,this.#s.style.display=""}})}f;update(s,o){this.#r.setAttribute("d",o.rawPath),lt(this.#r,this.#n),this.f=s,this.#t.style.offsetPath=o.cssPath}static update(s,o){this.#e.update(s,o)}}class It{static#e=new this;#n=b.getById("requestedVsReconstructed",SVGSVGElement);#t;#r;#s=F("[data-using] [data-circles]",HTMLTableCellElement);#a=F("[data-using] [data-amplitude]",HTMLTableCellElement);#l=F("[data-adding] [data-circles]",HTMLTableCellElement);#o=F("[data-adding] [data-amplitude]",HTMLTableCellElement);#u=F("[data-available] [data-circles]",HTMLTableCellElement);#i=F("[data-available] [data-amplitude]",HTMLTableCellElement);constructor(){[this.#t,this.#r]=ht("path",SVGPathElement,2,2,this.#n)}#c;update(s,o){this.#c?.();const t=[];this.#c=()=>{t.forEach(d=>d.cancel())},this.#t.setAttribute("d",o.rawPath),lt(this.#t,this.#n);const e=Et(s),n=Tt(e);window.nonZeroTerms=n,window.originalTerms=e;let r=0;n.forEach(d=>r+=d.amplitude);const i=10;let u=0;const l=750,m=500,g=n.slice(0,i-1).flatMap((d,h)=>{const M=d.amplitude/r*100,x={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:h,usingAmplitude:u,addingCircles:1,addingAmplitude:M};u+=M;const E={offset:NaN,startTime:NaN,endTime:NaN,usingCircles:h+1,usingAmplitude:u,addingCircles:0,addingAmplitude:0};return h==0?[E]:[x,E]});{const d=g.at(-1),h=n.length-d.usingCircles;h>0&&g.push({offset:NaN,startTime:NaN,endTime:NaN,usingCircles:d.usingCircles,usingAmplitude:d.usingAmplitude,addingCircles:h,addingAmplitude:100-d.usingAmplitude},{offset:NaN,startTime:NaN,endTime:NaN,usingCircles:n.length,usingAmplitude:100,addingCircles:0,addingAmplitude:0})}let w=NaN;{let d=0;g.forEach(x=>{const E=x.addingCircles?m:l,A=d+E;x.startTime=d,x.endTime=A,d=A}),g.forEach(x=>{x.offset=x.startTime/d}),w=50/d;const M={...g.at(-1),startTime:d,offset:1};g.push(M)}const I={duration:g.at(-1).endTime*3,iterations:1/0};{let d=-1/0,h="";const M=g.map(({offset:x,usingCircles:E})=>{if(E!=d){let A=function(c){if(c.commands.length<2)throw new Error("wtf");const[p,...T]=c.commands,y=T.pop();if(!(p instanceof H&&y instanceof H))throw new Error("wtf");if(p.x0==y.x&&p.y0==y.y)return c;const P=(p.x0+y.x)/2,L=(p.y0+y.y)/2,v=H.controlPoints(P,L,p.x1,p.y1,p.x,p.y),dt=H.controlPoints(y.x0,y.y0,y.x1,y.y1,P,L);return new J([v,...T,dt])};const C=Ft(n,E),R=J.parametric(C,ct);h=A(R).cssPath,d=E}return{offset:x,d:h,easing:"ease-in-out"}});t.push(this.#r.animate(M,I))}{const d=(h,M,x)=>{const E=c=>`'${c.toString().padStart(4,S.FIGURE_SPACE)}'`;let A;const C=new Array;x.forEach(({offset:c,circles:p})=>{A!==void 0&&C.push({offset:c,content:A});const T=A=E(p);C.push({offset:c,content:T})}),t.push(h.animate(C,{pseudoElement:"::after",...I}));const R=x.flatMap(({offset:c,circles:p},T,y)=>{function P(v=p){return v==0?.25:1}if(c==0||c==1)return[{offset:c,opacity:P()}];const L=y[T-1].circles;return L==p?[]:[{offset:c-w,opacity:P(L)},{offset:c,opacity:0},{offset:c+w,opacity:P()}]});[h,M].forEach(c=>t.push(c.animate(R,I)))};d(this.#s,this.#a,g.map(({offset:h,usingCircles:M})=>({offset:h,circles:M}))),d(this.#l,this.#o,g.map(({offset:h,addingCircles:M})=>({offset:h,circles:M}))),d(this.#u,this.#i,g.map(({offset:h,usingCircles:M,addingCircles:x})=>({offset:h,circles:n.length-M-x})))}{let d=function(c){let p;const T=new Array;return g.forEach(y=>{const{offset:P}=y,L=c(y);p!==void 0&&T.push({offset:P,content:p});const v=p=M(L);T.push({offset:P,content:v})}),T};const h=new Intl.NumberFormat("en-US",{minimumSignificantDigits:5,maximumSignificantDigits:5,useGrouping:!1}).format,M=c=>(c<0&&(c=0),h(c)),x=d(c=>c.usingAmplitude),E=d(c=>c.addingAmplitude),A=d(c=>100-c.usingAmplitude-c.addingAmplitude),C=[...x,...E,...A];let R=0;C.forEach(c=>{const[,p,T]=/^([0-9]+)\.([0-9]+)$/.exec(c.content);switch(p.length){case 3:break;case 2:{c.content=S.FIGURE_SPACE+c.content;break}case 1:{c.content=S.FIGURE_SPACE+S.FIGURE_SPACE+c.content;break}default:throw console.warn({beforeDecimalPoint:p,afterDecimalPoint:T,keyframe:c}),new Error("wtf")}R=Math.max(R,c.content.length)}),C.forEach(c=>{c.content=`'${(c.content+"%").padEnd(R+1,S.FIGURE_SPACE)}'`}),t.push(this.#a.animate(x,{pseudoElement:"::after",...I})),t.push(this.#o.animate(E,{pseudoElement:"::after",...I})),t.push(this.#i.animate(A,{pseudoElement:"::after",...I}))}}static update(s,o){this.#e.update(s,o)}}B.addEventListener("input",()=>{k.disabled=!1,O[0].code=B.value,q.selectedIndex=0});q.innerText="";O.forEach((a,s)=>{const o=document.createElement("option");o.innerText=a.name,q.appendChild(o),a.default&&(q.selectedIndex=s,B.value=a.code)});class _{static#e=b.getById("error",HTMLDivElement);static display(s){this.#e.innerText=s}static displayError(s){s instanceof ut?this.#e.innerHTML=`Unable to access <code>support.input(${s.requestedIndex})</code>.  Only ${N.length} input sliders currently exist.  <button onclick="addMoreInputs(this,${s.requestedIndex+1})">Add More</button>`:this.display(s.message)}static clear(){this.display("")}}function At(a){try{return J.parametric(a,ct)}catch(s){if(s instanceof Error){_.displayError(s);return}else throw s}}const N=[];class ut extends Error{constructor(s){super(`Unable to access support.input(${s}).  Only ${N.length} input sliders currently exist.`),this.requestedIndex=s}}const ot={input(a){if(!Number.isSafeInteger(a)||a<0)throw new RangeError(`invalid ${a}`);if(a>=N.length)throw new ut(a);return N[a]},ease(a){return(1-Math.cos(Math.PI*a))/2},makeTSplitter:pt,makeTSplitterA:ft,lerpPoints:mt,lerp:S.lerp,makeLinear:S.makeLinear},Pt=b.getById("inputs",HTMLDivElement);function V(){k.disabled=!1;const a=N.length,s=.5,o=`<div class="has-slider">
      <input type="range" min="0" max="1" value="${s}" step="0.00001" oninput="copyNewInput(this, ${a})" />
      <code>support.input(${a})</code> =
      <span>${s.toString().padEnd(7,"0")}</span>
    </div>`;Pt.insertAdjacentHTML("beforeend",o),N.push(s)}window.addMoreInputs=(a,s)=>{for(a.disabled=!0;N.length<s;)V()};F("#inputsGroup button",HTMLButtonElement).addEventListener("click",()=>{V()});V();V();{const a=()=>{_.clear();const t=`"use strict";
`+B.value+`
return f;`;let e;try{e=new Function("support",t)}catch(u){if(u instanceof SyntaxError){_.displayError(u);return}else throw u}let n;try{n=e(ot)}catch(u){if(u instanceof Error){_.displayError(u);return}else throw u}const r=u=>{const l=n(u,ot);if(!(Number.isFinite(l.x)&&Number.isFinite(l.y)))throw new Error(`Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(l)} when t=${u}.`);return l},i=At(r);i&&(bt.update(r,i),It.update(r,i))};let s=!1;const o=()=>{k.disabled=!0,s||(s=!0,requestAnimationFrame(()=>{s=!1,a()}))};k.addEventListener("click",o),window.copyNewInput=(t,e)=>{N[e]=t.valueAsNumber;const n=S.assertClass(t.parentElement?.lastElementChild,HTMLSpanElement);n.innerText=t.valueAsNumber.toFixed(5),o()};{const t=()=>{const e=O[q.selectedIndex];B.value=e.code,o()};q.addEventListener("change",t),b.getById("nextSample",HTMLButtonElement).addEventListener("click",()=>{q.selectedIndex=(q.selectedIndex+1)%O.length,t()})}{const t=b.getById("codeSamplesHolder",HTMLDivElement),e=b.getById("inputsGroup",HTMLDivElement),n=`<div>
            <div data-description>
              <button class="show-this">Show This</button><span></span>
            </div>
            <pre data-code-snippet></pre></div>`;O.forEach((r,i)=>{if(i>0){t.insertAdjacentHTML("beforeend",n);const u=t.lastElementChild,l=F("span",HTMLSpanElement,u);l.innerText=r.name;const m=F("pre",HTMLPreElement,u);m.innerText=r.code,F("button",HTMLButtonElement,u).addEventListener("click",()=>{B.value=r.code,o(),e.scrollIntoView({behavior:"smooth"})})}})}o()}{const a=b.getById("hide-text",HTMLInputElement);a.addEventListener("click",()=>{a.checked?document.documentElement.dataset.hide="requested":delete document.documentElement.dataset.hide})}
