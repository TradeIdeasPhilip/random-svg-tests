import{m as T}from"./client-misc-CqK8Npau.js";import{P as R,Q as C,b as l,L as W}from"./path-shape-BXOkZTxi.js";class j{constructor(M,i=M/10){if(this.fontSize=M,this.strokeWidth=i,M<=0||!isFinite(M))throw new Error("wtf")}get mHeight(){return this.fontSize}get xHeight(){return this.fontSize*.5}get aWidth(){return this.fontSize*.75}get digitWidth(){return this.fontSize*.5}get defaultKerning(){return this.strokeWidth*2.5}get spaceWidth(){return this.strokeWidth+this.digitWidth/2}get top(){return this.capitalTop-this.mHeight/4}get capitalTop(){return this.baseline-this.mHeight}get capitalTopMiddle(){return(this.capitalTop+this.capitalMiddle)/2}get capitalMiddle(){return this.baseline-this.xHeight}get capitalBottomMiddle(){return(this.baseline+this.capitalMiddle)/2}get baseline(){return 0}get descender(){return this.mHeight/4}get bottom(){return this.descender+this.mHeight/4}}class q{constructor(M,i,L){this.advance=i,this.fontMetrics=L,M instanceof R?this.#t=()=>M:this.#t=M}#t;get shape(){return this.#t()}get cssPath(){return this.shape.cssPath}get d(){return this.shape.rawPath}makeElement(){return this.shape.makeElement()}makeElements(){return this.shape.splitOnMove().map(M=>({innerShape:M,element:M.makeElement()}))}}function tt(w){function M(r){return r.length==1}let i="",L=[];return w.forEach((r,h)=>{M(h)?i+=h:L.push(r)}),{normal:i,special:L}}const D=0,F=Math.PI/4,O=2*F,G=3*F,$=4*F,J=5*F,I=6*F,Y=7*F;function K(w){const M=new Map;typeof w=="number"&&(w=new j(w));const i=(t,s,n)=>{const e=new q(s,n,w);if(M.has(t))throw new Error(`duplicate letter: "${t}", previous letter: "${[...M].at(-1)[0]}"`);M.set(t,e)},{aWidth:L,digitWidth:r,capitalTop:h,capitalTopMiddle:u,capitalMiddle:p,capitalBottomMiddle:V,baseline:a,descender:E,strokeWidth:P}=w,c=0,x=P/3;{const t=w.mHeight,s=.5803571598560251*t,n=[];n.push(C.controlPoints(.5803571598560251*t,-.011904772996231272*t,.1993461912459357*t,-.4845653833822309*t,.15178572549774305*t,-.5833333559985097*t)),n.push(C.controlPoints(.15178572549774305*t,-.5833333559985097*t,.07142858010885174*t,-.7502096094253163*t,.07142858010885174*t,-.8809523915616125*t)),n.push(C.controlPoints(.07142858010885174*t,-.8809523915616125*t,.07142858010885174*t,-1*t,.18154763484090689*t,-1*t)),n.push(C.controlPoints(.18154763484090689*t,-1*t,.3125000278492327*t,-1*t,.3125000278492327*t,-.8809523857747589*t)),n.push(C.controlPoints(.3125000278492327*t,-.8809523857747589*t,.3125000278492327*t,-.795672021064033*t,.14880952935525849*t,-.5863095347804337*t)),n.push(C.controlPoints(.14880952935525849*t,-.5863095347804337*t,0*t,-.39598002063544424*t,0*t,-.23511904966855834*t)),n.push(C.controlPoints(0*t,-.23511904966855834*t,0*t,0*t,.16369048113341364*t,0*t)),n.push(C.controlPoints(.16369048113341364*t,0*t,.31699631330709954*t,0*t,.45535713019840074*t,-.4583333263408854*t)),i("&",new R(n),s)}{const t=r,s=t/2*Math.sqrt(3),n=(a+h)/2,e=n-t/2,o=e+t,d=0,H=s;i("<",new R([C.line4(H,e,d,n),C.line4(d,n,H,o)]),s),i(">",new R([C.line4(d,e,H,n),C.line4(H,n,d,o)]),s)}{const t=r*.9,s=t/2,n=t/2,e=n*Math.SQRT1_2,o=l.M(c,h+n);o.arc(s,h+n,s+e,h+n+e,"cw"),o.Q_angles(s,V,O),o.M(s,a-x),o.L(s,a),i("?",o.pathShape,t)}{const t=r*7/8,s=t/2,n=t,e=t/2,o=w.mHeight/8,d=h-o,H=a+o;if(H-d<e*4)throw new Error("wtf");const g=(d+H)/2,_=l.M(n,d).arc(n,d+e,s,d+e,"ccw").L(s,g-e).arc(c,g-e,c,g,"cw").arc(c,g+e,s,g+e,"cw").L(s,H-e).arc(n,H-e,n,H,"ccw").pathShape;i("{",_,t);const Q=l.M(c,d).arc(c,d+e,s,d+e,"cw").L(s,g-e).arc(n,g-e,n,g,"ccw").arc(n,g+e,s,g+e,"ccw").L(s,H-e).arc(c,H-e,c,H,"cw").pathShape;i("}",Q,t)}{const t=r,n=t/2,e=t;{const o=(E-a)*2,d=E,H=d-o,g=h-o/4,_=g+o;if(o<=0||d<=H||H<=_||_<=g)throw new Error("wtf");const Q=r*.5;{const m=l.M(Q,g).Q_HV(0,_).V(H).Q_VH(Q,d).pathShape;i("(",m,Q)}{const m=r*.5,S=l.M(0,g).Q_HV(m,_).V(H).Q_VH(0,d).pathShape;i(")",S,m)}{const m=l.M(Q,g).H(0).V(d).H(Q).pathShape;i("[",m,Q)}{const m=l.M(0,g).H(Q).V(d).H(0).pathShape;i("]",m,Q)}}{const o=r*.4,d=r*.3,H=c,g=H+o,_=g+d,Q=_+d,m=Q+o,S=m,y=r*.25,v=p,b=v-y,f=v+y,k=l.M(H,v).Q_angles(g,b,D,Y).Q_angles(_,v,(O+F)/2).Q_angles(Q,f,D).Q_angles(m,v,Y).pathShape;i("~",k,S)}{const o=r*.75,d=o/2,H=l.M(d,p-d).V(p+d).M(c,p).H(o).pathShape;i("+",H,o)}{const o=r*.75,d=l.M(c,p).H(o).pathShape;i("-",d,o)}{const o=r*.75,d=2*P,H=o+d,g=p-H/2,_=g+H,Q=g,m=g+o,S=(Q+m)/2,y=0,v=o,b=o/2,f=new R([new W(y,S,v,S),new W(b,Q,b,m),new W(y,_,v,_)]);i("±",f,o)}{const o=r*.75,d=0,H=o/2,g=o,_=2*P,Q=p,m=new R([new W(d,Q,g,Q),new W(H,Q-_-x,H,Q-_),new W(H,Q+_,H,Q+_+x)]);l.M(d,p).H(o).pathShape,i("÷",m,o)}{const o=r*.75*Math.SQRT1_2,d=p-o/2,H=p+o/2,g=0,_=o,Q=new R([new W(g,d,_,H),new W(_,d,g,H)]);i("×",Q,o)}{const o=r/2*.9,d=5,H=-Math.PI/2,g=(h+a)/2,_=0,Q=T.initializedArray(d,f=>{const k=f*(Math.PI*2)/d+H,B=T.polarToRectangular(_,k),z=T.polarToRectangular(o,k);return[B,z]}),m=Q.flat(),S=Math.min(...m.map(({x:f})=>f));m.forEach(f=>{f.x-=S,f.y+=g});const y=Q.map(([f,k])=>new W(f.x,f.y,k.x,k.y)),v=new R(y),b=Math.max(...m.map(({x:f})=>f));i("*",v,b)}{const o=r*.75,d=l.M(c,p-P*1.25).H(o).M(c,p+P*1.25).H(o).pathShape;i("=",d,o)}{const o=r*1.25,d=a+P,H=l.M(0,d).H(o).pathShape;i("_",H,o)}{const o=r/2,d=3*o,H=o/3,g=h,_=g+o,Q=_+o,m=Q+o,S=l.M(o+H,g).L(o-H,m).M(2*o+H,g).L(2*o-H,m).M(0,_).H(d).M(0,Q).H(d).pathShape;i("#",S,d)}{const o=r/2,d=3*o,H=0,g=o,_=d/2,Q=2*o,m=d,S=h+(w.mHeight-d)/2,y=S+g,v=S+_,b=S+Q,f=S+m,k=l.M(Q,v).Q_VH(_,y).Q_HV(g,v).Q_VH(_,b).Q_HV(Q,v).Q_VH((Q+m)/2,b).Q_HV(m,v).V((y+v)/2).Q_VH(_,S).Q_HV(H,v).Q_VH(_,f).H((Q+m)/2).pathShape;i("@",k,d)}{const o=l.M(n,h).Q(e,h,e,u).L(e,V).Q(e,a,n,a).Q(c,a,c,V).L(c,u).Q(c,h,n,h).M(e,u).L(c,V).pathShape;i("0",o,t)}{const o=l.M(c,u).Q(n,u,n,h).L(n,a).M(c,a).L(e,a).pathShape;i("1",o,t)}{const o=l.M(c,u).Q_VH(n,h).Q_HV(e,u).Q_VH(n,p).Q_HV(c,a).L(e,a).pathShape;i("2",o,t)}{const o=l.M(c,u).Q_VH(n,h).Q_HV(e,u).Q_VH(n,p).Q_HV(e,V).Q_VH(n,a).Q_HV(c,V).pathShape;i("3",o,t)}{const o=(n+e)/2,d=(n+c)/2,H=l.M(e,p).L(c,p).L(d,h).M(o,h).L(o,a).pathShape;i("4",H,t)}{const o=c+r/5,d=e-r/5,H=(p+V)/2,g=l.M(d,h).L(o,h).L(c,p).Q_VH(n,u).Q_HV(e,H).Q_VH(n,a).Q_HV(c,V).pathShape;i("5",g,t)}{const o=l.M(e,h).Q_HV(c,V).Q_VH(n,a).Q_HV(e,V).Q_VH(n,p).Q_HV(c,V).pathShape;i("6",o,t)}{const o=l.M(c,h).L(e,h).L(c,a).pathShape;i("7",o,t)}{const o=l.M(n,h).Q(e,h,e,u).Q(e,p,n,p).Q(c,p,c,V).Q(c,a,n,a).Q(e,a,e,V).Q(e,p,n,p).Q(c,p,c,u).Q(c,h,n,h).pathShape;i("8",o,t)}{const o=l.M(e,u).Q(e,h,n,h).Q(c,h,c,u).Q(c,p,n,p).Q(e,p,e,u).Q(e,a,c,a).pathShape;i("9",o,t)}}{const t=l.M(c,a).L(L/2,h).L(w.aWidth,a).M(w.aWidth/4,p).L(w.aWidth*.75,p).pathShape;i("A",t,L)}{const t=r,s=u-h;if(s<=0)throw new Error("wtf");const n=(t-s)*(2/3),e=a-V;if(e<=0)throw new Error("wtf");const o=t-e,d=l.M(c,a).L(c,h).L(n,h).Q_HV(n+s,h+s).Q(n+s,p,n,p).L(c,p).M(Math.max(o,n),p).Q_HV(o+e,a-e).Q_VH(o,a).L(c,a).pathShape;i("B",d,t)}{const t=r,n=t/2,e=t,o=l.M(e,u).Q(e,h,n,h).Q(c,h,c,u).L(c,V).Q(c,a,n,a).Q(e,a,e,V).pathShape;i("C",o,t)}{const t=r,n=t/2,e=t,o=l.M(c,h).L(c,a).L(n,a).Q(e,a,e,V).L(e,u).Q(e,h,n,h).L(c,h).pathShape;i("D",o,t)}{const t=r,s=t*(2/3),n=t,e=l.M(n,h).L(c,h).L(c,a).L(n,a).M(s,p).L(c,p).pathShape;i("E",e,t)}{const t=r,s=t*(2/3),n=t,e=l.M(n,h).L(c,h).L(c,a).M(s,p).L(c,p).pathShape;i("F",e,t)}{const t=r,n=t/2,e=t,o=l.M(e,u).Q(e,h,n,h).Q(c,h,c,u).L(c,V).Q(c,a,n,a).Q(e,a,e,V).L(e,p).L(n,p).pathShape;i("G",o,t)}{const t=r,s=t,n=l.M(c,h).L(c,a).M(s,h).L(s,a).M(c,p).L(s,p).pathShape;i("H",n,t)}{const t=w.mHeight/3,s=t/2,n=t,e=l.M(c,h).L(n,h).M(c,a).L(n,a).M(s,h).L(s,a).pathShape;i("I",e,t)}{const t=r*.85,n=t/2,e=t,o=l.M(e,h).L(e,V).Q(e,a,n,a).Q(c,a,c,V).pathShape;i("J",o,t)}{const t=r+P,s=(h+a)/2,n=l.M(c,h).L(c,a).M(t,h).L(c+.5,s).L(t,a).pathShape;i("K",n,t)}{const t=r,s=l.M(c,h).L(c,a).L(t,a).pathShape;i("L",s,t)}{const t=r*1.5,s=t/2,n=l.M(c,a).L(c,h).L(s,p).L(t,h).L(t,a).pathShape;i("M",n,t)}{const t=r*1.2,s=l.M(c,a).L(c,h).L(t,a).L(t,h).pathShape;i("N",s,t)}{const t=r*1.5,s=t/2,n=(h+a)/2,e=l.M(s,h).Q_HV(t,n).Q_VH(s,a).Q_HV(c,n).Q_VH(s,h).pathShape;i("O",e,t)}{const t=r,s=p-u;if(s<=0)throw new Error("wtf");const n=t-s,e=l.M(c,h).L(c,a).M(c,h).L(n,h).Q_HV(t,u).Q_VH(n,p).L(c,p).pathShape;i("P",e,t)}{const t=r*1.5,s=t/2,n=(h+a)/2,e=l.M(s,h).Q_HV(t,n).Q_VH(s,a).Q_HV(c,n).Q_VH(s,h).M(t-s*.75,a-s*.75).L(t+s/6,a+s/6).pathShape;i("Q",e,t)}{const t=r,s=p-u;if(s<=0)throw new Error("wtf");const n=t-s,e=l.M(c,h).L(c,a).M(c,h).L(n,h).Q_HV(t,u).Q_VH(n,p).L(c,p).M(n,p).L(t,a).pathShape;i("R",e,t)}{const t=r,s=r/2,n=r,e=l.M(n,u).Q_VH(s,h).Q_HV(c,u).Q_VH(s,p).Q_HV(n,V).Q_VH(s,a).Q_HV(c,V).pathShape;i("S",e,t)}{const s=r+P,n=s/2,e=s,o=w.mHeight/8,d=l.M(e,u).Q_VH(n,h).Q_HV(c,u).Q_VH(n,p).Q_HV(e,V).Q_VH(n,a).Q_HV(c,V).M(n,h-o).V(a+o).pathShape;i("$",d,s)}{const t=r,s=t/2,n=l.M(s,h).L(s,a).M(t,h).L(c,h).pathShape;i("T",n,t)}{const t=(V+p)/2,s=Math.abs(t-a)*.85,n=s*2,e=l.M(c,h).V(t).Q_VH(s,a).Q_HV(n,t).V(h).pathShape;i("U",e,n)}{const t=L,s=t/2,n=l.M(c,h).L(s,a).L(t,h).pathShape;i("V",n,t)}{const t=L*1.5,s=t/3,n=t/2,e=s*2,o=l.M(c,h).L(s,a).L(n,p).L(e,a).L(t,h).pathShape;i("W",o,t)}{const t=r,s=l.M(t,h).L(c,a).M(c,h).L(t,a).pathShape;i("X",s,t)}{const t=P,s=r+t,n=l.M(s,h).L(t,a).M(c,h).L(s/2,p).pathShape;i("Y",n,s)}{const t=r,s=l.M(c,h).H(t).L(c,a).H(t).pathShape;i("Z",s,t)}{const t=r/4,s=r*1.2,n=l.M(t*2,h+t).Q_VH(t,h).Q_HV(0,h+t).Q_VH(t,h+t*2).Q_HV(t*2,h+t),o=n.pathShape.translate(s-t*2,w.mHeight-t*2);n.addCommands(o.commands),n.M(s,h).L(c,a);const d=n.pathShape;i("%",d,s)}{const t=r,s=l.M(t,h).L(c,a).pathShape;i("/",s,t)}{const t=r,s=l.M(c,h).L(t,a).pathShape;i("\\",s,t)}{const t=r,s=t*.05,n=t+s,e=t/2,o=l.M(t,V).Q_VH(e,p).Q_HV(c,V).Q_VH(e,a).Q_HV(n,p).V(a).pathShape;i("a",o,n)}{const t=r,s=t*.05,n=t+s,e=s,o=s+t/2,d=n,H=l.M(e,V).Q_VH(o,a).Q_HV(d,V).Q_VH(o,p).Q_HV(c,a).V(h).pathShape;i("b",H,n)}{const t=r*.875,s=0,n=r/2,e=t,o=(p+V)/2,d=(V+a)/2,H=l.M(e,o).Q_VH(n,p).Q_HV(s,V).Q_VH(n,a).Q_HV(e,d).pathShape;i("c",H,t)}{const t=r,s=t*.05,n=t+s,e=t/2,o=l.M(n,h).L(n,a).Q_VH(e,p).Q_HV(c,V).Q_VH(e,a).Q_HV(t,V).pathShape;i("d",o,n)}const A=r/8;{const t=r,s=r/2,n=t,e=n-A,o=l.M(c,V).H(n).Q_VH(s,p).Q_HV(c,V).Q_VH(s,a).H(e).pathShape;i("e",o,t)}{const t=r*.75,s=t/2,n=t,e=l.M(n,h).Q_HV(s,u).V(a).M(n,p).H(c).pathShape;i("f",e,t)}{const t=r,s=t*.05,n=t+s,e=t/2,o=l.M(t,V).Q_VH(e,p).Q_HV(c,V).Q_VH(e,a).Q_HV(n,p).V(a).Q_VH(e,E).H(c+A).pathShape;i("g",o,n)}{const t=r*.85,s=t/2,n=l.M(c,h).V(a).Q_VH(s,p).Q_HV(t,V).V(a).pathShape;i("h",n,t)}{const s=l.M(c,p).V(a).M(c,u).V(u-x).pathShape;i("i",s,0)}{const t=Math.abs(a-E),s=t/2,n=l.M(t,p).V(a).Q_VH(s,E).Q_HV(c,a).M(t,u).V(u-x).pathShape;i("j",n,t)}{const s=l.M(c,a).V(a-x).pathShape;i(".",s,0)}{const s=l.M(c,h).V(V).M(c,a).V(a-x).pathShape;i("!",s,0)}{const s=(E-a)/2,n=s/2,e=l.M(c,a-x).V(a).Q_VH(-n,a+s).pathShape;i(",",e,0)}{const n=(E-a)/2+x,e=new R([new W(c,h,c,h+n)]);i("'",e,0)}{const s=(E-a)/2+x,n=s,e=s,o=new R([new W(c,h,e,h+s)]);i("`",o,n)}{const s=(E-a)/2+x,n=s,e=s*2,o=e,d=h,H=h+s,g=l.M(c,H).L(n,d).L(o,H).pathShape;i("^",g,e)}{const t=P*2,n=(E-a)/2+x,e=new R([new W(c,h,c,h+n),new W(t,h,t,h+n)]);i('"',e,t)}{const s=p,n=l.M(c,a).V(a-x).M(c,s-x).V(s).pathShape;i(":",n,0)}{const s=new R([new W(c,h,c,a)]);i("|",s,0)}{const s=p,n=(E-a)/2,e=n/2,o=l.M(c,a-x).V(a).Q_VH(-e,a+n).M(c,s-x).V(s).pathShape;i(";",o,0)}{const t=w.xHeight*2/3,s=r/10,n=t+s,e=l.M(c,h).V(a).M(t,p).L(c,p+t).M(t/2,a-t).L(n,a).pathShape;i("k",e,n)}{const s=l.M(c,h).V(a).pathShape;i("l",s,0)}{const t=r*1.5,s=t/4,n=t/2,e=t*3/4,o=t,d=l.M(c,p).V(a).Q_VH(s,p).Q_HV(n,V).V(a).M(n,V).Q_VH(e,p).Q_HV(o,V).V(a).pathShape;i("m",d,t)}{const t=r*.85,s=t/2,n=l.M(c,p).V(a).Q_VH(s,p).Q_HV(t,V).V(a).pathShape;i("n",n,t)}{const t=r,s=0,n=t/2,e=t,o=l.M(n,p).Q_HV(e,V).Q_VH(n,a).Q_HV(s,V).Q_VH(n,p).pathShape;i("o",o,t)}{const t=r,s=r*.05,n=t+s,e=s,o=s+t/2,d=n,H=l.M(e,V).Q_VH(o,p).Q_HV(d,V).Q_VH(o,a).Q_HV(c,p).V(E).pathShape;i("p",H,n)}{const t=r,s=t/2,n=r*.05,e=t+n,o=Math.abs(a-E),d=e+o/2,H=e+o,g=l.M(t,V).Q_VH(s,p).Q_HV(c,V).Q_VH(s,a).Q_HV(e,p).V(a).Q_VH(d,E).Q_HV(H,a).pathShape;i("q",g,H)}{const t=r,s=t/2,n=l.M(c,p).V(a).Q_VH(s,p).Q_HV(t,V).pathShape;i("r",n,t)}{const t=w.xHeight*2/3,s=t/2,n=a,e=V,o=p,d=(n+e)/2,H=(e+o)/2,g=(H+o)/2,_=(n+d)/2,Q=l.M(t,g).Q_VH(s,o).Q_HV(c,H).Q_VH(s,e).Q_HV(t,d).Q_VH(s,n).Q_HV(c,_).pathShape;i("s",Q,t)}{const t=r*.75,s=t/2,n=t,e=l.M(s,u).V(V).Q_VH(n,a).M(n,p).H(c).pathShape;i("t",e,t)}{const t=r*.85,s=t/2,n=l.M(c,p).V(V).Q_VH(s,a).Q_HV(t,p).L(t,a).pathShape;i("u",n,t)}{const t=r,s=t/2,n=l.M(c,p).L(s,a).L(t,p).pathShape;i("v",n,t)}{const t=w.xHeight*1.5,s=t/3,n=t/2,e=s*2,o=l.M(c,p).L(s,a).L(n,V).L(e,a).L(t,p).pathShape;i("w",o,t)}{const t=r,s=l.M(t,p).L(c,a).M(c,p).L(t,a).pathShape;i("x",s,t)}{const t=r,s=t/2,n=(p+E)/2,e=l.M(t,p).L(c,E).M(c,p).L(s,n).pathShape;i("y",e,t)}{const t=r,s=l.M(c,p).H(t).L(c,a).H(t).pathShape;i("z",s,t)}{const t=r/2,s=t/2,n=l.M(s,h).circle(s,h+s,"cw").pathShape;i("°",n,t)}{const t=-h,s=t/2,n=l.M(s,h).circle(s,h+s,"cw").pathShape;i("◯",n,t)}{const t=-h,s=t/2,n=h/2,e=l.M(0,n).arc(s,n,t,n,"cw").pathShape;i("◠",e,t)}{const t=-h,s=t/2,n=h/2,e=l.M(0,n).arc(s,n,t,n,"ccw").pathShape;i("◡",e,t)}{const t=-h,s=t/4,n=h+s,e=l.M(s*2,n).arc(s*3,n,t,n,"cw").Q_angles(s*2,a,G,O).Q_angles(0,n,I,J).arc(s,n,s*2,n,"cw").pathShape;i("♡",e,t)}{const t=w.mHeight,s=t/4,n=s;{const e=t,o=(h+a)/2,d=l.M(n,o-s).L(0,o).L(n,o+s).M(0,o).L(e,o).M(e-n,o-s).L(e,o).L(e-n,o+s);i("↔",d.pathShape,e);const H=new R(d.commands.slice(0,3));i("←",H,e);const g=new R(d.commands.slice(2,5));i("→",g,e)}{const o=s,d=s*2,H=d,g=l.M(0,h+n).L(o,h).L(H,h+n).M(o,h).L(o,a).M(0,a-n).L(o,a).L(H,a-n);i("↕",g.pathShape,d);const _=new R(g.commands.slice(0,3));i("↑",_,d);const Q=new R(g.commands.slice(2,5));i("↓",Q,d)}}{const t=w.mHeight,s=0,n=t/2,e=t,o=h,d=a,H=(o+d)/2,g=Math.PI/16,_=l.M(n,o).Q_angles(e,H,D+g,O-g).Q_angles(n,d,O+g,$-g).Q_angles(s,H,$+g,I-g).Q_angles(n,o,I+g,D-g).pathShape;i("✧",_,t)}{let t=function(Q,m){const S=Q.maxY-Q.minY,v=(m.bottom-m.top)/S,f=(Q.maxX-Q.minX)*v,k=0,B=f,z=T.makeBoundedLinear(Q.minX,k,Q.maxX,B),N=T.makeBoundedLinear(Q.minY,m.top,Q.maxY,m.bottom);return{x:z,y:N,advance:B}},s=function(){const Q={x:1/0,y:1/0},m={x:-1/0,y:-1/0};d.forEach(b=>{["x","y"].forEach(f=>{Q[f]=Math.min(Q[f],b[f]),m[f]=Math.max(m[f],b[f])})});const S={minX:Q.x,maxX:m.x,minY:Q.y,maxY:m.y},v=t(S,{top:h,bottom:a});return d.forEach(b=>{b.x=v.x(b.x),b.y=v.y(b.y)}),v};const o=I,d=T.initializedArray(5,Q=>{const m=o+Q*(2*Math.PI)*2/5;return T.polarToRectangular(1,m)}),H=s(),g=d.map((Q,m,S)=>{const y=S.at(m+1-S.length);return new W(Q.x,Q.y,y.x,y.y)});i("☆",new R(g),H.advance);const _=d.map((Q,m,S)=>{const y=S.at(m+1-S.length),v=Math.atan2(y.y-Q.y,y.x-Q.x),b=.175;return C.angles(Q.x,Q.y,v+b,y.x,y.y,v-b)});i("⭒",new R(_),H.advance)}return new Map([...M.entries()].sort(([t],[s])=>t<s?-1:t==s?1:0))}class X{restart(M=5,i=this.lineHeight){this.leftMargin=M,this.x=M,this.baseline=i}leftMargin=0;rightMargin=95;x=this.leftMargin;baseline=0;lineHeight=7.5;carriageReturn(){this.x=this.leftMargin}lineFeed(M=1){this.baseline+=this.lineHeight*M}CRLF(){this.carriageReturn(),this.lineFeed(4/3)}font=K(5);getDescription(M){return this.font.get(M)}static join(M){return new R(M.flatMap(i=>i.description.shape.translate(i.x,i.baseline).commands))}static displayText(M,i){return M.map(L=>{const r=L.description.shape,h=r.makeElement();return i.appendChild(h),h.style.transform=`translate(${L.x}px,${L.baseline}px)`,{...L,shape:r,element:h}})}static WORD_BREAK=/^(\n+| +|[^ \n]+)(.*)/ms;addText(M,i="left"){const L=new Set,r=[],h=[...r],u=()=>{if(i!="left"){const p=this.rightMargin-this.x;if(p>0){const V=i=="right"?p:p/2;h.forEach(a=>a.x+=V)}}h.length=0};for(;;){const p=X.WORD_BREAK.exec(M);if(!p)break;const V=p[1];if(M=p[2],V[0]==`
`)u(),this.carriageReturn(),this.lineFeed(V.length*4/3);else if(V[0]==" ")this.addSpace(V.length);else{let a=0;const E=0,P=[...V].flatMap(c=>{const x=this.getDescription(c);if(x){const A=x.advance+x.fontMetrics.defaultKerning,t={char:c,x:a,width:A,baseline:E,description:x};return a+=A,t}else return L.add(c),[]});this.x+a>this.rightMargin&&this.x>this.leftMargin&&(u(),this.carriageReturn(),this.lineFeed()),P.forEach(c=>{c.x+=this.x,c.baseline=this.baseline,r.push(c),h.push(c)}),this.x+=a}}return u(),L.size>0&&console.warn(L),r}addSpace(M=1){this.x+=this.font.get("0").fontMetrics.spaceWidth*M}static textToShape(M,i){const L=new X;L.font=i;const r=L.addText(M),h=X.join(r),u=L.x;return{shape:h,advance:u}}}class nt{constructor(M){this.element=M}leftMargin=5;rightMargin=95;x=this.leftMargin;baseline=10;lineHeight=7.5;carriageReturn(){this.x=this.leftMargin}lineFeed(M=1){this.baseline+=this.lineHeight*M}CRLF(){this.carriageReturn(),this.lineFeed(4/3)}font=K(5);getDescription(M){return this.font.get(M)}makeRoom(M){this.x+M.advance>this.rightMargin&&this.x>this.leftMargin&&(this.carriageReturn(),this.lineFeed())}advance(M){this.x+=M.advance+M.fontMetrics.defaultKerning}moveToCursor(M){M.style.transform=`translate(${this.x}px,${this.baseline}px)`}showAndAdvance(M,i){return this.x+i>this.rightMargin&&this.x>this.leftMargin&&(this.carriageReturn(),this.lineFeed()),this.element.appendChild(M),M.style.transform=`translate(${this.x}px,${this.baseline}px)`,this.x+=i,this}show1(M){this.makeRoom(M);const i=M.makeElement();this.element.appendChild(i);const{x:L,baseline:r}=this;return this.moveToCursor(i),this.advance(M),{element:i,x:L,baseline:r}}splitAndShow1(M){this.makeRoom(M);const i=M.makeElements();return i.forEach(({element:L})=>{this.element.appendChild(L),this.moveToCursor(L)}),this.advance(M),i}show(M){const i=new Set,L=[...M].flatMap(r=>{const h=this.getDescription(r);return h?{...this.show1(h),description:h,char:r}:r==" "?(this.showSpace(),[]):(i.add(r),[])});return i.size>0&&console.warn(i),L}splitAndShow(M){const i=new Set,L=[...M].flatMap(r=>{const h=this.getDescription(r);return h?this.splitAndShow1(h):r==" "?(this.showSpace(),[]):(i.add(r),[])});return i.size>0&&console.warn(i),L}showSpace(M=1){return this.x+=this.font.get("0").fontMetrics.spaceWidth*M,this}}export{q as D,j as F,X as T,nt as W,tt as d,K as m};