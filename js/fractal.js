const PALETTES={aurora:t=>{t=Math.max(0,Math.min(1,t));const stops=[[0,8,8,20],[.18,45,18,95],[.38,120,25,150],[.58,225,45,125],[.78,255,145,35],[1,255,225,95]];for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){const a=stops[i-1],b=stops[i],q=(t-a[0])/(b[0]-a[0]);return[a[1]+(b[1]-a[1])*q,a[2]+(b[2]-a[2])*q,a[3]+(b[3]-a[3])*q].map(Math.round)}return[255,225,95]}};

let renderWorkers=null,workerURLs=[],jobId=0;

function workerSource(){
return String.raw`
const TRIG_N=2048, TRIG_TWOPI=Math.PI*2, HYP_N=2048, HYP_MAX=4;
const st=new Float64Array(TRIG_N+1),ct=new Float64Array(TRIG_N+1),sh=new Float64Array(HYP_N+1),ch=new Float64Array(HYP_N+1);
for(let i=0;i<=TRIG_N;i++){const x=-Math.PI+TRIG_TWOPI*i/TRIG_N;st[i]=Math.sin(x);ct[i]=Math.cos(x)}
for(let i=0;i<=HYP_N;i++){const x=-HYP_MAX+2*HYP_MAX*i/HYP_N;sh[i]=Math.sinh(x);ch[i]=Math.cosh(x)}

function trig(x){x=(x+Math.PI)%TRIG_TWOPI;if(x<0)x+=TRIG_TWOPI;x-=Math.PI;const p=(x+Math.PI)/TRIG_TWOPI*TRIG_N,i=p|0,f=p-i,j=i===TRIG_N?0:i+1;return[st[i]*(1-f)+st[j]*f,ct[i]*(1-f)+ct[j]*f]}
function hyp(x){const p=(x+HYP_MAX)/(2*HYP_MAX)*HYP_N;if(p<=0)return[sh[0],ch[0]];if(p>=HYP_N)return[Math.sinh(x),Math.cosh(x)];const i=p|0,f=p-i;return[sh[i]*(1-f)+sh[i+1]*f,ch[i]*(1-f)+ch[i+1]*f]}

self.onmessage=e=>{
 const {id,view,o,w,y0,y1}=e.data,d=new Uint8ClampedArray(w*(y1-y0)*4),er2=o.escape*o.escape,poly=o.type==="polynomial"?compileRPN(o.ast):null,sr=poly?new Float64Array(poly.length+2):null,si=poly?new Float64Array(poly.length+2):null;
 for(let py=y0;py<y1;py++){
  const im=view.ymax-py/(Math.max(1,e.data.h-1))*(view.ymax-view.ymin);
  for(let px=0;px<w;px++){
   const re=view.xmin+px/(w-1)*(view.xmax-view.xmin),r=iteratePixel(re,im,o,er2,poly,sr,si),k=((py-y0)*w+px)*4;
   if(!r.escaped){d[k]=4;d[k+1]=5;d[k+2]=14;d[k+3]=255;continue}
   let t=r.iter/o.maxIter;if(t>1)t=1;t=Math.pow(t,.72);
   const c=color(t);d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=255;
  }
 }
 postMessage({id,y0,y1,w,h:y1-y0,buffer:d.buffer},[d.buffer])
};

function color(t){
 const s=[[0,8,8,20],[.18,45,18,95],[.38,120,25,150],[.58,225,45,125],[.78,255,145,35],[1,255,225,95]];
 for(let i=1;i<s.length;i++)if(t<=s[i][0]){const a=s[i-1],b=s[i],q=(t-a[0])/(b[0]-a[0]);return[Math.round(a[1]+(b[1]-a[1])*q),Math.round(a[2]+(b[2]-a[2])*q),Math.round(a[3]+(b[3]-a[3])*q)]}
 return[255,225,95]
}

function compileRPN(n,out=[]){if(n.type==="num")out.push(["n",n.v]);else if(n.type==="id")out.push([n.v.toLowerCase()==="z"?"z":"c"]);else if(n.type==="neg"){compileRPN(n.x,out);out.push(["neg"])}else{compileRPN(n.a,out);compileRPN(n.b,out);out.push([n.type])}return out}
function evalRPN(code,zr,zi,cr,ci,sr,si){
 let sp=0;
 for(let j=0;j<code.length;j++){
  const q=code[j],op=q[0];
  if(op==="n"){sr[sp]=q[1];si[sp++]=0;continue}
  if(op==="z"){sr[sp]=zr;si[sp++]=zi;continue}
  if(op==="c"){sr[sp]=cr;si[sp++]=ci;continue}
  if(op==="neg"){--sp;sr[sp]=-sr[sp];si[sp]=-si[sp];continue}
  const br=sr[--sp],bi=si[sp],ar=sr[sp-1],ai=si[sp-1];
  if(op==="+"){sr[sp-1]=ar+br;si[sp-1]=ai+bi}
  else if(op==="-"){sr[sp-1]=ar-br;si[sp-1]=ai-bi}
  else if(op==="*"){sr[sp-1]=ar*br-ai*bi;si[sp-1]=ar*bi+ai*br}
  else if(op==="/"){const d=br*br+bi*bi;sr[sp-1]=(ar*br+ai*bi)/d;si[sp-1]=(ai*br-ar*bi)/d}
  else if(op==="^"&&bi===0&&Number.isInteger(br)&&br>=0&&br<=12){
   if(br===0){sr[sp-1]=1;si[sp-1]=0}else{let n=br,pr=1,pi=0,qr=ar,qi=ai;while(n){if(n%2){const tr=pr*qr-pi*qi,ti=pr*qi+pi*qr;pr=tr;pi=ti}n=Math.floor(n/2);if(n){const tr=qr*qr-qi*qi,ti=2*qr*qi;qr=tr;qi=ti}}sr[sp-1]=pr;si[sp-1]=pi}
  }else if(op==="^"){const rr=Math.hypot(ar,ai),ang=Math.atan2(ai,ar),rn=Math.pow(rr,br),tc=trig(ang*br);sr[sp-1]=rn*tc[1];si[sp-1]=rn*tc[0]}
 }
}

function iteratePixel(re,im,o,er2,poly,sr,si){
 const isM=o.preset==="mandelbrot";
 let zr=isM?0:re,zi=isM?0:im,cr=isM?re:o.cre,ci=isM?im:o.cim;
 const trigType=o.type==="sine"||o.type==="cosine";
 const limit=trigType?Math.asinh(Math.sqrt(er2)+Math.hypot(cr,ci)):0;
 for(let i=0;i<o.maxIter;i++){
  let nr,ni;
  if(o.type==="quadratic"){nr=zr*zr-zi*zi+cr;ni=2*zr*zi+ci}
  else if(o.type==="polynomial"){evalRPN(poly,zr,zi,cr,ci,sr,si);nr=sr[0];ni=si[0]}
  else if(trigType){
   const ay=Math.abs(zi);
   if(ay>limit)return{escaped:true,iter:i+1};
   const tc=trig(zr),hc=hyp(zi),sx=tc[0],cx=tc[1],shv=hc[0],chv=hc[1];
   if(o.type==="sine"){nr=sx*chv+cr;ni=cx*shv+ci}
   else{nr=cx*chv+cr;ni=-sx*shv+ci}
  }else{
   const ee=Math.exp(zr),tc=trig(zi);nr=ee*tc[1]+cr;ni=ee*tc[0]+ci
  }
  zr=nr;zi=ni;
  const a2=zr*zr+zi*zi;
  if(!Number.isFinite(a2)||a2>er2){
   let s=i+1;
   if(o.smooth&&a2>1)s=i+1-Math.log(Math.log(Math.sqrt(a2)))/Math.log(2);
   return{escaped:true,iter:s}
  }
 }
 return{escaped:false,iter:o.maxIter}
}
`
}

function getRenderWorkers(){
 if(renderWorkers)return renderWorkers;
 const n=Math.min(4,Math.max(2,(navigator.hardwareConcurrency||2)-1));
 const src=workerSource();
 renderWorkers=[];
 for(let i=0;i<n;i++){
  const url=URL.createObjectURL(new Blob([src],{type:"text/javascript"}));
  workerURLs.push(url);
  renderWorkers.push(new Worker(url));
 }
 return renderWorkers;
}

function renderFractal(canvas,view,o){
 const scale=o.resolution,w=Math.max(160,Math.floor(canvas.clientWidth/scale)),h=Math.max(100,Math.floor(canvas.clientHeight/scale));
 const workers=getRenderWorkers(),id=++jobId,parts=Math.min(workers.length,h),rows=Math.ceil(h/parts),full=new Uint8ClampedArray(w*h*4);
 return new Promise(resolve=>{
  let done=0;
  workers.forEach((worker,i)=>{
   const y0=i*rows,y1=Math.min(h,y0+rows);
   if(y0>=h){done++;return}
   const onMessage=e=>{
    if(e.data.id!==id)return;
    worker.removeEventListener("message",onMessage);
    full.set(new Uint8ClampedArray(e.data.buffer),e.data.y0*w*4);
    done++;
    if(done===parts){
     canvas.width=w;canvas.height=h;
     canvas.getContext("2d",{alpha:false}).putImageData(new ImageData(full,w,h),0,0);
     resolve({width:w,height:h})
    }
   };
   worker.addEventListener("message",onMessage);
   worker.postMessage({id,view,o,w,h,y0,y1});
  });
 })
}

function iterate(z0,c,fn,maxIter,escapeR){
 let z=C(z0),orbit=[z];
 for(let i=0;i<maxIter;i++){z=fn(z,c);orbit.push(z);if(!Number.isFinite(z.re)||!Number.isFinite(z.im)||z.abs()>escapeR)return{orbit,escaped:true,iterations:i+1}}
 return{orbit,escaped:false,iterations:maxIter}
}
function pixelToComplex(canvas,view,e){
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
 return new Complex(view.xmin+x*(view.xmax-view.xmin),view.ymax-y*(view.ymax-view.ymin))
}