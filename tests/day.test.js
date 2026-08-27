const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,26,9,30,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},click(){if(this._h.click)this._h.click({preventDefault(){}});},setAttribute(k,v){this._attrs[k]=v;},remove(){},
 querySelector(){return null;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null,confirm:()=>true}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");
// 접힌 덩이 안은 화면에 없다. .blocks 의 바로 아래 자식만이 첫 화면이다.
const topRows=()=>{const w=byCls("blocks")[0]; return w?w.children.filter(c=>/(^| )(block|microrow)( |$)/.test(c.className)):[];};

mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"DB",tasks:[
  {id:"t1",text:"DB 1강 듣고 필기 2쪽",done:false},{id:"t2",text:"3장 연습문제 1-10번 풀기",done:false},
  {id:"t3",text:"4장 요약 정리",done:false},{id:"t4",text:"5장 예제 따라치기",done:false}]}]});
const m=require(APP);
const prof=m.loadProfile();

// ---------- 장소별 이동 시간 ----------
// main 은 안 채우고 personal 은 내 장소를 채운다. 둘 다 맞다.
const SEEDS=!!(m.MY_PLACES||"");
ok(SEEDS?"개인용은 채워둠":"공개판은 빈 채로",
   SEEDS ? prof.places===m.MY_PLACES : prof.places==="",
   JSON.stringify(prof.places));
prof.places="학교 도서관 25분 / 집 앞 스터디카페 5분 / 집 책상 / 체육관 15분 / 카페는 3시간 이상 앉을 때만";
const r=m.placeRules(prof);
ok("저녁 학습 장소", r.night==="집 앞 스터디카페", r.night);
ok("장소별 분 파싱", r.mins["학교 도서관"]===25 && r.mins["집 앞 스터디카페"]===5 && r.mins["체육관"]===15, JSON.stringify(r.mins));
ok("집은 0분", r.mins[r.home]===0, String(r.mins[r.home]));
ok("집↔스터디카페 5분", m.commuteBetween("집","집 앞 스터디카페",r)===5, m.commuteBetween("집","집 앞 스터디카페",r));
ok("도서관↔체육관은 먼 쪽", m.commuteBetween("학교 도서관","체육관",r)===25, m.commuteBetween("학교 도서관","체육관",r));
ok("같은 장소면 0", m.commuteBetween("집","집",r)===0);
ok("모르는 장소는 프로필의 대표 이동시간", m.commuteBetween("집","학원",r)===25, m.commuteBetween("집","학원",r));

// 옛 기본값만 새 기본값으로 올린다
mem["lf.profile"]=JSON.stringify({goals:[],places:"경북대 중앙도서관 / 집 책상 / 카페는 3시간 이상 앉을 때만 / 수영장"});
ok("적어둔 값은 그대로", m.loadProfile().places.indexOf("경북대")>=0, m.loadProfile().places);
mem["lf.profile"]=JSON.stringify({goals:[],places:"내가 적은 장소 / 독서실"});
ok("직접 적은 값은 안 건드림", m.loadProfile().places==="내가 적은 장소 / 독서실", m.loadProfile().places);
mem["lf.profile"]=JSON.stringify({goals:[],places:""});
ok("지운 값은 그대로 빈칸", m.loadProfile().places==="", JSON.stringify(m.loadProfile().places));

// ---------- fillPlaces: 저녁은 집 근처 ----------
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"DB",tasks:[{id:"t1",text:"x",done:false}]}],places:"학교 도서관 25분 / 집 앞 스터디카페 5분 / 집 책상 / 체육관 15분 / 카페는 3시간 이상 앉을 때만"});
const prof2=m.loadProfile();
const fp=m.fillPlaces([
  {id:"a",time:"14:00-15:50",text:"4장 요약 정리",taskId:"t3",core:true},
  {id:"b",time:"19:00-21:00",text:"5장 예제 따라치기",taskId:"t4"},
  {id:"c",time:"21:00-22:00",text:"오늘 기록 · 독서"}
], prof2);
ok("낮 학습은 도서관", fp[0].place==="학교 도서관", fp[0].place);
ok("저녁 학습은 집 앞 스터디카페", fp[1].place==="집 앞 스터디카페", fp[1].place);
ok("밤 마무리는 집", fp[2].place==="집", fp[2].place);

// ---------- 이동: 짧은 휴식을 흡수 ----------
const abs=m.insertCommutes([
  {id:"a",time:"14:00-15:50",text:"4장 요약 정리",taskId:"t3",core:true,place:"경북대 중앙도서관"},
  {id:"b",time:"15:50-16:00",text:"물 한 잔 · 눈 휴식",place:"경북대 중앙도서관"},
  {id:"c",time:"16:00-17:00",text:"운동 (수영 우선)",place:"수영장"}
], r);
ok("흡수하면 휴식 행이 사라짐", abs.length===3, abs.map(x=>x.time+" "+x.text).join(" / "));
ok("이동이 휴식 자리를 먹음", abs[1].move && abs[1].time==="15:50-16:15", abs[1].time);
ok("운동은 45분 남음", abs[2].time==="16:15-17:00", abs[2].time);
ok("앞 학습 블록은 안 깎임", abs[0].time==="14:00-15:50", abs[0].time);

// 흡수할 게 없으면 예전처럼 뒤를 미룬다
const del=m.insertCommutes([
  {id:"a",time:"12:00-13:00",text:"점심",place:"경북대 중앙도서관"},
  {id:"b",time:"13:00-15:00",text:"공부",taskId:"t1",place:"수영장"}
], r);
ok("긴 블록은 흡수 안 함", del.length===3 && del[0].time==="12:00-13:00", del.map(x=>x.time).join(" / "));
ok("뒤가 밀림(폴백)", del[1].time==="13:00-13:25" && del[2].time==="13:25-15:00", del[1].time+" / "+del[2].time);
ok("숫자 인자도 그대로 동작", m.insertCommutes([{id:"1",time:"09:00-10:00",text:"a",place:"집"},{id:"2",time:"10:00-12:00",text:"b",place:"도서관"}],25)[1].time==="10:00-10:25");

ok("filler 판정", m.isFillerBlock({text:"점심"}) && m.isFillerBlock({text:"물 한 잔 · 눈 휴식"}), "");
ok("핵심은 filler 아님", !m.isFillerBlock({text:"휴식",core:true}) && !m.isFillerBlock({text:"휴식",taskId:"t1"}), "");

// ---------- micro 판정 ----------
ok("10분 휴식은 micro", m.isMicroBlock({time:"10:50-11:00",text:"물 한 잔"})===true);
ok("이동은 micro", m.isMicroBlock({time:"16:00-16:25",text:"이동 · A → B",move:true})===true);
ok("60분 점심은 micro 아님", m.isMicroBlock({time:"12:00-13:00",text:"점심"})===false);
ok("25분이어도 과제면 micro 아님", m.isMicroBlock({time:"09:00-09:25",text:"x",taskId:"t1"})===false);
ok("25분이어도 핵심이면 micro 아님", m.isMicroBlock({time:"09:00-09:25",text:"x",core:true})===false);
ok("특별 일정은 micro 아님", m.isMicroBlock({time:"14:00-14:20",text:"병원",event:true})===false);

// ---------- splitDay ----------
// 위에서 과제 1개짜리로 덮어썼으니 되돌린다
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"DB",tasks:[
  {id:"t1",text:"DB 1강 듣고 필기 2쪽",done:false},{id:"t2",text:"3장 연습문제 1-10번 풀기",done:false},
  {id:"t3",text:"4장 요약 정리",done:false},{id:"t4",text:"5장 예제 따라치기",done:false}]}]});
const _dp=m.loadProfile(); _dp.places="학교 도서관 25분 / 집 앞 스터디카페 5분 / 집 책상 / 체육관 15분 / 카페는 3시간 이상 앉을 때만"; mem["lf.profile"]=JSON.stringify(_dp);
const day=m.insertCommutes(m.fillPlaces(m.templatePlan(m.nextPendingTasks(m.loadProfile(),6)),m.loadProfile()), m.placeRules(m.loadProfile()));
ok("하루가 15행 미만", day.length<=14, String(day.length));
ok("이동은 4개 이하", day.filter(x=>x.move).length<=4, String(day.filter(x=>x.move).length));

const s0=m.splitDay(day, 9*60+30, true, 3);
ok("아침엔 지난 것 없음", s0.past.length===0, String(s0.past.length));
ok("펼침은 4개", s0.live.length===4, String(s0.live.length));
ok("나머지는 이따", s0.later.length===day.length-4, String(s0.later.length));
ok("펼침에 지금 블록이 첫 줄", s0.live[0].time.indexOf("09:00")===0, s0.live[0].time);

const s1=m.splitDay(day, 16*60+30, true, 3);
ok("오후엔 지난 것이 쌓임", s1.past.length>=6, String(s1.past.length));
ok("지금 진행 중인 블록이 첫 줄", m.blockEndMinutes(s1.live[0].time)>16*60+30, s1.live[0].time);
ok("세 덩이 합이 전체", s1.past.length+s1.live.length+s1.later.length===day.length);

const s2=m.splitDay(day, 23*60+30, true, 3);
ok("하루 끝나면 전부 지난 것", s2.past.length===day.length && s2.live.length===0, String(s2.past.length));

const s3=m.splitDay(day, 9*60, false, 3);
ok("내일 계획은 지난 것 없이 앞 4개", s3.past.length===0 && s3.live.length===4, String(s3.live.length));

ok("spanText", m.spanText([{time:"12:00-13:00"},{time:"21:00-22:00"}])==="12:00~22:00", m.spanText([{time:"12:00-13:00"},{time:"21:00-22:00"}]));
ok("빈 목록은 빈 문자열", m.spanText([])==="");

// ---------- 화면 ----------
mem["lf.plans"]=JSON.stringify({"2026-08-26":{source:"template",generatedAt:"x",blocks:day}});
FIXED=new RealDate(2026,7,26,9,30,0);
m.render();
const t=allText();
ok("첫 화면 행은 4개", topRows().length===4, String(topRows().length));
ok("그중 정상 행은 3개", topRows().filter(c=>c.className.indexOf("block")>=0).length===3, topRows().map(c=>c.className).join(","));
ok("얇은 행 존재", byCls("microrow").length>=1, String(byCls("microrow").length));
ok("접힌 덩이 하나(이따)", byCls("daygroup").length===1, String(byCls("daygroup").length));
ok("이따 요약에 개수·구간·핵심", /이따 10개 \(13:00~22:00\) · 핵심 1/.test(t), (t.match(/이따[^|]*/)||[""])[0]);
ok("접힌 것은 안 펼쳐짐", byCls("daygroup")[0].open===false, String(byCls("daygroup")[0].open));

FIXED=new RealDate(2026,7,26,16,30,0);
m.render();
const t2=allText();
ok("오후엔 지난 덩이도 생김", byCls("daygroup").length===2, String(byCls("daygroup").length));
ok("지난 요약에 착수 집계", /지난 \d+개 · 착수 0\/3/.test(t2), t2.match(/지난[^|]*/));
ok("첫 화면은 6줄 이하 (14행짜리 하루인데도)", topRows().length+byCls("daygroup").length<=6,
   "top="+topRows().length+" group="+byCls("daygroup").length+" 전체="+day.length);

console.log(f?("\nFAILED "+f):"\nDAY OK");
process.exit(f?1:0);
