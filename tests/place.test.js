const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,26,10,0,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},click(){if(this._h.click)this._h.click();},setAttribute(k,v){this._attrs[k]=v;},
 querySelector(sel){const m=sel.match(/\[data-k="(.+)"\]/); if(!m)return null; let found=null; (function w(n){(n.children||[]).forEach(c=>{if(c.dataset&&c.dataset.k===m[1])found=found||c; w(c);});})(this); return found;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];

async function main(){
  mem["lf.profile"]=JSON.stringify({places:"경북대 중앙도서관 / 집 책상 / 카페는 3시간 이상 앉을 때만 / 수영장 · 집→학교 25분",
    goals:[{id:"g1",title:"DB",tasks:[{id:"t1",text:"DB 1강 듣기",done:false},{id:"t2",text:"3장 1-10번 풀기",done:false},{id:"t3",text:"4장 요약",done:false},{id:"t4",text:"5장 예제",done:false}]}]});
  delete require.cache[APP]; const m=require(APP);
  const prof=m.loadProfile();

  // --- placeRules: 자유 텍스트에서 이름과 이동시간 뽑기 ---
  const r=m.placeRules(prof);
  ok("도서관 이름", r.lib==="경북대 중앙도서관", r.lib);
  ok("카페 이름", r.cafe==="카페", r.cafe);
  ok("운동 장소", r.gym==="수영장", r.gym);
  ok("집", r.home==="집", r.home);
  ok("이동 시간 파싱", r.commuteMin===25, r.commuteMin);
  const d=m.placeRules({});
  ok("기본값", d.lib==="도서관" && d.cafe==="카페" && d.commuteMin===20, JSON.stringify(d));
  ok("이상한 이동시간은 클램프", m.placeRules({places:"집→학교 900분"}).commuteMin===120, m.placeRules({places:"집→학교 900분"}).commuteMin);

  // --- fillPlaces ---
  const blocks=[
    {id:"a",time:"09:00-12:30",text:"DB 1강 듣기",taskId:"t1",core:true},          // 210분 -> 카페
    {id:"b",time:"12:30-13:30",text:"점심"},                                        // 직전 따라감
    {id:"c",time:"13:30-15:30",text:"3장 1-10번 풀기",taskId:"t2",core:true},      // 120분 -> 도서관
    {id:"d",time:"16:00-17:00",text:"운동 (수영 우선)"},                            // 수영장
    {id:"e",time:"17:00-19:00",text:"저녁 · 휴식"},                                 // 운동 뒤 식사는 집
    {id:"f",time:"21:00-22:00",text:"오늘 기록 · 독서"}                             // 밤 -> 집
  ];
  const fp=m.fillPlaces(blocks,prof);
  ok("3시간 이상 학습 -> 카페", fp[0].place==="카페", fp[0].place);
  ok("식사는 직전 장소", fp[1].place==="카페", fp[1].place);
  ok("3시간 미만 학습 -> 도서관", fp[2].place==="경북대 중앙도서관", fp[2].place);
  ok("운동 -> 수영장", fp[3].place==="수영장", fp[3].place);
  ok("운동 뒤 식사는 집", fp[4].place==="집", fp[4].place);
  ok("밤 21시 이후 -> 집", fp[5].place==="집", fp[5].place);
  ok("원본 불변", blocks[0].place===undefined, JSON.stringify(blocks[0]));
  const keep=m.fillPlaces([{id:"x",time:"14:00-15:00",text:"병원",event:true}],prof);
  ok("특별 일정은 장소를 덮지 않음", !keep[0].place, JSON.stringify(keep[0]));
  const given=m.fillPlaces([{id:"y",time:"09:00-10:00",text:"수업",place:"공대 3호관"}],prof);
  ok("이미 있는 place 유지", given[0].place==="공대 3호관", given[0].place);

  // --- insertCommutes ---
  const ic=m.insertCommutes(fp,25);
  const moves=ic.filter(b=>b.move);
  ok("장소 바뀐 만큼 이동 블록", moves.length===3, moves.map(b=>b.time+" "+b.text).join(" / "));
  ok("이동 문구", moves[0].text==="이동 · 카페 → 경북대 중앙도서관", moves[0].text);
  ok("이동 블록 시각", moves[0].time==="13:30-13:55", moves[0].time);
  const after=ic.find(b=>b.id==="c");
  ok("뒤 블록이 25분 밀림", after.time==="13:55-15:30", after.time);
  ok("이동은 핵심이 아님", moves.every(b=>!b.core && !b.place), "");
  const tight=m.insertCommutes([{id:"1",time:"09:00-10:00",text:"a",place:"집"},{id:"2",time:"10:00-10:30",text:"b",place:"도서관"}],25);
  ok("20분 미만으로 남으면 이동 안 넣음", tight.length===2 && tight[1].time==="10:00-10:30", JSON.stringify(tight.map(b=>b.time)));
  ok("같은 장소면 이동 없음", m.insertCommutes([{id:"1",time:"09:00-10:00",place:"집",text:"a"},{id:"2",time:"10:00-12:00",place:"집",text:"b"}],25).length===2);

  // --- 생성(AI 없음 -> 템플릿) 전체 경로 ---
  btn("오늘 계획 생성").click();
  await new Promise(r2=>setTimeout(r2,0));
  const plan=JSON.parse(mem["lf.plans"])["2026-08-26"];
  ok("모든 계획 블록에 장소(이동 제외)", plan.blocks.every(b=>b.move||b.place), plan.blocks.map(b=>b.time+" "+(b.place||"-")).join(" / "));
  ok("이동 블록 생성됨", plan.blocks.some(b=>b.move), plan.blocks.map(b=>b.text).join(" / "));
  const mins=plan.blocks.map(b=>m.blockStartMinutes(b.time));
  ok("시간 정렬 유지", mins.every((v,i)=>i===0||(mins[i-1]||0)<=(v||0)), plan.blocks.map(b=>b.time).join(" "));
  ok("겹치지 않음", plan.blocks.every((b,i)=>i===0||m.blockEndMinutes(plan.blocks[i-1].time)<=m.blockStartMinutes(b.time)), plan.blocks.map(b=>b.time).join(" "));

  // --- 렌더 ---
  ok("장소 칩 렌더", byCls("place").length>0, "");
  ok("이동 블록 클래스", byCls("isMove").length>0, "");

  // --- 프로필 기본값 ---
  mem["lf.profile"]=JSON.stringify({goals:[]});
  // main 은 기본값을 안 채우고(온보딩이 받는다), personal 은 내 장소를 채워둔다.
const SEEDS=!!(m.MY_PLACES||"");
ok(SEEDS?"개인용은 내 장소를 채워둠":"공개판은 빈 채로",
   SEEDS ? m.loadProfile().places===m.MY_PLACES : m.loadProfile().places==="",
   JSON.stringify(m.loadProfile().places));
  mem["lf.profile"]=JSON.stringify({goals:[],places:""});
  ok("지운 값은 그대로 빈칸", m.loadProfile().places==="", JSON.stringify(m.loadProfile().places));
  ok("AI 컨텍스트에 장소", m.profileContext({places:"중앙도서관 / 집"}).indexOf("중앙도서관")>=0, m.profileContext({places:"중앙도서관 / 집"}));

  console.log(f?("\nFAILED "+f):"\nPLACE OK");
  process.exit(f?1:0);
}
main();
