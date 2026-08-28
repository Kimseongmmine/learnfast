const path=require("path"); const APP=path.resolve(__dirname, "..", "client", "app.js");
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

const m=require(APP);

// personal 브랜치는 내 기본값이 채워져 있어서 온보딩이 뜰 이유가 없다.
// 그것 자체가 확인할 값어치가 있는 동작이라, 여기서 끝낸다.
if (m.MY_COURSES) {
  ok("개인용은 온보딩을 안 띄운다", m.needsOnboard()===false, "");
  ok("대신 내 과목이 채워져 있다", m.loadProfile().courses===m.MY_COURSES, m.loadProfile().courses);
  console.log("\nONBOARD OK");
  process.exit(0);
}

// ================= 처음 열면 온보딩만 =================
ok("온보딩 필요", m.needsOnboard()===true, "");
m.render();
ok("온보딩만 보인다", byCls("onboard").length===1, String(byCls("onboard").length));
ok("탭바 없음", byCls("tabbar").length===0, "");
ok("계획도 없음", byCls("today").length===0, "");
ok("세 단계", byCls("obstep").length===3, String(byCls("obstep").length));
const t=allText();
ok("과목을 묻는다", t.includes("이번 학기 과목"), "");
ok("시험을 묻는다", t.includes("시험 날짜"), "");
ok("장소를 묻는다", t.includes("주로 공부하는 곳"), "");
ok("남의 대학이 안 보인다", !/경북대|중앙도서관/.test(t), "");
ok("남의 과목이 안 보인다", !/데이터베이스|확률과통계|대규모병렬/.test(t), "");
ok("남의 시험날짜가 안 보인다", !/10\/20|12\/15/.test(t.replace(/예:|중간 · |기말 · /g,"")) || /placeholder/.test(""), "");
ok("저장 위치를 밝힌다", /이 브라우저에만 저장/.test(t), "");
ok("건너뛸 수 있다", !!btn("나중에"), "");

// ================= 채우고 시작 =================
const ins=walk(root,n=>n.className&&n.className.indexOf("obinput")>=0,[]);
ok("입력칸 5개(과목 칸 포함)", ins.length===5, String(ins.length));
ins[0].value="자료구조\n운영체제\n선형대수"; ins[0]._h.change();
ins[1].value="10/20"; ins[1]._h.change();
ins[2].value="12/15"; ins[2]._h.change();
ins[3].value="학교 도서관"; ins[3]._h.change();
const mins=walk(root,n=>n.placeholder&&n.placeholder.indexOf("집에서")>=0,[])[0];
mins.value="25"; mins._h.change();
btn("시작하기").click();

const pf=m.loadProfile();
ok("과목 저장", pf.courses.indexOf("자료구조")>=0, pf.courses);
ok("목표 3개 생성", pf.goals.length===3, pf.goals.map(g=>g.title).join(","));
ok("목표 제목", pf.goals[0].title==="자료구조" && pf.goals[2].title==="선형대수", pf.goals.map(g=>g.title).join(","));
ok("시험 조립", pf.exams==="중간고사 10/20 / 기말고사 12/15", pf.exams);
ok("장소 조립", pf.places==="학교 도서관 25분 / 집 책상", pf.places);
ok("온보딩 끝남", m.needsOnboard()===false, "");
ok("이제 앱이 뜬다", byCls("onboard").length===0 && byCls("tabbar").length===1, "");

// 시험 일정이 실제로 물려받아진다
ok("마감 상속", /D-54 \(중간고사\)/.test(m.paceLine(pf.goals[0],"2026-08-27",pf)), m.paceLine(pf.goals[0],"2026-08-27",pf));
ok("장소 규칙", m.placeRules(pf).lib==="학교 도서관" && m.placeRules(pf).commuteMin===25, JSON.stringify(m.placeRules(pf)));

// ================= 건너뛰기 =================
mem={};
delete require.cache[APP]; const m2=require(APP);
ok("다시 처음이면 온보딩", m2.needsOnboard()===true, "");
m2.render();
btn("나중에").click();
ok("건너뛰면 앱으로", byCls("onboard").length===0 && byCls("tabbar").length===1, "");
ok("빈 프로필", m2.loadProfile().courses==="" && m2.loadProfile().goals.length===0, JSON.stringify(m2.loadProfile().courses));
ok("다시 안 뜬다", m2.needsOnboard()===false, "");

// 목표를 직접 만든 사람에게는 안 뜬다
mem={}; mem["lf.profile"]=JSON.stringify({goals:[{id:"g",title:"x",tasks:[]}]});
delete require.cache[APP]; const m3=require(APP);
ok("목표가 있으면 안 뜬다", m3.needsOnboard()===false, "");

console.log(f?("\nFAILED "+f):"\nONBOARD OK");
process.exit(f?1:0);
