const path=require("path"); const fs=require("fs");
const APP=path.resolve(__dirname, "..", "app.js");
const CSS=path.resolve(__dirname, "..", "style.css");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,27,10,0,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,draggable:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},
 click(){if(this._h.click)this._h.click({preventDefault(){}});},setAttribute(k,v){this._attrs[k]=v;},remove(){},querySelector(){return null;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null,confirm:()=>true,scrollTo(){}}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent===t,[])[0];

const TODAY="2026-08-27";
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"DB",tasks:[{id:"t1",text:"3장 풀기",done:false}]}]});
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:[
  {id:"b1",time:"09:00-11:00",text:"3장 풀기",place:"경북대 중앙도서관",goalId:"g1",taskId:"t1",core:true,done:false},
  {id:"b2",time:"11:00-12:00",text:"점심",place:"경북대 중앙도서관",done:false}
]}});
const m=require(APP);

// ---------- 탭바가 모든 화면에 있다 ----------
["today","goal","flow","me"].forEach(function (k) {
  m.goTab(k);
  ok(k+" 화면에 탭바", byCls("tabbar").length===1, String(byCls("tabbar").length));
  ok(k+" 화면에 탭 4개", byCls("tab").length===4, String(byCls("tab").length));
  ok(k+" 탭이 켜져 보임", byCls("tab").filter(t=>t.className.includes("on")).length===1, "");
});

// ---------- 로고가 홈 버튼 ----------
m.goTab("flow");
ok("로고가 버튼", byCls("homebtn").length===1 && byCls("homebtn")[0].tagName==="BUTTON", byCls("homebtn")[0] && byCls("homebtn")[0].tagName);
ok("로고에 설명 붙음", byCls("homebtn")[0]._attrs["aria-label"]==="오늘 화면으로", byCls("homebtn")[0]._attrs["aria-label"]);
byCls("homebtn")[0].click();
ok("로고 누르면 오늘로", m.currentTab()==="today", m.currentTab());
ok("오늘 계획이 보임", byCls("today").length===1, "");

// ---------- ← 오늘 버튼 ----------
ok("오늘 화면엔 돌아가기 버튼 없음", byCls("backbtn").length===0, String(byCls("backbtn").length));
["goal","flow","me"].forEach(function (k) {
  m.goTab(k);
  ok(k+" 화면엔 ← 오늘 버튼", byCls("backbtn").length===1, String(byCls("backbtn").length));
  byCls("backbtn")[0].click();
  ok(k+" 에서 한 번에 복귀", m.currentTab()==="today" && byCls("today").length===1, m.currentTab());
});

// ---------- 실행 모드에서도 나갈 길 두 개 ----------
m.goTab("today");
m.openFocus("b1");
ok("실행 모드 진입", byCls("focus").length===1, "");
ok("실행 모드엔 탭바 없음(집중)", byCls("tabbar").length===0, "");
ok("닫기 있음", !!btn("닫기"), "");
ok("오늘 계획으로 가는 버튼", !!btn("오늘 계획"), "");
btn("오늘 계획").click();
ok("실행 모드에서 바로 오늘로", byCls("focus").length===0 && byCls("today").length===1 && m.currentTab()==="today", m.currentTab());

m.openFocus("b1");
btn("닫기").click();
ok("닫기로도 빠져나옴", byCls("focus").length===0 && byCls("tabbar").length===1, "");

// ---------- 설정 탭에서 다른 탭으로 직접 ----------
m.goTab("me");
byCls("tab")[0].click();
ok("설정에서 탭바로 오늘 복귀", m.currentTab()==="today", m.currentTab());

// ---------- CSS: 데스크톱 규칙이 기본 규칙보다 뒤에 있어야 한다 ----------
const css=fs.readFileSync(CSS,"utf8");
const base=css.indexOf(".tabbar {");
const wide=css.indexOf(".tabbar {", base+1);
ok("탭바 규칙이 두 개", base>=0 && wide>base, "base="+base+" wide="+wide);
ok("데스크톱 규칙이 뒤에 온다", wide>base, "");
const block=css.slice(wide, wide+300);
ok("가운데 정렬이 온전함", /left:\s*50%/.test(block) && /right:\s*auto/.test(block) && /translateX\(-50%\)/.test(block), block.slice(0,140));
ok("기본 규칙엔 transform 없음", !/transform/.test(css.slice(base, wide)), css.slice(base, base+200));

console.log(f?("\nFAILED "+f):"\nNAV OK");
process.exit(f?1:0);
