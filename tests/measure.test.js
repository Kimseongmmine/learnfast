const path=require("path"); const APP=path.resolve(__dirname, "..", "client", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,27,9,2,0);
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
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-27";
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"데이터베이스",tasks:[{id:"t1",text:"x",done:false}]}]});
const m=require(APP);

// ================= 아무것도 없으면 아무 말도 안 한다 =================
m.saveReviews([]); m.saveSessions([]); mem["lf.plans"]=JSON.stringify({});
let st=m.studyStats(TODAY);
ok("빈 상태", st.items===0 && st.days===0, JSON.stringify(st));
ok("없는 건 null", st.perItem===null && st.recallRate===null && st.startRate===null, JSON.stringify(st));
m.goTab("flow");
ok("카드 자체가 안 뜬다", byCls("measure").length===0, String(byCls("measure").length));

// ================= 복습이 쌓이면 =================
m.saveReviews([
  {id:"r1",goalId:"g1",kind:"개념",text:"A",box:1,due:"2026-08-28",seen:2},
  {id:"r2",goalId:"g1",kind:"개념",text:"B",box:3,due:"2026-09-01",seen:4},
  {id:"r3",goalId:"g1",kind:"유도",text:"C",box:5,due:"2026-09-12",seen:6},
  {id:"r4",goalId:"g1",kind:"개념",text:"D",box:1,due:"2026-08-28",seen:0}
]);
st=m.studyStats(TODAY);
ok("항목 수", st.items===4, String(st.items));
ok("굳은 것(3상자 이상)", st.held===2, String(st.held));
ok("항목당 본 횟수", st.perItem===3, String(st.perItem));
ok("총 손댄 횟수", st.touches===12, String(st.touches));
// 유지 기간: box 1,3,5,1 -> 간격 1,4,16,1 -> 평균 5.5
ok("평균 유지 기간", st.holdDays===5.5, String(st.holdDays));
// 성공률: 오른 칸 (0+2+4)/본 횟수 (2+4+6) = 6/12 = 50%
ok("인출 성공률", st.recallRate===50, String(st.recallRate));
ok("seen 0 은 성공률에서 빠짐", st.recallRate===50, "");

// ================= 착수율 =================
mem["lf.plans"]=JSON.stringify({
  "2026-08-25":{blocks:[{id:"a",core:true,onTime:true},{id:"b",core:true,onTime:false},{id:"c",core:false}]},
  "2026-08-26":{blocks:[{id:"d",core:true,onTime:true},{id:"e",core:true,onTime:true}]},
  "2026-08-28":{blocks:[{id:"z",core:true,onTime:true}]}   // 미래는 안 센다
});
st=m.studyStats(TODAY);
ok("계획이 있던 날만", st.days===2, String(st.days));
ok("핵심 착수율 3/4", st.startRate===75, String(st.startRate));
ok("미래 날짜는 제외", st.startRate===75, "");
ok("핵심 아닌 블록은 안 셈", st.startRate===75, "");

// ================= 화면 =================
m.goTab("flow");
ok("측정 카드", byCls("measure").length===1, String(byCls("measure").length));
const t=allText();
ok("항목 수 표시", /복습 큐에 든 항목/.test(t), "");
ok("굳은 비율", /50%/.test(t), (t.match(/굳은[^|]*\|[^|]*/)||[""])[0]);
ok("착수율", /핵심 착수율/.test(t) && /75%/.test(t), "");
ok("몇 일치인지", /2일치/.test(t), "");
ok("주장이 아니라고 밝힘", /주장이 아니라/.test(t), "");
ok("칸 개수", byCls("mcell").length===6, String(byCls("mcell").length));

// 복습만 없을 때
m.saveReviews([]);
m.goTab("flow");
ok("복습 없으면 안내", /복습 기록이 아직 없습니다/.test(allText()), "");
ok("착수율 칸은 남음", byCls("mcell").length>=1, String(byCls("mcell").length));

console.log(f?("\nFAILED "+f):"\nMEASURE OK");
process.exit(f?1:0);
