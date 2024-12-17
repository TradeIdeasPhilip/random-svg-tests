import{m as g,g as Q}from"./client-misc-CqK8Npau.js";import{P as F,Q as H}from"./path-shape-BXOkZTxi.js";function j(d){const L=document.createElement("div");L.innerHTML=`
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
      </div>`;const u=g.assertClass(L.firstElementChild,HTMLDivElement),r=g.assertClass(u.firstElementChild,SVGSVGElement),E=g.assertClass(r.nextElementSibling,HTMLTableElement);let p=-1;const w=[];function b(e){u.querySelectorAll(".selected").forEach(s=>s.classList.remove("selected"));const o=w[e];o?(o.forEach(s=>s.classList.add("selected")),p=e):p=-1,B()}function A(){if(r.innerHTML="",E.querySelectorAll("tr[data-temporary]").forEach(e=>{e.firstElementChild&&e.remove()}),p=-1,w.length=0,d){let e;const o=d.commands;if(o.forEach((s,a)=>{const n=document.createElementNS("http://www.w3.org/2000/svg","path");n.style.d=new F([s]).cssPath;const l=`hsl(${2.4*a}rad ${60+Math.sin(a)*40}% 50%)`;n.style.stroke=l,r.appendChild(n);const S=n.getBBox();e?e=g.rectUnion(e,S):e=S;const C=[];if(s instanceof H){const t=document.createElementNS("http://www.w3.org/2000/svg","circle");t.classList.add("control-point"),s.creationInfo.source=="angles"&&!s.creationInfo.success&&t.classList.add("error");const c=s.x1,m=s.y1;t.cx.baseVal.value=0,t.cy.baseVal.value=0,t.r.baseVal.value=1;const v=.75;t.style.setProperty("--x",(c*v).toFixed(6)+"pt"),t.style.setProperty("--y",(m*v).toFixed(6)+"pt"),t.style.fill=l,r.appendChild(t),C.push(t),e=g.rectAddPoint(e,c,m)}const i=E.insertRow();i.dataset.temporary="😎";const h=i.insertCell();h.innerText=a.toString(),h.style.color=l,h.classList.add("index-column");const M=i.insertCell();M.innerText=s.command;const P=i.insertCell();P.innerText=n.getTotalLength().toFixed(2);const f=(t,c)=>{t.innerText=(c*g.degreesPerRadian).toFixed(2)+"°"},y=i.insertCell(),x=i.insertCell();if(s instanceof H){const t=s.creationInfo;t.source=="angles"&&(f(y,t.angle0),f(x,t.angle),t.success||[y,x].forEach(c=>c.classList.add("error")))}const I=i.insertCell(),O=s.incomingAngle;f(I,O);const V=i.insertCell(),Y=s.outgoingAngle;f(V,Y);const G=i.insertCell(),R=o[a-1],q=F.needAnM(R,s)?void 0:g.angleBetween(R.outgoingAngle,s.incomingAngle);q!==void 0&&f(G,q);const N=[h,M,P,y,x,I,V],D=[n,...C,...N];w.push([n,...C,h]),D.forEach(t=>{const c=m=>{D.forEach(v=>{v.classList[m]("hover")})};t.addEventListener("mouseenter",()=>c("add")),t.addEventListener("mouseleave",()=>c("remove")),t.addEventListener("click",()=>{b(a)})})}),e){let{x:s,y:a,width:n,height:l}=e;n==0&&l!=0?(n=l,s-=n/2):n!=0&&l==0&&(l=n,a-=l/2),r.viewBox.baseVal.x=s,r.viewBox.baseVal.y=a,r.viewBox.baseVal.width=n,r.viewBox.baseVal.height=l,r.style.setProperty("--stroke-width",(Math.hypot(e.width,e.height)*.008305657597434369).toString())}}if(!(d&&d.commands.length>0)){const e=E.insertRow();e.dataset.temporary="🎃";const o=e.insertCell();o.colSpan=8,o.classList.add("empty"),o.innerText="Empty"}B()}const T=[];function B(){T.forEach(e=>{try{e()}catch(o){console.error(o)}})}A();function k(e){typeof e=="string"&&(e=Q(e,Element)),e.parentElement.insertBefore(u,e)}return{topLevelElement:u,get pathShape(){return d},set pathShape(e){d=e,A()},insertBefore:k,get selectedIndex(){return p},set selectedIndex(e){b(e)},listeners:T}}export{j as c};
