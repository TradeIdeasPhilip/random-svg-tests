import{a as C,g as O}from"./client-misc-DWuUZUgy.js";import{P as I,Q as q}from"./path-shape-T33T0rPM.js";import{f as Y,c as _,g as G,e as N}from"./utility-BHSQpXni.js";function U(a){const x=document.createElement("div");x.innerHTML=`
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
      </div>`;const p=C(x.firstElementChild,HTMLDivElement),s=C(p.firstElementChild,SVGSVGElement),u=C(s.nextElementSibling,HTMLTableElement);let v=-1;function L(){if(s.innerHTML="",u.querySelectorAll("tr[data-temporary]").forEach(e=>{e.firstElementChild&&e.remove()}),v=-1,a){let e;const r=a.commands;r.map((n,g)=>{const c=document.createElementNS("http://www.w3.org/2000/svg","path");c.style.d=new I([n]).cssPath;const w=`hsl(${2.4*g}rad ${60+Math.sin(g)*40}% 50%)`;c.style.stroke=w,s.appendChild(c);const T=c.getBBox();if(e?e=G(e,T):e=T,n instanceof q){const t=document.createElementNS("http://www.w3.org/2000/svg","circle");t.classList.add("control-point");const l=n.x1,f=n.y1;t.cx.baseVal.value=0,t.cy.baseVal.value=0,t.r.baseVal.value=1;const i=.75;t.style.setProperty("--x",(l*i).toFixed(6)+"pt"),t.style.setProperty("--y",(f*i).toFixed(6)+"pt"),t.style.fill=w,s.appendChild(t),e=Y(e,l,f)}const o=u.insertRow();o.dataset.temporary="😎";const d=o.insertCell();d.innerText=g.toString(),d.style.color=w,d.classList.add("index-column");const B=o.insertCell();B.innerText=n.command;const M=o.insertCell();M.innerText=c.getTotalLength().toFixed(2);const h=(t,l)=>{t.innerText=(l*N).toFixed(2)+"°"},E=o.insertCell(),y=o.insertCell();if(n instanceof q){const t=n.creationInfo;t.source=="angles"&&(h(E,t.angle0),h(y,t.angle),t.success||[E,y].forEach(l=>l.classList.add("error")))}const P=o.insertCell(),F=n.incomingAngle;h(P,F);const S=o.insertCell(),H=n.outgoingAngle;h(S,H);const k=o.insertCell(),V=r[g-1],R=I.needAnM(V,n)?void 0:_(V.outgoingAngle,n.incomingAngle);R!==void 0&&h(k,R);{const l=[c,...[d,B,M,E,y,P,S]],f=i=>{l.forEach(m=>{m.classList[i]("hover")})};l.forEach(i=>{i.addEventListener("mouseenter",()=>f("add")),i.addEventListener("mouseleave",()=>f("remove")),i.addEventListener("click",()=>{p.querySelectorAll(".selected").forEach(m=>m.classList.remove("selected")),[c,d].forEach(m=>m.classList.add("selected")),v=g,A()})})}}),e&&(s.viewBox.baseVal.x=e.x,s.viewBox.baseVal.y=e.y,s.viewBox.baseVal.width=e.width,s.viewBox.baseVal.height=e.height,s.style.setProperty("--stroke-width",(Math.hypot(e.width,e.height)*.008305657597434369).toString()))}if(!(a&&a.commands.length>0)){const e=u.insertRow();e.dataset.temporary="🎃";const r=e.insertCell();r.colSpan=8,r.classList.add("empty"),r.innerText="Empty"}A()}const b=[];function A(){b.forEach(e=>{try{e()}catch(r){console.error(r)}})}L();function D(e){typeof e=="string"&&(e=O(e,Element)),e.parentElement.insertBefore(p,e)}return{topLevelElement:p,get pathShape(){return a},set pathShape(e){a=e,L()},insertBefore:D,get selectedIndex(){return v},listeners:b}}export{U as c};
