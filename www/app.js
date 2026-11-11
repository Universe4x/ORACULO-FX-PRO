const $=id=>document.getElementById(id);
const assets=[["XAU/USD · Oro","GC=F"],["EUR/USD","EURUSD=X"],["GBP/USD","GBPUSD=X"],["BTC/USD","BTC-USD"],["USD/JPY","JPY=X"]];
const tfs=[["M5","5m","5d",1],["M15","15m","5d",1],["M30","30m","1mo",1],["H1","60m","3mo",1],["H4","60m","3mo",4],["D1","1d","1y",1]];
let latest=[],currentAsset=assets[0],cache={};
function fmt(x,p){if(!Number.isFinite(x))return "—";return x.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:p<10?4:2})}
function ema(a,n){let k=2/(n+1),e=a[0];return a.map(v=>e=v*k+e*(1-k))}
function rsi(c,n=14){let g=0,l=0;for(let i=1;i<=n;i++){let d=c[i]-c[i-1];g+=Math.max(0,d);l+=Math.max(0,-d)}g/=n;l/=n;for(let i=n+1;i<c.length;i++){let d=c[i]-c[i-1];g=(g*(n-1)+Math.max(0,d))/n;l=(l*(n-1)+Math.max(0,-d))/n}return l===0?100:100-100/(1+g/l)}
function atr(v,n=14){let a=[];for(let i=1;i<v.length;i++)a.push(Math.max(v[i].h-v[i].l,Math.abs(v[i].h-v[i-1].c),Math.abs(v[i].l-v[i-1].c)));return a.slice(-n).reduce((x,y)=>x+y,0)/Math.min(n,a.length)}
function analyze(v){if(!v||v.length<60)throw Error("Histórico insuficiente");let c=v.map(x=>x.c),p=c.at(-1),e20=ema(c,20).at(-1),e50=ema(c,50).at(-1),e200=ema(c,Math.min(200,c.length-1)).at(-1),rr=rsi(c),a=atr(v),mom=p-c.at(-6);let score=(e20>e50?2:-2)+(p>e50?1:-1)+(p>e200?1:-1)+(rr>55?1:rr<45?-1:0)+(mom>0?1:-1);let dir=score>=3?1:score<=-3?-1:0;let conf=Math.min(78,42+Math.abs(score)*5);let hi=Math.max(...v.slice(-20).map(x=>x.h)),lo=Math.min(...v.slice(-20).map(x=>x.l));return{p,dir,score,conf,rr,a,e20,e50,e200,hi,lo,tp:[p+dir*a,p+dir*a*1.8,p+dir*a*2.6],sl:p-dir*a*1.1}}
async function fetchBars(sym,iv,range){let url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${iv}&range=${range}`;let res=await fetch(url);if(!res.ok)throw Error("Proveedor no disponible");let j=await res.json(),r=j.chart?.result?.[0];if(!r)throw Error("Sin cotización");let q=r.indicators.quote[0],out=[];r.timestamp.forEach((t,i)=>{if(q.close[i]!=null&&q.high[i]!=null&&q.low[i]!=null)out.push({t,h:q.high[i],l:q.low[i],c:q.close[i],o:q.open[i],vol:q.volume?.[i]??null})});return{meta:r.meta,bars:out}}
function aggregate(v,n){if(n===1)return v;let m=new Map;v.forEach(x=>{let k=Math.floor(x.t/(3600*n));if(!m.has(k))m.set(k,{...x});else{let z=m.get(k);z.h=Math.max(z.h,x.h);z.l=Math.min(z.l,x.l);z.c=x.c}});return [...m.values()]}
function dirName(d){return d>0?"COMPRA":d<0?"VENTA":"NEUTRAL"}
function dirClass(d){return d>0?"buytxt":d<0?"selltxt":"neutxt"}
function setText(id,x){$(id).textContent=x}
function renderAnalysis(results,meta){latest=results;let valid=results.filter(x=>x.f),score=valid.reduce((s,x)=>s+x.f.dir*x.weight,0),total=valid.reduce((s,x)=>s+x.weight,0),dir=total&&score/total>.18?1:total&&score/total<-.18?-1:0;let base=valid.find(x=>x.tf==="M15")||valid[0];if(!base){setText("signal","SIN DATOS");return}
let f=base.f;setText("price",fmt(meta.regularMarketPrice??f.p,f.p));setText("priceMeta","Datos del proveedor · "+new Date().toLocaleTimeString("es-ES"));$("signal").className="signal "+(dir>0?"buy":dir<0?"sell":"neutral");setText("signal",dirName(dir));setText("tp1",fmt(f.tp[0],f.p));setText("tp2",fmt(f.tp[1],f.p));setText("tp3",fmt(f.tp[2],f.p));setText("sl",fmt(f.sl,f.p));setText("confidence",f.conf+"% · técnica");$("meter").style.width=f.conf+"%";
$("timeframes").replaceChildren(...results.map(x=>{let d=document.createElement("div");d.className="tfrow";d.innerHTML=`<b>${x.tf}</b><b class="${x.f?dirClass(x.f.dir):"neutxt"}">${x.f?dirName(x.f.dir):"SIN DATOS"}</b>`;return d}));
$("factors").replaceChildren(...[["EMA 20/50",f.e20>f.e50?"Positivo":"Negativo"],["RSI 14",f.rr.toFixed(1)],["ATR",fmt(f.a,f.p)],["Volumen",base.vol==null?"No disponible":"Tick/volumen proveedor"],["Rango 20 velas",fmt(f.lo,f.p)+" – "+fmt(f.hi,f.p)]].map(([a,b])=>{let d=document.createElement("div");d.className="factor";d.innerHTML=`<span>${a}</span><b>${b}</b>`;return d}));
setText("summary",dir===0?"El consenso multitemporal no es suficientemente claro. Esperar confirmación y evitar entradas forzadas.":`Consenso técnico ${dirName(dir)}. Los objetivos se calculan con ATR; comprobar estructura, liquidez y noticias antes de operar. No hay todavía análisis institucional ni clasificación de noticias conectados.`);
$("signalcards").replaceChildren(...results.map(x=>{let c=document.createElement("article");c.className="card";c.innerHTML=`<div class="tfrow"><b>${x.tf}</b><b class="${x.f?dirClass(x.f.dir):"neutxt"}">${x.f?dirName(x.f.dir):"SIN DATOS"}</b></div>${x.f?`<p class="muted">RSI ${x.f.rr.toFixed(1)} · ATR ${fmt(x.f.a,x.f.p)} · Confianza técnica ${x.f.conf}%</p><div class="targets"><div><small>TP1</small><b>${fmt(x.f.tp[0],x.f.p)}</b></div><div><small>TP2</small><b>${fmt(x.f.tp[1],x.f.p)}</b></div><div><small>TP3</small><b>${fmt(x.f.tp[2],x.f.p)}</b></div><div class="stop"><small>STOP / INVALIDACIÓN</small><b>${fmt(x.f.sl,x.f.p)}</b></div></div>`:"<p class=muted>Datos no disponibles para esta temporalidad.</p>"}`;return c}));
}
async function analyzeAsset(asset){currentAsset=asset;setText("summary","Consultando datos de mercado…");let results=await Promise.all(tfs.map(async([tf,iv,range,mult])=>{try{let z=await fetchBars(asset[1],iv,range),bars=aggregate(z.bars,mult);return{tf,weight:({M5:1,M15:1.4,M30:1.6,H1:2,H4:2.4,D1:2.8})[tf],f:analyze(bars),meta:z.meta,vol:bars.at(-1)?.vol}}catch(e){return{tf,weight:1,f:null,error:e.message}}}));let m=results.find(x=>x.meta)?.meta;if(m)renderAnalysis(results,m);else throw Error("No se pudieron obtener datos del proveedor. Comprueba conexión o disponibilidad.");}
async function refresh(){try{await analyzeAsset(assets[0]);}catch(e){setText("summary",e.message);setText("price","—");setText("priceMeta","Datos no disponibles");setText("signal","SIN DATOS");$("signal").className="signal neutral"}}
function nav(tab){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===tab));document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.tab)));
$("refresh").onclick=refresh;$("reanalyze").onclick=refresh;
function marketList(){let box=$("marketlist");box.replaceChildren(...assets.map(a=>{let d=document.createElement("button");d.className="market";d.style.width="100%";d.style.color="inherit";d.innerHTML=`<span><b>${a[0]}</b><small class=muted>Ver análisis multitemporal</small></span><b>›</b>`;d.onclick=()=>{nav("home");analyzeAsset(a).catch(e=>setText("summary",e.message))};return d}))}
marketList();refresh();setInterval(refresh,120000);
$("saveconfig").onclick=()=>{let u=$("server").value.trim();if(u&&!/^https:\/\//i.test(u)){setText("configmsg","Por seguridad, el servidor debe usar HTTPS.");return}setText("configmsg","Configuración guardada localmente como borrador. La autenticación y el enlace real se activarán al desplegar el backend seguro.");};

// ORACULO FX PRO - MT5 local bridge (read-only)
const bridgeConfigKey="oraculo_mt5_bridge_v1";
let bridgeTimer=null;
function loadBridgeConfig(){try{return JSON.parse(localStorage.getItem(bridgeConfigKey)||"{}")}catch(_){return {}}}
function saveBridgeConfig(){
 const base=$("server").value.trim().replace(/\/$/,"");
 const token=$("paircode").value.trim();
 if(!/^http:\/\/([\d.]+|localhost)(:\d+)?$/i.test(base)){$("configmsg").textContent="Introduce la URL local del PC, por ejemplo http://192.168.1.25:8765";return}
 if(token.length<20){$("configmsg").textContent="El token parece incompleto. Copia el token completo de la ventana del puente.";return}
 localStorage.setItem(bridgeConfigKey,JSON.stringify({base,token}));
 $("configmsg").textContent="Configuración guardada. Comprobando conexión MT5…";
 pollBridge();
}
function bridgeStatus(connected,detail){
 const state=$("mt5state"),small=$("mt5detail"),dot=document.querySelector(".connection .dot"),adot=$("accountdot");
 state.textContent=connected?"MT5 conectado":"MT5 sin conectar"; small.textContent=detail||"Puente local";
 if(dot)dot.style.background=connected?"#43d18a":"#e06b6b";
 if(adot)adot.style.background=connected?"#43d18a":"#e06b6b";
 $("accountstate").textContent=connected?"Conectado · solo lectura":"Conector no vinculado";
}
async function pollBridge(){
 const cfg=loadBridgeConfig(); if(!cfg.base||!cfg.token){bridgeStatus(false,"Configura el puente local");return}
 try{
  const res=await fetch(cfg.base+"/api/state",{headers:{"X-ORACULO-TOKEN":cfg.token},cache:"no-store"});
  if(!res.ok)throw Error(res.status===401?"Token incorrecto":"Puente no disponible (HTTP "+res.status+")");
  const j=await res.json();
  if(!j.connected||!j.data)throw Error("Esperando datos de MT5");
  const d=j.data,age=Math.max(0,Math.round(Date.now()/1000-j.received_at));
  bridgeStatus(true,d.symbol+" · recibido hace "+age+" s");
  $("accsymbol").textContent=d.symbol||"—";
  $("accquote").textContent=fmt(d.bid,d.digits)+" / "+fmt(d.ask,d.digits);
  $("accbalance").textContent=d.balance==null?"—":fmt(d.balance,2)+" "+(d.currency||"");
  $("accequity").textContent=d.equity==null?"—":fmt(d.equity,2)+" "+(d.currency||"");
  $("accprofit").textContent=d.profit==null?"—":fmt(d.profit,2)+" "+(d.currency||"");
  $("accpositions").textContent=d.open_positions??"—";
  if(/XAU|GOLD/i.test(d.symbol)&&currentAsset===assets[0]){
    setText("price",fmt(d.bid,d.digits));
    setText("priceMeta","Cotización MT5 · Bid · "+new Date(j.received_at*1000).toLocaleTimeString("es-ES"));
  }
  $("configmsg").textContent="Conexión correcta con "+d.symbol+". Solo lectura; no se envían órdenes.";
 }catch(e){bridgeStatus(false,e.message);$("configmsg").textContent=e.message;}
}
const savedBridge=loadBridgeConfig();
if(savedBridge.base){$("server").value=savedBridge.base;$("paircode").value=savedBridge.token;}
$("saveconfig").onclick=saveBridgeConfig;
pollBridge();bridgeTimer=setInterval(pollBridge,3000);
