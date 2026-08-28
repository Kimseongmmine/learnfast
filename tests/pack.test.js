const path=require("path"); const APP=path.resolve(__dirname, "..", "client", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,27,9,2,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,draggable:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,files:null,
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
mem["lf.onboarded"]="1";
mem["lf.profile"]=JSON.stringify({courses:"확률과통계",goals:[
  {id:"g1",title:"확률과통계",deadline:"10/20",scope:"1~6장",tasks:[
    {id:"t1",text:"6장 연습문제 1-12번 풀기",done:true,kind:"문제"},
    {id:"t2",text:"중심극한정리 정리",done:false,kind:"개념"}]},
  {id:"g2",title:"자료구조",deadline:"",scope:"",tasks:[{id:"t9",text:"트리 순회 구현",done:false,kind:"구현"}]}
]});
const m=require(APP);
m.saveReviews([
  {id:"r1",goalId:"g1",kind:"개념",text:"중심극한정리",q:"CLT의 조건 세 가지를 쓰라",missed:"분산 유한",box:4,due:"2026-09-20",seen:7,made:"2026-08-01"},
  {id:"r2",goalId:"g1",kind:"문제",text:"베이즈 정리 계산",q:"",missed:"",box:1,due:"2026-08-28",seen:0,made:TODAY},
  {id:"r3",goalId:"g2",kind:"구현",text:"트리 순회",q:"",missed:"",box:2,due:"2026-08-30",seen:2,made:TODAY}
]);
m.saveSessions([{date:TODAY,kind:"문제",plannedMin:90,actualMin:70}]);

// ================= 내보내기 =================
const pack=m.exportPack("g1");
ok("팩 형식", pack.app==="learnfast-pack" && pack.version===1, JSON.stringify({a:pack.app,v:pack.version}));
ok("과목 이름", pack.course==="확률과통계", pack.course);
ok("범위 포함", pack.scope==="1~6장", pack.scope);
ok("과제 2개", pack.tasks.length===2, JSON.stringify(pack.tasks));
ok("과제 유형 포함", pack.tasks[0].kind==="문제", pack.tasks[0].kind);
ok("그 과목 복습만", pack.cards.length===2, JSON.stringify(pack.cards.map(c=>c.text)));
ok("다른 과목 복습은 제외", !pack.cards.some(c=>c.text==="트리 순회"), "");
ok("문제도 같이 간다", pack.cards[0].q==="CLT의 조건 세 가지를 쓰라", pack.cards[0].q);

// ---- 개인 기록이 절대 안 나가야 한다 ----
const raw=JSON.stringify(pack);
ok("완료 여부 안 나감", raw.indexOf('"done"')<0, raw.slice(0,200));
ok("상자 안 나감", raw.indexOf('"box"')<0, "");
ok("다음 차례 안 나감", raw.indexOf('"due"')<0, "");
ok("본 횟수 안 나감", raw.indexOf('"seen"')<0, "");
ok("틀린 지점 안 나감", raw.indexOf("분산 유한")<0 && raw.indexOf('"missed"')<0, "");
ok("마감 안 나감", raw.indexOf("10/20")<0, "");
ok("세션 안 나감", raw.indexOf('"actualMin"')<0, "");
ok("없는 목표는 null", m.exportPack("없음")===null, "");
ok("파일 이름", m.packName("확률과통계")==="확률과통계 팩.json", m.packName("확률과통계"));
ok("파일명에서 금지문자 제거", m.packName("자료구조/알고리즘")==="자료구조알고리즘 팩.json", m.packName("자료구조/알고리즘"));

// ================= 가져오기 (빈 상태) =================
mem={}; mem["lf.onboarded"]="1"; mem["lf.profile"]=JSON.stringify({goals:[]});
delete require.cache[APP]; const m2=require(APP);
const r=m2.importPack(JSON.stringify(pack),TODAY);
ok("결과 보고", r.course==="확률과통계" && r.tasks===2 && r.cards===2, JSON.stringify(r));
const pf=m2.loadProfile();
ok("목표 생성", pf.goals.length===1 && pf.goals[0].title==="확률과통계", pf.goals.map(g=>g.title).join(","));
ok("범위 따라옴", pf.goals[0].scope==="1~6장", pf.goals[0].scope);
ok("마감은 안 따라옴", pf.goals[0].deadline==="", JSON.stringify(pf.goals[0].deadline));
ok("과제 미완료 상태로", pf.goals[0].tasks.every(t=>t.done===false), JSON.stringify(pf.goals[0].tasks.map(t=>t.done)));
ok("과제 유형 살아있음", pf.goals[0].tasks[0].kind==="문제", pf.goals[0].tasks[0].kind);
const rv=m2.loadReviews();
ok("복습 2개", rv.length===2, String(rv.length));
ok("전부 1번 상자부터", rv.every(x=>x.box===1), JSON.stringify(rv.map(x=>x.box)));
ok("내일부터 시작", rv.every(x=>x.due==="2026-08-28"), JSON.stringify(rv.map(x=>x.due)));
ok("본 횟수 0", rv.every(x=>x.seen===0), "");
ok("남의 틀린 지점 없음", rv.every(x=>!x.missed), JSON.stringify(rv.map(x=>x.missed)));
ok("문제는 따라옴", rv.filter(x=>x.q).length===1, JSON.stringify(rv.map(x=>x.q)));
ok("내 목표에 붙음", rv.every(x=>x.goalId===pf.goals[0].id), "");

// ================= 두 번 넣어도 안 겹침 =================
const r2=m2.importPack(JSON.stringify(pack),TODAY);
ok("중복 안 들어감", r2.tasks===0 && r2.cards===0, JSON.stringify(r2));
ok("목표도 하나", m2.loadProfile().goals.length===1, "");
ok("복습도 둘", m2.loadReviews().length===2, "");

// ================= 이미 하던 과목에 얹기 =================
mem={}; mem["lf.onboarded"]="1";
mem["lf.profile"]=JSON.stringify({goals:[{id:"mine",title:"확률과통계",deadline:"11/5",scope:"",tasks:[{id:"a",text:"내가 적은 과제",done:true,kind:"개념"}]}]});
delete require.cache[APP]; const m3=require(APP);
m3.importPack(JSON.stringify(pack),TODAY);
const pf3=m3.loadProfile();
ok("기존 목표에 붙음", pf3.goals.length===1 && pf3.goals[0].id==="mine", pf3.goals.map(g=>g.id).join(","));
ok("내 과제 유지", pf3.goals[0].tasks[0].text==="내가 적은 과제" && pf3.goals[0].tasks[0].done===true, "");
ok("팩 과제 추가", pf3.goals[0].tasks.length===3, String(pf3.goals[0].tasks.length));
ok("내 마감 안 덮임", pf3.goals[0].deadline==="11/5", pf3.goals[0].deadline);

// ================= 형식 검사 =================
let threw=""; try{ m3.importPack('{"app":"other","course":"x"}'); }catch(e){ threw=e.message; }
ok("남의 파일 거부", /과목 팩 파일이 아닙니다/.test(threw), threw);
threw=""; try{ m3.importPack('{"app":"learnfast-pack"}'); }catch(e){ threw=e.message; }
ok("과목명 없으면 거부", /과목 팩 파일이 아닙니다/.test(threw), threw);
threw=""; try{ m3.importPack('nope'); }catch(e){ threw="parse"; }
ok("깨진 파일 거부", threw==="parse", threw);
ok("백업 파일은 팩이 아님", (function(){ try{ m3.importPack(JSON.stringify(m3.exportPayload())); return false; }catch(e){ return true; } })(), "");

// ================= 화면 =================
m3.goTab("goal");
ok("목표마다 내보내기 버튼", byCls("packbtn").length===1, String(byCls("packbtn").length));
ok("가져오기 칸", /과목 팩 가져오기/.test(allText()), "");
ok("내 진도는 안 간다고 알림", byCls("packbtn")[0].title.indexOf("내 진도는 빠집니다")>=0, byCls("packbtn")[0].title);

console.log(f?("\nFAILED "+f):"\nPACK OK");
process.exit(f?1:0);
