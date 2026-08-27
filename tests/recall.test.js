const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,27,9,2,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,draggable:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},
 click(){if(this._h.click)this._h.click({preventDefault(){}});},setAttribute(k,v){this._attrs[k]=v;},remove(){},
 querySelector(sel){const m=sel.match(/\[data-k="(.+)"\]/); if(!m)return null; let found=null; (function w(n){(n.children||[]).forEach(c=>{if(c.dataset&&c.dataset.k===m[1])found=found||c; w(c);});})(this); return found;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null,confirm:()=>true,scrollTo(){}}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-27";
function plan(blocks){ mem["loop.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:blocks}}); }
mem["loop.profile"]=JSON.stringify({goals:[{id:"g1",title:"데이터베이스",tasks:[{id:"t1",text:"x",done:false}]}]});
const m=require(APP);

// ================= 큐가 스스로 찬다 =================
ok("개념은 인출 가능", m.isRecallable("개념")===true, "");
ok("유도도", m.isRecallable("유도")===true, "");
ok("구현은 아님", m.isRecallable("구현")===false, "");
ok("문제도 아님", m.isRecallable("문제")===false, "");

m.saveReviews([]);
plan([{id:"b1",time:"09:00-10:00",text:"안 보고 써보기 — 정규화 1NF~3NF",goalId:"g1",taskId:"t1",kind:"개념",done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z"}]);
m.finishBlock(TODAY,{id:"b1",time:"09:00-10:00",text:"안 보고 써보기 — 정규화 1NF~3NF",goalId:"g1",taskId:"t1",kind:"개념"});
let revs=m.loadReviews();
ok("한 줄 없이도 복습이 생김", revs.length===1, JSON.stringify(revs));
ok("인출 문구는 벗겨짐", revs[0].text==="정규화 1NF~3NF", revs[0].text);
ok("내일 차례", revs[0].due==="2026-08-28", revs[0].due);
ok("틀린 지점은 비어 있음", revs[0].missed==="", JSON.stringify(revs[0].missed));

m.saveReviews([]);
m.finishBlock(TODAY,{id:"b2",time:"09:00-10:00",text:"CUDA 커널 짜기",goalId:"g1",taskId:"t1",kind:"구현"});
ok("구현은 한 줄 없으면 안 쌓임", m.loadReviews().length===0, JSON.stringify(m.loadReviews()));

// ================= 맞음/틀림 =================
m.saveReviews([{id:"r1",goalId:"g1",kind:"개념",text:"정규화",due:"2026-08-25",box:2,missed:"",seen:1}]);
let r=m.settleReview("r1","",TODAY,true);
ok("맞음이면 상자 위로", r.box===3 && r.due==="2026-08-31", JSON.stringify(r));
r=m.settleReview("r1","",TODAY,false);
ok("한 줄이 비어도 틀림이면 1로", r.box===1 && r.due==="2026-08-28", JSON.stringify(r));
ok("빈 한 줄은 missed 를 안 덮음", r.missed==="", JSON.stringify(r.missed));
r=m.settleReview("r1","2NF 부분함수종속",TODAY,false);
ok("적었으면 남긴다", r.missed==="2NF 부분함수종속", r.missed);
r=m.settleReview("r1","",TODAY);
ok("판정을 안 주면 예전대로(빈 줄=맞음)", r.box===2, String(r.box));

// ================= 화면 =================
m.saveReviews([{id:"rr",goalId:"g1",kind:"개념",text:"정규화 1NF~3NF",due:"2026-08-25",box:1,missed:"2NF",seen:0}]);
plan([{id:"rb",time:"09:00-09:30",text:"복습 — 정규화 1NF~3NF",goalId:"g1",reviewId:"rr",kind:"개념",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]);
m.goTab("today"); m.openFocus("rb");
ok("복습엔 맞음/틀림 버튼", !!btn("기억났다") && !!btn("안 나왔다"), allText().slice(0,200));
ok("복습엔 완료 버튼 없음", !btn("완료"), "");
ok("판정 줄 렌더", byCls("recallrow").length===1, String(byCls("recallrow").length));

btn("기억났다").click();
ok("기억났다 -> 상자 2", m.loadReviews()[0].box===2, JSON.stringify(m.loadReviews()[0]));
ok("블록도 완료됨", JSON.parse(mem["loop.plans"])[TODAY].blocks[0].done===true, "");

// 틀림 경로
m.saveReviews([{id:"rr2",goalId:"g1",kind:"유도",text:"뉴턴법 수렴차수",due:"2026-08-25",box:4,missed:"",seen:3}]);
plan([{id:"rb2",time:"09:00-09:30",text:"복습 — 뉴턴법 수렴차수",goalId:"g1",reviewId:"rr2",kind:"유도",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]);
m.openFocus("rb2");
btn("안 나왔다").click();
ok("안 나왔다 -> 상자 1", m.loadReviews()[0].box===1, JSON.stringify(m.loadReviews()[0]));
ok("내일 다시", m.loadReviews()[0].due==="2026-08-28", m.loadReviews()[0].due);

// 일반 블록은 여전히 완료 버튼
plan([{id:"nb",time:"09:00-10:00",text:"SQL 조인",goalId:"g1",taskId:"t1",kind:"구현",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]);
m.openFocus("nb");
ok("일반 블록엔 완료 버튼", !!btn("완료"), "");
ok("일반 블록엔 판정 줄 없음", byCls("recallrow").length===0, "");

// ================= 하루 쓰면 큐가 산다 =================
m.saveReviews([]);
["정규화 1NF~3NF","트랜잭션 ACID","뉴턴법 수렴차수"].forEach(function(t,i){
  m.finishBlock(TODAY,{id:"z"+i,time:"09:00-10:00",text:"안 보고 써보기 — "+t,goalId:"g1",taskId:"t1",kind:i===2?"유도":"개념"});
});
ok("하루에 3개가 자동으로 쌓임", m.loadReviews().length===3, JSON.stringify(m.loadReviews().map(r=>r.text)));
ok("전부 내일 차례", m.loadReviews().every(r=>r.due==="2026-08-28"), "");
const due=m.dueReviewCandidates("2026-08-28",m.loadProfile(),2);
ok("내일 계획에 2개까지만", due.length===2, String(due.length));
ok("복습이 블록 후보가 됨", due[0].review===true && /^복습 — /.test(due[0].text), due[0].text);

console.log(f?("\nFAILED "+f):"\nRECALL OK");
process.exit(f?1:0);
