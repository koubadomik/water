(function () {
    const DAILY_KEY = 'dailyRoutineData';
    const PALACE_KEY = 'memoryPalaceNotes';

    let dailyData = loadDailyData();

    function loadDailyData() {
        const defaultData = {
            streak: 0,
            lastDate: null,
            currentVerse: 'Zj 1:1',
            completedToday: false,
            history: []
        };
        try {
            const data = JSON.parse(localStorage.getItem(DAILY_KEY)) || defaultData;
            const today = new Date().toISOString().split('T')[0];
            if (data.lastDate !== today) {
                data.completedToday = false;
            }
            return data;
        } catch (e) {
            return defaultData;
        }
    }

    function saveDailyData() {
        localStorage.setItem(DAILY_KEY, JSON.stringify(dailyData));
    }

    function loadPalaceNotes() {
        try {
            return JSON.parse(localStorage.getItem(PALACE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function savePalaceNotes(notes) {
        localStorage.setItem(PALACE_KEY, JSON.stringify(notes));
    }

    function updateStreak() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        if (dailyData.lastDate === today) return;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dailyData.lastDate === yesterdayStr) {
            dailyData.streak++;
        } else if (dailyData.lastDate !== today) {
            dailyData.streak = 1;
        }
        dailyData.lastDate = today;
        dailyData.completedToday = true;
        dailyData.history = dailyData.history || [];
        saveDailyData();
        if (window.updateNavStreak) window.updateNavStreak();
    }

    function getNextVerse(ref) {
        // Simple next verse logic
        const match = ref.match(/^(\w+)\s+(\d+):(\d+)$/);
        if (!match) return ref;
        const book = match[1], ch = parseInt(match[2]), v = parseInt(match[3]);
        
        if (bible[book] && bible[book].chapters[ch - 1] && bible[book].chapters[ch - 1][v]) {
            return `${book} ${ch}:${v + 1}`;
        } else if (bible[book] && bible[book].chapters[ch]) {
            return `${book} ${ch + 1}:1`;
        }
        return ref;
    }

    window.initDailyRoutine = function () {
        const container = document.getElementById('daily-container');
        if (container) container.style.display = 'block';
        showMainDashboard();
    };

    window.hideDailyRoutine = function () {
        const container = document.getElementById('daily-container');
        if (container) container.style.display = 'none';
    };

    function showMainDashboard() {
        const content = document.getElementById('daily-content');
        const today = new Date().toISOString().split('T')[0];
        const doneToday = dailyData.lastDate === today && dailyData.completedToday;

        content.innerHTML = `
            <div class="space-y-6 text-white text-center">
                <div class="space-y-2">
                    <h1 class="text-4xl font-extrabold text-blue-400">Welcome Back!</h1>
                    <p class="text-gray-400 text-lg">Ready for your daily verse practice?</p>
                </div>

                <div class="flex justify-center items-center gap-8 py-4">
                    <div class="text-center">
                        <div class="text-4xl">🔥</div>
                        <div class="text-2xl font-bold text-orange-400">${dailyData.streak}</div>
                        <div class="text-xs uppercase tracking-wider text-gray-500">Streak</div>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl">🎯</div>
                        <div class="text-2xl font-bold text-green-400">${dailyData.completedToday ? '1/1' : '0/1'}</div>
                        <div class="text-xs uppercase tracking-wider text-gray-500">Today</div>
                    </div>
                </div>
                
                <div class="bg-gray-700/50 p-6 rounded-2xl shadow-inner border border-gray-600">
                    <div class="flex justify-between mb-3 text-sm font-medium">
                        <span>Daily Goal Progress</span>
                        <span class="${dailyData.completedToday ? 'text-green-400' : 'text-blue-400'}">${dailyData.completedToday ? '100' : '0'}%</span>
                    </div>
                    <div class="w-full bg-gray-900 rounded-full h-4 overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out" style="width: ${dailyData.completedToday ? '100' : '0'}%"></div>
                    </div>
                </div>

                <div class="bg-gray-700/50 p-8 rounded-2xl border border-blue-500/30">
                    <h3 class="text-xl mb-2 text-gray-300">Next Verse to Learn</h3>
                    <div class="text-3xl font-mono text-blue-400 mb-8">${dailyData.currentVerse}</div>
                    
                    <button id="start-routine" class="w-full py-5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-900/20">
                        ${doneToday ? 'Routine Completed! Repeat?' : 'Start Daily Routine'}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('start-routine').addEventListener('click', startStep1);
    }

    // --- Routine Steps ---

    function startStep1() {
        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="space-y-4 text-white">
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex-1 h-2 bg-blue-500 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                </div>
                <h2 class="text-2xl font-bold">Step 1: Choose Verse</h2>
                <p>Continue from where you left off or choose a new one.</p>
                <input id="daily-v-input" type="text" value="${dailyData.currentVerse}" class="w-full p-3 rounded bg-gray-900 text-white border border-gray-600 text-xl" />
                <button id="daily-next-1" class="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold">Continue</button>
            </div>
        `;
        document.getElementById('daily-next-1').addEventListener('click', () => {
            dailyData.currentVerse = document.getElementById('daily-v-input').value.trim();
            saveDailyData();
            startStep2();
        });
    }

    function startStep2() {
        const history = dailyData.history || [];
        const prevVerse = history[history.length - 1] || dailyData.currentVerse;
        const notes = loadPalaceNotes();
        const verseNotes = notes[prevVerse] || "No notes yet.";
        
        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="space-y-4 text-white">
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex-1 h-2 bg-green-500 rounded"></div>
                    <div class="flex-1 h-2 bg-blue-500 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                </div>
                <h2 class="text-2xl font-bold">Step 2: Remind Yesterday</h2>
                <div class="bg-gray-900 p-4 rounded border border-blue-500">
                    <h3 class="text-blue-400 font-bold mb-2">${prevVerse}</h3>
                    <p class="italic text-gray-300">${verseNotes}</p>
                </div>
                <p class="text-sm text-gray-400 text-center">Type the verse to refresh your memory</p>
                <textarea id="daily-review-input" rows="3" class="w-full p-3 rounded bg-gray-900 text-white border border-gray-600" placeholder="Type here..."></textarea>
                <button id="daily-next-2" class="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold">I Remember!</button>
            </div>
        `;
        document.getElementById('daily-next-2').addEventListener('click', startStep3);
    }

    function startStep3() {
        const ref = dailyData.currentVerse;
        const notes = loadPalaceNotes();
        const currentNote = notes[ref] || "";

        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="space-y-4 text-white">
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex-1 h-2 bg-green-500 rounded"></div>
                    <div class="flex-1 h-2 bg-green-500 rounded"></div>
                    <div class="flex-1 h-2 bg-blue-500 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                </div>
                <h2 class="text-2xl font-bold">Step 3: Current Verse Palace Note</h2>
                <div class="bg-blue-900/30 p-4 rounded">
                    <h3 class="text-xl font-mono text-blue-300">${ref}</h3>
                    <div id="daily-verse-text" class="mt-2 text-lg">Loading verse...</div>
                </div>
                <p>Create or update your Palace Note for this verse:</p>
                <textarea id="daily-note-input" rows="4" class="w-full p-3 rounded bg-gray-900 text-white border border-gray-600" placeholder="e.g. On my desk there is a golden lamp...">${currentNote}</textarea>
                <button id="daily-save-note" class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Save Note & Train</button>
            </div>
        `;

        // Load verse text
        const vArr = parseReference(ref);
        if (vArr && vArr.length) {
            document.getElementById('daily-verse-text').innerText = vArr.join(' ');
        }

        document.getElementById('daily-save-note').addEventListener('click', () => {
            const newNote = document.getElementById('daily-note-input').value.trim();
            const notes = loadPalaceNotes();
            notes[ref] = newNote;
            savePalaceNotes(notes);
            startStep3Train(vArr);
        });
    }

    function startStep3Train(verseArray) {
        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="space-y-4 text-white">
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex-1 h-2 bg-green-500 rounded"></div>
                    <div class="flex-1 h-2 bg-green-500 rounded"></div>
                    <div class="flex-1 h-2 bg-blue-500 rounded"></div>
                    <div class="flex-1 h-2 bg-gray-600 rounded"></div>
                </div>
                <h2 class="text-2xl font-bold">Step 3: Training</h2>
                <div id="daily-train-container" class="bg-gray-900 p-6 rounded text-2xl leading-relaxed min-h-[150px]"></div>
                <div class="flex gap-2">
                    <input id="daily-train-input" type="text" class="flex-1 p-3 rounded bg-white text-black text-xl" placeholder="Type next word..." />
                    <button id="daily-train-reveal" class="bg-blue-600 px-4 rounded">Reveal</button>
                </div>
            </div>
        `;

        // Re-use script.js logic if possible, or simple version
        let localWords = [];
        verseArray.forEach(v => {
            v.split(/(\s+|\n)/).forEach(w => {
                if (w.trim()) localWords.push({text: w, hidden: Math.random() > 0.5, typed: ""});
                else if (w === "\n") localWords.push({text: "\n"});
                else localWords.push({text: " "});
            });
        });

        const trainInput = document.getElementById('daily-train-input');
        const trainContainer = document.getElementById('daily-train-container');
        
        let currentWordIdx = localWords.findIndex(w => w.hidden);
        if (currentWordIdx === -1) {
            // No words hidden? Hide at least one
            const realWords = localWords.filter(w => w.hidden === false && w.text.trim());
            if (realWords.length) {
                const target = realWords[Math.floor(Math.random() * realWords.length)];
                target.hidden = true;
                currentWordIdx = localWords.indexOf(target);
            }
        }

        function renderTrain() {
            trainContainer.innerHTML = localWords.map((w, i) => {
                if (w.text === "\n") return "<br/>";
                if (!w.hidden) return `<span>${w.text}</span>`;
                if (w.solved) return `<span class="text-green-400">${w.text}</span>`;
                return `<span class="border-b-2 border-gray-500 mx-1 px-1 ${i === currentWordIdx ? 'bg-blue-900' : ''}">${w.typed || '___'}</span>`;
            }).join("");
        }

        renderTrain();
        trainInput.focus();

        trainInput.addEventListener('input', (e) => {
            if (currentWordIdx === -1) return;
            localWords[currentWordIdx].typed = e.target.value;
            renderTrain();
        });

        trainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const target = localWords[currentWordIdx].text.toLowerCase().replace(/[^\w]/g, '');
                const typed = e.target.value.toLowerCase().replace(/[^\w]/g, '');
                
                if (typed === target || e.key === 'Enter') {
                    localWords[currentWordIdx].solved = true;
                    localWords[currentWordIdx].hidden = false;
                    currentWordIdx = localWords.findIndex((w, i) => w.hidden && i > currentWordIdx);
                    if (currentWordIdx === -1) {
                        finishRoutine();
                    } else {
                        e.target.value = "";
                        renderTrain();
                    }
                }
            }
        });

        document.getElementById('daily-train-reveal').addEventListener('click', () => {
             if (currentWordIdx !== -1) {
                localWords[currentWordIdx].solved = true;
                localWords[currentWordIdx].hidden = false;
                currentWordIdx = localWords.findIndex((w, i) => w.hidden && i > currentWordIdx);
                if (currentWordIdx === -1) {
                    finishRoutine();
                } else {
                    trainInput.value = "";
                    renderTrain();
                    trainInput.focus();
                }
             }
        });
    }

    function finishRoutine() {
        updateStreak();
        dailyData.history = dailyData.history || [];
        if (!dailyData.history.includes(dailyData.currentVerse)) {
            dailyData.history.push(dailyData.currentVerse);
        }
        // Prepare for tomorrow
        const next = getNextVerse(dailyData.currentVerse);
        dailyData.nextVerse = next; 
        saveDailyData();

        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="text-center space-y-6 text-white py-10 animate-bounce-slow">
                <h2 class="text-5xl">🎉</h2>
                <h2 class="text-3xl font-bold">Excellent Work!</h2>
                <p class="text-xl">You've completed your daily routine.</p>
                <div class="text-4xl font-bold text-orange-400">🔥 ${dailyData.streak} Day Streak!</div>
                
                <div class="flex justify-center py-4">
                    <div class="relative w-32 h-32">
                        <svg class="w-full h-full" viewBox="0 0 100 100">
                            <circle class="text-gray-700 stroke-current" stroke-width="10" fill="transparent" r="40" cx="50" cy="50"/>
                            <circle class="text-green-500 stroke-current" stroke-width="10" stroke-linecap="round" fill="transparent" r="40" cx="50" cy="50"
                                    stroke-dasharray="251.2" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center text-xl font-bold">100%</div>
                    </div>
                </div>

                <button id="back-to-dash" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition-transform hover:scale-105">
                    Back to Dashboard
                </button>
            </div>
        `;

        // Next day's verse update
        dailyData.currentVerse = next;
        saveDailyData();

        document.getElementById('back-to-dash').addEventListener('click', showMainDashboard);
    }

})();
