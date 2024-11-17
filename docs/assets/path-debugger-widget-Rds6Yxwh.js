import{a as x,g as N}from"./client-misc-DWuUZUgy.js";import{P as F,Q as H}from"./path-shape-T33T0rPM.js";import{f as Q,c as $,g as j,e as U}from"./utility-BHSQpXni.js";function W(g){const L=document.createElement("div");L.innerHTML=`
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
      </div>`;const f=x(L.firstElementChild,HTMLDivElement),r=x(f.firstElementChild,SVGSVGElement),v=x(r.nextElementSibling,HTMLTableElement);let u=-1;const E=[];function b(e){f.querySelectorAll(".selected").forEach(s=>s.classList.remove("selected"));const o=E[e];o?(o.forEach(s=>s.classList.add("selected")),u=e):u=-1,B()}function A(){if(r.innerHTML="",v.querySelectorAll("tr[data-temporary]").forEach(e=>{e.firstElementChild&&e.remove()}),u=-1,E.length=0,g){let e;const o=g.commands;if(o.forEach((s,a)=>{const n=document.createElementNS("http://www.w3.org/2000/svg","path");n.style.d=new F([s]).cssPath;const l=`hsl(${2.4*a}rad ${60+Math.sin(a)*40}% 50%)`;n.style.stroke=l,r.appendChild(n);const S=n.getBBox();e?e=j(e,S):e=S;const w=[];if(s instanceof H){const t=document.createElementNS("http://www.w3.org/2000/svg","circle");t.classList.add("control-point"),s.creationInfo.source=="angles"&&!s.creationInfo.success&&t.classList.add("error");const c=s.x1,p=s.y1;t.cx.baseVal.value=0,t.cy.baseVal.value=0,t.r.baseVal.value=1;const m=.75;t.style.setProperty("--x",(c*m).toFixed(6)+"pt"),t.style.setProperty("--y",(p*m).toFixed(6)+"pt"),t.style.fill=l,r.appendChild(t),w.push(t),e=Q(e,c,p)}const i=v.insertRow();i.dataset.temporary="😎";const d=i.insertCell();d.innerText=a.toString(),d.style.color=l,d.classList.add("index-column");const M=i.insertCell();M.innerText=s.command;const P=i.insertCell();P.innerText=n.getTotalLength().toFixed(2);const h=(t,c)=>{t.innerText=(c*U).toFixed(2)+"°"},y=i.insertCell(),C=i.insertCell();if(s instanceof H){const t=s.creationInfo;t.source=="angles"&&(h(y,t.angle0),h(C,t.angle),t.success||[y,C].forEach(c=>c.classList.add("error")))}const I=i.insertCell(),O=s.incomingAngle;h(I,O);const V=i.insertCell(),Y=s.outgoingAngle;h(V,Y);const _=i.insertCell(),R=o[a-1],q=F.needAnM(R,s)?void 0:$(R.outgoingAngle,s.incomingAngle);q!==void 0&&h(_,q);const G=[d,M,P,y,C,I,V],D=[n,...w,...G];E.push([n,...w,d]),D.forEach(t=>{const c=p=>{D.forEach(m=>{m.classList[p]("hover")})};t.addEventListener("mouseenter",()=>c("add")),t.addEventListener("mouseleave",()=>c("remove")),t.addEventListener("click",()=>{b(a)})})}),e){let{x:s,y:a,width:n,height:l}=e;n==0&&l!=0?(n=l,s-=n/2):n!=0&&l==0&&(l=n,a-=l/2),r.viewBox.baseVal.x=s,r.viewBox.baseVal.y=a,r.viewBox.baseVal.width=n,r.viewBox.baseVal.height=l,r.style.setProperty("--stroke-width",(Math.hypot(e.width,e.height)*.008305657597434369).toString())}}if(!(g&&g.commands.length>0)){const e=v.insertRow();e.dataset.temporary="🎃";const o=e.insertCell();o.colSpan=8,o.classList.add("empty"),o.innerText="Empty"}B()}const T=[];function B(){T.forEach(e=>{try{e()}catch(o){console.error(o)}})}A();function k(e){typeof e=="string"&&(e=N(e,Element)),e.parentElement.insertBefore(f,e)}return{topLevelElement:f,get pathShape(){return g},set pathShape(e){g=e,A()},insertBefore:k,get selectedIndex(){return u},set selectedIndex(e){b(e)},listeners:T}}export{W as c};
