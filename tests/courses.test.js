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
function tasks(n){ return Array.from({length:n},(_,i)=>({id:"t"+i,text:"과제"+i,done:false,kind:"개념"})); }
function seed(over){
  mem={};
  mem["loop.profile"]=JSON.stringify({goals:[
    {id:"g1",title:"데이터베이스",deadline:"",scope:"",hard:true,tasks:tasks(4)},
    {id:"g2",title:"확률과통계",deadline:"",scope:"",hard:true,tasks:tasks(4)},
    {id:"g3",title:"수치해석",deadline:"",scope:"",tasks:tasks(4)},
    {id:"g4",title:"기계학습개론",deadline:"",scope:"",hard:true,tasks:tasks(4)},
    {id:"g5",title:"대규모병렬컴퓨팅",deadline:"",scope:"",tasks:tasks(4)}
  ].map(function(g){ return Object.assign(g, (over||{})[g.id]||{}); })});
}
seed(); const m=require(APP);

// ================= 하루 3과목 =================
ok("기본이 3과목", m.DAILY_COURSES===3, String(m.DAILY_COURSES));
let day=m.dailyCourses(m.loadProfile(),TODAY,3);
ok("5과목 중 3개만", day.length===3, day.map(g=>g.title).join(","));
// 공개판은 과목명으로 짐작하지 않는다. 사용자가 goal.hard 로 표시한 것만 가산.
ok("어렵다고 표시한 과목이 먼저", day.filter(g=>g.hard).length===3, day.map(g=>g.title).join(","));
ok("같은 날 같은 답(결정론적)", m.dailyCourses(m.loadProfile(),TODAY,3).map(g=>g.id).join()===day.map(g=>g.id).join(), "");

// 마감이 코앞이면 부담 과목을 제친다
seed({g5:{deadline:"8/30"}});
day=m.dailyCourses(m.loadProfile(),TODAY,3);
ok("마감 임박이 최우선", day[0].title==="대규모병렬컴퓨팅", day.map(g=>g.title).join(","));

// 며칠 안 한 과목이 끌려 올라온다
seed();
const plans={};
[1,2,3].forEach(function(i){
  plans[m.addDays(TODAY,-i)]={source:"template",blocks:[
    {id:"x"+i,time:"09:00-11:00",text:"t",goalId:"g1",taskId:"t0"},
    {id:"y"+i,time:"11:00-12:00",text:"t",goalId:"g2",taskId:"t0"},
    {id:"z"+i,time:"14:00-15:00",text:"t",goalId:"g4",taskId:"t0"}]};
});
mem["loop.plans"]=JSON.stringify(plans);
ok("어제 한 과목은 최근", m.lastTouched("g1",TODAY,14)===m.addDays(TODAY,-1), m.lastTouched("g1",TODAY,14));
ok("안 한 과목은 null", m.lastTouched("g3",TODAY,14)===null, String(m.lastTouched("g3",TODAY,14)));
day=m.dailyCourses(m.loadProfile(),TODAY,3);
ok("3일 내리 한 과목은 밀림", day.map(g=>g.id).indexOf("g3")>=0 || day.map(g=>g.id).indexOf("g5")>=0, day.map(g=>g.title).join(","));

// 남은 과제가 없는 과목은 안 고른다
seed({g1:{tasks:[{id:"a",text:"x",done:true}]}});
day=m.dailyCourses(m.loadProfile(),TODAY,5);
ok("다 끝낸 과목은 제외", day.every(g=>g.id!=="g1"), day.map(g=>g.title).join(","));
ok("과제 없는 프로필도 안 터짐", m.dailyCourses({goals:[]},TODAY,3).length===0, "");
ok("빈 인자도 안 터짐", m.dailyCourses(null,TODAY,3).length===0, "");

// ================= 시험 역산 =================
ok("범위 1~6장", JSON.stringify(m.scopeUnits("1~6장"))==='{"n":6,"unit":"장"}', JSON.stringify(m.scopeUnits("1~6장")));
ok("범위 3장", m.scopeUnits("3장").n===3, "");
ok("주차 단위", JSON.stringify(m.scopeUnits("1-4주차"))==='{"n":4,"unit":"주차"}', JSON.stringify(m.scopeUnits("1-4주차")));
ok("못 읽으면 null", m.scopeUnits("범위 미정").n===null, "");
ok("빈 값", m.scopeUnits("").n===null, "");

const g={id:"x",title:"확률과통계",deadline:"10/20",scope:"1~6장",
  tasks:Array.from({length:8},(_,i)=>({id:"t"+i,done:i<2}))};
const pace=m.examPace(g,TODAY);
ok("남은 날", pace.daysLeft===54, String(pace.daysLeft));
ok("총량", pace.total===6, String(pace.total));
ok("완료 환산", pace.done===1.5, String(pace.done));
ok("남은 양", pace.left===4.5, String(pace.left));
ok("며칠에 1장", pace.daysPer===12, String(pace.daysPer));
ok("한 줄 문구", m.paceLine(g,TODAY)==="D-54 · 6장 중 1.5장 · 남은 4.5장 → 12일에 1장", m.paceLine(g,TODAY));

const tight={id:"y",title:"수치해석",deadline:"9/1",scope:"1~10장",tasks:[{id:"a",done:false},{id:"b",done:false}]};
ok("빡빡하면 하루 단위로", m.paceLine(tight,TODAY)==="D-5 · 10장 중 0장 · 남은 10장 → 하루 2장", m.paceLine(tight,TODAY));

const doneAll={id:"z",title:"데베",deadline:"10/20",scope:"1~6장",tasks:[{id:"a",done:true}]};
ok("다 했으면 그렇게 말한다", /6장 다 함/.test(m.paceLine(doneAll,TODAY)), m.paceLine(doneAll,TODAY));

const late={id:"w",title:"기계",deadline:"8/20",scope:"1~6장",tasks:[{id:"a",done:false},{id:"b",done:false}]};
ok("지난 마감", /^마감 7일 지남/.test(m.paceLine(late,TODAY)), m.paceLine(late,TODAY));
// 마감을 안 적으면 학기 시험 일정을 물려받는다. 시험 일정까지 없어야 빈 줄.
ok("마감 없으면 학기 시험을 물려받음", /^D-54 \(중간고사\)/.test(m.paceLine({id:"v",title:"x",deadline:"",scope:"1~6장",tasks:[]},TODAY,{exams:"중간고사 10/20 / 기말고사 12/15",goals:[]})), m.paceLine({id:"v",title:"x",deadline:"",scope:"1~6장",tasks:[]},TODAY,{exams:"중간고사 10/20 / 기말고사 12/15",goals:[]}));
ok("시험 일정도 없으면 빈 줄", m.paceLine({id:"v",title:"x",deadline:"",scope:"1~6장",tasks:[]},TODAY,{exams:"",goals:[]})==="", "");
ok("범위 없으면 D- 만", m.paceLine({id:"u",title:"x",deadline:"10/20",scope:"",tasks:[]},TODAY)==="D-54", m.paceLine({id:"u",title:"x",deadline:"10/20",scope:"",tasks:[]},TODAY));
ok("격려 문구 없음", !/힘내|화이팅|할 수 있|괜찮/.test(m.paceLine(tight,TODAY)), m.paceLine(tight,TODAY));

// ================= 계획에 반영 =================
seed({g5:{deadline:"8/30"}});
mem["loop.plans"]=JSON.stringify({});
const prof=m.loadProfile();
const chosen=m.dailyCourses(prof,TODAY,m.DAILY_COURSES);
const cands=m.nextPendingTasks({goals:chosen},6);
const ids={}; cands.forEach(c=>{ids[c.goalId]=true;});
ok("후보가 3과목 안에서만", Object.keys(ids).length<=3, Object.keys(ids).join(","));
ok("고른 과목에서만 나옴", cands.every(c=>chosen.some(g=>g.id===c.goalId)), "");

// ================= 화면 =================
seed({g2:{deadline:"10/20",scope:"1~6장"}});
const _cp=m.loadProfile(); _cp.exams="중간고사 10/20 / 기말고사 12/15"; mem["loop.profile"]=JSON.stringify(_cp);
m.goTab("goal");
ok("역산 줄 렌더", byCls("paceline").length>=1, String(byCls("paceline").length));
ok("역산 내용", /D-54/.test(allText()), (allText().match(/D-\d+[^|]*/)||[""])[0]);
ok("나머지도 학기 시험으로 줄이 뜬다", byCls("paceline").length===5, String(byCls("paceline").length));

console.log(f?("\nFAILED "+f):"\nCOURSES OK");
process.exit(f?1:0);
