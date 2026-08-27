const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,26,9,2,0);   // 09:02 — 09:00 블록의 정시 창 안
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},click(){if(this._h.click)this._h.click({preventDefault(){}});},setAttribute(k,v){this._attrs[k]=v;},remove(){},
 querySelector(sel){const m=sel.match(/\[data-k="(.+)"\]/); if(!m)return null; let found=null; (function w(n){(n.children||[]).forEach(c=>{if(c.dataset&&c.dataset.k===m[1])found=found||c; w(c);});})(this); return found;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null,confirm:()=>true}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-26";
function seed(){
  mem={};
  mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"DB",tasks:[{id:"t1",text:"3장 1-10번 풀기",done:false}]}]});
  mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:[
    {id:"b1",time:"09:00-10:50",text:"3장 1-10번 풀기",place:"경북대 중앙도서관",goalId:"g1",taskId:"t1",core:true,done:false},
    {id:"b2",time:"10:50-11:00",text:"물 한 잔 · 눈 휴식(먼 곳 보기)",place:"경북대 중앙도서관",core:false,done:false},
    {id:"b3",time:"11:00-12:00",text:"이동 · 중앙도서관 → 수영장",move:true,core:false,done:false},
    {id:"b4",time:"16:00-17:00",text:"운동 (수영 우선)",place:"수영장",core:true,done:false}
  ]}});
}
seed();
delete require.cache[APP]; const m=require(APP);

// ---------- 첫 동작 ----------
ok("AI가 준 first를 그대로", m.firstStep({first:"노트북 열고 1번만"})==="노트북 열고 1번만", m.firstStep({first:"노트북 열고 1번만"}));
ok("학습 블록 -> 자리에 앉아", m.firstStep({text:"3장 1-10번 풀기",taskId:"t1"})==="자리에 앉아 3장 1-10번 풀기 · 5분만", m.firstStep({text:"3장 1-10번 풀기",taskId:"t1"}));
ok("긴 텍스트는 잘림", /…/.test(m.firstStep({core:true,text:"운영체제 4장 프로세스 스케줄링 연습문제 1번부터 20번까지 풀기"})), m.firstStep({core:true,text:"운영체제 4장 프로세스 스케줄링 연습문제 1번부터 20번까지 풀기"}));
ok("운동 -> 옷 갈아입기", m.firstStep({text:"운동 (수영 우선)"})==="옷 갈아입고 가방 챙기기", m.firstStep({text:"운동 (수영 우선)"}));
ok("이동 -> 일어나서 나가기", m.firstStep({move:true,text:"이동 · A → B"})==="지금 일어나서 나가기", m.firstStep({move:true,text:"이동 · A → B"}));
ok("휴식엔 첫 동작 없음", m.firstStep({text:"물 한 잔 · 눈 휴식(먼 곳 보기)"})===null, m.firstStep({text:"물 한 잔 · 눈 휴식(먼 곳 보기)"}));
ok("특별 일정엔 첫 동작 없음", m.firstStep({event:true,text:"병원"})===null, m.firstStep({event:true,text:"병원"}));

// ---------- 착수 기록 ----------
const b=m.setBlockStarted(TODAY,"b1",new Date());
ok("started 기록", b.started===true && !!b.startedAt, JSON.stringify(b));
ok("정시 판정 붙음", b.onTime===true, String(b.onTime));
ok("완료는 아직 아님", !b.done, String(b.done));
ok("저장됨", JSON.parse(mem["lf.plans"])[TODAY].blocks[0].started===true);
const before=b.startedAt;
m.setBlockStarted(TODAY,"b1",new RealDate(2026,7,26,11,0,0));
ok("두 번 눌러도 시각 안 바뀜", JSON.parse(mem["lf.plans"])[TODAY].blocks[0].startedAt===before);

// 착수만 해도 핵심 카운터에 잡힌다
let plan=JSON.parse(mem["lf.plans"])[TODAY];
let cs=m.coreStatus(plan.blocks);
ok("착수 1/2", cs.done===1 && cs.total===2 && cs.fin===0, JSON.stringify(cs));

// 착수 창(시작 ±5분) 밖에서는 착수 자체가 안 된다
FIXED=new RealDate(2026,7,26,16,40,0);   // 16:00 블록을 40분 늦게
ok("창 밖이면 착수 거부", m.setBlockStarted(TODAY,"b4",new Date())===null, "");
plan=JSON.parse(mem["lf.plans"])[TODAY];
ok("거부되면 기록도 안 남음", !plan.blocks[3].started, JSON.stringify(plan.blocks[3]));
cs=m.coreStatus(plan.blocks);
ok("놓친 블록은 미착수", cs.done===1 && cs.late===0, JSON.stringify(cs));
ok("창 상태는 놓침", m.startWindow(plan.blocks[3],TODAY,new Date()).state==="missed", m.startWindow(plan.blocks[3],TODAY,new Date()).state);
ok("놓친 이유를 말해준다", /시간\(시작 ±5분\)이 지났습니다/.test(m.lockReason(m.startWindow(plan.blocks[3],TODAY,new Date()))), m.lockReason(m.startWindow(plan.blocks[3],TODAY,new Date())));
// 창 안이면 된다
FIXED=new RealDate(2026,7,26,16,3,0);
ok("창 안이면 착수됨", !!m.setBlockStarted(TODAY,"b4",new Date()), "");
FIXED=new RealDate(2026,7,26,16,40,0);
plan=JSON.parse(mem["lf.plans"])[TODAY];
cs=m.coreStatus(plan.blocks);
ok("정시 착수 2개", cs.done===2 && cs.late===0, JSON.stringify(cs));

// 완료는 따로
m.setBlockDone(TODAY,"b1",true,new Date());
plan=JSON.parse(mem["lf.plans"])[TODAY];
cs=m.coreStatus(plan.blocks);
ok("완료해도 착수 시각은 유지", plan.blocks[0].startedAt===before, plan.blocks[0].startedAt);
ok("완료 카운트 1", cs.fin===1 && cs.done===2, JSON.stringify(cs));
ok("연결된 과제 완료", JSON.parse(mem["lf.profile"]).goals[0].tasks[0].done===true);

// 착수 없이 완료부터 눌러도 착수로 인정 (예전 동작 유지)
seed(); delete require.cache[APP]; const m2=require(APP);
FIXED=new RealDate(2026,7,26,9,2,0);
m2.setBlockDone(TODAY,"b1",true,new Date());
const p2=JSON.parse(mem["lf.plans"])[TODAY].blocks[0];
ok("완료부터 눌러도 started", p2.started===true && p2.onTime===true, JSON.stringify(p2));

// ---------- 백업 ----------
const pay=m2.exportPayload();
ok("백업 형식", pay.app==="loop" && pay.version===1 && !!pay.exportedAt, JSON.stringify(Object.keys(pay)));
ok("계획·목표 포함", !!pay.data["lf.plans"] && !!pay.data["lf.profile"], Object.keys(pay.data).join(","));
mem["lf.reviews"]=JSON.stringify([{id:"r1",text:"정규화",box:2,due:"2026-09-01",seen:3}]);
mem["lf.sessions"]=JSON.stringify([{date:TODAY,kind:"구현",plannedMin:90,actualMin:120}]);
mem["lf.stuck"]=JSON.stringify({g1:["shared memory"]});
const pay3=m2.exportPayload();
ok("복습 큐도 백업에 담김", !!pay3.data["lf.reviews"], Object.keys(pay3.data).join(","));
ok("세션도 담김", !!pay3.data["lf.sessions"], "");
ok("막힘 기록도 담김", !!pay3.data["lf.stuck"], "");
mem["lf.reviews"]=JSON.stringify([]);
m2.applyImport(JSON.stringify(pay3));
ok("복습이 복원됨", JSON.parse(mem["lf.reviews"]).length===1, mem["lf.reviews"]);
mem["lf.or_key"]="sk-or-secret"; mem["lf.gemini_key"]="AIza-secret";
const pay2=m2.exportPayload();
ok("API 키는 절대 안 나감", JSON.stringify(pay2).indexOf("secret")<0, "키가 백업에 들어감");

const snapshot=JSON.stringify(pay2);
mem["lf.plans"]=JSON.stringify({});                      // 데이터 날림
ok("날아간 상태 확인", Object.keys(JSON.parse(mem["lf.plans"])).length===0);
const n=m2.applyImport(snapshot);
ok("되돌린 항목 수", n>=2, String(n));
ok("계획 복구됨", JSON.parse(mem["lf.plans"])[TODAY].blocks.length===4, mem["lf.plans"].slice(0,40));
ok("키는 백업이 덮지 않음", mem["lf.or_key"]==="sk-or-secret");

let threw=""; try { m2.applyImport('{"app":"other","data":{}}'); } catch(e){ threw=e.message; }
ok("남의 파일 거부", /LOOP 백업 파일이 아닙니다/.test(threw), threw);
threw=""; try { m2.applyImport('not json'); } catch(e){ threw="parse"; }
ok("깨진 파일 거부", threw==="parse", threw);
threw=""; try { m2.applyImport({app:"loop",data:{"lf.plans":"{broken"}}); } catch(e){ threw=e.message; }
ok("깨진 항목은 건너뜀 -> 되돌릴 것 없음", /되돌릴 항목이 없습니다/.test(threw), threw);

// ---------- 실행 모드 ----------
seed(); delete require.cache[APP]; const m3=require(APP);
FIXED=new RealDate(2026,7,26,9,2,0);
m3.render();
ok("실행 모드 진입 버튼", !!btn("▶ 실행 모드"), "");
ok("지금 줄이 버튼", byCls("nowbar").length===1 && byCls("nowbar")[0].tagName==="BUTTON", byCls("nowbar")[0] && byCls("nowbar")[0].tagName);
ok("착수 라벨로 바뀜", /착수 0\/2/.test(allText()), "");
ok("탭바 4개", byCls("tab").length===4, String(byCls("tab").length));
ok("오늘 탭이 기본", byCls("tab")[0].className.includes("on"), byCls("tab")[0].className);

m3.openFocus("b1");
ok("실행 모드 화면", byCls("focus").length===1, "");
ok("다른 섹션은 사라짐", byCls("hero").length===0 && byCls("today").length===0, "");
const ftxt=allText();
ok("블록 제목", ftxt.includes("3장 1-10번 풀기"), "");
ok("첫 동작 표시", ftxt.includes("첫 동작") && ftxt.includes("자리에 앉아"), "");
ok("장소 표시", ftxt.includes("경북대 중앙도서관"), "");
ok("남은 시간", /분 남음/.test(ftxt), "");
ok("다음 블록 예고", ftxt.includes("끝나면 다음"), "");
ok("5분 버튼", !!btn("5분만 시작"), "");

btn("시작 기록").click();
ok("실행 모드에서 착수 기록", JSON.parse(mem["lf.plans"])[TODAY].blocks[0].onTime===true, "");
ok("기록 후엔 시각 표시", /시작 09:02 · 정시/.test(allText()), "");

btn("완료").click();
ok("완료 표시", allText().includes("완료됨"), "");

m3.closeFocus();
ok("닫으면 원래 화면", byCls("focus").length===0 && byCls("tools").length===1, "");

// 설정 탭에 데이터 블록
m3.goTab("me");
ok("백업 버튼", !!btn("백업 내보내기"), "");
ok("저장소 경고 문구", /사파리는 7일/.test(allText()), "");
ok("키 제외 고지", /API 키는 백업에 들어가지 않습니다/.test(allText()), "");

console.log(f?("\nFAILED "+f):"\nFOCUS OK");
process.exit(f?1:0);
