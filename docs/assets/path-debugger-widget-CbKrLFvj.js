import{a as v,g as F}from"./client-misc-DWuUZUgy.js";import{P as V,Q as G}from"./path-shape-BZC9YcLk.js";import{c as O,f as Q,e as _}from"./utility-CsOzd0ZV.js";function U(i){const w=document.createElement("div");w.innerHTML=`
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
      </div>`;const f=v(w.firstElementChild,HTMLDivElement),n=v(f.firstElementChild,SVGSVGElement),u=v(n.nextElementSibling,HTMLTableElement);let p=-1;function x(){if(n.innerHTML="",u.querySelectorAll("tr[data-temporary]").forEach(e=>{e.firstElementChild&&e.remove()}),p=-1,i){let e;const s=i.commands;s.map((o,a)=>{const l=document.createElementNS("http://www.w3.org/2000/svg","path");l.style.d=new V([o]).cssPath;const b=`hsl(${2.4*a}rad ${60+Math.sin(a)*40}% 50%)`;l.style.stroke=b,n.appendChild(l);const B=l.getBBox();e?e=Q(e,B):e=B;const t=u.insertRow();t.dataset.temporary="😎";const g=t.insertCell();g.innerText=a.toString(),g.style.color=b,g.classList.add("index-column");const A=t.insertCell();A.innerText=o.command;const T=t.insertCell();T.innerText=l.getTotalLength().toFixed(2);const d=(r,c)=>{r.innerText=(c*_).toFixed(2)+"°"},E=t.insertCell(),C=t.insertCell();if(o instanceof G){const r=o.creationInfo;r.source=="angles"&&(d(E,r.angle0),d(C,r.angle),r.success||[E,C].forEach(c=>c.classList.add("error")))}const M=t.insertCell(),D=o.incomingAngle;d(M,D);const I=t.insertCell(),H=o.outgoingAngle;d(I,H);const k=t.insertCell(),R=s[a-1],S=V.needAnM(R,o)?void 0:O(R.outgoingAngle,o.incomingAngle);S!==void 0&&d(k,S);{const c=[l,...[g,A,T,E,C,M,I]],P=h=>{c.forEach(m=>{m.classList[h]("hover")})};c.forEach(h=>{h.addEventListener("mouseenter",()=>P("add")),h.addEventListener("mouseleave",()=>P("remove")),h.addEventListener("click",()=>{f.querySelectorAll(".selected").forEach(m=>m.classList.remove("selected")),[l,g].forEach(m=>m.classList.add("selected")),p=a,L()})})}}),e&&(n.viewBox.baseVal.x=e.x,n.viewBox.baseVal.y=e.y,n.viewBox.baseVal.width=e.width,n.viewBox.baseVal.height=e.height,n.style.setProperty("--stroke-width",(Math.hypot(e.width,e.height)*.008305657597434369).toString()))}if(!(i&&i.commands.length>0)){const e=u.insertRow();e.dataset.temporary="🎃";const s=e.insertCell();s.colSpan=8,s.classList.add("empty"),s.innerText="Empty"}L()}const y=[];function L(){y.forEach(e=>{try{e()}catch(s){console.error(s)}})}x();function q(e){typeof e=="string"&&(e=F(e,Element)),e.parentElement.insertBefore(f,e)}return{topLevelElement:f,get pathShape(){return i},set pathShape(e){i=e,x()},insertBefore:q,get selectedIndex(){return p},listeners:y}}export{U as c};
