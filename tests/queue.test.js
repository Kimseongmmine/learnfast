const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
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
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-27";
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"데이터베이스",deadline:"",tasks:[{id:"t1",text:"x",done:false}]}]});
const m=require(APP);

// ================= 문제 파싱 =================
const REPLY=[
"1. 3NF의 조건을 쓰고 2NF와 무엇이 다른지 설명하라",
"2. 뉴턴법이 2차 수렴하는 조건을 유도하라",
"- ACID 중 I가 깨지면 어떤 이상이 생기나",
"",
"---",
"1. 답: 이행적 함수 종속이 없어야 한다",
"2. 답: f'(x*) != 0 이고 f'' 가 연속"
].join("\n");
const qs=m.parseQuestions(REPLY);
ok("답 구획 앞까지만", qs.length===3, JSON.stringify(qs));
ok("번호 목록", qs[0].indexOf("3NF의 조건")>=0, qs[0]);
ok("불릿도", qs[2].indexOf("ACID")>=0, qs[2]);
ok("답은 안 섞임", qs.every(q=>q.indexOf("답:")<0), JSON.stringify(qs));
ok("짧은 줄은 버림", m.parseQuestions("1. ab").length===0, "");
ok("빈 입력", m.parseQuestions("").length===0, "");
ok("Q: 형식도", m.parseQuestions("Q: 정규화가 무엇인지 설명하라").length===1, "");

// ================= 오늘 것에 붙는다 =================
m.saveReviews([
  {id:"r1",goalId:"g1",kind:"개념",text:"정규화",due:"2026-08-20",box:1,seen:0},
  {id:"r2",goalId:"g1",kind:"유도",text:"뉴턴법",due:"2026-08-27",box:1,seen:0},
  {id:"r3",goalId:"g1",kind:"개념",text:"ACID",due:"2026-08-27",box:1,seen:0},
  {id:"r4",goalId:"g1",kind:"개념",text:"미래것",due:"2026-09-20",box:1,seen:0}
]);
const n=m.attachQuestions(TODAY,REPLY);
ok("세 개 붙음", n===3, String(n));
let R=m.loadReviews();
ok("오래 밀린 것부터 순서대로", R[0].q.indexOf("3NF")>=0, R[0].q);
ok("두 번째", R[1].q.indexOf("뉴턴법")>=0, R[1].q);
ok("미래 것엔 안 붙음", !R[3].q, String(R[3].q));
ok("문제가 없으면 0", m.attachQuestions(TODAY,"줄글")===0, "");

// ================= 여러 번 틀린 항목 =================
ok("6번 보고도 1상자면 leech", m.isLeech({seen:6,box:1})===true, "");
ok("상자가 올라갔으면 아님", m.isLeech({seen:9,box:2})===false, "");
ok("적게 봤으면 아님", m.isLeech({seen:5,box:1})===false, "");
m.saveReviews([{id:"L",goalId:"g1",kind:"개념",text:"안 외워지는 것",due:"2026-08-25",box:1,seen:5,missed:"매번"}]);
const settled=m.settleReview("L","",TODAY,false);
ok("leech 가 되면 표시", settled.leech===true, JSON.stringify(settled));
ok("열흘 물림", settled.due==="2026-09-06", settled.due);
ok("매일 안 나옴", m.dueReviews("2026-08-28",5).length===0, JSON.stringify(m.dueReviews("2026-08-28",5)));
ok("목록으로 뽑힘", m.leechItems().length===1, String(m.leechItems().length));

// ================= 시험이 가까우면 복습을 늘린다 =================
const far={goals:[{id:"a",title:"x",deadline:"12/20",tasks:[]}]};
const near={goals:[{id:"a",title:"x",deadline:"9/2",tasks:[]}]};
const imm={goals:[{id:"a",title:"x",deadline:"8/29",tasks:[]}]};
ok("마감 없으면 2개", m.reviewQuota({goals:[{id:"a",title:"x",deadline:"",tasks:[]}]},TODAY)===2, "");
ok("멀면 2개", m.reviewQuota(far,TODAY)===2, String(m.reviewQuota(far,TODAY)));
ok("일주일 안이면 4개", m.reviewQuota(near,TODAY)===4, String(m.reviewQuota(near,TODAY)));
ok("사흘 안이면 5개", m.reviewQuota(imm,TODAY)===5, String(m.reviewQuota(imm,TODAY)));
ok("가장 가까운 마감을 본다", m.reviewQuota({goals:[
  {id:"a",title:"x",deadline:"12/20",tasks:[]},{id:"b",title:"y",deadline:"8/29",tasks:[]}]},TODAY)===5, "");
ok("지난 마감은 무시", m.reviewQuota({goals:[{id:"a",title:"x",deadline:"8/1",tasks:[]}]},TODAY)===2, "");

// ================= 실행 모드가 문제를 띄운다 =================
m.saveReviews([{id:"rq",goalId:"g1",kind:"개념",text:"정규화",q:"3NF의 조건을 쓰고 2NF와 무엇이 다른지 설명하라",due:"2026-08-25",box:1,seen:1,missed:"2NF 부분함수종속"}]);
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",blocks:[
  {id:"rb",time:"09:00-09:30",text:"복습 — 정규화",goalId:"g1",reviewId:"rq",kind:"개념",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]}});
m.goTab("today"); m.openFocus("rb");
ok("문제가 뜬다", byCls("recallq").length===1, String(byCls("recallq").length));
ok("문제 내용", allText().indexOf("3NF의 조건")>=0, "");
ok("지난번 막힌 곳도", allText().indexOf("지난번 막힌 곳 · 2NF 부분함수종속")>=0, "");
ok("판정 버튼 그대로", !!btn("기억났다") && !!btn("안 나왔다"), "");

// leech 는 쪼개라고 알린다
m.saveReviews([{id:"rl",goalId:"g1",kind:"개념",text:"x",due:"2026-08-25",box:1,seen:7,leech:true}]);
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",blocks:[
  {id:"rb2",time:"09:00-09:30",text:"복습 — x",goalId:"g1",reviewId:"rl",kind:"개념",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]}});
m.openFocus("rb2");
ok("leech 안내", allText().indexOf("여러 번 놓친 항목")>=0, "");

// 인출 프롬프트가 leech 를 전달한다
const P=m.buildPrompt("retrieval",{items:[{course:"데베",kind:"개념",text:"x",missed:"",leech:true}]});
ok("프롬프트가 쪼개라고 시킴", /더 작은 조각으로 나눠서/.test(P), P.slice(-120));

// 문제 붙이는 칸이 오늘 탭에 있다
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",blocks:[
  {id:"rb3",time:"09:00-09:30",text:"복습 — x",goalId:"g1",reviewId:"rl",kind:"개념",core:true,done:false}]}});
m.closeFocus(); m.goTab("today");
ok("붙여넣기 칸 열기", !!btn("만들어진 문제를 여기 붙여넣기"), allText().slice(0,200));

console.log(f?("\nFAILED "+f):"\nQUEUE OK");
process.exit(f?1:0);
