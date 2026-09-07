(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const state = {
    mode: "bopomofo",
    levelIndex: 0,
    sequence: [],
    pointer: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    total: 0,
    correct: 0,
    startedAt: 0,
    running: false,
    sound: true,
    result: null,
    adminPassword: "",
    adminRows: [],
    editingId: null
  };

  const LESSONS = {
    bopomofo: [
      {name:"注音 1｜ㄅㄆㄇㄈ", items:["1","q","a","z","1","q","a","z","1","a","q","z"]},
      {name:"注音 2｜ㄉㄊㄋㄌ", items:["2","w","s","x","2","w","s","x","w","s","2","x"]},
      {name:"注音 3｜ㄍㄎㄏ", items:["e","d","c","e","d","c","e","d","c","d","e","c"]},
      {name:"注音 4｜ㄐㄑㄒ", items:["r","f","v","r","f","v","r","v","f","r","f","v"]},
      {name:"注音 5｜ㄓㄔㄕㄖ", items:["5","t","g","b","5","t","g","b","5","g","t","b"]},
      {name:"注音 6｜ㄗㄘㄙ", items:["y","h","n","y","h","n","h","y","n","y","n","h"]},
      {name:"注音 7｜介音與韻母", items:["u","j","m","8","i","k",",","9","o","l",".","0","p",";","/","-"]},
      {name:"注音 8｜聲調", items:[" ","6","3","4","7"," ","6","3","4","7"," ","4","3","6","7"]}
    ],
    english: [
      {name:"英打 1｜基準鍵", items:["a","s","d","f","j","k","l",";","a","s","d","f","j","k","l",";"]},
      {name:"英打 2｜CAT", items:[..."cat cat cat"]},
      {name:"英打 3｜FISH", items:[..."fish fish"]},
      {name:"英打 4｜MILK", items:[..."milk milk"]},
      {name:"英打 5｜STUDY", items:[..."study study"]},
      {name:"英打 6｜DSHPS", items:[..."dshps dshps"]}
    ],
    boss: [
      {name:"Boss 1｜混合挑戰", items:["1","q","a","z","a","s","d","f","6","3","4","7","j","k","l",";"]},
      {name:"Boss 2｜巨龍守護戰", items:["5","t","g","b","c","a","t"," ","f","i","s","h","6","3","4","7","u","j","m"]}
    ]
  };

  const KEY_LABELS = {
    "`":"`","1":"ㄅ","q":"ㄆ","a":"ㄇ","z":"ㄈ",
    "2":"ㄉ","w":"ㄊ","s":"ㄋ","x":"ㄌ",
    "e":"ㄍ","d":"ㄎ","c":"ㄏ",
    "r":"ㄐ","f":"ㄑ","v":"ㄒ",
    "5":"ㄓ","t":"ㄔ","g":"ㄕ","b":"ㄖ",
    "y":"ㄗ","h":"ㄘ","n":"ㄙ",
    "u":"ㄧ","j":"ㄨ","m":"ㄩ",
    "8":"ㄚ","i":"ㄛ","k":"ㄜ",",":"ㄝ",
    "9":"ㄞ","o":"ㄟ","l":"ㄠ",".":"ㄡ",
    "0":"ㄢ","p":"ㄣ",";":"ㄤ","/":"ㄥ","-":"ㄦ",
    "6":"ˊ","3":"ˇ","4":"ˋ","7":"˙"," ":"一聲"
  };

  const KB_ROWS = [
    ["`","1","2","3","4","5","6","7","8","9","0","-","="],
    ["q","w","e","r","t","y","u","i","o","p","[","]"],
    ["a","s","d","f","g","h","j","k","l",";","'"],
    ["z","x","c","v","b","n","m",",",".","/"],
    [" "]
  ];

  const fingerClass = key => {
    const pinky = new Set(["`","1","q","a","z","0","p",";","/","-","=","[","]","'"]);
    const ring = new Set(["2","w","s","x","9","o","l","."]);
    const middle = new Set(["3","e","d","c","8","i","k",","]);
    const index = new Set(["4","5","r","t","f","g","v","b","6","7","y","u","h","j","n","m"]);
    if (key === " ") return "thumb";
    if (pinky.has(key)) return "pinky";
    if (ring.has(key)) return "ring";
    if (middle.has(key)) return "middle";
    if (index.has(key)) return "index";
    return "index";
  };

  const catItems = [
    {id:"orange", icon:"🐱", name:"橘貓", cost:0},
    {id:"black", icon:"🐈‍⬛", name:"黑貓", cost:60},
    {id:"white", icon:"😺", name:"雪白貓", cost:80},
    {id:"calico", icon:"🐈", name:"三花貓", cost:100}
  ];
  const accItems = [
    {id:"none", icon:"", name:"無配件", cost:0},
    {id:"fish", icon:"🐟", name:"魚乾頭飾", cost:40},
    {id:"crown", icon:"👑", name:"王冠", cost:120},
    {id:"glasses", icon:"👓", name:"眼鏡", cost:90}
  ];

  function getProfile(){
    return JSON.parse(localStorage.getItem("catAdventureProfile") || '{"fish":0,"ownedCats":["orange"],"ownedAcc":["none"],"cat":"orange","acc":"none"}');
  }
  function saveProfile(p){ localStorage.setItem("catAdventureProfile", JSON.stringify(p)); renderCatEverywhere(); renderShop(); }
  function getStudent(){ return JSON.parse(localStorage.getItem("catAdventureStudent") || '{"className":"","seatNo":"","name":""}'); }
  function saveStudent(){
    const s={className:$("#studentClass").value.trim(),seatNo:$("#studentNo").value.trim(),name:$("#studentName").value.trim()};
    localStorage.setItem("catAdventureStudent",JSON.stringify(s));
    toast("學生資料已儲存。");
  }
  function loadStudent(){
    const s=getStudent(); $("#studentClass").value=s.className; $("#studentNo").value=s.seatNo; $("#studentName").value=s.name;
  }

  function catVisual(){
    const p=getProfile();
    const cat=catItems.find(x=>x.id===p.cat)?.icon || "🐱";
    const acc=accItems.find(x=>x.id===p.acc)?.icon || "";
    return acc ? `${acc}${cat}` : cat;
  }
  function renderCatEverywhere(){
    const v=catVisual(), p=getProfile();
    ["#homeCat","#playerCat","#wardrobeCat"].forEach(s=>{ if($(s)) $(s).textContent=v; });
    $("#fishCount").textContent=p.fish||0;
    $("#wardrobeFish").textContent=p.fish||0;
  }

  function switchView(id){
    $$(".view").forEach(v=>v.classList.remove("active"));
    $("#"+id)?.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
    if(id==="leaderboard") loadLeaderboard();
  }

  function setMode(mode){
    state.mode=mode; state.levelIndex=0; buildLevelOptions(); updateGameMeta(); switchView("game"); buildKeyboard();
  }
  function buildLevelOptions(){
    const sel=$("#levelSelect"); sel.innerHTML="";
    LESSONS[state.mode].forEach((l,i)=>{ const o=document.createElement("option");o.value=i;o.textContent=l.name;sel.appendChild(o); });
  }
  function updateGameMeta(){
    const names={bopomofo:"🀄 貓咪注音大冒險",english:"🔤 貓咪英打大冒險",boss:"👑 守護魚乾魔王戰"};
    $("#modeBadge").textContent=state.mode==="bopomofo"?"注音模式":state.mode==="english"?"英打模式":"Boss 模式";
    $("#gameTitle").textContent=names[state.mode];
    $("#gameSubtitle").textContent=LESSONS[state.mode][state.levelIndex].name;
  }
  function buildKeyboard(){
    const kb=$("#keyboard"); kb.innerHTML="";
    KB_ROWS.forEach(row=>{
      const r=document.createElement("div"); r.className="kb-row";
      row.forEach(key=>{
        const el=document.createElement("div"); el.className=`key ${fingerClass(key)}`; el.dataset.key=key;
        if(state.mode==="bopomofo"){
          el.innerHTML = key===" " ? "空白｜一聲" : `<span>${KEY_LABELS[key]||key.toUpperCase()}</span><small>${key.toUpperCase()}</small>`;
        }else{
          el.textContent = key===" " ? "SPACE" : key.toUpperCase();
        }
        el.addEventListener("pointerdown",()=>handleInput(key));
        r.appendChild(el);
      });
      kb.appendChild(r);
    });
  }
  function startGame(){
    state.levelIndex=Number($("#levelSelect").value||0);
    const lesson=LESSONS[state.mode][state.levelIndex];
    state.sequence=[...lesson.items];
    state.pointer=0;state.score=0;state.combo=0;state.maxCombo=0;state.total=0;state.correct=0;state.startedAt=Date.now();state.running=true;
    updateGameMeta(); updateStats(); showTarget(); playTone("start");
  }
  function restartGame(){ state.running=false; $("#targetText").textContent="按「開始」進行冒險"; $("#targetHint").textContent="目標按鍵會自動發光"; $("#progressBar").style.width="0%"; clearActiveKeys(); updateStats(true); }
  function displayTarget(key){
    if(state.mode==="bopomofo") return KEY_LABELS[key] || key.toUpperCase();
    return key===" " ? "SPACE" : key.toUpperCase();
  }
  function showTarget(){
    clearActiveKeys();
    if(!state.running) return;
    const key=state.sequence[state.pointer];
    $("#targetText").textContent=displayTarget(key);
    $("#targetHint").textContent = state.mode==="bopomofo" ? `請按鍵盤：${key===" "?"空白鍵":key.toUpperCase()}` : "看準目標，使用正確手指";
    const el=$(`.key[data-key="${CSS.escape(key)}"]`); if(el) el.classList.add("active");
    $("#progressBar").style.width=`${(state.pointer/state.sequence.length)*100}%`;
  }
  function clearActiveKeys(){ $$(".key").forEach(k=>k.classList.remove("active","hit")); }
  function handleInput(raw){
    if(!state.running) return;
    const key=raw.length===1?raw.toLowerCase():raw;
    const expected=state.sequence[state.pointer];
    state.total++;
    const el=$(`.key[data-key="${CSS.escape(key)}"]`); if(el){el.classList.add("hit");setTimeout(()=>el.classList.remove("hit"),120);}
    if(key===expected){
      state.correct++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.score+=100+Math.min(state.combo*5,100);state.pointer++;
      playTone("ok");
      if(state.pointer>=state.sequence.length){ finishGame(); } else showTarget();
    }else{
      state.combo=0;state.score=Math.max(0,state.score-20);playTone("bad");
    }
    updateStats();
  }
  function updateStats(reset=false){
    if(reset){$("#score").textContent="0";$("#combo").textContent="0";$("#accuracy").textContent="100%";$("#wpm").textContent="0";return;}
    const acc=state.total?state.correct/state.total*100:100;
    const minutes=Math.max((Date.now()-state.startedAt)/60000,1/60);
    const wpm=Math.round((state.correct/5)/minutes);
    $("#score").textContent=state.score;$("#combo").textContent=state.combo;$("#accuracy").textContent=`${acc.toFixed(0)}%`;$("#wpm").textContent=wpm;
  }
  function finishGame(){
    state.running=false; clearActiveKeys(); $("#progressBar").style.width="100%";
    const duration=(Date.now()-state.startedAt)/1000;
    const acc=state.total?state.correct/state.total*100:100;
    const wpm=Math.round((state.correct/5)/Math.max(duration/60,1/60));
    const fishEarned=Math.max(3,Math.round(state.score/250));
    const p=getProfile(); p.fish=(p.fish||0)+fishEarned; saveProfile(p);
    state.result={
      className:getStudent().className, seatNo:getStudent().seatNo, name:getStudent().name,
      mode:state.mode, level:LESSONS[state.mode][state.levelIndex].name,
      score:state.score,wpm,accuracy:Number(acc.toFixed(1)),combo:state.maxCombo,duration:Number(duration.toFixed(1))
    };
    $("#resultStats").innerHTML=`
      <div><b>${state.score}</b><span>分數</span></div>
      <div><b>${wpm}</b><span>WPM</span></div>
      <div><b>${acc.toFixed(1)}%</b><span>正確率</span></div>
      <div><b>+${fishEarned}🐟</b><span>魚乾</span></div>`;
    $("#uploadMsg").textContent=""; openModal("resultModal"); playTone("win");
  }

  let audioCtx;
  function tone(freq,dur,type="sine",gain=.05){
    if(!state.sound) return;
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur);
  }
  function playTone(kind){
    if(kind==="ok"){tone(660,.08,"square",.03);setTimeout(()=>tone(880,.07,"square",.025),70);}
    if(kind==="bad"){tone(170,.14,"sawtooth",.035);}
    if(kind==="win"){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.18,"triangle",.04),i*110));}
    if(kind==="start"){tone(440,.08);setTimeout(()=>tone(660,.1),90);}
  }

  async function api(params={}, method="GET"){
    if(!GAS_URL) throw new Error("尚未設定 GAS_URL。");
    if(method==="GET"){
      const url=new URL(GAS_URL); Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v??""));
      const r=await fetch(url.toString(),{method:"GET",redirect:"follow"}); return await r.json();
    }
    const r=await fetch(GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(params),redirect:"follow"});
    return await r.json();
  }
  async function uploadScore(){
    if(!state.result) return;
    const s=getStudent();
    if(!s.className||!s.name){ setMsg("#uploadMsg","請先回首頁填寫班級與姓名。",false); return; }
    try{
      $("#uploadScoreBtn").disabled=true; setMsg("#uploadMsg","正在上傳…",true);
      const res=await api({action:"add",...state.result,className:s.className,seatNo:s.seatNo,name:s.name},"POST");
      if(!res.ok) throw new Error(res.message||"上傳失敗");
      setMsg("#uploadMsg","✅ 成績已成功寫入試算表！",true);
    }catch(e){ setMsg("#uploadMsg","❌ "+e.message,false); }
    finally{$("#uploadScoreBtn").disabled=false;}
  }

  async function loadLeaderboard(){
    const tbody=$("#leaderboardBody");tbody.innerHTML='<tr><td colspan="9">載入中…</td></tr>';
    if(!GAS_URL){tbody.innerHTML='<tr><td colspan="9">尚未設定 GAS_URL；目前為離線模式。</td></tr>';return;}
    try{
      const res=await api({action:"leaderboard",className:$("#lbClass").value.trim(),mode:$("#lbMode").value});
      const rows=res.data||[];
      tbody.innerHTML=rows.length?rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.className)}</td><td>${esc(r.name)}</td><td>${modeName(r.mode)}</td><td>${esc(r.level)}</td><td>${r.score}</td><td>${r.wpm}</td><td>${r.accuracy}%</td><td>${r.combo}</td></tr>`).join(""):'<tr><td colspan="9">目前沒有資料</td></tr>';
    }catch(e){tbody.innerHTML=`<tr><td colspan="9">載入失敗：${esc(e.message)}</td></tr>`;}
  }

  async function adminLogin(){
    const pw=$("#adminPassword").value;
    if(!pw){setMsg("#adminLoginMsg","請輸入密碼。",false);return;}
    try{
      const res=await api({action:"auth",password:pw},"POST");
      if(!res.ok) throw new Error(res.message||"密碼錯誤");
      state.adminPassword=pw; $("#adminLogin").classList.add("hidden");$("#adminPanel").classList.remove("hidden"); await loadAdmin();
    }catch(e){setMsg("#adminLoginMsg","❌ "+e.message,false);}
  }
  async function loadAdmin(){
    $("#adminBody").innerHTML='<tr><td colspan="11">載入中…</td></tr>';
    try{
      const res=await api({action:"scores",password:state.adminPassword,className:$("#adminClassFilter").value.trim(),mode:$("#adminModeFilter").value,name:$("#adminNameFilter").value.trim()});
      if(!res.ok) throw new Error(res.message||"讀取失敗");
      state.adminRows=res.data||[]; renderAdmin(); renderSummary();
    }catch(e){$("#adminBody").innerHTML=`<tr><td colspan="11">${esc(e.message)}</td></tr>`;}
  }
  function renderAdmin(){
    const rows=state.adminRows;
    $("#adminBody").innerHTML=rows.length?rows.map(r=>`<tr>
      <td>${esc(r.timestamp)}</td><td>${esc(r.className)}</td><td>${esc(r.seatNo)}</td><td>${esc(r.name)}</td>
      <td>${modeName(r.mode)}</td><td>${esc(r.level)}</td><td>${r.score}</td><td>${r.wpm}</td><td>${r.accuracy}%</td><td>${r.combo}</td>
      <td><button class="secondary edit-btn" data-id="${esc(r.recordId)}">編修</button> <button class="danger del-btn" data-id="${esc(r.recordId)}">刪除</button></td></tr>`).join(""):'<tr><td colspan="11">沒有符合資料</td></tr>';
    $$(".edit-btn").forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
    $$(".del-btn").forEach(b=>b.onclick=()=>deleteRow(b.dataset.id));
  }
  function renderSummary(){
    const r=state.adminRows,n=r.length;
    const avg=a=>n?(r.reduce((s,x)=>s+Number(x[a]||0),0)/n):0;
    $("#adminSummary").innerHTML=`<div><b>${n}</b><br>紀錄數</div><div><b>${avg("score").toFixed(0)}</b><br>平均分數</div><div><b>${avg("wpm").toFixed(1)}</b><br>平均 WPM</div><div><b>${avg("accuracy").toFixed(1)}%</b><br>平均正確率</div>`;
  }
  function openEdit(id=null){
    state.editingId=id;
    const r=id?state.adminRows.find(x=>x.recordId===id):{className:"",seatNo:"",name:"",mode:"bopomofo",level:"",score:0,wpm:0,accuracy:100,combo:0,duration:0};
    $("#editTitle").textContent=id?"編修成績":"手動補登";
    $("#editClass").value=r.className||"";$("#editNo").value=r.seatNo||"";$("#editName").value=r.name||"";$("#editMode").value=r.mode||"bopomofo";$("#editLevel").value=r.level||"";$("#editScore").value=r.score||0;$("#editWpm").value=r.wpm||0;$("#editAccuracy").value=r.accuracy??100;$("#editCombo").value=r.combo||0;$("#editDuration").value=r.duration||0;$("#editMsg").textContent="";
    openModal("editModal");
  }
  async function saveEdit(){
    const payload={password:state.adminPassword,className:$("#editClass").value.trim(),seatNo:$("#editNo").value.trim(),name:$("#editName").value.trim(),mode:$("#editMode").value,level:$("#editLevel").value.trim(),score:Number($("#editScore").value),wpm:Number($("#editWpm").value),accuracy:Number($("#editAccuracy").value),combo:Number($("#editCombo").value),duration:Number($("#editDuration").value)};
    payload.action=state.editingId?"update":"add"; if(state.editingId) payload.recordId=state.editingId;
    try{
      const res=await api(payload,"POST"); if(!res.ok)throw new Error(res.message||"儲存失敗");
      setMsg("#editMsg","✅ 已儲存",true); await loadAdmin(); setTimeout(()=>closeModal("editModal"),500);
    }catch(e){setMsg("#editMsg","❌ "+e.message,false);}
  }
  async function deleteRow(id){
    if(!confirm("確定刪除這筆紀錄？此操作無法復原。")) return;
    try{const res=await api({action:"delete",password:state.adminPassword,recordId:id},"POST");if(!res.ok)throw new Error(res.message);await loadAdmin();}
    catch(e){alert("刪除失敗："+e.message);}
  }
  function exportCsv(){
    const headers=["時間","班級","座號","姓名","模式","關卡","分數","WPM","正確率","連擊","秒數","RecordId"];
    const rows=state.adminRows.map(r=>[r.timestamp,r.className,r.seatNo,r.name,modeName(r.mode),r.level,r.score,r.wpm,r.accuracy,r.combo,r.duration,r.recordId]);
    const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`cat-adventure-scores-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
  }

  function renderShop(){
    const p=getProfile();
    const render=(items,ownedKey,selectedKey)=>items.map(it=>{
      const owned=(p[ownedKey]||[]).includes(it.id), selected=p[selectedKey]===it.id;
      return `<div class="shop-item"><div class="icon">${it.icon||"⭕"}</div><b>${it.name}</b><div>🐟 ${it.cost}</div><button class="${selected?"secondary":"primary"} shop-btn" data-type="${selectedKey}" data-id="${it.id}">${selected?"使用中":owned?"使用":"解鎖"}</button></div>`;
    }).join("");
    $("#catOptions").innerHTML=render(catItems,"ownedCats","cat");
    $("#accessoryOptions").innerHTML=render(accItems,"ownedAcc","acc");
    $$(".shop-btn").forEach(b=>b.onclick=()=>shopAction(b.dataset.type,b.dataset.id));
  }
  function shopAction(type,id){
    const p=getProfile(),items=type==="cat"?catItems:accItems,ownedKey=type==="cat"?"ownedCats":"ownedAcc";
    const item=items.find(x=>x.id===id); if(!item)return;
    p[ownedKey] ||= [];
    if(!p[ownedKey].includes(id)){
      if((p.fish||0)<item.cost){alert("小魚乾不足，先去闖關吧！");return;}
      p.fish-=item.cost;p[ownedKey].push(id);
    }
    p[type]=id;saveProfile(p);
  }

  function modeName(m){return m==="bopomofo"?"注音":m==="english"?"英打":"魔王戰";}
  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function setMsg(sel,text,ok){const e=$(sel);e.textContent=text;e.className="msg "+(ok?"ok":"err");}
  function toast(msg){alert(msg);}
  function openModal(id){$("#"+id).classList.remove("hidden");}
  function closeModal(id){$("#"+id).classList.add("hidden");}

  document.addEventListener("keydown",e=>{
    if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)) return;
    let k=e.key.toLowerCase(); if(k==="spacebar")k=" "; if(k===" ")e.preventDefault();
    if(k.length===1||k===" ") handleInput(k);
  });

  $$("[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
  $$(".start-mode").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  $$("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
  $("#saveStudentBtn").onclick=saveStudent;
  $("#levelSelect").onchange=()=>{state.levelIndex=Number($("#levelSelect").value);updateGameMeta();};
  $("#startGameBtn").onclick=startGame; $("#restartGameBtn").onclick=restartGame;
  $("#soundBtn").onclick=()=>{state.sound=!state.sound;$("#soundBtn").textContent=state.sound?"🔊 音效開":"🔇 音效關";};
  $("#uploadScoreBtn").onclick=uploadScore;
  $("#refreshLeaderboardBtn").onclick=loadLeaderboard; $("#lbClass").oninput=debounce(loadLeaderboard,400); $("#lbMode").onchange=loadLeaderboard;
  $("#adminLoginBtn").onclick=adminLogin; $("#adminRefreshBtn").onclick=loadAdmin;
  $("#adminClassFilter").oninput=debounce(loadAdmin,450);$("#adminNameFilter").oninput=debounce(loadAdmin,450);$("#adminModeFilter").onchange=loadAdmin;
  $("#addScoreBtn").onclick=()=>openEdit();$("#saveEditBtn").onclick=saveEdit;$("#exportCsvBtn").onclick=exportCsv;
  $("#adminLogoutBtn").onclick=()=>{state.adminPassword="";$("#adminPassword").value="";$("#adminPanel").classList.add("hidden");$("#adminLogin").classList.remove("hidden");};

  function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}

  loadStudent();renderCatEverywhere();renderShop();buildLevelOptions();buildKeyboard();updateGameMeta();
})();