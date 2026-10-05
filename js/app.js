const fractal=document.getElementById("fractal"),$=id=>document.getElementById(id);let view={xmin:-2.2,xmax:1.2,ymin:-1.3,ymax:1.3},drag=null,compiled=null,lastPoint=null;const animator=new OrbitAnimator(document.getElementById("orbit"),$("orbitInfo"),$("status"));const presets={mandelbrot:["Mandelbrot","z^2 + c","quadratic",0,0,-2.2,1.2,-1.3,1.3],julia:["Julia","z^2 + c₀","quadratic",-0.8,.156,-2,2,-2,2],poly:["Polinomio","z^3 + 0.2z + c","polynomial",0,0,-1.7,1.7,-1.3,1.3],sine:["Seno","sin(z) + c","sine",0,0,-3,3,-2.2,2.2],cosine:["Coseno","cos(z) + c","cosine",0,0,-3,3,-2.2,2.2],exp:["Exponencial","exp(z) + c","exp",0,0,-2,2,-2,2]};function options(){const p=presets[$("preset").value];let ast=null;if($("preset").value==="poly"){try{ast=parseExpression($("expression").value)}catch(e){return null}}return{type:p[2],preset:$("preset").value,expression:$("expression").value,ast,cre:+$("cre").value,cim:+$("cim").value,maxIter:+$("iterations").value,escape:+$("escape").value,resolution:+$("resolution").value,smooth:$("smooth").value==="true"}}let renderSeq=0;function render(){const t=performance.now(),o=options(),seq=++renderSeq;if(!o){$("renderStatus").textContent="Expresión inválida";return}$("renderStatus").textContent="Calculando…";renderFractal(fractal,view,o).then(()=>{if(seq===renderSeq)$("renderStatus").textContent="Listo · "+Math.round(performance.now()-t)+" ms"})}function reset(){const p=presets[$("preset").value];view={xmin:p[5],xmax:p[6],ymin:p[7],ymax:p[8]};$("centerRe").value=(p[5]+p[6])/2;$("centerIm").value=(p[7]+p[8])/2;$("zoom").value=0;render()}function setPreset(){const key=$("preset").value,p=presets[key];$("expression").value=key==="poly"?"z^3 + 0.2z + c":p[1];$("expression").readOnly=key!=="poly";$("expression").style.opacity=key==="poly"?"1":".7";$("cre").value=p[3];$("cim").value=p[4];const isM=key==="mandelbrot",isJulia=key==="julia";$("cre").disabled=isM;$("cim").disabled=isM;$("cre").closest("label").style.opacity=isM?".45":"1";$("cim").closest("label").style.opacity=isM?".45":"1";$("constantTitle").textContent=isM?"Parámetros de visualización":isJulia?"Constante c (Julia)":"Constante c";$("escapeLabel").firstChild.textContent=key==="exp"?"Radio de escape (exp)":key==="sine"||key==="cosine"?"Radio de escape":"Radio de escape";$("iterationsLabel").firstChild.textContent=key==="exp"?"Iteraciones (recomendado ≤800)":"Iteraciones";$("escape").value=key==="exp"?"20":key==="sine"||key==="cosine"?"8":"4";$("iterations").value=key==="sine"||key==="cosine"?"110":key==="exp"?"220":"300";$("centerRe").disabled=false;$("centerIm").disabled=false;reset()}$("preset").onchange=setPreset;$("expression").addEventListener("keydown",e=>{if(e.key==="Enter")render()});$("expression").addEventListener("change",render);$("render").onclick=render;$("reset").onclick=reset;["smooth"].forEach(id=>$(id).onchange=render);$("centerRe").onchange=$("centerIm").onchange=()=>{const cx=+$("centerRe").value,cy=+$("centerIm").value,w=view.xmax-view.xmin,h=view.ymax-view.ymin;view={xmin:cx-w/2,xmax:cx+w/2,ymin:cy-h/2,ymax:cy+h/2};render()};$("zoom").oninput=e=>{const q=+e.target.value/100,f=Math.pow(10,q*3),cx=+$("centerRe").value,cy=+$("centerIm").value,w=3.4/f,h=2.6/f;view={xmin:cx-w/2,xmax:cx+w/2,ymin:cy-h/2,ymax:cy+h/2};$("iterations").value=$("preset").value==="sine"||$("preset").value==="cosine"?Math.min(500,Math.round(90+q*410)):Math.min(2500,Math.round(250+q*2250));render()};fractal.onmousemove=e=>{const z=pixelToComplex(fractal,view,e);$("coords").textContent="Re: "+z.re.toFixed(7)+"   Im: "+z.im.toFixed(7)};let dragStart=null,dragMoved=false;
fractal.onpointerdown=e=>{
  dragStart={x:e.clientX,y:e.clientY,v:{...view}};
  dragMoved=false;
  fractal.setPointerCapture?.(e.pointerId);
};
fractal.onpointermove=e=>{
  if(!dragStart)return;
  const mx=e.clientX-dragStart.x,my=e.clientY-dragStart.y;
  if(Math.hypot(mx,my)>5)dragMoved=true;
  if(!dragMoved)return;
  const dx=mx/fractal.clientWidth*(dragStart.v.xmax-dragStart.v.xmin),
        dy=my/fractal.clientHeight*(dragStart.v.ymax-dragStart.v.ymin);
  view.xmin=dragStart.v.xmin-dx;
  view.xmax=dragStart.v.xmax-dx;
  view.ymin=dragStart.v.ymin+dy;
  view.ymax=dragStart.v.ymax+dy;
};
fractal.onpointerup=e=>{
  if(!dragStart)return;
  const moved=dragMoved;
  const x=e.clientX,y=e.clientY;
  dragStart=null;
  dragMoved=false;
  if(moved){
    render();
  }else{
    selectPoint({clientX:x,clientY:y});
  }
};
fractal.onpointercancel=()=>{
  dragStart=null;
  dragMoved=false;
};
function evaluatePolynomialNode(n,z,c){if(n.type==="num")return new Complex(n.v,0);if(n.type==="id")return n.v.toLowerCase()==="z"?z:c;if(n.type==="neg")return evaluatePolynomialNode(n.x,z,c).neg();const a=evaluatePolynomialNode(n.a,z,c),b=evaluatePolynomialNode(n.b,z,c);if(n.type==="+")return a.add(b);if(n.type==="-")return a.sub(b);if(n.type==="*")return a.mul(b);if(n.type==="/")return a.div(b);if(n.type==="pow"){const n=b.im===0?b.re:NaN;return Number.isInteger(n)&&n>=0&&n<=12?powInt(a,n):a.pow(n)}throw Error("Operador inválido")}
function powInt(z,n){let r=new Complex(1,0);while(n){if(n&1)r=r.mul(z);n>>=1;if(n)z=z.mul(z)}return r}
function selectPoint(e){const o=options();if(!o)return;const z=e instanceof Complex?e:pixelToComplex(fractal,view,e),key=$("preset").value,z0=key==="mandelbrot"?new Complex(0,0):z,c=key==="mandelbrot"?z:new Complex(o.cre,o.cim),fn={quadratic:(a,b)=>a.mul(a).add(b),polynomial:(a,b)=>evaluatePolynomialNode(o.ast,a,b),sine:(a,b)=>a.sin().add(b),cosine:(a,b)=>a.cos().add(b),exp:(a,b)=>a.exp().add(b)}[o.type],r=iterate(z0,c,fn,o.maxIter,o.escape);lastPoint=new Complex(z.re,z.im);$("copyCoords").disabled=false;animator.set(r.orbit,z,r.escaped,$("orbitPlot").checked)};fractal.addEventListener("wheel",e=>{e.preventDefault();const z=pixelToComplex(fractal,view,e),f=e.deltaY<0?.9:1.1;view.xmin=z.re+(view.xmin-z.re)*f;view.xmax=z.re+(view.xmax-z.re)*f;view.ymin=z.im+(view.ymin-z.im)*f;view.ymax=z.im+(view.ymax-z.im)*f;render()},{passive:false});$("play").onclick=()=>animator.play(+$("speed").value);$("pause").onclick=()=>animator.stop();$("prev").onclick=()=>animator.step(-1);$("next").onclick=()=>animator.step(1);$("orbitPlot").onchange=()=>{if(lastPoint)selectPoint(lastPoint)};$("exportImage").onclick=()=>{const a=document.createElement("a");a.download="fractal.png";a.href=fractal.toDataURL("image/png");a.click()};$("copyCoords").onclick=async()=>{if(!lastPoint)return;const text="Re: "+lastPoint.re.toFixed(10)+", Im: "+lastPoint.im.toFixed(10),btn=$("copyCoords"),label=btn.textContent;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();document.execCommand("copy");t.remove()}btn.textContent="Copiado";setTimeout(()=>btn.textContent=label,1200)}catch(e){btn.textContent="No se pudo copiar";setTimeout(()=>btn.textContent=label,1600)}};window.onresize=()=>{render();if(lastPoint)animator.draw()};setPreset();