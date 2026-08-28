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
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

// 실제 수강 과목 5개
const COURSES=["데이터베이스","확률과통계","수치해석","기계학습개론","대규모병렬컴퓨팅"];
mem["lf.profile"]=JSON.stringify({places:"학교 도서관 25분 / 집 앞 스터디카페 5분 / 집 책상 / 체육관 15분 / 카페는 3시간 이상 앉을 때만",goals:COURSES.map(function(t,i){
  return {id:"g"+i,title:t,note:"",deadline:"",scope:"",tasks:[]};
})});
const m=require(APP);

// ================= 과제 유형 =================
const CASES=[
  ["CUDA 행렬곱 커널 짜고 로컬 테스트","대규모병렬컴퓨팅","구현"],
  ["공유메모리 타일링으로 최적화하고 프로파일","대규모병렬컴퓨팅","구현"],
  ["6장 연습문제 1-12번 풀기","확률과통계","문제"],
  ["중심극한정리 조건 정리","확률과통계","문제"],          // 과목 기본값
  ["뉴턴법 수렴차수 유도","수치해석","유도"],
  ["가우스 소거 오차한계 도출","수치해석","유도"],
  ["경사하강법 갱신식 유도","기계학습개론","유도"],
  ["sklearn 로지스틱 회귀 돌려보기","기계학습개론","구현"],
  ["정규화 1NF~3NF 정리","데이터베이스","개념"],
  ["SQL 조인 쿼리 10개 짜기","데이터베이스","구현"],
  ["트랜잭션 ACID 설명 쓰기","데이터베이스","개념"]
];
CASES.forEach(function(c){
  ok("유형: "+c[0].slice(0,18), m.taskKind(c[0],c[1])===c[2], m.taskKind(c[0],c[1])+" (기대 "+c[2]+")");
});
ok("과목 기본값 — 병렬은 구현", m.courseKind("대규모병렬컴퓨팅")==="구현", m.courseKind("대규모병렬컴퓨팅"));
ok("과목 기본값 — 확통은 문제", m.courseKind("확률과통계")==="문제", m.courseKind("확률과통계"));
ok("모르는 과목은 개념", m.courseKind("교양 글쓰기")==="개념", m.courseKind("교양 글쓰기"));

// 유형별 길이 — 구현은 컴파일·디버깅 사이클이 있어 90분 미만으로 못 쪼갠다
ok("구현 최소 90분", m.blockMinutesFor("구현").min===90, JSON.stringify(m.blockMinutesFor("구현")));
ok("개념은 짧아도 됨", m.blockMinutesFor("개념").min===40, JSON.stringify(m.blockMinutesFor("개념")));
ok("모르는 유형도 값이 나옴", m.blockMinutesFor("x").min===60, JSON.stringify(m.blockMinutesFor("x")));

// 인출 연습 — 개념·유도만. 코드는 백지가 안 통한다
ok("개념은 안 보고 써보기", m.retrievalText("정규화 1NF~3NF 정리","개념")==="안 보고 써보기 — 정규화 1NF~3NF 정리", m.retrievalText("정규화 1NF~3NF 정리","개념"));
ok("유도는 안 보고 유도", m.retrievalText("뉴턴법 수렴차수 유도","유도")==="안 보고 유도 — 뉴턴법 수렴차수 유도", m.retrievalText("뉴턴법 수렴차수 유도","유도"));
ok("구현은 그대로", m.retrievalText("CUDA 커널 짜기","구현")==="CUDA 커널 짜기", m.retrievalText("CUDA 커널 짜기","구현"));
ok("문제도 그대로", m.retrievalText("6장 1-12번 풀기","문제")==="6장 1-12번 풀기", m.retrievalText("6장 1-12번 풀기","문제"));
ok("두 번 붙지 않음", m.retrievalText("안 보고 써보기 — x","개념")==="안 보고 써보기 — x", m.retrievalText("안 보고 써보기 — x","개념"));

// 첫 동작이 유형을 따른다
ok("구현 첫 동작", m.firstStep({kind:"구현",text:"CUDA 커널",taskId:"t"})==="터미널 열고 빌드/실행 한 번 돌리기", m.firstStep({kind:"구현",text:"x",taskId:"t"}));
ok("문제 첫 동작", m.firstStep({kind:"문제",text:"6장",taskId:"t"})==="첫 1문제만 풀기", m.firstStep({kind:"문제",text:"x",taskId:"t"}));
ok("유도 첫 동작", /결과 식만/.test(m.firstStep({kind:"유도",text:"x",taskId:"t"})), m.firstStep({kind:"유도",text:"x",taskId:"t"}));
ok("개념 첫 동작", /목차만 보고/.test(m.firstStep({kind:"개념",text:"x",taskId:"t"})), m.firstStep({kind:"개념",text:"x",taskId:"t"}));
ok("AI가 준 first가 유형보다 우선", m.firstStep({kind:"구현",first:"내가 쓴 것"})==="내가 쓴 것", "");
ok("휴식엔 여전히 없음", m.firstStep({text:"물 한 잔 · 눈 휴식"})===null, "");

// ================= 브리지 =================
const P=m.buildPrompt("breakdown",{traits:"쉽게 지침",goals:[
  {title:"대규모병렬컴퓨팅",scope:"1~5장",deadline:"10/20",note:""},
  {title:"확률과통계",scope:"",deadline:"",note:""}]});
ok("쪼개기 프롬프트에 규칙", /60분 안에 끝낼 수 있어야/.test(P), P.slice(0,60));
ok("추상 표현 금지 명시", /추상적 표현 금지/.test(P), "");
ok("내 과목이 들어감", P.indexOf("대규모병렬컴퓨팅")>=0 && P.indexOf("확률과통계")>=0, "");
ok("범위·마감이 들어감", /범위 1~5장/.test(P) && /마감\/시험 10\/20/.test(P), "");
ok("출력 형식을 못박음", /## 과목이름/.test(P), "");
ok("내 특성도 전달", /쉽게 지침/.test(P), "");

const R=m.buildPrompt("retrieval",{items:[
  {course:"데이터베이스",kind:"개념",text:"정규화 1NF~3NF",missed:"2NF 부분함수종속"},
  {course:"수치해석",kind:"유도",text:"뉴턴법 수렴차수",missed:""}]});
ok("인출 프롬프트가 안 보고를 요구", /안 보고/.test(R), "");
ok("구현은 판단을 묻게", /코드를 쓰게 하지 말고 판단을 물어라/.test(R), "");
ok("항목이 들어감", R.indexOf("정규화 1NF~3NF")>=0, "");
ok("틀린 지점이 들어감", /지난번 틀린 곳: 2NF 부분함수종속/.test(R), "");
ok("답은 뒤로 몰아라", /---.*아래에 한꺼번에|한꺼번에 둬라/.test(R), "");

const S=m.buildPrompt("stuck",{course:"대규모병렬컴퓨팅",kind:"구현",text:"CUDA 커널",note:"shared memory 크기 오류",past:["인덱싱 헷갈림"]});
ok("막힘은 답을 통째로 안 준다", /답을 통째로 주지 말고 다음 한 걸음만/.test(S), "");
ok("위로하지 말라고 명시", /위로하거나 격려하지 마라/.test(S), "");
ok("지금 막힌 게 들어감", /shared memory 크기 오류/.test(S), "");
ok("전에 막혔던 것도", /인덱싱 헷갈림/.test(S), "");
ok("과목·유형이 들어감", /대규모병렬컴퓨팅 \(구현\)/.test(S), "");

const PA=m.buildPrompt("pace",{today:"2026-08-27",goals:[
  {title:"확률과통계",scope:"1~6장",deadline:"10/20",daysLeft:54,done:3,total:8}]});
ok("진도 프롬프트가 숫자만 요구", /위로하지 말고 숫자로만/.test(PA), "");
ok("D- 가 들어감", /D-54/.test(PA), "");
ok("완료 개수가 들어감", /과제 3\/8 완료/.test(PA), "");
ok("버릴 우선순위를 묻는다", /버릴 우선순위/.test(PA), "");
ok("모르는 종류는 빈 문자열", m.buildPrompt("없음",{})==="", "");

// 남은 날 계산
ok("연-월-일", m.daysUntil("2026-10-20","2026-08-27")===54, String(m.daysUntil("2026-10-20","2026-08-27")));
ok("월/일", m.daysUntil("10/20","2026-08-27")===54, String(m.daysUntil("10/20","2026-08-27")));
ok("한글 월일", m.daysUntil("10월 20","2026-08-27")===54, String(m.daysUntil("10월 20","2026-08-27")));
ok("해를 넘긴 마감", m.daysUntil("1/5","2026-12-20")===16, String(m.daysUntil("1/5","2026-12-20")));
ok("빈 값은 null", m.daysUntil("","2026-08-27")===null, "");
ok("못 읽으면 null", m.daysUntil("다음학기","2026-08-27")===null, String(m.daysUntil("다음학기","2026-08-27")));

// Gemini 답을 되받기
const REPLY=[
"## 데이터베이스",
"1. 정규화 1NF~3NF 정의 백지에 쓰기",
"2. SQL 조인 쿼리 10개 짜기",
"",
"## 대규모병렬컴퓨팅",
"1. CUDA 행렬곱 커널 짜고 로컬 테스트",
"- 공유메모리 타일링으로 최적화하고 프로파일",
"",
"## 없는과목",
"1. 아무거나"
].join("\n");
const parsed=m.parseCourseTasks(REPLY);
ok("과목 3개 읽음", Object.keys(parsed).length===3, Object.keys(parsed).join(","));
ok("번호 목록 읽음", parsed["데이터베이스"].length===2, JSON.stringify(parsed["데이터베이스"]));
ok("불릿도 읽음", parsed["대규모병렬컴퓨팅"].length===2, JSON.stringify(parsed["대규모병렬컴퓨팅"]));
ok("빈 섹션은 버림", m.parseCourseTasks("## 빈것\n\n## 또빈것")["빈것"]===undefined, "");
ok("형식이 아니면 빈 객체", Object.keys(m.parseCourseTasks("그냥 줄글입니다")).length===0, "");

const added=m.importCourseTasks(REPLY);
ok("과제가 들어감", added===5, String(added));
const prof=m.loadProfile();
const db=prof.goals.filter(g=>g.title==="데이터베이스")[0];
ok("기존 목표에 붙음", db.tasks.length===2, JSON.stringify(db.tasks.map(t=>t.text)));
ok("유형이 같이 붙음", db.tasks[0].kind==="개념" && db.tasks[1].kind==="구현", db.tasks.map(t=>t.kind).join(","));
ok("모르는 과목은 목표로 생김", prof.goals.some(g=>g.title==="없는과목"), prof.goals.map(g=>g.title).join(","));
ok("두 번 넣어도 안 겹침", m.importCourseTasks(REPLY)===0, String(m.importCourseTasks(REPLY)));
ok("분석 시각 기록", !!db.analyzedAt, "");

// ================= 계획에 반영 =================
const cands=m.nextPendingTasks(m.loadProfile(),6);
ok("후보에 유형이 실림", cands.every(c=>!!c.kind), JSON.stringify(cands.map(c=>c.kind)));
const blocks=m.templatePlan(cands);
const study=blocks.filter(b=>b.taskId);
ok("블록에 유형이 실림", study.every(b=>!!b.kind), JSON.stringify(study.map(b=>b.kind)));
const concept=study.filter(b=>b.kind==="개념")[0];
ok("개념 블록에 인출 문구", !concept || /^안 보고 써보기 — /.test(concept.text), concept && concept.text);
const impl=study.filter(b=>b.kind==="구현")[0];
ok("구현 블록엔 인출 문구 없음", !impl || !/안 보고/.test(impl.text), impl && impl.text);

// 구현 과제는 집에서 — 이동이 안 생긴다
const pf=m.loadProfile();
const filled=m.fillPlaces([{id:"x",time:"09:00-11:00",text:"CUDA 커널 짜기",taskId:"t",kind:"구현",core:true}],pf);
ok("구현은 집", filled[0].place===m.placeRules(pf).home, filled[0].place);
const filled2=m.fillPlaces([{id:"y",time:"09:00-11:00",text:"정규화 정리",taskId:"t",kind:"개념",core:true}],pf);
ok("개념은 도서관", filled2[0].place==="학교 도서관", filled2[0].place);

// ================= 화면 =================
mem["lf.plans"]=JSON.stringify({"2026-08-27":{source:"template",generatedAt:"x",blocks:blocks}});
m.goTab("today");
ok("유형 칩 렌더", byCls("kindchip").length>=1, String(byCls("kindchip").length));
const drill=blocks.filter(b=>b.taskId&&(b.kind==="개념"||b.kind==="유도"));
if (drill.length) ok("인출 문제 버튼", !!btn("오늘 인출 문제"), allText().slice(0,200));
else ok("인출 대상 없으면 버튼 없음", !btn("오늘 인출 문제"), "");

m.goTab("goal");
ok("쪼개기 버튼", !!btn("과제 쪼개기 프롬프트"), "");
ok("진도 점검 버튼", !!btn("진도 점검 프롬프트"), "");
ok("붙여넣기 열기 버튼", !!btn("Gemini 답을 여기 붙여넣기"), "");
ok("범위 입력칸", walk(root,n=>n._attrs&&/시험 범위/.test(n._attrs["aria-label"]||""),[]).length>=1, "");

// 클립보드가 없으면 원문 상자로 폴백
btn("과제 쪼개기 프롬프트").click();
ok("클립보드 없으면 원문 표시", byCls("promptbox").length===1, String(byCls("promptbox").length));
ok("원문에 실제 프롬프트", /60분 안에/.test(byCls("promptbox")[0].value), byCls("promptbox")[0].value.slice(0,50));

console.log(f?("\nFAILED "+f):"\nSTUDY OK");
process.exit(f?1:0);
