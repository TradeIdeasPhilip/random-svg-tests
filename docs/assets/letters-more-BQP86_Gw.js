import{i as z,b as Y}from"./client-misc-DWuUZUgy.js";import{a as X}from"./utility-CsOzd0ZV.js";import{P as W,Q as C,a as d,L as P}from"./path-shape-BZC9YcLk.js";class G{constructor(H,h=H/10){if(this.fontSize=H,this.strokeWidth=h,H<=0||!isFinite(H))throw new Error("wtf")}get mHeight(){return this.fontSize}get xHeight(){return this.fontSize*.5}get aWidth(){return this.fontSize*.75}get digitWidth(){return this.fontSize*.5}get defaultKerning(){return this.strokeWidth*2.5}get spaceWidth(){return this.strokeWidth+this.digitWidth/2}get top(){return this.capitalTop-this.mHeight/4}get capitalTop(){return this.baseline-this.mHeight}get capitalTopMiddle(){return(this.capitalTop+this.capitalMiddle)/2}get capitalMiddle(){return this.baseline-this.xHeight}get capitalBottomMiddle(){return(this.baseline+this.capitalMiddle)/2}get baseline(){return 0}get descender(){return this.mHeight/4}get bottom(){return this.descender+this.mHeight/4}}class J{constructor(H,h,_){this.advance=h,this.fontMetrics=_,H instanceof W?this.#t=()=>H:this.#t=H}#t;get shape(){return this.#t()}get cssPath(){return this.shape.cssPath}get d(){return this.shape.rawPath}makeElement(){return this.shape.makeElement()}makeElements(){return this.shape.splitOnMove().map(H=>({innerShape:H,element:H.makeElement()}))}}function st(S){function H(r){return r.length==1}let h="",_=[];return S.forEach((r,c)=>{H(c)?h+=c:_.push(r)}),{normal:h,special:_}}const B=0,F=Math.PI/4,T=2*F,U=3*F,K=4*F,Z=5*F,D=6*F,N=7*F;function j(S){const H=new Map;typeof S=="number"&&(S=new G(S));const h=(t,e,n)=>{const s=new J(e,n,S);if(H.has(t))throw new Error(`duplicate letter: "${t}", previous letter: "${[...H].at(-1)[0]}"`);H.set(t,s)},{aWidth:_,digitWidth:r,capitalTop:c,capitalTopMiddle:m,capitalMiddle:p,capitalBottomMiddle:Q,baseline:a,descender:w,strokeWidth:y}=S,o=0,E=y/3;{const t=S.mHeight,e=.5803571598560251*t,n=[];n.push(C.controlPoints(.5803571598560251*t,-.011904772996231272*t,.1993461912459357*t,-.4845653833822309*t,.15178572549774305*t,-.5833333559985097*t)),n.push(C.controlPoints(.15178572549774305*t,-.5833333559985097*t,.07142858010885174*t,-.7502096094253163*t,.07142858010885174*t,-.8809523915616125*t)),n.push(C.controlPoints(.07142858010885174*t,-.8809523915616125*t,.07142858010885174*t,-1*t,.18154763484090689*t,-1*t)),n.push(C.controlPoints(.18154763484090689*t,-1*t,.3125000278492327*t,-1*t,.3125000278492327*t,-.8809523857747589*t)),n.push(C.controlPoints(.3125000278492327*t,-.8809523857747589*t,.3125000278492327*t,-.795672021064033*t,.14880952935525849*t,-.5863095347804337*t)),n.push(C.controlPoints(.14880952935525849*t,-.5863095347804337*t,0*t,-.39598002063544424*t,0*t,-.23511904966855834*t)),n.push(C.controlPoints(0*t,-.23511904966855834*t,0*t,0*t,.16369048113341364*t,0*t)),n.push(C.controlPoints(.16369048113341364*t,0*t,.31699631330709954*t,0*t,.45535713019840074*t,-.4583333263408854*t)),h("&",new W(n),e)}{const t=r,e=t/2*Math.sqrt(3),n=(a+c)/2,s=n-t/2,i=s+t,l=0,M=e;h("<",new W([C.line4(M,s,l,n),C.line4(l,n,M,i)]),e),h(">",new W([C.line4(l,s,M,n),C.line4(M,n,l,i)]),e)}{const t=r*.9,e=t/2,n=t/2,s=n*Math.SQRT1_2,i=d.M(o,c+n);i.arc(e,c+n,e+s,c+n+s,"cw"),i.Q_angles(e,Q,T),i.M(e,a-E),i.L(e,a),h("?",i.pathShape,t)}{const t=r*7/8,e=t/2,n=t,s=t/2,i=S.mHeight/8,l=c-i,M=a+i;if(M-l<s*4)throw new Error("wtf");const g=(l+M)/2,L=d.M(n,l).arc(n,l+s,e,l+s,"ccw").L(e,g-s).arc(o,g-s,o,g,"cw").arc(o,g+s,e,g+s,"cw").L(e,M-s).arc(n,M-s,n,M,"ccw").pathShape;h("{",L,t);const V=d.M(o,l).arc(o,l+s,e,l+s,"cw").L(e,g-s).arc(n,g-s,n,g,"ccw").arc(n,g+s,e,g+s,"ccw").L(e,M-s).arc(o,M-s,o,M,"cw").pathShape;h("}",V,t)}{const t=r,n=t/2,s=t;{const i=(w-a)*2,l=w,M=l-i,g=c-i/4,L=g+i;if(i<=0||l<=M||M<=L||L<=g)throw new Error("wtf");const V=r*.5;{const u=d.M(V,g).Q_HV(0,L).V(M).Q_VH(V,l).pathShape;h("(",u,V)}{const u=r*.5,f=d.M(0,g).Q_HV(u,L).V(M).Q_VH(0,l).pathShape;h(")",f,u)}{const u=d.M(V,g).H(0).V(l).H(V).pathShape;h("[",u,V)}{const u=d.M(0,g).H(V).V(l).H(0).pathShape;h("]",u,V)}}{const i=r*.4,l=r*.3,M=o,g=M+i,L=g+l,V=L+l,u=V+i,f=u,R=r*.25,x=p,b=x-R,v=x+R,k=d.M(M,x).Q_angles(g,b,B,N).Q_angles(L,x,(T+F)/2).Q_angles(V,v,B).Q_angles(u,x,N).pathShape;h("~",k,f)}{const i=r*.75,l=i/2,M=d.M(l,p-l).V(p+l).M(o,p).H(i).pathShape;h("+",M,i)}{const i=r*.75,l=d.M(o,p).H(i).pathShape;h("-",l,i)}{const i=r/2*.9,l=5,M=-Math.PI/2,g=(c+a)/2,L=0,V=z(l,v=>{const k=v*(Math.PI*2)/l+M,A=X(L,k),O=X(i,k);return[A,O]}),u=V.flat(),f=Math.min(...u.map(({x:v})=>v));u.forEach(v=>{v.x-=f,v.y+=g});const R=V.map(([v,k])=>new P(v.x,v.y,k.x,k.y)),x=new W(R),b=Math.max(...u.map(({x:v})=>v));h("*",x,b)}{const i=r*.75,l=d.M(o,p-y*1.25).H(i).M(o,p+y*1.25).H(i).pathShape;h("=",l,i)}{const i=r*1.25,l=a+y,M=d.M(0,l).H(i).pathShape;h("_",M,i)}{const i=r/2,l=3*i,M=i/3,g=c,L=g+i,V=L+i,u=V+i,f=d.M(i+M,g).L(i-M,u).M(2*i+M,g).L(2*i-M,u).M(0,L).H(l).M(0,V).H(l).pathShape;h("#",f,l)}{const i=r/2,l=3*i,M=0,g=i,L=l/2,V=2*i,u=l,f=c+(S.mHeight-l)/2,R=f+g,x=f+L,b=f+V,v=f+u,k=d.M(V,x).Q_VH(L,R).Q_HV(g,x).Q_VH(L,b).Q_HV(V,x).Q_VH((V+u)/2,b).Q_HV(u,x).V((R+x)/2).Q_VH(L,f).Q_HV(M,x).Q_VH(L,v).H((V+u)/2).pathShape;h("@",k,l)}{const i=d.M(n,c).Q(s,c,s,m).L(s,Q).Q(s,a,n,a).Q(o,a,o,Q).L(o,m).Q(o,c,n,c).M(s,m).L(o,Q).pathShape;h("0",i,t)}{const i=d.M(o,m).Q(n,m,n,c).L(n,a).M(o,a).L(s,a).pathShape;h("1",i,t)}{const i=d.M(o,m).Q_VH(n,c).Q_HV(s,m).Q_VH(n,p).Q_HV(o,a).L(s,a).pathShape;h("2",i,t)}{const i=d.M(o,m).Q_VH(n,c).Q_HV(s,m).Q_VH(n,p).Q_HV(s,Q).Q_VH(n,a).Q_HV(o,Q).pathShape;h("3",i,t)}{const i=(n+s)/2,l=(n+o)/2,M=d.M(s,p).L(o,p).L(l,c).M(i,c).L(i,a).pathShape;h("4",M,t)}{const i=o+r/5,l=s-r/5,M=(p+Q)/2,g=d.M(l,c).L(i,c).L(o,p).Q_VH(n,m).Q_HV(s,M).Q_VH(n,a).Q_HV(o,Q).pathShape;h("5",g,t)}{const i=d.M(s,c).Q_HV(o,Q).Q_VH(n,a).Q_HV(s,Q).Q_VH(n,p).Q_HV(o,Q).pathShape;h("6",i,t)}{const i=d.M(o,c).L(s,c).L(o,a).pathShape;h("7",i,t)}{const i=d.M(n,c).Q(s,c,s,m).Q(s,p,n,p).Q(o,p,o,Q).Q(o,a,n,a).Q(s,a,s,Q).Q(s,p,n,p).Q(o,p,o,m).Q(o,c,n,c).pathShape;h("8",i,t)}{const i=d.M(s,m).Q(s,c,n,c).Q(o,c,o,m).Q(o,p,n,p).Q(s,p,s,m).Q(s,a,o,a).pathShape;h("9",i,t)}}{const t=d.M(o,a).L(_/2,c).L(S.aWidth,a).M(S.aWidth/4,p).L(S.aWidth*.75,p).pathShape;h("A",t,_)}{const t=r,e=m-c;if(e<=0)throw new Error("wtf");const n=(t-e)*(2/3),s=a-Q;if(s<=0)throw new Error("wtf");const i=t-s,l=d.M(o,a).L(o,c).L(n,c).Q_HV(n+e,c+e).Q(n+e,p,n,p).L(o,p).M(Math.max(i,n),p).Q_HV(i+s,a-s).Q_VH(i,a).L(o,a).pathShape;h("B",l,t)}{const t=r,n=t/2,s=t,i=d.M(s,m).Q(s,c,n,c).Q(o,c,o,m).L(o,Q).Q(o,a,n,a).Q(s,a,s,Q).pathShape;h("C",i,t)}{const t=r,n=t/2,s=t,i=d.M(o,c).L(o,a).L(n,a).Q(s,a,s,Q).L(s,m).Q(s,c,n,c).L(o,c).pathShape;h("D",i,t)}{const t=r,e=t*(2/3),n=t,s=d.M(n,c).L(o,c).L(o,a).L(n,a).M(e,p).L(o,p).pathShape;h("E",s,t)}{const t=r,e=t*(2/3),n=t,s=d.M(n,c).L(o,c).L(o,a).M(e,p).L(o,p).pathShape;h("F",s,t)}{const t=r,n=t/2,s=t,i=d.M(s,m).Q(s,c,n,c).Q(o,c,o,m).L(o,Q).Q(o,a,n,a).Q(s,a,s,Q).L(s,p).L(n,p).pathShape;h("G",i,t)}{const t=r,e=t,n=d.M(o,c).L(o,a).M(e,c).L(e,a).M(o,p).L(e,p).pathShape;h("H",n,t)}{const t=S.mHeight/3,e=t/2,n=t,s=d.M(o,c).L(n,c).M(o,a).L(n,a).M(e,c).L(e,a).pathShape;h("I",s,t)}{const t=r*.85,n=t/2,s=t,i=d.M(s,c).L(s,Q).Q(s,a,n,a).Q(o,a,o,Q).pathShape;h("J",i,t)}{const t=r+y,e=(c+a)/2,n=d.M(o,c).L(o,a).M(t,c).L(o+.5,e).L(t,a).pathShape;h("K",n,t)}{const t=r,e=d.M(o,c).L(o,a).L(t,a).pathShape;h("L",e,t)}{const t=r*1.5,e=t/2,n=d.M(o,a).L(o,c).L(e,p).L(t,c).L(t,a).pathShape;h("M",n,t)}{const t=r*1.2,e=d.M(o,a).L(o,c).L(t,a).L(t,c).pathShape;h("N",e,t)}{const t=r*1.5,e=t/2,n=(c+a)/2,s=d.M(e,c).Q_HV(t,n).Q_VH(e,a).Q_HV(o,n).Q_VH(e,c).pathShape;h("O",s,t)}{const t=r,e=p-m;if(e<=0)throw new Error("wtf");const n=t-e,s=d.M(o,c).L(o,a).M(o,c).L(n,c).Q_HV(t,m).Q_VH(n,p).L(o,p).pathShape;h("P",s,t)}{const t=r*1.5,e=t/2,n=(c+a)/2,s=d.M(e,c).Q_HV(t,n).Q_VH(e,a).Q_HV(o,n).Q_VH(e,c).M(t-e*.75,a-e*.75).L(t+e/6,a+e/6).pathShape;h("Q",s,t)}{const t=r,e=p-m;if(e<=0)throw new Error("wtf");const n=t-e,s=d.M(o,c).L(o,a).M(o,c).L(n,c).Q_HV(t,m).Q_VH(n,p).L(o,p).M(n,p).L(t,a).pathShape;h("R",s,t)}{const t=r,e=r/2,n=r,s=d.M(n,m).Q_VH(e,c).Q_HV(o,m).Q_VH(e,p).Q_HV(n,Q).Q_VH(e,a).Q_HV(o,Q).pathShape;h("S",s,t)}{const e=r+y,n=e/2,s=e,i=S.mHeight/8,l=d.M(s,m).Q_VH(n,c).Q_HV(o,m).Q_VH(n,p).Q_HV(s,Q).Q_VH(n,a).Q_HV(o,Q).M(n,c-i).V(a+i).pathShape;h("$",l,e)}{const t=r,e=t/2,n=d.M(e,c).L(e,a).M(t,c).L(o,c).pathShape;h("T",n,t)}{const t=(Q+p)/2,e=Math.abs(t-a)*.85,n=e*2,s=d.M(o,c).V(t).Q_VH(e,a).Q_HV(n,t).V(c).pathShape;h("U",s,n)}{const t=_,e=t/2,n=d.M(o,c).L(e,a).L(t,c).pathShape;h("V",n,t)}{const t=_*1.5,e=t/3,n=t/2,s=e*2,i=d.M(o,c).L(e,a).L(n,p).L(s,a).L(t,c).pathShape;h("W",i,t)}{const t=r,e=d.M(t,c).L(o,a).M(o,c).L(t,a).pathShape;h("X",e,t)}{const t=y,e=r+t,n=d.M(e,c).L(t,a).M(o,c).L(e/2,p).pathShape;h("Y",n,e)}{const t=r,e=d.M(o,c).H(t).L(o,a).H(t).pathShape;h("Z",e,t)}{const t=r/4,e=r*1.2,n=d.M(t*2,c+t).Q_VH(t,c).Q_HV(0,c+t).Q_VH(t,c+t*2).Q_HV(t*2,c+t),i=n.pathShape.translate(e-t*2,S.mHeight-t*2);n.addCommands(i.commands),n.M(e,c).L(o,a);const l=n.pathShape;h("%",l,e)}{const t=r,e=d.M(t,c).L(o,a).pathShape;h("/",e,t)}{const t=r,e=d.M(o,c).L(t,a).pathShape;h("\\",e,t)}{const t=r,e=y/2,n=t+e,s=t/2,i=d.M(s,p).Q_HV(o,Q).Q_VH(s,a).Q_HV(t,Q).Q_VH(s,p).M(n,p).L(n,a).pathShape;h("a",i,n)}{const t=r,e=y/2,n=t+e,s=e,i=e+t/2,l=n,M=d.M(o,c).V(a).M(s,Q).Q_VH(i,a).Q_HV(l,Q).Q_VH(i,p).Q_HV(s,Q).pathShape;h("b",M,n)}{const t=r*.875,e=0,n=r/2,s=t,i=(p+Q)/2,l=(Q+a)/2,M=d.M(s,i).Q_VH(n,p).Q_HV(e,Q).Q_VH(n,a).Q_HV(s,l).pathShape;h("c",M,t)}{const t=r,e=y/2,n=t+e,s=t/2,i=d.M(s,p).Q_HV(o,Q).Q_VH(s,a).Q_HV(t,Q).Q_VH(s,p).M(n,c).L(n,a).pathShape;h("d",i,n)}const $=r/8;{const t=r,e=r/2,n=t,s=n-$,i=d.M(o,Q).H(n).Q_VH(e,p).Q_HV(o,Q).Q_VH(e,a).H(s).pathShape;h("e",i,t)}{const t=r*.75,e=t/2,n=t,s=d.M(n,c).Q_HV(e,m).V(a).M(n,p).H(o).pathShape;h("f",s,t)}{const t=r,e=y/2,n=t+e,s=t/2,i=d.M(s,p).Q_HV(o,Q).Q_VH(s,a).Q_HV(t,Q).Q_VH(s,p).M(n,p).V(a).Q_VH(s,w).H(o+$).pathShape;h("g",i,n)}{const t=r*.85,e=t/2,n=d.M(o,c).V(a).Q_VH(e,p).Q_HV(t,Q).V(a).pathShape;h("h",n,t)}{const e=d.M(o,p).V(a).M(o,m).V(m-E).pathShape;h("i",e,0)}{const t=Math.abs(a-w),e=t/2,n=d.M(t,p).V(a).Q_VH(e,w).Q_HV(o,a).M(t,m).V(m-E).pathShape;h("j",n,t)}{const e=d.M(o,a).V(a-E).pathShape;h(".",e,0)}{const e=d.M(o,c).V(Q).M(o,a).V(a-E).pathShape;h("!",e,0)}{const e=(w-a)/2,n=e/2,s=d.M(o,a-E).V(a).Q_VH(-n,a+e).pathShape;h(",",s,0)}{const n=(w-a)/2+E,s=new W([new P(o,c,o,c+n)]);h("'",s,0)}{const e=(w-a)/2+E,n=e,s=e,i=new W([new P(o,c,s,c+e)]);h("`",i,n)}{const e=(w-a)/2+E,n=e,s=e*2,i=s,l=c,M=c+e,g=d.M(o,M).L(n,l).L(i,M).pathShape;h("^",g,s)}{const t=y*2,n=(w-a)/2+E,s=new W([new P(o,c,o,c+n),new P(t,c,t,c+n)]);h('"',s,t)}{const e=p,n=d.M(o,a).V(a-E).M(o,e-E).V(e).pathShape;h(":",n,0)}{const e=new W([new P(o,c,o,a)]);h("|",e,0)}{const e=p,n=(w-a)/2,s=n/2,i=d.M(o,a-E).V(a).Q_VH(-s,a+n).M(o,e-E).V(e).pathShape;h(";",i,0)}{const t=S.xHeight*2/3,e=r/10,n=t+e,s=d.M(o,c).V(a).M(t,p).L(o,p+t).M(t/2,a-t).L(n,a).pathShape;h("k",s,n)}{const e=d.M(o,c).V(a).pathShape;h("l",e,0)}{const t=r*1.5,e=t/4,n=t/2,s=t*3/4,i=t,l=d.M(o,p).V(a).Q_VH(e,p).Q_HV(n,Q).V(a).M(n,Q).Q_VH(s,p).Q_HV(i,Q).V(a).pathShape;h("m",l,t)}{const t=r*.85,e=t/2,n=d.M(o,p).V(a).Q_VH(e,p).Q_HV(t,Q).V(a).pathShape;h("n",n,t)}{const t=r,e=0,n=t/2,s=t,i=d.M(n,p).Q_HV(s,Q).Q_VH(n,a).Q_HV(e,Q).Q_VH(n,p).pathShape;h("o",i,t)}{const t=r,e=y/2,n=t+e,s=e,i=e+t/2,l=n,M=d.M(o,p).V(w).M(s,Q).Q_VH(i,p).Q_HV(l,Q).Q_VH(i,a).Q_HV(s,Q).pathShape;h("p",M,n)}{const t=r,e=t/2,n=t+y/2,s=Math.abs(a-w),i=n+s/2,l=n+s,M=d.M(e,p).Q_HV(o,Q).Q_VH(e,a).Q_HV(t,Q).Q_VH(e,p).M(n,p).V(a).Q_VH(i,w).Q_HV(l,a).pathShape;h("q",M,l)}{const t=r,e=t/2,n=d.M(o,p).V(a).Q_VH(e,p).Q_HV(t,Q).pathShape;h("r",n,t)}{const t=S.xHeight*2/3,e=t/2,n=a,s=Q,i=p,l=(n+s)/2,M=(s+i)/2,g=(M+i)/2,L=(n+l)/2,V=d.M(t,g).Q_VH(e,i).Q_HV(o,M).Q_VH(e,s).Q_HV(t,l).Q_VH(e,n).Q_HV(o,L).pathShape;h("s",V,t)}{const t=r*.75,e=t/2,n=t,s=d.M(e,m).V(Q).Q_VH(n,a).M(n,p).H(o).pathShape;h("t",s,t)}{const t=r*.85,e=t/2,n=d.M(o,p).V(Q).Q_VH(e,a).Q_HV(t,p).L(t,a).pathShape;h("u",n,t)}{const t=r,e=t/2,n=d.M(o,p).L(e,a).L(t,p).pathShape;h("v",n,t)}{const t=S.xHeight*1.5,e=t/3,n=t/2,s=e*2,i=d.M(o,p).L(e,a).L(n,Q).L(s,a).L(t,p).pathShape;h("w",i,t)}{const t=r,e=d.M(t,p).L(o,a).M(o,p).L(t,a).pathShape;h("x",e,t)}{const t=r,e=t/2,n=(p+w)/2,s=d.M(t,p).L(o,w).M(o,p).L(e,n).pathShape;h("y",s,t)}{const t=r,e=d.M(o,p).H(t).L(o,a).H(t).pathShape;h("z",e,t)}{const t=r/2,e=t/2,n=d.M(e,c).circle(e,c+e,"cw").pathShape;h("°",n,t)}{const t=-c,e=t/2,n=d.M(e,c).circle(e,c+e,"cw").pathShape;h("◯",n,t)}{const t=-c,e=t/2,n=c/2,s=d.M(0,n).arc(e,n,t,n,"cw").pathShape;h("◠",s,t)}{const t=-c,e=t/2,n=c/2,s=d.M(0,n).arc(e,n,t,n,"ccw").pathShape;h("◡",s,t)}{const t=-c,e=t/4,n=c+e,s=d.M(e*2,n).arc(e*3,n,t,n,"cw").Q_angles(e*2,a,U,T).Q_angles(0,n,D,Z).arc(e,n,e*2,n,"cw").pathShape;h("♡",s,t)}{const t=S.mHeight,e=t/4,n=e;{const s=t,i=(c+a)/2,l=d.M(n,i-e).L(0,i).L(n,i+e).M(0,i).L(s,i).M(s-n,i-e).L(s,i).L(s-n,i+e);h("↔",l.pathShape,s);const M=new W(l.commands.slice(0,3));h("←",M,s);const g=new W(l.commands.slice(2,5));h("→",g,s)}{const i=e,l=e*2,M=l,g=d.M(0,c+n).L(i,c).L(M,c+n).M(i,c).L(i,a).M(0,a-n).L(i,a).L(M,a-n);h("↕",g.pathShape,l);const L=new W(g.commands.slice(0,3));h("↑",L,l);const V=new W(g.commands.slice(2,5));h("↓",V,l)}}{const t=S.mHeight,e=0,n=t/2,s=t,i=c,l=a,M=(i+l)/2,g=Math.PI/16,L=d.M(n,i).Q_angles(s,M,B+g,T-g).Q_angles(n,l,T+g,K-g).Q_angles(e,M,K+g,D-g).Q_angles(n,i,D+g,B-g).pathShape;h("✧",L,t)}{let t=function(V,u){const f=V.maxY-V.minY,x=(u.bottom-u.top)/f,v=(V.maxX-V.minX)*x,k=0,A=v,O=Y(V.minX,k,V.maxX,A),q=Y(V.minY,u.top,V.maxY,u.bottom);return{x:O,y:q,advance:A}},e=function(){const V={x:1/0,y:1/0},u={x:-1/0,y:-1/0};l.forEach(b=>{["x","y"].forEach(v=>{V[v]=Math.min(V[v],b[v]),u[v]=Math.max(u[v],b[v])})});const f={minX:V.x,maxX:u.x,minY:V.y,maxY:u.y},x=t(f,{top:c,bottom:a});return l.forEach(b=>{b.x=x.x(b.x),b.y=x.y(b.y)}),x};const i=D,l=z(5,V=>{const u=i+V*(2*Math.PI)*2/5;return X(1,u)}),M=e(),g=l.map((V,u,f)=>{const R=f.at(u+1-f.length);return new P(V.x,V.y,R.x,R.y)});h("☆",new W(g),M.advance);const L=l.map((V,u,f)=>{const R=f.at(u+1-f.length),x=Math.atan2(R.y-V.y,R.x-V.x),b=.175;return C.angles(V.x,V.y,x+b,R.x,R.y,x-b)});h("⭒",new W(L),M.advance)}return new Map([...H.entries()].sort(([t],[e])=>t<e?-1:t==e?1:0))}class I{restart(H=5,h=this.lineHeight){this.leftMargin=H,this.x=H,this.baseline=h}leftMargin=0;rightMargin=95;x=this.leftMargin;baseline=0;lineHeight=7.5;carriageReturn(){this.x=this.leftMargin}lineFeed(H=1){this.baseline+=this.lineHeight*H}CRLF(){this.carriageReturn(),this.lineFeed(4/3)}font=j(5);getDescription(H){return this.font.get(H)}static join(H){return new W(H.flatMap(h=>h.description.shape.translate(h.x,h.baseline).commands))}displayText(H,h){return H.map(_=>{const r=_.description.shape,c=r.makeElement();return h.appendChild(c),c.style.transform=`translate(${_.x}px,${_.baseline}px)`,{..._,shape:r,element:c}})}static WORD_BREAK=/^(\n+| +|[^ \n]+)(.*)/ms;addText(H){const h=new Set,_=[];for(;;){const r=I.WORD_BREAK.exec(H);if(!r)break;const c=r[1];if(H=r[2],c[0]==`
`)this.carriageReturn(),this.lineFeed(c.length*4/3);else if(c[0]==" ")this.addSpace(c.length);else{let m=0;const p=0,Q=[...c].flatMap(a=>{const w=this.getDescription(a);if(w){const y=w.advance+w.fontMetrics.defaultKerning,o={char:a,x:m,width:y,baseline:p,description:w};return m+=y,o}else return h.add(a),[]});this.x+m>this.rightMargin&&this.x>this.leftMargin&&(this.carriageReturn(),this.lineFeed()),Q.forEach(a=>{a.x+=this.x,a.baseline=this.baseline,_.push(a)}),this.x+=m}}return h.size>0&&console.warn(h),_}addSpace(H=1){this.x+=this.font.get("0").fontMetrics.spaceWidth*H}static textToShape(H,h){const _=new I;_.font=h;const r=_.addText(H),c=I.join(r),m=_.x;return{shape:c,advance:m}}}class at{constructor(H){this.element=H}leftMargin=5;rightMargin=95;x=this.leftMargin;baseline=10;lineHeight=7.5;carriageReturn(){this.x=this.leftMargin}lineFeed(H=1){this.baseline+=this.lineHeight*H}CRLF(){this.carriageReturn(),this.lineFeed(4/3)}font=j(5);getDescription(H){return this.font.get(H)}makeRoom(H){this.x+H.advance>this.rightMargin&&this.x>this.leftMargin&&(this.carriageReturn(),this.lineFeed())}advance(H){this.x+=H.advance+H.fontMetrics.defaultKerning}moveToCursor(H){H.style.transform=`translate(${this.x}px,${this.baseline}px)`}showAndAdvance(H,h){return this.x+h>this.rightMargin&&this.x>this.leftMargin&&(this.carriageReturn(),this.lineFeed()),this.element.appendChild(H),H.style.transform=`translate(${this.x}px,${this.baseline}px)`,this.x+=h,this}show1(H){this.makeRoom(H);const h=H.makeElement();this.element.appendChild(h);const{x:_,baseline:r}=this;return this.moveToCursor(h),this.advance(H),{element:h,x:_,baseline:r}}splitAndShow1(H){this.makeRoom(H);const h=H.makeElements();return h.forEach(({element:_})=>{this.element.appendChild(_),this.moveToCursor(_)}),this.advance(H),h}show(H){const h=new Set,_=[...H].flatMap(r=>{const c=this.getDescription(r);return c?{...this.show1(c),description:c,char:r}:r==" "?(this.showSpace(),[]):(h.add(r),[])});return h.size>0&&console.warn(h),_}splitAndShow(H){const h=new Set,_=[...H].flatMap(r=>{const c=this.getDescription(r);return c?this.splitAndShow1(c):r==" "?(this.showSpace(),[]):(h.add(r),[])});return h.size>0&&console.warn(h),_}showSpace(H=1){return this.x+=this.font.get("0").fontMetrics.spaceWidth*H,this}}export{J as D,G as F,I as T,at as W,st as d,j as m};