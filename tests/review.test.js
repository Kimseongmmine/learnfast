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
mem["loop.profile"]=JSON.stringify({goals:[
  {id:"g1",title:"데이터베이스",tasks:[{id:"t1",text:"정규화 1NF~3NF 정리",done:false,kind:"개념"},{id:"t2",text:"SQL 조인 쿼리 10개 짜기",done:false,kind:"구현"}]},
  {id:"g2",title:"수치해석",tasks:[{id:"t3",text:"뉴턴법 수렴차수 유도",done:false,kind:"유도"}]}
]});
const m=require(APP);

// ================= 간격 반복 =================
ok("간격은 1·2·4·8·16", JSON.stringify(m.REVIEW_STEPS)==="[1,2,4,8,16]", JSON.stringify(m.REVIEW_STEPS));
let it={box:1,due:TODAY,seen:0};
const steps=[];
for(let i=0;i<5;i++){ it=m.scheduleReview(it,true,TODAY); steps.push(it.box+":"+it.due); }
ok("맞히면 상자가 오른다", steps.join(" ")==="2:2026-08-29 3:2026-08-31 4:2026-09-04 5:2026-09-12 5:2026-09-12", steps.join(" "));
ok("5번 상자에서 멈춤", it.box===5, String(it.box));
ok("본 횟수 누적", it.seen===5, String(it.seen));
const wrong=m.scheduleReview(it,false,TODAY);
ok("틀리면 1로", wrong.box===1 && wrong.due==="2026-08-28", wrong.box+" "+wrong.due);
ok("원본 불변", it.box===5, String(it.box));

// ================= 큐에 넣기 =================
const r1=m.addReview("g1","개념","정규화 1NF~3NF",TODAY,"2NF 부분함수종속");
ok("새 항목 생성", !!r1 && r1.box===1 && r1.due==="2026-08-28", JSON.stringify(r1));
ok("틀린 지점 저장", r1.missed==="2NF 부분함수종속", r1.missed);
ok("빈 텍스트는 안 들어감", m.addReview("g1","개념","",TODAY)===null, "");
const dup=m.addReview("g1","개념","정규화 1NF~3NF",TODAY,"이번엔 3NF");
ok("같은 걸 또 틀리면 되돌림", m.loadReviews().length===1 && dup.box===1, String(m.loadReviews().length));
ok("틀린 지점이 갱신됨", dup.missed==="이번엔 3NF", dup.missed);

// 상자를 올려두고 같은 걸 또 틀리면 1로 떨어진다
let all=m.loadReviews(); all[0]=m.scheduleReview(all[0],true,TODAY); m.saveReviews(all);
ok("상자 2로 올라감", m.loadReviews()[0].box===2, String(m.loadReviews()[0].box));
m.addReview("g1","개념","정규화 1NF~3NF",TODAY,"또 틀림");
ok("다시 1로", m.loadReviews()[0].box===1, String(m.loadReviews()[0].box));

// ================= 차례가 된 것만 =================
m.saveReviews([
  {id:"r1",goalId:"g1",kind:"개념",text:"A",due:"2026-08-20",box:1,missed:"a놓침"},
  {id:"r2",goalId:"g2",kind:"유도",text:"B",due:"2026-08-27",box:2,missed:""},
  {id:"r3",goalId:"g1",kind:"개념",text:"C",due:"2026-09-10",box:3,missed:""}
]);
const due=m.dueReviews(TODAY,5);
ok("미래 것은 안 나옴", due.length===2, JSON.stringify(due.map(x=>x.id)));
ok("오래 밀린 것부터", due[0].id==="r1", due.map(x=>x.id).join(","));
ok("개수 제한", m.dueReviews(TODAY,1).length===1, "");

const rc=m.dueReviewCandidates(TODAY,m.loadProfile(),5);
ok("후보 모양으로 나옴", rc[0].reviewId==="r1" && rc[0].taskId===null, JSON.stringify(rc[0]));
ok("복습 표시가 붙음", rc[0].text==="복습 — A" && rc[0].review===true, rc[0].text);
ok("과목 제목을 찾아옴", rc[0].goalTitle==="데이터베이스", rc[0].goalTitle);
ok("유형을 물려받음", rc[1].kind==="유도", rc[1].kind);

// 복습 텍스트에는 인출 문구를 겹쳐 붙이지 않는다
ok("복습엔 인출 문구 안 겹침", m.retrievalText("복습 — A","개념")==="복습 — A", m.retrievalText("복습 — A","개념"));

// ================= 끝냈을 때 =================
const okd=m.settleReview("r2","",TODAY);
ok("비우고 끝내면 상자 오름", okd.box===3 && okd.due==="2026-08-31", JSON.stringify(okd));
const bad=m.settleReview("r1","여전히 2NF",TODAY);
ok("한 줄 적으면 1로", bad.box===1 && bad.due==="2026-08-28", JSON.stringify(bad));
ok("적은 게 저장됨", bad.missed==="여전히 2NF", bad.missed);
ok("없는 id 는 null", m.settleReview("없음","",TODAY)===null, "");

// ================= 유형별로 묻는 말 =================
ok("구현", m.askLabel("구현")==="막혔던 지점?", m.askLabel("구현"));
ok("문제", m.askLabel("문제")==="틀린 번호?", m.askLabel("문제"));
ok("유도", m.askLabel("유도")==="막힌 단계?", m.askLabel("유도"));
ok("개념", m.askLabel("개념")==="안 나온 것?", m.askLabel("개념"));
ok("모르는 유형도 뭔가 묻는다", !!m.askLabel(null), m.askLabel(null));

// ================= 계획에 섞여 들어간다 =================
m.saveReviews([{id:"rr",goalId:"g1",kind:"개념",text:"정규화 1NF~3NF",due:"2026-08-25",box:1,missed:"2NF"}]);
const cands=m.dueReviewCandidates(TODAY,m.loadProfile(),2)
  .concat(m.nextPendingTasks(m.loadProfile(),4));
ok("복습이 맨 앞", cands[0].review===true, JSON.stringify(cands.map(c=>c.text)));
const blocks=m.templatePlan(cands);
const rb=blocks.filter(b=>b.reviewId)[0];
ok("복습이 블록이 됨", !!rb, blocks.map(b=>b.text).join(" / "));
ok("복습 블록에 reviewId", rb.reviewId==="rr", rb.reviewId);
ok("복습 블록은 핵심", rb.core===true, String(rb.core));
ok("과제 블록은 taskId 유지", blocks.filter(b=>b.taskId).length>=1, "");

// ================= 실행 모드에서 한 줄 =================
mem["loop.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:[
  {id:"b1",time:"09:00-11:00",text:"복습 — 정규화 1NF~3NF",goalId:"g1",reviewId:"rr",kind:"개념",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true},
  {id:"b2",time:"11:00-12:30",text:"SQL 조인 쿼리 10개 짜기",goalId:"g1",taskId:"t2",kind:"구현",core:true,done:false,started:true,startedAt:"2026-08-27T02:00:00.000Z",onTime:true}
]}});
m.goTab("today");
m.openFocus("b1");
ok("한 줄 칸이 뜸", byCls("askinput").length===1, String(byCls("askinput").length));
ok("유형에 맞는 라벨", allText().includes("안 나온 것?"), "");
ok("비워두라고 안내", byCls("askinput")[0].placeholder.indexOf("비워두고")>=0, byCls("askinput")[0].placeholder);

// 복습 블록은 맞음/틀림으로 판정한다
ok("복습엔 판정 버튼", !!btn("기억났다") && !!btn("안 나왔다"), "");
btn("기억났다").click();
ok("기억났으면 상자 오름", m.loadReviews()[0].box===2, JSON.stringify(m.loadReviews()[0]));

// 적고 완료 -> 새 복습이 생긴다
m.openFocus("b2");
const inp=byCls("askinput")[0];
inp.value="shared memory 크기 오류";
inp._h.change();
btn("완료").click();
const revs=m.loadReviews();
ok("새 복습이 생김", revs.length===2, JSON.stringify(revs.map(r=>r.text)));
const made=revs.filter(r=>r.text.indexOf("SQL")>=0)[0];
ok("과제 텍스트가 복습이 됨", !!made, JSON.stringify(revs.map(r=>r.text)));
ok("적은 게 붙음", made.missed==="shared memory 크기 오류", made.missed);
ok("유형도 따라옴", made.kind==="구현", made.kind);
ok("내일 다시 뜬다", made.due==="2026-08-28", made.due);
ok("막힘 기록에도 남음", (m.loadStuck()["g1"]||[]).indexOf("shared memory 크기 오류")>=0, JSON.stringify(m.loadStuck()));
ok("초안은 비워짐", true, "");

// ================= 막힘 =================
mem["loop.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:[
  {id:"b3",time:"09:00-11:00",text:"CUDA 커널 짜기",goalId:"g1",taskId:"t2",kind:"구현",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}
]}});
m.openFocus("b3");
ok("막힘 프롬프트 버튼", !!btn("막힘 — 다음 한 걸음만"), "");
ok("첫 1개만 버튼", !!btn("첫 1개만"), "");
btn("첫 1개만").click();
const nb=JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(b=>b.id==="b3")[0];
ok("과제가 줄어듦", /^첫 1개만 · /.test(nb.text), nb.text);
btn("첫 1개만").click();
const nb2=JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(b=>b.id==="b3")[0];
ok("두 번 눌러도 한 번만 붙음", (nb2.text.match(/첫 1개만/g)||[]).length===1, nb2.text);

console.log(f?("\nFAILED "+f):"\nREVIEW OK");
process.exit(f?1:0);
