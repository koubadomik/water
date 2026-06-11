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

// Handle Sidebar
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

function openMenu() {
    if (!sidebar || !sidebarOverlay) return;
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
    setTimeout(() => sidebarOverlay.classList.add('opacity-100'), 10);
}

function closeMenu() {
    if (!sidebar || !sidebarOverlay) return;
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.remove('opacity-100');
    setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
}

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMenu);

window.updateNavStreak = function() {
    const data = JSON.parse(localStorage.getItem('dailyRoutineData_v2')) || {streak: 0};
    const navStreak = document.getElementById('nav-streak-count');
    if (navStreak) navStreak.innerText = data.streak || 0;
};

/* -------------------- Helpers -------------------- */
function escapeHTML(s) {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/* -------------------- Bible loading -------------------- */
async function loadBible() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json");
        if (!res.ok) throw new Error("Network response not ok");
        bible = await res.json();
        document.getElementById("status").innerText = "Bible loaded from GitHub ✅";
        document.getElementById("file-container").style.display = "none";
        return;
    } catch (e) {
        console.warn("GitHub Bible fetch failed:", e);
    }

    if (localStorage.getItem("bibleJSON")) {
        try {
            bible = JSON.parse(localStorage.getItem("bibleJSON"));
            document.getElementById("status").innerText = "Bible loaded from localStorage ✅";
            document.getElementById("file-container").style.display = "none";
            return;
        } catch (e) {
            console.error(e);
        }
    }

    document.getElementById("file-container").style.display = "block";
}

document.getElementById("bible-file").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            bible = JSON.parse(evt.target.result);
            localStorage.setItem("bibleJSON", JSON.stringify(bible));
            document.getElementById("status").innerText = "Bible loaded from file and saved to localStorage ✅";
            document.getElementById("file-container").style.display = "none";
        } catch (err) {
            console.error(err);
            document.getElementById("status").innerText = "Error loading Bible JSON ❌";
        }
    };
    reader.readAsText(file, "utf-8");
});

/* -------------------- Verse parsing -------------------- */
function parseReference(ref) {
    if (!bible || Object.keys(bible).length === 0) {
        console.warn("Bible not loaded yet.");
        return null;
    }
    const match = ref.match(/^(\w+)\s+(\d+)(?::(\d+)(?:-(\d+)(?::(\d+))?)?)?$/);
    if (!match) {
        console.warn("Invalid reference format:", ref);
        return null;
    }
    const book = match[1], ch1 = parseInt(match[2]), v1 = match[3] ? parseInt(match[3]) : null,
        v2 = match[4] ? parseInt(match[4]) : null;
    
    if (!bible[book]) {
        console.warn("Book not found:", book);
        return null;
    }

    let verses = [];
    try {
        if (!v1) verses = bible[book]["chapters"][ch1 - 1];
        else if (v1 && !v2) verses.push(bible[book]["chapters"][ch1 - 1][v1 - 1]);
        else for (let i = v1 - 1; i < v2; i++) verses.push(bible[book]["chapters"][ch1 - 1][i]);
    } catch (e) {
        console.warn("Error accessing verses for ref:", ref, e);
        return null;
    }
    return verses;
}

/* -------------------- Blanks -------------------- */
function initBlanks(verseArray) {
    currentVerseArray = verseArray;
    words = [];
    blanks = [];
    typed = [];
    locked = [];
    verseArray.forEach(v => {
        const tokens = v.split(/(\s+|\n)/);
        if (difficulty === 0) {
            tokens.forEach(tok => {
                words.push(tok);
                blanks.push(false);
                typed.push("");
                locked.push(false);
            });
        } else {
            const real = tokens.map((t, i) => ({t, i})).filter(x => x.t.trim() !== "");
            const hide_ratio = {1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1.0}[difficulty];
            const num_to_hide = Math.floor(real.length * hide_ratio);
            const indices = new Set();
            while (indices.size < num_to_hide && real.length > 0) indices.add(real[Math.floor(Math.random() * real.length)].i);
            tokens.forEach((tok, i) => {
                words.push(tok);
                blanks.push(indices.has(i));
                typed.push("");
                locked.push(false);
            });
        }
        words.push("\n");
        blanks.push(false);
        typed.push("");
        locked.push(false);
    });
    currentIdx = blanks.findIndex(b => b);
    if (currentIdx === -1) currentIdx = 0;
    revealPointer = 0;
    render();
    localStorage.setItem(LAST_VERSE_KEY, JSON.stringify(verseArray));
}

function render() {
    const container = document.getElementById("verse-container");
    container.innerHTML = words.map((w, i) => {
        if (blanks[i]) {
            if (locked[i]) {
                const correct = words[i] || "";
                const input = typed[i] || "";
                let out = "";
                const maxlen = Math.max(input.length, correct.length);
                for (let j = 0; j < maxlen; j++) {
                    const cInput = input[j] ?? "";
                    const cCorrect = correct[j] ?? "";
                    if (j < input.length) out += (cInput === cCorrect ? `<span class="correct">${escapeHTML(cInput)}</span>` : `<span class="wrong">${escapeHTML(cInput)}</span>`);
                    else out += `<span class="missing">${escapeHTML(cCorrect)}</span>`;
                }
                return `<span class="blank ${i === currentIdx ? 'current' : ''}" id="word-${i}">${out}</span>`;
            } else {
                const display = typed[i] || "";
                const rest = "_".repeat(Math.max(1, (words[i] || "").length - display.length));
                return `<span class="blank ${i === currentIdx ? 'current' : ''}" id="word-${i}">${escapeHTML(display)}${rest}</span>`;
            }
        } else {
            if (w === "\n") return "<br/>";
            return `<span class="mx-1">${escapeHTML(w)}</span>`;
        }
    }).join("");
    if (document.getElementById("toggle-input")?.checked) document.getElementById("input").focus();
    const currentEl = document.getElementById(`word-${currentIdx}`);
    if (currentEl) currentEl.scrollIntoView({behavior: "smooth", block: "center"});
}

/* -------------------- Reveal -------------------- */
document.getElementById("reveal").addEventListener("click", () => {
    const idx = blanks.findIndex((b, i) => i >= revealPointer && b);
    if (idx >= 0) {
        typed[idx] = words[idx];
        locked[idx] = true;
        revealPointer = idx + 1;
        if (idx === currentIdx) moveToNextBlank();
        render();
    }
});

/* -------------------- Input mode toggle -------------------- */
document.getElementById("toggle-input").addEventListener("change", e => {
    const inputBox = document.getElementById("input");
    const revealBtn = document.getElementById("reveal");
    if (e.target.checked) {
        inputBox.style.display = "block";
        revealBtn.style.flexGrow = "0";
    } else {
        inputBox.style.display = "none";
        revealBtn.style.flexGrow = "1";
    }
    render();
});

/* -------------------- Navigation -------------------- */
function moveToNextBlank() {
    if (currentIdx < 0) return;
    if (blanks[currentIdx]) locked[currentIdx] = true;
    currentIdx = blanks.findIndex((b, i) => b && i > currentIdx);
    if (currentIdx === -1) currentIdx = blanks.findIndex(b => b);
}

/* -------------------- Input handling -------------------- */
document.getElementById("input").addEventListener("input", e => {
    if (currentIdx < 0 || !blanks[currentIdx]) return;
    typed[currentIdx] = e.target.value;
    render();
});
document.getElementById("input").addEventListener("keydown", e => {
    if (currentIdx < 0 || !blanks[currentIdx]) return;
    if (e.key === " " || e.key === "Enter") {
        typed[currentIdx] = e.target.value.trim();
        locked[currentIdx] = true;
        moveToNextBlank();
        e.target.value = "";
        render();
        e.preventDefault();
    }
});

/* -------------------- Restart -------------------- */
document.getElementById("restart").addEventListener("click", () => {
    if (currentVerseArray) initBlanks(currentVerseArray);
});

/* -------------------- Load verse -------------------- */
document.getElementById("load-verse").addEventListener("click", () => {
    const ref = document.getElementById("verse-input").value.trim();
    if (!bible || Object.keys(bible).length === 0) {
        alert("Bible není načtena.");
        return;
    }
    const verses = parseReference(ref);
    if (verses && verses.length > 0) initBlanks(verses);
});

/* -------------------- Custom texts -------------------- */
function loadSavedTexts() {
    const saved = JSON.parse(localStorage.getItem("customTexts") || "[]");
    const container = document.getElementById("saved-texts");
    container.innerHTML = "";
    saved.forEach((t, i) => {
        const row = document.createElement("div");
        row.className = "flex items-center space-x-2";
        const btn = document.createElement("button");
        btn.textContent = t.title;
        btn.className = "bg-gray-600 flex-grow text-white px-2 py-1 rounded hover:bg-gray-500 text-left";
        btn.onclick = () => {
            initBlanks([t.text]);
        };
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏";
        editBtn.className = "bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600";
        editBtn.onclick = () => {
            document.getElementById("custom-title").value = t.title;
            document.getElementById("custom-text").value = t.text;
            editingIndex = i;
        };
        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.className = "bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600";
        delBtn.onclick = () => {
            saved.splice(i, 1);
            localStorage.setItem("customTexts", JSON.stringify(saved));
            loadSavedTexts();
        };
        row.appendChild(btn);
        row.appendChild(editBtn);
        row.appendChild(delBtn);
        container.appendChild(row);
    });
}

document.getElementById("save-text").addEventListener("click", () => {
    const title = document.getElementById("custom-title").value.trim();
    const text = document.getElementById("custom-text").value;
    if (!title || !text) {
        alert("Vyplň název i text!");
        return;
    }
    let saved = JSON.parse(localStorage.getItem("customTexts") || "[]");
    if (editingIndex !== null) {
        saved[editingIndex] = {title, text};
        editingIndex = null;
    } else {
        saved.push({title, text});
    }
    localStorage.setItem("customTexts", JSON.stringify(saved));
    document.getElementById("custom-title").value = "";
    document.getElementById("custom-text").value = "";
    loadSavedTexts();
});
document.getElementById("clear-edit").addEventListener("click", () => {
    editingIndex = null;
    document.getElementById("custom-title").value = "";
    document.getElementById("custom-text").value = "";
});
document.getElementById("toggle-texts").addEventListener("click", () => {
    document.getElementById("custom-section").classList.toggle("hidden");
});
document.getElementById("difficulty").addEventListener("change", e => {
    difficulty = parseInt(e.target.value);
});

/* -------------------- Menu switching (show/hide typing area) -------------------- */
function switchApp(app) {
    // highlight menu
    document.querySelectorAll("#app-menu button").forEach(b => {
        b.classList.remove("bg-gray-800", "text-white");
        b.classList.add("text-gray-300");
    });
    const activeBtn = document.querySelector(`#app-menu button[data-app='${app}']`);
    if (activeBtn) {
        activeBtn.classList.add("bg-gray-800", "text-white");
        activeBtn.classList.remove("text-gray-300");
    }

    // show/hide primary app containers
    document.getElementById("byheart-container").style.display = app === "byheart" ? "block" : "none";
    
    const daily = document.getElementById("daily-container");
    if (daily) daily.style.display = app === "daily" ? "block" : "none";

    const palace = document.getElementById("palace-container");
    if (palace) palace.style.display = app === "palace" ? "block" : "none";

    const drill = document.getElementById("drill-container");
    if (drill) drill.style.display = app === "drill" ? "block" : "none";

    // persist last app
    localStorage.setItem(LAST_APP_KEY, app);

    // hide typing area + reveal button when in ByHeart
    const sticky = document.getElementById("sticky-controls");
    if (sticky) {
        sticky.style.display = (app === "byheart") ? "flex" : "none";
    }

    // initialize memory palace when opening it
    if (app === "palace" && window.initMemoryPalace) {
        window.initMemoryPalace();
    }
    
    // initialize drill mode when opening it
    if (app === "drill" && window.initDrillMode) {
        window.initDrillMode();
    }
    
    // initialize daily routine when opening it
    if (app === "daily" && window.initDailyRoutine) {
        window.initDailyRoutine();
    } else if (app !== "daily" && window.hideDailyRoutine) {
        window.hideDailyRoutine();
    }

    closeMenu();
    updateNavStreak();
}

// wire up menu buttons
document.querySelectorAll("#app-menu button").forEach(b => {
    b.addEventListener("click", () => {
        if (b.dataset.app) switchApp(b.dataset.app);
        if (b.id === 'open-drill-mode') closeMenu();
    });
});

/* -------------------- Init on load -------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadBible();
    loadSavedTexts();
    const lastVerse = localStorage.getItem(LAST_VERSE_KEY);
    if (lastVerse) initBlanks(JSON.parse(lastVerse));
    const lastApp = "daily";
    switchApp(lastApp);
    updateNavStreak();
});

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
    if (currentEl) currentEl.scrollIntoView({behavior: "smooth", block: "center"});
}

function startSpeech(startIndex = 0) {
    stopAudio();
    fullText = getCurrentText();
    if (!fullText) return;

    const textToRead = fullText.substring(startIndex);
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "cs-CZ";
    utterance.pitch = 0.3;
    utterance.rate = 0.95;
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


/* -------------------- Drill mode: START (self-contained) -------------------- */
/* Drill mode is an IIFE that does not modify the main app state except reading from the displayed verse or the global `bible` object (read-only). It persists local progress to localStorage -> key 'drillState'. */

(function () {
    // small utilities
    function _escapeHtml(s) {
        return (s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function _normText(txt, opts) {
        opts = opts || {ignoreCase: false, ignorePunctuation: false};
        let out = (txt || '').trim();
        if (opts.ignoreCase) out = out.toLowerCase();
        if (opts.ignorePunctuation) out = out.replace(/[^\w\s\u00C0-\u024F'-]+/g, '');
        out = out.replace(/\s+/g, ' ');
        return out;
    }

    function _splitWords(text) {
        return (text || '').split(/\s+/).filter(Boolean);
    }

    function _lcsIndices(a, b) {
        const n = a.length, m = b.length;
        const dp = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; --i) {
            for (let j = m - 1; j >= 0; --j) {
                if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
                else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
        const pairs = [];
        let i = 0, j = 0;
        while (i < n && j < m) {
            if (a[i] === b[j]) {
                pairs.push([i, j]);
                i++;
                j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
            else j++;
        }
        return pairs;
    }

    function _levenshtein(a, b) {
        const A = Array.from(a || ''), B = Array.from(b || '');
        const n = A.length, m = B.length;
        const dp = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
        for (let i = 0; i <= n; i++) dp[i][0] = i;
        for (let j = 0; j <= m; j++) dp[0][j] = j;
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (A[i - 1] === B[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
            }
        }
        return dp[n][m];
    }

    function _charDiffHtml(target, typed) {
        const ta = Array.from(target || ''), tb = Array.from(typed || '');
        const n = ta.length, m = tb.length;
        const dp = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; --i) for (let j = m - 1; j >= 0; --j) dp[i][j] = (ta[i] === tb[j]) ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
        let i = 0, j = 0;
        const parts = [];
        while (i < n || j < m) {
            if (i < n && j < m && ta[i] === tb[j]) {
                parts.push({t: 'match', c: ta[i]});
                i++;
                j++;
            } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
                parts.push({t: 'insert', c: tb[j]});
                j++;
            } else if (i < n) {
                parts.push({t: 'delete', c: ta[i]});
                i++;
            }
        }
        let html = '';
        parts.forEach(p => {
            const ch = p.c === ' ' ? '&nbsp;' : _escapeHtml(p.c);
            if (p.t === 'match') html += '<span>' + ch + '</span>';
            else if (p.t === 'delete') html += '<span class="drill-char-wrong" title="Missing">' + ch + '</span>';
            else if (p.t === 'insert') html += '<span class="drill-char-insert" title="Extra">' + ch + '</span>';
        });
        return html;
    }

    // Try to load verses from a reference by reading the global bible object (if available)
    function _lookupVersesFromRef(refStr) {
        if (!refStr || !refStr.trim()) return null;
        const m = refStr.trim().match(/^([\p{L}\d\.\s]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/u);
        if (!m) return null;
        const book = m[1].trim();
        const ch = parseInt(m[2], 10);
        const v1 = m[3] ? parseInt(m[3], 10) : null;
        const v2 = m[4] ? parseInt(m[4], 10) : null;
        try {
            const chapters = bible[book]['chapters'];
            if (!chapters || !chapters[ch - 1]) return null;
            if (!v1) return [chapters[ch - 1].join(' ')];
            if (v1 && !v2) return [chapters[ch - 1][v1 - 1]];
            const out = [];
            for (let i = v1 - 1; i <= v2 - 1; i++) if (chapters[ch - 1][i]) out.push(chapters[ch - 1][i]);
            return out;
        } catch (e) {
            return null;
        }
    }

    function _renderComparisonHtml(targetText, typedText, opts) {
        opts = opts || {ignoreCase: false, ignorePunctuation: false};
        const tWordsRaw = _splitWords(targetText);
        const yWordsRaw = _splitWords(typedText);
        const tNorm = tWordsRaw.map(w => _normText(w, opts));
        const yNorm = yWordsRaw.map(w => _normText(w, opts));
        const matches = _lcsIndices(tNorm, yNorm);
        const matchedTargetIdx = new Set(matches.map(p => p[0]));
        let typedCursor = 0;
        const container = document.createElement('div');
        for (let i = 0; i < tWordsRaw.length; i++) {
            const span = document.createElement('span');
            span.className = 'drill-word';
            const tRaw = tWordsRaw[i] || '';
            if (matchedTargetIdx.has(i)) {
                span.classList.add('correct');
                span.textContent = tRaw;
            } else {
                const typedGuess = yWordsRaw[typedCursor] || '';
                span.classList.add('wrong');
                if (typedGuess) {
                    span.innerHTML = _charDiffHtml(tRaw, typedGuess);
                } else {
                    span.innerHTML = '<span class="drill-char-wrong" title="Missing">' + _escapeHtml(tRaw) + '</span>';
                }
            }
            container.appendChild(span);
            container.appendChild(document.createTextNode(' '));
            typedCursor++;
        }
        for (let k = tWordsRaw.length; k < yWordsRaw.length; k++) {
            const ins = document.createElement('span');
            ins.className = 'drill-word wrong';
            ins.innerHTML = '<span class="drill-char-insert">' + _escapeHtml(yWordsRaw[k]) + '</span>';
            container.appendChild(ins);
            container.appendChild(document.createTextNode(' '));
        }
        return container.innerHTML;
    }

    // persistence helpers
    const DRILL_KEY = 'drillState';

    function _save(state) {
        try {
            localStorage.setItem(DRILL_KEY, JSON.stringify(state));
        } catch (e) {
        }
    }

    function _load() {
        try {
            const r = localStorage.getItem(DRILL_KEY);
            return r ? JSON.parse(r) : null;
        } catch (e) {
            return null;
        }
    }

    // UI wiring
    document.addEventListener('DOMContentLoaded', function () {
        const loadBtn = document.getElementById('drill-load-btn');
        const refInput = document.getElementById('drill-verse-input');
        const typingInput = document.getElementById('drill-typing-input');
        const checkBtn = document.getElementById('drill-check-btn');
        const retryBtn = document.getElementById('drill-retry-btn');
        const prevBtn = document.getElementById('drill-prev-btn');
        const nextBtn = document.getElementById('drill-next-btn');
        const resultDiv = document.getElementById('drill-result');
        const rightFormDiv = document.getElementById('drill-right-form');
        const statsDiv = document.getElementById('drill-stats');
        const accSpan = document.getElementById('drill-accuracy');
        const errSpan = document.getElementById('drill-errors');
        const distSpan = document.getElementById('drill-distance');
        const ignorePunct = document.getElementById('drill-ignore-punct');
        const progressEl = document.getElementById('drill-progress');

        // restore persisted state if available
        let state = {ref: '', index: 0, verses: [], isAdvancing: false};
        const persisted = _load();
        if (persisted && persisted.verses && persisted.verses.length) state = persisted;

        window.initDrillMode = function() {
            if (state.ref) refInput.value = state.ref;
            _updateDisplay();
            typingInput.focus();
        };

        function _setVersesArray(ref, verses) {
            state.ref = ref || '';
            state.verses = Array.isArray(verses) ? verses.slice() : [];
            state.index = 0;
            _save(state);
            _updateDisplay();
        }

        function _updateDisplay() {
            const total = state.verses.length;
            const idx = Math.min(Math.max(0, state.index), Math.max(0, total - 1));
            progressEl.textContent = (total > 0) ? `${state.ref} | ${idx + 1} / ${total}` : '— / —';
            prevBtn.disabled = !(total > 0 && idx > 0);
            nextBtn.disabled = !(total > 0 && idx < total - 1);
            retryBtn.disabled = false;
            resultDiv.innerHTML = '<em>Loaded. Type and press Check.</em>';
            rightFormDiv.classList.add('drill-hidden');
            rightFormDiv.innerHTML = '';
            statsDiv.classList.add('drill-hidden');
            typingInput.value = '';
        }

        loadBtn.addEventListener('click', function () {
            const ref = (refInput.value || '').trim();
            if (ref) {
                const verses = _lookupVersesFromRef(ref);
                if (Array.isArray(verses) && verses.length > 0) {
                    _setVersesArray(ref, verses);
                } else {
                    resultDiv.innerHTML = '<em>Reference not found in local Bible data. If you have not loaded a local Bible, use the main page to load the verse and open Drill with empty reference.</em>';
                    state.verses = [];
                    state.index = 0;
                    state.ref = ref;
                    _save(state);
                    _updateDisplay();
                }
            } else {
                // use main display as fallback
                const mainText = document.getElementById('verse-container')?.innerText || '';
                if (mainText.trim()) {
                    const verses = mainText.split(/\n+/).map(s => s.trim()).filter(Boolean);
                    _setVersesArray('', verses.length > 0 ? verses : [mainText.trim()]);
                } else {
                    resultDiv.innerHTML = '<em>No reference provided and main verse display empty.</em>';
                }
            }
        });

        checkBtn.addEventListener('click', function () {
            if (!state.verses || state.verses.length === 0) {
                resultDiv.innerHTML = '<em>No target loaded. Use the small reference box or load the displayed verse.</em>';
                return;
            }
            const typed = typingInput.value || '';
            const opts = {ignoreCase: false, ignorePunctuation: !!ignorePunct.checked};

            // Multi-verse smart checking
            let targetText = state.verses[state.index];
            let currentIdx = state.index;
            const typedLines = typed.split(/\n+/).filter(l => l.trim().length > 0);

            // If user typed more than what's in current verse, try to combine subsequent verses
            if (typedLines.length > 1 || typed.length > targetText.length * 1.2) {
                let combinedTarget = [];
                for (let i = state.index; i < state.verses.length; i++) {
                    combinedTarget.push(state.verses[i]);
                    // heuristic: if we have enough target text to cover typed text
                    if (combinedTarget.join(' ').length >= typed.length * 0.9) break;
                }
                targetText = combinedTarget.join(' ');
            }

            const compHtml = _renderComparisonHtml(targetText, typed, opts);
            resultDiv.innerHTML = '<strong>Comparison:</strong><div style="margin-top:6px">' + compHtml + '</div>';

            rightFormDiv.innerHTML = '<strong>Correct form:</strong><div style="margin-top:4px">' + _escapeHtml(targetText) + '</div>';
            rightFormDiv.classList.remove('drill-hidden');

            const nTarget = _normText(targetText, opts);
            const nTyped = _normText(typed, opts);
            const lev = _levenshtein(nTarget, nTyped);
            const tWords = _splitWords(nTarget);
            const yWords = _splitWords(nTyped);
            const matched = _lcsIndices(tWords, yWords).length;
            const accuracy = tWords.length ? Math.round((matched / tWords.length) * 100) : (nTarget === '' ? 100 : 0);

            // Auto-advance if perfect match
            if (accuracy === 100 && nTarget === nTyped && nTarget !== '' && !state.isAdvancing) {
                state.isAdvancing = true; // prevent double triggers
                setTimeout(() => {
                    if (state.index < state.verses.length - 1) {
                        nextBtn.click();
                    }
                    state.isAdvancing = false;
                }, 1000);
            }

            accSpan.textContent = 'Accuracy: ' + accuracy + '%';
            errSpan.textContent = 'Words correct: ' + matched + '/' + tWords.length;
            distSpan.textContent = 'Levenshtein: ' + lev;
            statsDiv.classList.remove('drill-hidden');

            prevBtn.disabled = !(state.index > 0);
            nextBtn.disabled = !(state.index < state.verses.length - 1);
            retryBtn.disabled = false;
        });

        /*
        typingInput.addEventListener('input', function () {
            if (state.verses && state.verses.length > 0) {
                checkBtn.click();
            }
        });
        */

        retryBtn.addEventListener('click', function () {
            typingInput.value = '';
            typingInput.focus();
            resultDiv.innerHTML = '<em>Retry: type again and press Check.</em>';
            rightFormDiv.classList.add('drill-hidden');
            rightFormDiv.innerHTML = '';
            statsDiv.classList.add('drill-hidden');
            retryBtn.disabled = true;
        });

        prevBtn.addEventListener('click', function () {
            if (state.index > 0) {
                state.index--;
                _save(state);
                _updateDisplay();
                typingInput.focus();
            }
        });

        nextBtn.addEventListener('click', function () {
            if (state.index < state.verses.length - 1) {
                state.index++;
                _save(state);
                _updateDisplay();
                typingInput.focus();
            } else {
                resultDiv.innerHTML = '<em>End of selected verses.</em>';
            }
        });

        // Save on close/unload
        if (closeBtn) closeBtn.addEventListener('click', () => _save(state));
        window.addEventListener('beforeunload', () => _save(state));

        // Ctrl/Cmd+Enter quick-check
        typingInput.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                checkBtn.click();
            }
        });

        // init UI state
        _updateDisplay();
    });
})();
/* -------------------- Drill mode: END -------------------- */