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
const docHandlers={};
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(e,fn){docHandlers[e]=fn;}};
global.window={prompt:()=>null,confirm:()=>true,scrollTo(){}}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent.includes(t),[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-27";
mem["lf.profile"]=JSON.stringify({goals:[{id:"g1",title:"데이터베이스",tasks:[{id:"t1",text:"SQL 조인 쿼리 10개 짜기",done:false,kind:"구현"}]}]});
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",generatedAt:"x",blocks:[
  {id:"b1",time:"09:00-11:00",text:"SQL 조인 쿼리 10개 짜기",goalId:"g1",taskId:"t1",kind:"구현",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}
]}});
const m=require(APP);

// 기록이 없으면 아무 말도 안 한다
ok("기록 없으면 null", m.sessionStats(21,TODAY)===null, JSON.stringify(m.sessionStats(21,TODAY)));
ok("null이면 빈 줄", m.sessionLine(null)==="", "");

// 완료하면 실제 걸린 시간이 남는다 (09:02 착수 -> 지금 09:02, 아래에서 시각을 민다)
FIXED=new RealDate(2026,7,27,10,2,0);   // 착수 60분 뒤
m.goTab("today"); m.openFocus("b1");
btn("완료").click();
const ss=m.loadSessions();
ok("세션 1건", ss.length===1, JSON.stringify(ss));
ok("계획 120분", ss[0].plannedMin===120, String(ss[0].plannedMin));
ok("실제 60분", ss[0].actualMin===60, String(ss[0].actualMin));
ok("유형도 남음", ss[0].kind==="구현", ss[0].kind);

// 착수 기록이 없으면 지어내지 않는다
m.saveSessions([]);
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",blocks:[{id:"b2",time:"14:00-15:00",text:"x",goalId:"g1",taskId:"t1",kind:"개념",done:false}]}});
m.finishBlock(TODAY,{id:"b2",time:"14:00-15:00",kind:"개념",goalId:"g1",text:"x"});
ok("착수 없으면 기록 없음", m.loadSessions().length===0, JSON.stringify(m.loadSessions()));

// 비율은 몇 건 쌓여야 말한다
m.saveSessions([{date:TODAY,blockId:"a",kind:"구현",plannedMin:100,actualMin:140,breaks:2},
                {date:TODAY,blockId:"b",kind:"구현",plannedMin:100,actualMin:140,breaks:0}]);
ok("2건이면 아직 안 말함", m.sessionStats(21,TODAY)===null, JSON.stringify(m.sessionStats(21,TODAY)));
m.saveSessions(m.loadSessions().concat([{date:TODAY,blockId:"c",kind:"구현",plannedMin:100,actualMin:140,breaks:1}]));
const st=m.sessionStats(21,TODAY);
ok("3건이면 말함", !!st && st["구현"].n===3, JSON.stringify(st));
ok("비율 1.4배", st["구현"].ratio===1.4, String(st["구현"].ratio));
ok("중단 평균", st["구현"].breaks===1, String(st["구현"].breaks));
ok("한 줄로 나옴", /구현 과제는 계획의 1.4배/.test(m.sessionLine(st)), m.sessionLine(st));
ok("블록 길이를 고치라고 시킴", /블록 길이를 잡아라/.test(m.sessionLine(st)), "");
ok("평가하는 말이 없음", !/느리|게으|부족|못했|실패/.test(m.sessionLine(st)), m.sessionLine(st));

// 오래된 기록은 안 센다
m.saveSessions([{date:"2026-01-01",blockId:"z",kind:"구현",plannedMin:100,actualMin:300,breaks:0},
                {date:"2026-01-02",blockId:"y",kind:"구현",plannedMin:100,actualMin:300,breaks:0},
                {date:"2026-01-03",blockId:"x",kind:"구현",plannedMin:100,actualMin:300,breaks:0}]);
ok("21일 밖은 무시", m.sessionStats(21,TODAY)===null, JSON.stringify(m.sessionStats(21,TODAY)));

// 실행 모드가 경과를 보여준다
m.saveSessions([]);
mem["lf.plans"]=JSON.stringify({[TODAY]:{source:"template",blocks:[
  {id:"b3",time:"09:00-11:00",text:"x",goalId:"g1",taskId:"t1",kind:"구현",core:true,done:false,started:true,startedAt:"2026-08-27T00:02:00.000Z",onTime:true}]}});
FIXED=new RealDate(2026,7,27,10,2,0);
m.openFocus("b3");
ok("예상과 실제를 같이", /예상 120분 · 지금까지 60분/.test(allText()), (allText().match(/예상[^|]*/)||[""])[0]);

// 탭을 벗어나면 센다
ok("visibilitychange 구독", typeof docHandlers["visibilitychange"]==="function", "");
global.document.hidden=true; docHandlers["visibilitychange"](); docHandlers["visibilitychange"]();
global.document.hidden=false; docHandlers["visibilitychange"]();
btn("완료").click();
ok("중단 2회 기록", m.loadSessions()[0].breaks===2, JSON.stringify(m.loadSessions()[0]));

console.log(f?("\nFAILED "+f):"\nSESSION OK");
process.exit(f?1:0);
