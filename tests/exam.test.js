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
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-27";
mem["loop.profile"]=JSON.stringify({goals:[],exams:"중간고사 10/20 / 기말고사 12/15"});
const m=require(APP);
const pf=m.loadProfile();

// ================= 학기 시험이 기본으로 있다 =================
// 공개판엔 기본 시험 일정이 없다. 온보딩에서 받거나 설정에서 넣는다.
ok("빈 프로필엔 시험 일정 없음", m.loadProfile.call(null) && JSON.parse(JSON.stringify({e:""})).e==="", "");
ok("적어두면 읽힌다", /중간고사/.test(pf.exams), pf.exams);
const ex=m.parseExams(pf.exams);
ok("두 개 읽음", ex.length===2, JSON.stringify(ex));
ok("날짜의 슬래시가 안 쪼개짐", ex[0].date==="10/20", ex[0].date);
ok("이름도 읽음", ex[0].name==="중간고사" && ex[1].name==="기말고사", JSON.stringify(ex.map(e=>e.name)));
ok("연-월-일도 됨", m.parseExams("기말 2026-12-15")[0].date==="2026-12-15", JSON.stringify(m.parseExams("기말 2026-12-15")));
ok("한글 월일도", m.parseExams("중간 10월 20")[0].date==="10월 20", JSON.stringify(m.parseExams("중간 10월 20")));
ok("이름 없으면 시험", m.parseExams("10/20")[0].name==="시험", JSON.stringify(m.parseExams("10/20")));
ok("날짜 없으면 버림", m.parseExams("언젠가 본다").length===0, "");
ok("빈 값", m.parseExams("").length===0, "");

// ================= 다음 시험 =================
ok("두 달 전이면 중간", m.nextExam(pf,TODAY).name==="중간고사", JSON.stringify(m.nextExam(pf,TODAY)));
ok("남은 날", m.nextExam(pf,TODAY).daysLeft===54, String(m.nextExam(pf,TODAY).daysLeft));
ok("중간 지나면 기말", m.nextExam(pf,"2026-11-01").name==="기말고사", JSON.stringify(m.nextExam(pf,"2026-11-01")));
ok("다 지나면 null", m.nextExam(pf,"2026-12-20")===null, JSON.stringify(m.nextExam(pf,"2026-12-20")));
ok("당일도 포함", m.nextExam(pf,"2026-10-20").daysLeft===0, JSON.stringify(m.nextExam(pf,"2026-10-20")));

// ================= 목표가 물려받는다 =================
const g={id:"g1",title:"확률과통계",deadline:"",scope:"1~6장",
  tasks:[{id:"a",done:true},{id:"b",done:false},{id:"c",done:false},{id:"d",done:false}]};
const dl=m.effectiveDeadline(g,pf,TODAY);
ok("비어 있으면 물려받음", dl.inherited===true && dl.date==="10/20", JSON.stringify(dl));
ok("어디서 왔는지 남음", dl.name==="중간고사", dl.name);
const own=m.effectiveDeadline(Object.assign({},g,{deadline:"9/10"}),pf,TODAY);
ok("직접 적었으면 그것", own.inherited===false && own.date==="9/10", JSON.stringify(own));
ok("시험도 없으면 null", m.effectiveDeadline(g,{exams:""},TODAY)===null, "");

// ================= 세 기능이 전부 산다 =================
ok("역산이 돈다", /^D-54 \(중간고사\)/.test(m.paceLine(g,TODAY,pf)), m.paceLine(g,TODAY,pf));
ok("물려받은 건 출처를 밝힌다", /\(중간고사\)/.test(m.paceLine(g,TODAY,pf)), "");
ok("직접 적은 건 출처 없음", !/\(/.test(m.paceLine(Object.assign({},g,{deadline:"9/10"}),TODAY,pf).split("·")[0]), m.paceLine(Object.assign({},g,{deadline:"9/10"}),TODAY,pf));

const P={goals:[g],exams:pf.exams};
ok("두 달 전 복습 2개", m.reviewQuota(P,TODAY)===2, String(m.reviewQuota(P,TODAY)));
ok("닷새 전 4개", m.reviewQuota(P,"2026-10-15")===4, String(m.reviewQuota(P,"2026-10-15")));
ok("이틀 전 5개", m.reviewQuota(P,"2026-10-18")===5, String(m.reviewQuota(P,"2026-10-18")));
ok("중간 끝나면 기말 기준으로 2개", m.reviewQuota(P,"2026-10-21")===2, String(m.reviewQuota(P,"2026-10-21")));
ok("목표가 없어도 학기 시험을 본다", m.reviewQuota({goals:[],exams:pf.exams},"2026-10-18")===5, String(m.reviewQuota({goals:[],exams:pf.exams},"2026-10-18")));

// 과목 우선순위도 마감을 물려받아 돈다
mem["loop.profile"]=JSON.stringify({exams:"중간고사 9/1 / 기말고사 12/15",goals:[
  {id:"a",title:"수치해석",deadline:"",tasks:[{id:"t",done:false}]},
  {id:"b",title:"대규모병렬컴퓨팅",deadline:"",tasks:[{id:"t",done:false}]}
]});
const prof2=m.loadProfile();
const s1=m.courseScore(prof2.goals[0],TODAY,prof2);
mem["loop.profile"]=JSON.stringify(Object.assign({},prof2,{exams:"기말고사 12/15"}));
const prof3=m.loadProfile();
const s2=m.courseScore(prof3.goals[0],TODAY,prof3);
ok("시험이 가까우면 점수가 높다", s1>s2, s1+" vs "+s2);

// ================= 화면 =================
mem["loop.profile"]=JSON.stringify({exams:"중간고사 10/20 / 기말고사 12/15",goals:[
  {id:"g1",title:"확률과통계",deadline:"",scope:"1~6장",tasks:[{id:"a",done:true},{id:"b",done:false}]}]});
m.goTab("goal");
ok("역산 줄이 뜬다(마감 안 적었는데도)", byCls("paceline").length===1, String(byCls("paceline").length));
ok("출처 표시", /D-54 \(중간고사\)/.test(allText()), (allText().match(/D-[^|]*/)||[""])[0]);
m.goTab("me");
ok("시험 일정 칸", walk(root,n=>n._attrs&&/시험 일정/.test(n._attrs["aria-label"]||""),[]).length>=1 || /시험 일정/.test(allText()), "");
ok("AI 컨텍스트에 시험 일정", /시험 일정: 중간고사 10\/20/.test(m.profileContext(m.loadProfile())), m.profileContext(m.loadProfile()).slice(0,80));

console.log(f?("\nFAILED "+f):"\nEXAM OK");
process.exit(f?1:0);
