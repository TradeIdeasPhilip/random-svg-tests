import{a as x,g as N}from"./client-misc-DWuUZUgy.js";import{P as F,Q as H}from"./path-shape-T33T0rPM.js";import{f as Q,c as $,g as j,e as U}from"./utility-BHSQpXni.js";function W(c){const L=document.createElement("div");L.innerHTML=`
      <div class="pathDebugger">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        ></svg>
        <table class="segments">
          <tr>
            <th rowspan="2">#</th>
            <th rowspan="2">C</th>
            <th rowspan="2">Length</th>
            <th colspan="2">Requested</th>
            <th colspan="2">Actual</th>
            <th rowspan="2">Difference</th>
          </tr>
          <tr>
            <th>Incoming</th>
            <th>Outgoing</th>
            <th>Incoming</th>
            <th>Outgoing</th>
          </tr>
        </table>
      </div>`;const h=x(L.firstElementChild,HTMLDivElement),o=x(h.firstElementChild,SVGSVGElement),m=x(o.nextElementSibling,HTMLTableElement);let f=-1;const v=[];function b(e){h.querySelectorAll(".selected").forEach(s=>s.classList.remove("selected"));const n=v[e];n?(n.forEach(s=>s.classList.add("selected")),f=e):f=-1,B()}function A(){if(o.innerHTML="",m.querySelectorAll("tr[data-temporary]").forEach(e=>{e.firstElementChild&&e.remove()}),f=-1,v.length=0,c){let e;const n=c.commands;n.forEach((s,a)=>{const i=document.createElementNS("http://www.w3.org/2000/svg","path");i.style.d=new F([s]).cssPath;const E=`hsl(${2.4*a}rad ${60+Math.sin(a)*40}% 50%)`;i.style.stroke=E,o.appendChild(i);const S=i.getBBox();e?e=j(e,S):e=S;const w=[];if(s instanceof H){const t=document.createElementNS("http://www.w3.org/2000/svg","circle");t.classList.add("control-point"),s.creationInfo.source=="angles"&&!s.creationInfo.success&&t.classList.add("error");const r=s.x1,u=s.y1;t.cx.baseVal.value=0,t.cy.baseVal.value=0,t.r.baseVal.value=1;const p=.75;t.style.setProperty("--x",(r*p).toFixed(6)+"pt"),t.style.setProperty("--y",(u*p).toFixed(6)+"pt"),t.style.fill=E,o.appendChild(t),w.push(t),e=Q(e,r,u)}const l=m.insertRow();l.dataset.temporary="😎";const g=l.insertCell();g.innerText=a.toString(),g.style.color=E,g.classList.add("index-column");const M=l.insertCell();M.innerText=s.command;const P=l.insertCell();P.innerText=i.getTotalLength().toFixed(2);const d=(t,r)=>{t.innerText=(r*U).toFixed(2)+"°"},y=l.insertCell(),C=l.insertCell();if(s instanceof H){const t=s.creationInfo;t.source=="angles"&&(d(y,t.angle0),d(C,t.angle),t.success||[y,C].forEach(r=>r.classList.add("error")))}const I=l.insertCell(),O=s.incomingAngle;d(I,O);const V=l.insertCell(),Y=s.outgoingAngle;d(V,Y);const _=l.insertCell(),R=n[a-1],q=F.needAnM(R,s)?void 0:$(R.outgoingAngle,s.incomingAngle);q!==void 0&&d(_,q);const G=[g,M,P,y,C,I,V],D=[i,...w,...G];v.push([i,...w,g]),D.forEach(t=>{const r=u=>{D.forEach(p=>{p.classList[u]("hover")})};t.addEventListener("mouseenter",()=>r("add")),t.addEventListener("mouseleave",()=>r("remove")),t.addEventListener("click",()=>{b(a)})})}),e&&(o.viewBox.baseVal.x=e.x,o.viewBox.baseVal.y=e.y,o.viewBox.baseVal.width=e.width,o.viewBox.baseVal.height=e.height,o.style.setProperty("--stroke-width",(Math.hypot(e.width,e.height)*.008305657597434369).toString()))}if(!(c&&c.commands.length>0)){const e=m.insertRow();e.dataset.temporary="🎃";const n=e.insertCell();n.colSpan=8,n.classList.add("empty"),n.innerText="Empty"}B()}const T=[];function B(){T.forEach(e=>{try{e()}catch(n){console.error(n)}})}A();function k(e){typeof e=="string"&&(e=N(e,Element)),e.parentElement.insertBefore(h,e)}return{topLevelElement:h,get pathShape(){return c},set pathShape(e){c=e,A()},insertBefore:k,get selectedIndex(){return f},set selectedIndex(e){b(e)},listeners:T}}export{W as c};
