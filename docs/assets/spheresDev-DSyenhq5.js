import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{g as E,p as U,a as F,m as C,i as R,s as O}from"./client-misc-DWuUZUgy.js";import{d as H,p as k,a as A,A as L}from"./utility-BTo8yCd1.js";class a{constructor(t,e){this.x=t,this.y=e}equals(t){return this.x==t.x&&this.y==t.y}distanceTo(t){return Math.hypot(this.x-t.x,this.y-t.y)}extendPast(t,e,s=1/0){const i=Math.atan2(t.y-this.y,t.x-this.x),n=this.distanceTo(t),o=Math.min(n*e,s),c=A(o,i);return new a(this.x+c.x,this.y+c.y)}static ZERO=new a(0,0);static CENTER=new a(.5,.5);static random(t=0){function e(){return t+Math.random()*(1-2*t)}return new this(e(),e())}static fromJSON(t){try{const e=t.x,s=t.y;return typeof e!="number"||typeof s!="number"?void 0:new this(e,s)}catch{return}}}class l extends Object{overlaps(t){const e=this.center.distanceTo(t.center);return e<this.radius||e<t.radius}static overlapping(t){const e=[];return t.forEach((s,i)=>{for(var n=0;n<i;n++){const o=t[n];o.overlaps(s)&&e.push([o,s])}}),e}static allAttached(){const t=new Set;return document.querySelectorAll("circle").forEach(e=>{const s=this.for(e);s&&t.add(s)}),t}static removeAll(){[...l.allAttached()].forEach(t=>t.attached=!1)}configure({attached:t,center:e,color:s,radius:i}){return t!==void 0&&(this.attached=t),e!==void 0&&(this.center=e),s!==void 0&&(this.color=s),i!==void 0&&(this.radius=i),this}static parent=E("circle-parent",SVGElement);#t=document.createElementNS("http://www.w3.org/2000/svg","circle");#e=document.createElementNS("http://www.w3.org/2000/svg","circle");#s=[this.#t,this.#e];get elements(){return this.#s}#i=Math.random()*(1/8)+1/16;#n=U(["red","orange","yellow","green","blue","indigo","violet"]);#o=a.random(this.#i);constructor(){super(),this.#t.classList.add("simple"),this.#e.classList.add("sphere"),this.radius=this.#i,this.color=this.#n,this.center=this.#o,this.attached=!0,this.#s.forEach(t=>l.#c.set(t,this))}#r=!1;get attached(){return this.#r}set attached(t){t!=this.#r&&(this.#s.forEach(e=>{t?l.parent.appendChild(e):e.remove()}),this.#r=t)}sendToBack(){return this.attached=!0,this.elements.toReversed().forEach(t=>l.parent.insertBefore(t,l.parent.firstChild)),this}get center(){return this.#o}set center(t){this.#o=t,this.#s.forEach(e=>{e.cx.baseVal.value=t.x,e.cy.baseVal.value=t.y})}get radius(){return this.#i}set radius(t){this.#i=t,this.#s.forEach(e=>{e.r.baseVal.value=t})}get volume(){return Math.pow(this.radius,3)}set volume(t){this.radius=Math.pow(t,1/3)}get color(){return this.#n}set color(t){this.#n=t,this.#t.style.fill=this.#n}toJSON(){const{center:t,radius:e,color:s,attached:i}=this;return{center:t,radius:e,color:s,attached:i}}static fromJSON(t){try{const e=a.fromJSON(t.center);if(!e)return;const s=t.color;if(typeof s!="string")return;const i=t.radius;if(typeof i!="number")return;const n=t.attached;if(typeof n!="boolean")return;const o=new this;return o.center=e,o.color=s,o.radius=i,o.attached=n,o}catch{return}}toString(){return`<center cx="${this.center.x}" cy="${this.center.y}" r="${this.radius}" fill=${JSON.stringify(this.color)} \\>`}static#c=new WeakMap;static for(t){return this.#c.get(t)}}class N{#t;onAnimationFrame(t){const e=this.#t==null?void 0:t-this.#t;this.#t=t,this.beforeUpdate?.(e),this.update(e)}#e;get paused(){return!this.#e}set paused(t){t!=this.paused&&(t?(this.#e.cancel(),this.#e=void 0,this.#t=void 0):this.#e=new L(this.onAnimationFrame.bind(this))),t!=this.paused&&console.error("wtf")}beforeUpdate;constructor(t=!1){this.paused=t}}class B extends N{constructor(t=new l){super(),this.circle=t,t.elements.forEach(e=>B.#t.set(e,this))}configure({paused:t,circle:e,xSpeed:s,ySpeed:i}){return t!==void 0&&(this.paused=t),e&&this.circle.configure(e),s!==void 0&&(this.xSpeed=s),i!==void 0&&(this.ySpeed=i),this}xSpeed=Math.random()/1e3;ySpeed=Math.random()/1e3;update(t){if(t!==void 0){const e=this.circle.radius,s=1-e;let{x:i,y:n}=this.circle.center;i+=this.xSpeed*t,i<=e?(i=e,this.xSpeed=Math.abs(this.xSpeed)):i>=s&&(i=s,this.xSpeed=-Math.abs(this.xSpeed)),n+=this.ySpeed*t,n<=e?(n=e,this.ySpeed=Math.abs(this.ySpeed)):n>=s&&(n=s,this.ySpeed=-Math.abs(this.ySpeed)),this.circle.center=new a(i,n)}}static#t=new WeakMap;static for(t){return this.#t.get(t)}}class I extends N{goal=a.random();moveTo(t,e){this.goal=new a(t,e)}followCircle(t){return this.beforeUpdate=()=>this.goal=t.center,this}}class q extends I{constructor(t=new l){super(),this.circle=t}configure({paused:t,circle:e,goal:s,halflife:i}){return t!==void 0&&(this.paused=t),e&&this.circle.configure(e),s&&(this.goal=s),i!==void 0&&(this.halflife=i),this}update(t){if(t!==void 0){const e=Math.pow(.5,t/this.halflife),s=this.circle.center.extendPast(this.goal,1-e);this.circle.center=s}}halflife=250}function D(f){const t=l.parent.getBoundingClientRect(),e=(f.clientX-t.left)/t.width,s=(f.clientY-t.top)/t.height;return new a(e,s)}function P(f){function t(s){const i=D(s);f instanceof l?f.center=i:f.goal=i}const e=new AbortController;return l.parent.addEventListener("pointerdown",s=>{s.button==0&&t(s)},{signal:e.signal}),l.parent.addEventListener("pointermove",s=>{s.buttons&1&&t(s)},{signal:e.signal}),e.abort.bind(e)}class z extends I{constructor(t=new l){super(),this.circle=t}update(t){t!==void 0&&(this.updateControls(),this.updatePhysics(t))}updatePhysics(t){function e(s,i){const n=s.x+i.x*t,o=s.y+i.y*t;return new a(n,o)}this.circle.center=e(this.circle.center,this.velocity),this.velocity=e(this.velocity,this.acceleration)}updateControls(){const t=this.goal.x-this.circle.center.x,e=this.goal.y-this.circle.center.y;this.acceleration=new a(t,e)}maxAcceleration=3e-6;#t=new a(0,0);get acceleration(){return this.#t}set acceleration(t){this.#t=a.ZERO.extendPast(t,1,this.maxAcceleration)}maxSpeed=.001;#e=new a(0,0);get velocity(){return this.#e}set velocity(t){this.#e=a.ZERO.extendPast(t,1,this.maxSpeed)}}class x{constructor(t,e){this.z=t,e??=1,this.ratio=x.ratio(t,e),this.#t=C(.5,.5,1,.5+this.ratio*.5)}ratio;static ratio(t,e){return e/(t+e)}#t;flatten({x:t,y:e}){return new a(this.#t(t),this.#t(e))}static demo(t=5,e){const s=C(0,0,t-1,1),i=.75,n=1/t/3;for(let o=t-1;o>=0;o--){const c=s(o),r=new x(c,e),u=n*r.ratio;for(let h=0;h<t;h++){const d=s(h),v=r.flatten({x:d,y:i}),m=new l;m.center=v,m.radius=u;const g=["#004","#00F"][(o+h)%2];m.color=g}}}static demo3(t=4,e=0,s){const i=C(0,0,t-1,1),n=1/t/3,o=R(t,r=>R(t,u=>R(t,h=>new l().configure({color:["#004","#00F"][(r+u+h)%2]})))).reverse();function c(){o.forEach((r,u)=>{const h=i(u+e),d=new x(h,s),v=n*d.ratio;r.forEach((m,g)=>{const b=i(g);m.forEach((S,M)=>{const p=i(M),w=d.flatten({x:p,y:b});S.center=w,S.radius=v})})})}return c(),{get distance(){return e},set distance(r){r!=e&&(e=r,c())},get perspective(){return s},set perspective(r){r!=s&&(s=r,c())}}}static animateDemo3(t=4){l.removeAll();const e=this.demo3(t);let s,i;function n(o){s??=C(o,20,o+1e4,0);const c=s(o);c<0?(e.distance=0,i.cancel()):e.distance=c}return i=new L(n),i}static async tunnelDemo(t={}){const e=t.count??50,s=t.perRevolution??17.5,i=t.periodMS??10,n=(c,r)=>{const u=new this(r,t.perspective),h=new l;return h.center=u.flatten(c),h.radius=u.ratio*.09,h},o=c=>{const r=c*(2*Math.PI),h=A(.4,r);return h.x+=a.CENTER.x,h.y+=a.CENTER.y,h};for(let c=0;c<e;c++)n(o(c/s),c/30).sendToBack().configure({color:`hsl(none 0% ${100-c*(100/e)}%)`}),i>0&&await O(i)}static#e=["red","orange","yellow","green","indigo","violet","pink","darkblue","black","gray","brown","chartreuse","aqua","chocolate","turquoise","cadetblue","coral","darkgoldenrod","darkgray","fuchsia","darkorchid"];static async fibonacciSpiral(t={}){const e=t.colors??this.#e,s=t.stripeCount??t.colors?.length??8,i=t.initialColor??"white";if(s<2||s!=(s|0))throw new Error("stripeCount must be an integer > 1");const n=t.circleCount??600;if(n<s||n!=(n|0))throw new Error("circleCount must be an integer ≥ stripeCount");l.removeAll(),x.tunnelDemo({count:n,periodMS:0,perRevolution:k,perspective:t.perspective});const o=[...l.allAttached()].reverse();o.forEach(r=>r.color=i);const c=t.msBetweenStripes??3e3/s;for(let r=0;r<s;r++)c>0&&await O(c),o.forEach((u,h)=>{h%s==r&&(u.color=e[r])})}static animateSpiral(){const t=[],e=()=>{t.forEach(d=>d.attached=!1),t.length=0},s=["red","orange","yellow","green","indigo","violet","pink","darkblue","black","gray","brown","chartreuse","aqua"],i=d=>s[d%s.length],n=(d,v,m)=>{const g=this.ratio(m,1),b=v/k*2*Math.PI,M=1*g,p=A(M,b);p.x+=a.CENTER.x,p.y+=a.CENTER.y,d.center=new a(p.x,p.y);const w=.1;d.radius=w*g};let r;const u=new L(d=>{e(),r??=d;const m=(d-r)*.005,g=m+400,b=Math.floor(g),S=Math.ceil(m),M=C(m,0,g,400/25);for(let p=b;p>=S;p--){const w=new l;t.push(w),w.color=i(p),n(w,p,M(p))}});function h(){u.cancel(),e()}return h}}const G=E("circle-parent",SVGSVGElement),T=E("preview",HTMLIFrameElement),J=F(T.contentDocument?.firstElementChild,T.contentWindow.window.SVGSVGElement);E("copyToIFrame",HTMLButtonElement).addEventListener("click",()=>{J.innerHTML=G.innerHTML});const Z=E("previewImg",HTMLImageElement);E("downloadFromIFrame",HTMLButtonElement).addEventListener("click",()=>{const f=T.contentDocument.firstElementChild.outerHTML,t=new Blob([f]),e=URL.createObjectURL(t);Z.src=e;const s=document.createElement("a");s.href=e;const i=H(new Date);s.download="Spheres "+i+".svg",s.click(),URL.revokeObjectURL(e)});const y=window;y.Circle=l;y.InertiaAndBounce=B;y.ExponentialFollower=q;y.Physics=z;y.followMouse=P;y.ThreeDFlattener=x;y.phi=k;