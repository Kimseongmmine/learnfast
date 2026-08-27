const path=require("path"); const APP=path.resolve(__dirname, "..", "app.js");
let f=0; const ok=(n,c,e)=>{if(!c)f++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+(e||"")));};
const RealDate=Date; let FIXED=new RealDate(2026,7,26,9,30,0);
global.Date=class extends RealDate{constructor(...a){if(a.length===0)super(FIXED.getTime());else super(...a);}static now(){return FIXED.getTime();}};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(fn)=>{fn();return 0;};
function makeNode(t){const n={tagName:t.toUpperCase(),textContent:"",className:"",children:[],_h:{},type:"",placeholder:"",value:"",checked:false,disabled:false,draggable:false,open:false,title:"",id:"",htmlFor:"",dataset:{},style:{},isConnected:true,_attrs:{},rows:0,
 appendChild(c){this.children.push(c);c._p=this;return c;},addEventListener(e,fn){this._h[e]=fn;},focus(){},setSelectionRange(){},
 click(){if(this._h.click)this._h.click({preventDefault(){}});},
 fire(ev,extra){if(this._h[ev])this._h[ev](Object.assign({preventDefault(){}},extra||{}));},
 setAttribute(k,v){this._attrs[k]=v;},remove(){},querySelector(){return null;}};
Object.defineProperty(n,"innerHTML",{set(v){if(v==="")this.children=[];},get(){return"";}});return n;}
let root=makeNode("main");
global.document={hidden:false,activeElement:null,getElementById:()=>root,createElement:t=>makeNode(t),createElementNS:(ns,t)=>makeNode(t),addEventListener(){}};
global.window={prompt:()=>null,confirm:()=>true}; global.fetch=undefined;
var mem={}; global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
function walk(n,p,o){(n.children||[]).forEach(c=>{if(p(c))o.push(c);walk(c,p,o);});return o;}
const byCls=c=>walk(root,n=>n.className&&n.className.split(" ").indexOf(c)>=0,[]);
const btn=t=>walk(root,n=>n.tagName==="BUTTON"&&n.textContent===t,[])[0];
const allText=()=>walk(root,()=>true,[]).map(n=>n.textContent).join(" | ");

const TODAY="2026-08-26";
const PROFILE={goals:[{id:"g1",title:"DB",tasks:[
  {id:"t1",text:"DB 1강 듣고 필기 2쪽",done:false},{id:"t2",text:"3장 연습문제 1-10번 풀기",done:false},
  {id:"t3",text:"4장 요약 정리",done:false},{id:"t4",text:"5장 예제 따라치기",done:false},
  {id:"t5",text:"기출 2회분 채점까지",done:false},{id:"t6",text:"6장 정리",done:false}]}]};
function seed(){
  mem={};
  mem["loop.profile"]=JSON.stringify(Object.assign({places:"학교 도서관 25분 / 집 앞 스터디카페 5분 / 집 책상 / 체육관 15분 / 카페는 3시간 이상 앉을 때만"}, PROFILE));
  mem["loop.plans"]=JSON.stringify({[TODAY]:{source:"ai",generatedAt:"x",blocks:[
    {id:"b1",time:"09:00-11:00",text:"DB 1강 듣고 필기 2쪽",place:"경북대 중앙도서관",goalId:"g1",taskId:"t1",core:true,done:false},
    {id:"b2",time:"11:00-11:10",text:"물 한 잔 · 눈 휴식",place:"경북대 중앙도서관",core:false,done:false},
    {id:"b3",time:"11:10-12:00",text:"3장 연습문제 1-10번 풀기",place:"경북대 중앙도서관",goalId:"g1",taskId:"t2",core:true,done:false},
    {id:"b4",time:"14:00-15:00",text:"병원",place:"병원",event:true,core:false,done:false},
    {id:"b5",time:"19:00-21:00",text:"저녁 · 휴식",place:"집",core:false,done:false}
  ]}});
}
seed(); const m=require(APP);

// ---------- editableBlocks ----------
let bs=JSON.parse(mem["loop.plans"])[TODAY].blocks;
const ed=m.editableBlocks(bs);
ok("옮길 수 있는 건 3개", ed.length===3, ed.map(x=>x.id).join(","));
ok("10분 휴식은 제외", ed.every(x=>x.id!=="b2"), "");
ok("특별 일정은 제외", ed.every(x=>x.id!=="b4"), "");

// ---------- swapSlots: 시각은 제자리, 내용만 ----------
let sw=m.swapSlots(bs,"b1","b3");
ok("시각은 그대로", sw[0].time==="09:00-11:00" && sw[2].time==="11:10-12:00", sw[0].time+" / "+sw[2].time);
ok("내용이 맞바뀜", sw[0].text==="3장 연습문제 1-10번 풀기" && sw[2].text==="DB 1강 듣고 필기 2쪽", sw[0].text);
ok("과제 연결도 따라감", sw[0].taskId==="t2" && sw[2].taskId==="t1", sw[0].taskId+"/"+sw[2].taskId);
ok("사이 블록은 그대로", sw[1].id==="b2" && sw[1].text==="물 한 잔 · 눈 휴식", sw[1].text);
ok("원본 불변", bs[0].text==="DB 1강 듣고 필기 2쪽", bs[0].text);
ok("특별 일정과는 안 바뀜", m.swapSlots(bs,"b1","b4")===bs, "");
ok("micro 와도 안 바뀜", m.swapSlots(bs,"b1","b2")===bs, "");
ok("없는 id 는 원본", m.swapSlots(bs,"b1","zzz")===bs, "");
ok("자기 자신도 원본", m.swapSlots(bs,"b1","b1")===bs, "");

// 착수 기록은 자리에 남는다
const rec=m.swapSlots([{id:"a",time:"09:00-10:00",text:"A",started:true,startedAt:"x",onTime:true,done:true},
                       {id:"b",time:"10:00-11:00",text:"B"}],"a","b");
ok("기록은 옮겨가지 않음", rec[0].started===true && rec[0].onTime===true && rec[1].started===undefined, JSON.stringify(rec));
ok("그 자리 내용만 바뀜", rec[0].text==="B" && rec[1].text==="A", rec[0].text+"/"+rec[1].text);

// ---------- shiftBlock ----------
const up=m.shiftBlock(bs,"b3",-1);
ok("↑ 는 앞의 옮길 수 있는 블록과", up[0].text==="3장 연습문제 1-10번 풀기", up[0].text);
ok("↑ 가 micro 를 건너뜀", up[1].text==="물 한 잔 · 눈 휴식", up[1].text);
ok("맨 위에서 ↑ 는 아무 일 없음", m.shiftBlock(bs,"b1",-1)===bs, "");
ok("맨 아래서 ↓ 는 아무 일 없음", m.shiftBlock(bs,"b5",1)===bs, "");
const dn=m.shiftBlock(bs,"b3",1);
ok("↓ 는 저녁 블록과 (특별 일정 건너뜀)", dn[2].text==="저녁 · 휴식" && dn[4].text==="3장 연습문제 1-10번 풀기", dn[2].text+" / "+dn[4].text);

// ---------- swapTask ----------
const st=m.swapTask(bs,"b1",{goalId:"g1",taskId:"t5",text:"기출 2회분 채점까지"});
ok("과제 교체", st[0].text==="기출 2회분 채점까지" && st[0].taskId==="t5", st[0].text);
ok("시각·핵심 유지", st[0].time==="09:00-11:00" && st[0].core===true, st[0].time);
ok("first 는 비움", st[0].first===null, String(st[0].first));
ok("빈 후보는 원본", m.swapTask(bs,"b1",null)===bs, "");

// ---------- dropBlock ----------
const dp=m.dropBlock(bs,"b3");
ok("블록이 빠짐", dp.length===4 && dp.every(x=>x.id!=="b3"), dp.map(x=>x.id).join(","));
ok("앞 블록이 늘어나 구멍 없음", dp[1].time==="11:00-12:00", dp[1].time);
const dp0=m.dropBlock(bs,"b1");
ok("첫 블록을 빼면 뒤가 당겨짐", dp0[0].id==="b2" && dp0[0].time==="09:00-11:10", dp0[0].time);
ok("하나뿐이면 안 뺌", m.dropBlock([{id:"x",time:"09:00-10:00",text:"a"}],"x").length===1, "");

// ---------- swapCandidates ----------
const cands=m.swapCandidates(m.loadProfile(), bs, 4);
ok("이미 쓴 과제는 빠짐", cands.every(c=>c.taskId!=="t1" && c.taskId!=="t2"), cands.map(c=>c.taskId).join(","));
ok("최대 4개", cands.length===4, String(cands.length));
ok("남은 것부터 순서대로", cands[0].taskId==="t3", cands[0].taskId);
ok("목표 제목도 옴", cands[0].goalTitle==="DB", cands[0].goalTitle);
ok("다 썼으면 빈 배열", m.swapCandidates({goals:[{id:"g",title:"x",tasks:[{id:"t1",text:"a",done:false}]}]},[{taskId:"t1"}],4).length===0, "");

// ---------- applyEdit: 자리를 옮기면 장소·이동이 다시 계산된다 ----------
seed(); delete require.cache[APP]; const m2=require(APP);
const after=m2.applyEdit(TODAY, function(list){ return m2.swapSlots(list,"b3","b5"); });
ok("저장됨", !!after && JSON.parse(mem["loop.plans"])[TODAY].blocks.length===after.length, "");
const study=after.filter(x=>x.taskId==="t2")[0];
ok("11시 학습이 19시로 감", study.time.indexOf("19:")===0, study.time);
ok("장소가 집 앞 스터디카페로 바뀜", study.place==="집 앞 스터디카페", study.place);
ok("이동 블록이 새로 생김", after.some(x=>x.move), after.map(x=>x.text).join(" / "));
ok("특별 일정 시각은 그대로", after.filter(x=>x.event)[0].time==="14:00-15:00", after.filter(x=>x.event)[0].time);
ok("정렬 유지", after.every((x,i)=>i===0||m2.blockStartMinutes(after[i-1].time)<=m2.blockStartMinutes(x.time)), after.map(x=>x.time).join(" "));
ok("겹치지 않음", after.every((x,i)=>i===0||m2.blockEndMinutes(after[i-1].time)<=m2.blockStartMinutes(x.time)), after.map(x=>x.time).join(" "));
ok("editedAt 기록", !!JSON.parse(mem["loop.plans"])[TODAY].editedAt, "");
ok("바뀔 게 없으면 저장 안 함", m2.applyEdit(TODAY, function(l){ return m2.swapSlots(l,"b1","b1"); })===null, "");
ok("없는 날짜는 null", m2.applyEdit("1999-01-01", function(l){ return l; })===null, "");

// ---------- 화면 ----------
seed(); delete require.cache[APP]; const m3=require(APP);
m3.render();
ok("평소엔 손잡이 없음", byCls("handle").length===0, String(byCls("handle").length));
ok("평소엔 편집 버튼 없음", byCls("rowbtn").length===0, String(byCls("rowbtn").length));
ok("고치기 토글 있음", !!btn("✎ 고치기"), "");
const beforeRows=byCls("block").length;

btn("✎ 고치기").click();
ok("고치기 모드 진입", !!btn("완료"), "");
ok("손잡이가 생김", byCls("handle").length>=2, String(byCls("handle").length));
ok("행마다 버튼 4개", byCls("rowbtns").length>=2 && byCls("rowbtns")[0].children.length===4, String(byCls("rowbtns")[0].children.length));
ok("draggable 켜짐", byCls("block").filter(r=>r.draggable).length>=2, "");
ok("특별 일정은 고정 표시", allText().includes("고정"), "");
ok("설명이 편집용으로 바뀜", allText().includes("≡ 를 끌어서"), "");
ok("이따 덩이가 펼쳐짐", byCls("daygroup").every(d=>d.open===true), byCls("daygroup").map(d=>d.open).join(","));

// ⇄ 서랍
ok("평소엔 서랍 없음", byCls("swapdrawer").length===0, "");
byCls("rowbtn").filter(b=>b.textContent==="⇄")[0].click();
ok("서랍이 하나만 열림", byCls("swapdrawer").length===1, String(byCls("swapdrawer").length));
ok("후보가 뜸", byCls("sdrow").length===4, String(byCls("sdrow").length));
ok("이미 쓴 과제는 후보에 없음", !allText().includes("DB 1강 듣고 필기 2쪽 | 4장"), "");
byCls("sdrow")[0].click();
ok("교체됨", JSON.parse(mem["loop.plans"])[TODAY].blocks.some(x=>x.taskId==="t3"), "");
ok("서랍 닫힘", byCls("swapdrawer").length===0, "");

// ↑ 버튼
const before2=JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move)[0].text;
byCls("rowbtns")[1].children.filter(b=>b.textContent==="↑")[0].click();
ok("↑ 로 자리 바뀜", JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move)[0].text!==before2,
   before2+" -> "+JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move)[0].text);

// 드래그
const rows=byCls("block").filter(r=>r.draggable);
const t1=rows[0].textContent, t2=rows[1].textContent;
rows[0].fire("dragstart",{dataTransfer:{setData(){},effectAllowed:""}});
rows[1].fire("drop",{});
const nowFirst=byCls("block").filter(r=>r.draggable)[0];
ok("드래그로 자리 바뀜", nowFirst.textContent!==t1 || t1===t2, "");
ok("드래그 뒤 dragId 정리", byCls("dragging").length===0, "");

// ✕
const cnt=JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move).length;
byCls("rowbtn").filter(b=>b.textContent==="✕")[0].click();
ok("✕ 로 블록이 빠짐", JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move).length===cnt-1,
   cnt+" -> "+JSON.parse(mem["loop.plans"])[TODAY].blocks.filter(x=>!x.move).length);

btn("완료").click();
ok("나가면 손잡이 사라짐", byCls("handle").length===0, String(byCls("handle").length));
ok("나가면 서랍도 닫힘", byCls("swapdrawer").length===0, "");
ok("평소 화면으로 복귀", !!btn("✎ 고치기"), "");

console.log(f?("\nFAILED "+f):"\nEDIT OK");
process.exit(f?1:0);
