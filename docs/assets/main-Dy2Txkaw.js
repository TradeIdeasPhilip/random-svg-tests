(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();var o={};Object.defineProperty(o,"__esModule",{value:!0});o.permutations=o.polarToRectangular=o.makeBoundedLinear=M=o.makeLinear=o.sum=o.countMap=k=o.initializedArray=o.count=o.zip=o.FIGURE_SPACE=o.NON_BREAKING_SPACE=o.dateIsValid=o.MIN_DATE=o.MAX_DATE=o.makePromise=o.filterMap=$=o.pick=o.pickAny=o.csvStringToArray=o.parseTimeT=o.parseIntX=o.parseFloatX=o.getAttribute=o.followPath=o.parseXml=o.testXml=I=o.sleep=O=o.assertClass=void 0;function j(r,e,t="Assertion Failed."){const n=i=>{throw new Error(`${t}  Expected type:  ${e.name}.  Found type:  ${i}.`)};if(r===null)n("null");else if(typeof r!="object")n(typeof r);else if(!(r instanceof e))n(r.constructor.name);else return r;throw new Error("wtf")}var O=o.assertClass=j;function V(r){return new Promise(e=>setTimeout(e,r))}var I=o.sleep=V;function P(r){const t=new DOMParser().parseFromString(r,"application/xml");for(const n of Array.from(t.querySelectorAll("parsererror")))if(n instanceof HTMLElement)return{error:n};return{parsed:t}}o.testXml=P;function J(r){if(r!==void 0)return P(r)?.parsed?.documentElement}o.parseXml=J;function D(r,...e){for(const t of e){if(r===void 0)return;if(typeof t=="number")r=r.children[t];else{const n=r.getElementsByTagName(t);if(n.length!=1)return;r=n[0]}}return r}o.followPath=D;function W(r,e,...t){if(e=D(e,...t),e!==void 0&&e.hasAttribute(r))return e.getAttribute(r)??void 0}o.getAttribute=W;function H(r){if(r==null)return;const e=parseFloat(r);if(isFinite(e))return e}o.parseFloatX=H;function X(r){const e=H(r);if(e!==void 0)return e>Number.MAX_SAFE_INTEGER||e<Number.MIN_SAFE_INTEGER||e!=Math.floor(e)?void 0:e}o.parseIntX=X;function Z(r){if(typeof r=="string"&&(r=X(r)),r!=null&&!(r<=0))return new Date(r*1e3)}o.parseTimeT=Z;const K=r=>{const e=/(,|\r?\n|\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^,\r\n]*))/gi,t=[[]];let n;for(;n=e.exec(r);)n[1].length&&n[1]!==","&&t.push([]),t[t.length-1].push(n[2]!==void 0?n[2].replace(/""/g,'"'):n[3]);return t};o.csvStringToArray=K;function Y(r){const e=r.values().next();if(!e.done)return e.value}o.pickAny=Y;function Q(r){return r[Math.random()*r.length|0]}var $=o.pick=Q;function ee(r,e){const t=[];return r.forEach((n,i)=>{const s=e(n,i);s!==void 0&&t.push(s)}),t}o.filterMap=ee;function te(){let r,e;return{promise:new Promise((n,i)=>{r=n,e=i}),resolve:r,reject:e}}o.makePromise=te;o.MAX_DATE=new Date(864e13);o.MIN_DATE=new Date(-864e13);function ne(r){return isFinite(r.getTime())}o.dateIsValid=ne;o.NON_BREAKING_SPACE=" ";o.FIGURE_SPACE=" ";function*re(...r){const e=r.map(t=>t[Symbol.iterator]());for(;;){const t=e.map(n=>n.next());if(t.some(({done:n})=>n))break;yield t.map(({value:n})=>n)}}o.zip=re;function*ie(r=0,e=1/0,t=1){for(let n=r;n<e;n+=t)yield n}o.count=ie;function U(r,e){const t=[];for(let n=0;n<r;n++)t.push(e(n));return t}var k=o.initializedArray=U;o.countMap=U;function oe(r){return r.reduce((e,t)=>e+t,0)}o.sum=oe;function se(r,e,t,n){const i=(n-e)/(t-r);return function(s){return(s-r)*i+e}}var M=o.makeLinear=se;function ae(r,e,t,n){t<r&&([r,e,t,n]=[t,n,r,e]);const i=(n-e)/(t-r);return function(s){return s<=r?e:s>=t?n:(s-r)*i+e}}o.makeBoundedLinear=ae;function ce(r,e){return{x:Math.sin(e)*r,y:Math.cos(e)*r}}o.polarToRectangular=ce;function*_(r,e=[]){if(r.length==0)yield e;else for(let t=0;t<r.length;t++){const n=r[t],i=[...e,n],s=[...r.slice(0,t),...r.slice(t+1)];yield*_(s,i)}}o.permutations=_;var f={};Object.defineProperty(f,"__esModule",{value:!0});f.download=f.createElementFromHTML=f.getHashInfo=f.getAudioBalanceControl=f.getBlobFromCanvas=f.loadDateTimeLocal=E=f.getById=void 0;const z=o;function le(r,e){const t=document.getElementById(r);if(!t)throw new Error("Could not find element with id "+r+".  Expected type:  "+e.name);if(t instanceof e)return t;throw new Error("Element with id "+r+" has type "+t.constructor.name+".  Expected type:  "+e.name)}var E=f.getById=le;function ue(r,e,t="milliseconds"){let n;switch(t){case"minutes":{n=e.getSeconds()*1e3+e.getMilliseconds();break}case"seconds":{n=e.getMilliseconds();break}case"milliseconds":{n=0;break}default:throw new Error("wtf")}r.valueAsNumber=+e-e.getTimezoneOffset()*6e4-n}f.loadDateTimeLocal=ue;function de(r){const{reject:e,resolve:t,promise:n}=(0,z.makePromise)();return r.toBlob(i=>{i?t(i):e(new Error("blob is null!"))}),n}f.getBlobFromCanvas=de;function he(r){const e=new AudioContext,t=e.createMediaElementSource(r),n=new StereoPannerNode(e,{pan:0});return t.connect(n).connect(e.destination),i=>{n.pan.value=i}}f.getAudioBalanceControl=he;function fe(){const r=new Map;return/^#?(.*)$/.exec(location.hash.replace("+","%20"))[1].split("&").forEach(n=>{const i=n.split("=",2);if(i.length==2){const s=decodeURIComponent(i[0]),a=decodeURIComponent(i[1]);r.set(s,a)}}),r}f.getHashInfo=fe;function pe(r,e){var t=document.createElement("div");return t.innerHTML=r.trim(),(0,z.assertClass)(t.firstChild,e,"createElementFromHTML:")}f.createElementFromHTML=pe;function me(r,e){var t=document.createElement("a");if(t.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(e)),t.setAttribute("download",r),document.createEvent){var n=document.createEvent("MouseEvents");n.initEvent("click",!0,!0),t.dispatchEvent(n)}else t.click()}f.download=me;class R{constructor(e){this.onWake=e,this.callback=this.callback.bind(this),this.callback(performance.now())}#e=!1;cancel(){this.#e=!0}callback(e){this.#e||(requestAnimationFrame(this.callback),this.onWake(e))}}function L(r,e){return{x:Math.cos(e)*r,y:Math.sin(e)*r}}const N=(1+Math.sqrt(5))/2;function ge(r){return isNaN(r.getTime())?"0000⸱00⸱00 00⦂00⦂00":`${r.getFullYear().toString().padStart(4,"0")}⸱${(r.getMonth()+1).toString().padStart(2,"0")}⸱${r.getDate().toString().padStart(2,"0")} ${r.getHours().toString().padStart(2,"0")}⦂${r.getMinutes().toString().padStart(2,"0")}⦂${r.getSeconds().toString().padStart(2,"0")}`}class u{constructor(e,t){this.x=e,this.y=t}equals(e){return this.x==e.x&&this.y==e.y}distanceTo(e){return Math.hypot(this.x-e.x,this.y-e.y)}extendPast(e,t,n=1/0){const i=Math.atan2(e.y-this.y,e.x-this.x),s=this.distanceTo(e),a=Math.min(s*t,n),l=L(a,i);return new u(this.x+l.x,this.y+l.y)}static ZERO=new u(0,0);static CENTER=new u(.5,.5);static random(e=0){function t(){return e+Math.random()*(1-2*e)}return new this(t(),t())}static fromJSON(e){try{const t=e.x,n=e.y;return typeof t!="number"||typeof n!="number"?void 0:new this(t,n)}catch{return}}}class d extends Object{overlaps(e){const t=this.center.distanceTo(e.center);return t<this.radius||t<e.radius}static overlapping(e){const t=[];return e.forEach((n,i)=>{for(var s=0;s<i;s++){const a=e[s];a.overlaps(n)&&t.push([a,n])}}),t}static allAttached(){const e=new Set;return document.querySelectorAll("circle").forEach(t=>{const n=this.for(t);n&&e.add(n)}),e}static removeAll(){[...d.allAttached()].forEach(e=>e.attached=!1)}configure({attached:e,center:t,color:n,radius:i}){return e!==void 0&&(this.attached=e),t!==void 0&&(this.center=t),n!==void 0&&(this.color=n),i!==void 0&&(this.radius=i),this}static parent=E("circle-parent",SVGElement);#e=document.createElementNS("http://www.w3.org/2000/svg","circle");#t=document.createElementNS("http://www.w3.org/2000/svg","circle");#n=[this.#e,this.#t];get elements(){return this.#n}#r=Math.random()*(1/8)+1/16;#i=$(["red","orange","yellow","green","blue","indigo","violet"]);#o=u.random(this.#r);constructor(){super(),this.#e.classList.add("simple"),this.#t.classList.add("sphere"),this.radius=this.#r,this.color=this.#i,this.center=this.#o,this.attached=!0,this.#n.forEach(e=>d.#a.set(e,this))}#s=!1;get attached(){return this.#s}set attached(e){e!=this.#s&&(this.#n.forEach(t=>{e?d.parent.appendChild(t):t.remove()}),this.#s=e)}sendToBack(){return this.attached=!0,this.elements.toReversed().forEach(e=>d.parent.insertBefore(e,d.parent.firstChild)),this}get center(){return this.#o}set center(e){this.#o=e,this.#n.forEach(t=>{t.cx.baseVal.value=e.x,t.cy.baseVal.value=e.y})}get radius(){return this.#r}set radius(e){this.#r=e,this.#n.forEach(t=>{t.r.baseVal.value=e})}get volume(){return Math.pow(this.radius,3)}set volume(e){this.radius=Math.pow(e,1/3)}get color(){return this.#i}set color(e){this.#i=e,this.#e.style.fill=this.#i}toJSON(){const{center:e,radius:t,color:n,attached:i}=this;return{center:e,radius:t,color:n,attached:i}}static fromJSON(e){try{const t=u.fromJSON(e.center);if(!t)return;const n=e.color;if(typeof n!="string")return;const i=e.radius;if(typeof i!="number")return;const s=e.attached;if(typeof s!="boolean")return;const a=new this;return a.center=t,a.color=n,a.radius=i,a.attached=s,a}catch{return}}toString(){return`<center cx="${this.center.x}" cy="${this.center.y}" r="${this.radius}" fill=${JSON.stringify(this.color)} \\>`}static#a=new WeakMap;static for(e){return this.#a.get(e)}}class q{#e;onAnimationFrame(e){const t=this.#e==null?void 0:e-this.#e;this.#e=e,this.beforeUpdate?.(t),this.update(t)}#t;get paused(){return!this.#t}set paused(e){e!=this.paused&&(e?(this.#t.cancel(),this.#t=void 0,this.#e=void 0):this.#t=new R(this.onAnimationFrame.bind(this))),e!=this.paused&&console.error("wtf")}beforeUpdate;constructor(e=!1){this.paused=e}}class F extends q{constructor(e=new d){super(),this.circle=e,e.elements.forEach(t=>F.#e.set(t,this))}configure({paused:e,circle:t,xSpeed:n,ySpeed:i}){return e!==void 0&&(this.paused=e),t&&this.circle.configure(t),n!==void 0&&(this.xSpeed=n),i!==void 0&&(this.ySpeed=i),this}xSpeed=Math.random()/1e3;ySpeed=Math.random()/1e3;update(e){if(e!==void 0){const t=this.circle.radius,n=1-t;let{x:i,y:s}=this.circle.center;i+=this.xSpeed*e,i<=t?(i=t,this.xSpeed=Math.abs(this.xSpeed)):i>=n&&(i=n,this.xSpeed=-Math.abs(this.xSpeed)),s+=this.ySpeed*e,s<=t?(s=t,this.ySpeed=Math.abs(this.ySpeed)):s>=n&&(s=n,this.ySpeed=-Math.abs(this.ySpeed)),this.circle.center=new u(i,s)}}static#e=new WeakMap;static for(e){return this.#e.get(e)}}class G extends q{goal=u.random();moveTo(e,t){this.goal=new u(e,t)}followCircle(e){return this.beforeUpdate=()=>this.goal=e.center,this}}class we extends G{constructor(e=new d){super(),this.circle=e}configure({paused:e,circle:t,goal:n,halflife:i}){return e!==void 0&&(this.paused=e),t&&this.circle.configure(t),n&&(this.goal=n),i!==void 0&&(this.halflife=i),this}update(e){if(e!==void 0){const t=Math.pow(.5,e/this.halflife),n=this.circle.center.extendPast(this.goal,1-t);this.circle.center=n}}halflife=250}function ve(r){const e=d.parent.getBoundingClientRect(),t=(r.clientX-e.left)/e.width,n=(r.clientY-e.top)/e.height;return new u(t,n)}function ye(r){function e(n){const i=ve(n);r instanceof d?r.center=i:r.goal=i}const t=new AbortController;return d.parent.addEventListener("pointerdown",n=>{n.button==0&&e(n)},{signal:t.signal}),d.parent.addEventListener("pointermove",n=>{n.buttons&1&&e(n)},{signal:t.signal}),t.abort.bind(t)}class Ee extends G{constructor(e=new d){super(),this.circle=e}update(e){e!==void 0&&(this.updateControls(),this.updatePhysics(e))}updatePhysics(e){function t(n,i){const s=n.x+i.x*e,a=n.y+i.y*e;return new u(s,a)}this.circle.center=t(this.circle.center,this.velocity),this.velocity=t(this.velocity,this.acceleration)}updateControls(){const e=this.goal.x-this.circle.center.x,t=this.goal.y-this.circle.center.y;this.acceleration=new u(e,t)}maxAcceleration=3e-6;#e=new u(0,0);get acceleration(){return this.#e}set acceleration(e){this.#e=u.ZERO.extendPast(e,1,this.maxAcceleration)}maxSpeed=.001;#t=new u(0,0);get velocity(){return this.#t}set velocity(e){this.#t=u.ZERO.extendPast(e,1,this.maxSpeed)}}class x{constructor(e,t){this.z=e,t??=1,this.ratio=x.ratio(e,t),this.#e=M(.5,.5,1,.5+this.ratio*.5)}ratio;static ratio(e,t){return t/(e+t)}#e;flatten({x:e,y:t}){return new u(this.#e(e),this.#e(t))}static demo(e=5,t){const n=M(0,0,e-1,1),i=.75,s=1/e/3;for(let a=e-1;a>=0;a--){const l=n(a),c=new x(l,t),m=s*c.ratio;for(let h=0;h<e;h++){const p=n(h),S=c.flatten({x:p,y:i}),w=new d;w.center=S,w.radius=m;const v=["#004","#00F"][(a+h)%2];w.color=v}}}static demo3(e=4,t=0,n){const i=M(0,0,e-1,1),s=1/e/3,a=k(e,c=>k(e,m=>k(e,h=>new d().configure({color:["#004","#00F"][(c+m+h)%2]})))).reverse();function l(){a.forEach((c,m)=>{const h=i(m+t),p=new x(h,n),S=s*p.ratio;c.forEach((w,v)=>{const A=i(v);w.forEach((C,T)=>{const g=i(T),y=p.flatten({x:g,y:A});C.center=y,C.radius=S})})})}return l(),{get distance(){return t},set distance(c){c!=t&&(t=c,l())},get perspective(){return n},set perspective(c){c!=n&&(n=c,l())}}}static animateDemo3(e=4){d.removeAll();const t=this.demo3(e);let n,i;function s(a){n??=M(a,20,a+1e4,0);const l=n(a);l<0?(t.distance=0,i.cancel()):t.distance=l}return i=new R(s),i}static async tunnelDemo(e={}){const t=e.count??50,n=e.perRevolution??17.5,i=e.periodMS??10,s=(l,c)=>{const m=new this(c,e.perspective),h=new d;return h.center=m.flatten(l),h.radius=m.ratio*.09,h},a=l=>{const c=l*(2*Math.PI),h=L(.4,c);return h.x+=u.CENTER.x,h.y+=u.CENTER.y,h};for(let l=0;l<t;l++)s(a(l/n),l/30).sendToBack().configure({color:`hsl(none 0% ${100-l*(100/t)}%)`}),i>0&&await I(i)}static#t=["red","orange","yellow","green","indigo","violet","pink","darkblue","black","gray","brown","chartreuse","aqua","chocolate","turquoise","cadetblue","coral","darkgoldenrod","darkgray","fuchsia","darkorchid"];static async fibonacciSpiral(e={}){const t=e.colors??this.#t,n=e.stripeCount??e.colors?.length??8,i=e.initialColor??"white";if(n<2||n!=(n|0))throw new Error("stripeCount must be an integer > 1");const s=e.circleCount??600;if(s<n||s!=(s|0))throw new Error("circleCount must be an integer ≥ stripeCount");d.removeAll(),x.tunnelDemo({count:s,periodMS:0,perRevolution:N,perspective:e.perspective});const a=[...d.allAttached()].reverse();a.forEach(c=>c.color=i);const l=e.msBetweenStripes??3e3/n;for(let c=0;c<n;c++)l>0&&await I(l),a.forEach((m,h)=>{h%n==c&&(m.color=t[c])})}static animateSpiral(){const e=[],t=()=>{e.forEach(p=>p.attached=!1),e.length=0},n=["red","orange","yellow","green","indigo","violet","pink","darkblue","black","gray","brown","chartreuse","aqua"],i=p=>n[p%n.length],s=(p,S,w)=>{const v=this.ratio(w,1),A=S/N*2*Math.PI,T=1*v,g=L(T,A);g.x+=u.CENTER.x,g.y+=u.CENTER.y,p.center=new u(g.x,g.y);const y=.1;p.radius=y*v};let c;const m=new R(p=>{t(),c??=p;const w=(p-c)*.005,v=w+400,A=Math.floor(v),C=Math.ceil(w),T=M(w,0,v,400/25);for(let g=A;g>=C;g--){const y=new d;e.push(y),y.color=i(g),s(y,g,T(g))}});function h(){m.cancel(),t()}return h}}const be=E("circle-parent",SVGSVGElement),B=E("preview",HTMLIFrameElement),Se=O(B.contentDocument?.firstElementChild,B.contentWindow.window.SVGSVGElement);E("copyToIFrame",HTMLButtonElement).addEventListener("click",()=>{Se.innerHTML=be.innerHTML});const Me=E("previewImg",HTMLImageElement);E("downloadFromIFrame",HTMLButtonElement).addEventListener("click",()=>{const r=B.contentDocument.firstElementChild.outerHTML,e=new Blob([r]),t=URL.createObjectURL(e);Me.src=t;const n=document.createElement("a");n.href=t;const i=ge(new Date);n.download="Spheres "+i,n.click(),URL.revokeObjectURL(t)});const b=window;b.Circle=d;b.InertiaAndBounce=F;b.ExponentialFollower=we;b.Physics=Ee;b.followMouse=ye;b.ThreeDFlattener=x;b.phi=N;