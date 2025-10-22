/* -------------------- Globals -------------------- */
let bible = {};
let words = [];       
let blanks = [];      
let typed = [];       
let locked = [];      
let currentIdx = 0;
let difficulty = 2;
let revealPointer = 0;
let editingIndex = null;
let currentVerseArray = null;

const LAST_VERSE_KEY = "lastVerse";
const LAST_APP_KEY = "lastApp";

/* -------------------- Helpers -------------------- */
function escapeHTML(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* -------------------- Bible loading -------------------- */
async function loadBible() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json");
    if(!res.ok) throw new Error("Network response not ok");
    bible = await res.json();
    document.getElementById("status").innerText = "Bible loaded from GitHub ✅";
    document.getElementById("file-container").style.display = "none";
    return;
  } catch (e) { console.warn("GitHub Bible fetch failed:", e); }

  if(localStorage.getItem("bibleJSON")) {
    try {
      bible = JSON.parse(localStorage.getItem("bibleJSON"));
      document.getElementById("status").innerText = "Bible loaded from localStorage ✅";
      document.getElementById("file-container").style.display = "none";
      return;
    } catch(e){ console.error(e); }
  }

  document.getElementById("file-container").style.display = "block";
}

document.getElementById("bible-file").addEventListener("change", function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try{
      bible = JSON.parse(evt.target.result);
      localStorage.setItem("bibleJSON", JSON.stringify(bible));
      document.getElementById("status").innerText = "Bible loaded from file and saved to localStorage ✅";
      document.getElementById("file-container").style.display = "none";
    } catch(err){ console.error(err); document.getElementById("status").innerText = "Error loading Bible JSON ❌"; }
  };
  reader.readAsText(file, "utf-8");
});

/* -------------------- Verse parsing -------------------- */
function parseReference(ref){
  const match = ref.match(/^(\w+)\s+(\d+)(?::(\d+)(?:-(\d+)(?::(\d+))?)?)?$/);
  if(!match) { alert("Špatný formát (např. 'Zj 1:1')."); return null; }
  const book = match[1], ch1 = parseInt(match[2]), v1 = match[3] ? parseInt(match[3]) : null, v2 = match[4] ? parseInt(match[4]) : null;
  let verses = [];
  if(!v1) verses = bible[book]["chapters"][ch1-1];
  else if(v1 && !v2) verses.push(bible[book]["chapters"][ch1-1][v1-1]);
  else for(let i=v1-1;i<v2;i++) verses.push(bible[book]["chapters"][ch1-1][i]);
  return verses;
}

/* -------------------- Blanks -------------------- */
function initBlanks(verseArray){
  currentVerseArray = verseArray;
  words = []; blanks = []; typed = []; locked = [];
  verseArray.forEach(v=>{
    const tokens = v.split(/(\s+|\n)/);
    if(difficulty===0){
      tokens.forEach(tok=>{ words.push(tok); blanks.push(false); typed.push(""); locked.push(false); });
    } else {
      const real = tokens.map((t,i)=>({t,i})).filter(x=>x.t.trim()!=="");
      const hide_ratio = {1:0.2,2:0.4,3:0.6,4:0.8,5:1.0}[difficulty];
      const num_to_hide = Math.floor(real.length*hide_ratio);
      const indices = new Set();
      while(indices.size<num_to_hide && real.length>0) indices.add(real[Math.floor(Math.random()*real.length)].i);
      tokens.forEach((tok,i)=>{ words.push(tok); blanks.push(indices.has(i)); typed.push(""); locked.push(false); });
    }
    words.push("\n"); blanks.push(false); typed.push(""); locked.push(false);
  });
  currentIdx = blanks.findIndex(b=>b); if(currentIdx===-1) currentIdx=0;
  revealPointer=0;
  render();
  localStorage.setItem(LAST_VERSE_KEY, JSON.stringify(verseArray));
}

function render(){
  const container = document.getElementById("verse-container");
  container.innerHTML = words.map((w,i)=>{
    if(blanks[i]){
      if(locked[i]){
        const correct = words[i]||""; const input = typed[i]||""; let out="";
        const maxlen = Math.max(input.length, correct.length);
        for(let j=0;j<maxlen;j++){
          const cInput = input[j]??""; const cCorrect = correct[j]??"";
          if(j<input.length) out += (cInput===cCorrect?`<span class="correct">${escapeHTML(cInput)}</span>`:`<span class="wrong">${escapeHTML(cInput)}</span>`);
          else out += `<span class="missing">${escapeHTML(cCorrect)}</span>`;
        }
        return `<span class="blank ${i===currentIdx?'current':''}" id="word-${i}">${out}</span>`;
      } else {
        const display = typed[i]||""; const rest = "_".repeat(Math.max(1,(words[i]||"").length-display.length));
        return `<span class="blank ${i===currentIdx?'current':''}" id="word-${i}">${escapeHTML(display)}${rest}</span>`;
      }
    } else {
      if(w==="\n") return "<br/>"; return `<span class="mx-1">${escapeHTML(w)}</span>`;
    }
  }).join("");
  if(document.getElementById("toggle-input")?.checked) document.getElementById("input").focus();
  const currentEl = document.getElementById(`word-${currentIdx}`);
  if(currentEl) currentEl.scrollIntoView({behavior:"smooth", block:"center"});
}

/* -------------------- Reveal -------------------- */
document.getElementById("reveal").addEventListener("click", ()=>{
  const idx = blanks.findIndex((b,i)=>i>=revealPointer && b);
  if(idx>=0){
    typed[idx]=words[idx]; locked[idx]=true; revealPointer=idx+1;
    if(idx===currentIdx) moveToNextBlank();
    render();
  }
});

/* -------------------- Input mode toggle -------------------- */
document.getElementById("toggle-input").addEventListener("change", e=>{
  const inputBox = document.getElementById("input");
  const revealBtn = document.getElementById("reveal");
  if(e.target.checked){
    inputBox.style.display = "block";
    revealBtn.style.flexGrow = "0";
  } else {
    inputBox.style.display = "none";
    revealBtn.style.flexGrow = "1";
  }
  render();
});

/* -------------------- Navigation -------------------- */
function moveToNextBlank(){
  if(currentIdx<0) return;
  if(blanks[currentIdx]) locked[currentIdx]=true;
  currentIdx=blanks.findIndex((b,i)=>b && i>currentIdx);
  if(currentIdx===-1) currentIdx=blanks.findIndex(b=>b);
}

/* -------------------- Input handling -------------------- */
document.getElementById("input").addEventListener("input", e=>{
  if(currentIdx<0 || !blanks[currentIdx]) return;
  typed[currentIdx] = e.target.value;
  render();
});
document.getElementById("input").addEventListener("keydown", e=>{
  if(currentIdx<0||!blanks[currentIdx]) return;
  if(e.key===" "||e.key==="Enter"){
    typed[currentIdx]=e.target.value.trim(); locked[currentIdx]=true;
    moveToNextBlank();
    e.target.value="";
    render();
    e.preventDefault();
  }
});

/* -------------------- Restart -------------------- */
document.getElementById("restart").addEventListener("click", ()=>{ if(currentVerseArray)initBlanks(currentVerseArray); });

/* -------------------- Load verse -------------------- */
document.getElementById("load-verse").addEventListener("click", ()=>{
  const ref = document.getElementById("verse-input").value.trim();
  if(!bible||Object.keys(bible).length===0){ alert("Bible není načtena."); return; }
  const verses=parseReference(ref);
  if(verses&&verses.length>0)initBlanks(verses);
});

/* -------------------- Custom texts -------------------- */
function loadSavedTexts(){
  const saved=JSON.parse(localStorage.getItem("customTexts")||"[]");
  const container=document.getElementById("saved-texts");
  container.innerHTML="";
  saved.forEach((t,i)=>{
    const row=document.createElement("div"); row.className="flex items-center space-x-2";
    const btn=document.createElement("button"); btn.textContent=t.title;
    btn.className="bg-gray-600 flex-grow text-white px-2 py-1 rounded hover:bg-gray-500 text-left";
    btn.onclick=()=>{initBlanks([t.text]);};
    const editBtn=document.createElement("button"); editBtn.textContent="✏"; editBtn.className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600";
    editBtn.onclick=()=>{ document.getElementById("custom-title").value=t.title; document.getElementById("custom-text").value=t.text; editingIndex=i; };
    const delBtn=document.createElement("button"); delBtn.textContent="❌"; delBtn.className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600";
    delBtn.onclick=()=>{ saved.splice(i,1); localStorage.setItem("customTexts",JSON.stringify(saved)); loadSavedTexts(); };
    row.appendChild(btn); row.appendChild(editBtn); row.appendChild(delBtn);
    container.appendChild(row);
  });
}
document.getElementById("save-text").addEventListener("click", ()=>{
  const title=document.getElementById("custom-title").value.trim();
  const text=document.getElementById("custom-text").value;
  if(!title||!text){ alert("Vyplň název i text!"); return; }
  let saved=JSON.parse(localStorage.getItem("customTexts")||"[]");
  if(editingIndex!==null){ saved[editingIndex]={title,text}; editingIndex=null; } else { saved.push({title,text}); }
  localStorage.setItem("customTexts",JSON.stringify(saved));
  document.getElementById("custom-title").value=""; document.getElementById("custom-text").value="";
  loadSavedTexts();
});
document.getElementById("clear-edit").addEventListener("click", ()=>{
  editingIndex=null; document.getElementById("custom-title").value=""; document.getElementById("custom-text").value="";
});
document.getElementById("toggle-texts").addEventListener("click", ()=>{ document.getElementById("custom-section").classList.toggle("hidden"); });
document.getElementById("difficulty").addEventListener("change", e=>{ difficulty=parseInt(e.target.value); });

/* -------------------- Menu switching -------------------- */
function switchApp(app){
  document.querySelectorAll("#app-menu button").forEach(b=>b.classList.remove("active"));
  document.querySelector(`#app-menu button[data-app='${app}']`)?.classList.add("active");
  document.getElementById("byheart-container").style.display = app==="byheart"?"block":"none";
  document.getElementById("sealed-container").style.display = app==="sealed"?"block":"none";
  localStorage.setItem(LAST_APP_KEY, app);
}
document.querySelectorAll("#app-menu button").forEach(b=>{
  b.addEventListener("click",()=>{ switchApp(b.dataset.app); });
});

/* -------------------- Init on load -------------------- */
loadBible();
loadSavedTexts();
const lastVerse = localStorage.getItem(LAST_VERSE_KEY);
if(lastVerse) initBlanks(JSON.parse(lastVerse));
const lastApp = localStorage.getItem(LAST_APP_KEY) || "byheart";
switchApp(lastApp);

/* -------------------- Audio Mode (karaoke, no stop button) -------------------- */
const audioControls = document.getElementById("audio-controls");
const inputControls = document.getElementById("sticky-controls");
const toggleAudio = document.getElementById("toggle-audio");

let currentUtterance = null;
let isPaused = false;
let pausedCharIndex = 0;
let fullText = "";
const playBtn = document.getElementById("play-audio");

function getCurrentText() {
  if (!currentVerseArray) return "";
  return currentVerseArray.join(" ");
}

function renderHighlightedText(index) {
  const container = document.getElementById("verse-container");
  const before = escapeHTML(fullText.substring(0, index));
  const after = escapeHTML(fullText.substring(index));
  const firstWord = after.split(/\s+/)[0] || "";
  container.innerHTML =
    before +
    `<span class="karaoke-current">${escapeHTML(firstWord)}</span>` +
    escapeHTML(after.substring(firstWord.length));
  const currentEl = document.querySelector(".karaoke-current");
  if (currentEl) currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

function startSpeech(startIndex = 0) {
  stopAudio();
  fullText = getCurrentText();
  if (!fullText) return;

  const textToRead = fullText.substring(startIndex);
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = "cs-CZ";
  utterance.pitch = 0.3;
  utterance.rate  = 0.95;
  utterance.volume = 1;

  utterance.onboundary = (event) => {
    if (event.name === "word" || event.name === undefined) {
      const absIndex = startIndex + event.charIndex;
      pausedCharIndex = absIndex;
      renderHighlightedText(absIndex);
    }
  };

  utterance.onend = () => {
    isPaused = false;
    pausedCharIndex = 0;
    playBtn.textContent = "▶️ Play";
  };

  speechSynthesis.speak(utterance);
  currentUtterance = utterance;
  isPaused = false;
  playBtn.textContent = "⏸️ Pause";
}

function stopAudio() {
  speechSynthesis.cancel();
  currentUtterance = null;
  isPaused = false;
  pausedCharIndex = 0;
  document.getElementById("verse-container").innerHTML = escapeHTML(getCurrentText());
  playBtn.textContent = "▶️ Play";
}

function pauseAudio() {
  speechSynthesis.pause();
  isPaused = true;
  playBtn.textContent = "▶️ Play";
}

function resumeAudio() {
  speechSynthesis.resume();
  isPaused = false;
  playBtn.textContent = "⏸️ Pause";
}

/* -------------------- Button handlers -------------------- */
playBtn.addEventListener("click", () => {
  if (speechSynthesis.speaking && !isPaused) {
    pauseAudio();
  } else if (isPaused) {
    resumeAudio();
  } else {
    startSpeech(pausedCharIndex);
  }
});

document.getElementById("repeat-audio").addEventListener("click", () => {
  startSpeech(0);
});

/* toggle input vs audio mode */
toggleAudio.addEventListener("change", (e) => {
  const isAudio = e.target.checked;
  if (isAudio) {
    document.getElementById("toggle-input").checked = false;
    inputControls.classList.add("hidden");
    audioControls.classList.remove("hidden");
    stopAudio();
  } else {
    audioControls.classList.add("hidden");
    inputControls.classList.remove("hidden");
    stopAudio();
  }
});

