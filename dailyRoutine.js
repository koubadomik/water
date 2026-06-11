(function () {
    const DAILY_KEY = 'dailyRoutineData_v2'; 
    const PALACE_KEY = 'memoryPalaceNotes';

    let dailyData = loadDailyData();

    function loadDailyData() {
        const defaultData = {
            streak: 0,
            lastDate: null,
            weeklyProgress: {}, 
            currentGoal: null, 
            path: [], 
            history: []
        };
        try {
            return JSON.parse(localStorage.getItem(DAILY_KEY)) || defaultData;
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

    window.initDailyRoutine = function () {
        const container = document.getElementById('daily-container');
        if (container) container.style.display = 'block';
        
        if (!dailyData.currentGoal) {
            showGoalSetup();
        } else {
            showMainDashboard();
        }
    };

    function showGoalSetup() {
        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="space-y-6 text-white">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-blue-400">Set Your Goal</h2>
                    <p class="text-gray-400">Define the verses you want to master.</p>
                </div>
                
                <div class="bg-gray-700/50 p-6 rounded-2xl space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Start Verse</label>
                        <input id="goal-start" type="text" placeholder="e.g. Rv 14:1" class="w-full p-3 rounded bg-gray-900 border border-gray-600">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">End Verse</label>
                        <input id="goal-end" type="text" placeholder="e.g. Rv 14:5" class="w-full p-3 rounded bg-gray-900 border border-gray-600">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Intensity (Lessons per Verse)</label>
                        <select id="goal-intensity" class="w-full p-3 rounded bg-gray-900 border border-gray-600 text-white">
                            <option value="1">1 (Fast)</option>
                            <option value="2">2 (Balanced)</option>
                            <option value="3" selected>3 (Rigorous)</option>
                            <option value="5">5 (Deep Mastery)</option>
                        </select>
                    </div>
                </div>

                <button id="create-goal" class="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl transition-all">
                    Generate Learning Path
                </button>
            </div>
        `;

        document.getElementById('create-goal').addEventListener('click', () => {
            const start = document.getElementById('goal-start').value.trim();
            const end = document.getElementById('goal-end').value.trim();
            const intensity = parseInt(document.getElementById('goal-intensity').value);

            if (!start) return alert('Please enter a start verse');

            // Generate Path logic
            let verses = [];
            // Try to find verses between start and end
            const startParsed = start.match(/^(\w+)\s+(\d+):(\d+)$/);
            const endParsed = end.match(/^(\w+)\s+(\d+):(\d+)$/);

            if (startParsed && endParsed && startParsed[1] === endParsed[1] && startParsed[2] === endParsed[2]) {
                const book = startParsed[1];
                const ch = parseInt(startParsed[2]);
                const v1 = parseInt(startParsed[3]);
                const v2 = parseInt(endParsed[3]);
                for (let i = v1; i <= v2; i++) {
                    verses.push(`${book} ${ch}:${i}`);
                }
            } else {
                verses = [start];
            }

            const path = [];
            verses.forEach(v => {
                for(let i=0; i<intensity; i++) {
                    path.push({
                        verse: v,
                        lessonIndex: i,
                        status: (path.length === 0) ? 'active' : 'locked'
                    });
                }
            });

            dailyData.currentGoal = { startRef: start, endRef: end || start, lessonsPerVerse: intensity };
            dailyData.path = path;
            saveDailyData();
            showMainDashboard();
        });
    }

    function showMainDashboard() {
        const content = document.getElementById('daily-content');
        const today = new Date().toISOString().split('T')[0];
        
        const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const todayIdx = (new Date().getDay() + 6) % 7; 
        
        let weeklyHtml = '';
        weekdays.forEach((day, i) => {
            const isToday = i === todayIdx;
            const completed = dailyData.weeklyProgress[today] && isToday; 
            weeklyHtml += `
                <div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg 
                        ${completed ? 'bg-orange-500 text-white' : (isToday ? 'border-2 border-blue-400 text-blue-400' : 'bg-gray-700 text-gray-500')}">
                        ${completed ? '🔥' : (isToday ? '😴' : day)}
                    </div>
                    <span class="text-[10px] uppercase font-bold text-gray-500">${day}</span>
                </div>
            `;
        });

        content.innerHTML = `
            <div class="space-y-8">
                <div class="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl">
                    ${weeklyHtml}
                </div>

                <div class="relative flex flex-col items-center gap-8 py-10">
                    <div class="absolute top-0 bottom-0 w-2 bg-gray-700 -z-10"></div>
                    ${dailyData.path.map((node, i) => {
                        let colorClass = 'bg-gray-700 text-gray-500 cursor-not-allowed';
                        let icon = '🔒';
                        if (node.status === 'completed') {
                            colorClass = 'bg-green-500 text-white shadow-lg shadow-green-900/20';
                            icon = '✅';
                        } else if (node.status === 'active') {
                            colorClass = 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-125 z-10';
                            icon = (node.lessonIndex === 0) ? '🏛️' : (node.lessonIndex === dailyData.currentGoal.lessonsPerVerse - 1 ? '🏆' : '⚔️');
                        }

                        const offset = (i % 2 === 0 ? 'translate-x-12' : '-translate-x-12');

                        return `
                            <button class="path-node w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all transform ${colorClass} ${offset}" 
                                    data-index="${i}" ${node.status === 'locked' ? 'disabled' : ''}>
                                <span class="text-3xl">${icon}</span>
                                <span class="text-[10px] font-bold mt-1">${node.verse}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
                
                <div class="text-center">
                    <button id="reset-goal" class="text-xs text-gray-500 underline hover:text-gray-300">Reset Goal & Progress</button>
                </div>
            </div>
        `;

        document.querySelectorAll('.path-node').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                if (dailyData.path[idx].status !== 'locked') {
                    startLesson(idx);
                }
            });
        });

        document.getElementById('reset-goal').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your goal? All progress will be lost.')) {
                dailyData.currentGoal = null;
                dailyData.path = [];
                saveDailyData();
                showGoalSetup();
            }
        });
    }

    function startLesson(nodeIdx) {
        const node = dailyData.path[nodeIdx];
        const content = document.getElementById('daily-content');
        
        let steps = [];
        if (node.lessonIndex === 0) {
            steps = ['context', 'note_creation', 'word_scramble'];
        } else if (node.lessonIndex === 1) {
            steps = ['context', 'first_letter', 'phrase_order'];
        } else {
            steps = ['context', 'dictation', 'full_recall'];
        }

        let currentStepIdx = 0;

        function renderStep() {
            const stepType = steps[currentStepIdx];
            const progress = ((currentStepIdx) / steps.length) * 100;

            content.innerHTML = `
                <div class="space-y-6 text-white min-h-[400px] flex flex-col">
                    <div class="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                        <div class="bg-blue-500 h-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>

                    <div id="step-container" class="flex-1"></div>

                    <div class="flex justify-between gap-4">
                        <button id="skip-step" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all">Skip</button>
                        <button id="next-step" class="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl transition-all shadow-lg shadow-green-900/20">Check</button>
                    </div>
                </div>
            `;

            document.getElementById('skip-step').addEventListener('click', nextStep);
            document.getElementById('next-step').addEventListener('click', handleCheck);

            loadStepContent(stepType, node.verse);
        }

        function loadStepContent(type, verse) {
            const container = document.getElementById('step-container');
            const vArr = parseReference(verse);
            const verseText = vArr ? vArr.join(' ') : "Verse text loading error";
            
            // Helper to get current chapter verses
            const getChapterVerses = () => {
                const match = verse.match(/^(\w+)\s+(\d+)/);
                if (!match) return [verse];
                const book = match[1], ch = parseInt(match[2]);
                if (bible[book] && bible[book].chapters[ch - 1]) {
                    return bible[book].chapters[ch - 1].map((v, i) => `${book} ${ch}:${i + 1}`);
                }
                return [verse];
            };

            switch (type) {
                case 'context':
                    let browserIndex = 0;
                    const chapterVerses = getChapterVerses();
                    browserIndex = chapterVerses.indexOf(verse);
                    if (browserIndex === -1) browserIndex = 0;

                    const renderBrowser = (idx) => {
                        const vRef = chapterVerses[idx];
                        const vTextArr = parseReference(vRef);
                        const vText = vTextArr ? vTextArr.join(' ') : "...";
                        const vNote = loadPalaceNotes()[vRef] || 'No note yet.';

                        container.innerHTML = `
                            <div class="space-y-4">
                                <h2 class="text-2xl font-bold text-blue-300">Context & Palace Browser</h2>
                                <div class="bg-gray-900 p-4 rounded-xl border border-blue-500/30 min-h-[120px]">
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-blue-400 font-bold">${vRef}</span>
                                        <div class="flex gap-2">
                                            <button id="prev-v" class="p-1 hover:bg-gray-800 rounded">⬅️</button>
                                            <button id="next-v" class="p-1 hover:bg-gray-800 rounded">➡️</button>
                                        </div>
                                    </div>
                                    <p class="text-lg leading-relaxed">${vText}</p>
                                </div>
                                <div class="bg-blue-900/20 p-4 rounded-xl">
                                    <h4 class="text-xs uppercase font-bold text-blue-400 mb-2">Palace Note</h4>
                                    <p class="italic text-gray-300">${vNote}</p>
                                </div>
                                <p class="text-xs text-center text-gray-500">Current target: <span class="text-white">${verse}</span></p>
                            </div>
                        `;

                        container.querySelector('#prev-v').onclick = () => { if(idx > 0) renderBrowser(idx - 1); };
                        container.querySelector('#next-v').onclick = () => { if(idx < chapterVerses.length - 1) renderBrowser(idx + 1); };
                    };

                    renderBrowser(browserIndex);
                    document.getElementById('next-step').innerText = "Got it!";
                    break;

                case 'note_creation':
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">Create Palace Note</h2>
                            <p class="text-gray-400">Describe the scene for: <span class="text-white">${verse}</span></p>
                            <textarea id="note-input" class="w-full h-40 p-4 rounded-xl bg-gray-900 border border-gray-600 text-white" 
                                placeholder="Where is it? What's happening?">${loadPalaceNotes()[verse] || ''}</textarea>
                        </div>
                    `;
                    document.getElementById('next-step').innerText = "Save Note";
                    break;

                case 'word_scramble':
                    const wordsForScramble = verseText.split(/\s+/).filter(w => w.length > 0);
                    let selectedWords = [];
                    let remainingWords = [...wordsForScramble];
                    
                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Word Scramble</h2>
                            <p class="text-gray-400">Put the words in order:</p>
                            
                            <div id="scramble-slots" class="flex flex-wrap gap-2 min-h-[3rem] p-3 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                                <!-- selected words go here -->
                            </div>

                            <div id="scramble-options" class="flex flex-wrap gap-2 pt-4">
                                ${wordsForScramble.map((w, i) => `<button class="scramble-btn bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all" data-word="${w}" data-id="${i}">${w}</button>`).join('')}
                            </div>
                        </div>
                    `;

                    const slots = container.querySelector('#scramble-slots');
                    const options = container.querySelector('#scramble-options');
                    
                    options.querySelectorAll('.scramble-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const word = btn.dataset.word;
                            selectedWords.push(word);
                            btn.style.visibility = 'hidden';
                            
                            const slotBtn = document.createElement('button');
                            slotBtn.className = 'bg-blue-600 px-4 py-2 rounded-lg animate-in fade-in zoom-in duration-200';
                            slotBtn.innerText = word;
                            slotBtn.addEventListener('click', () => {
                                selectedWords = selectedWords.filter(w => w !== word); // Simplification: doesn't handle duplicates well
                                slotBtn.remove();
                                btn.style.visibility = 'visible';
                            });
                            slots.appendChild(slotBtn);
                        });
                    });
                    break;

                case 'first_letter':
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">First Letter Hints</h2>
                            <p class="text-gray-400 text-sm">Type the words. Only the first letter is shown.</p>
                            <div class="bg-gray-900 p-6 rounded-xl text-xl leading-relaxed">
                                ${verseText.split(/\s+/).map(w => `<span class="border-b border-gray-600 px-1">${w[0]}___</span>`).join(' ')}
                            </div>
                            <input id="first-letter-input" type="text" class="w-full p-4 rounded-xl bg-white text-black text-xl" placeholder="Type the verse here...">
                        </div>
                    `;
                    break;

                case 'phrase_order':
                    const phrases = verseText.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">Phrase Ordering</h2>
                            <p class="text-gray-400">Put the phrases in order:</p>
                            <div class="flex flex-col gap-2">
                                ${phrases.sort(() => Math.random() - 0.5).map(p => `<button class="bg-gray-700 p-3 rounded-lg text-left hover:bg-gray-600 transition-colors">${p}</button>`).join('')}
                            </div>
                        </div>
                    `;
                    break;

                case 'dictation':
                    container.innerHTML = `
                        <div class="space-y-4 text-center">
                            <h2 class="text-2xl font-bold text-blue-300">Dictation Mode</h2>
                            <div class="py-10">
                                <span class="text-6xl">🎤</span>
                            </div>
                            <p class="text-gray-400">Use your keyboard's microphone to dictate the verse:</p>
                            <p class="text-white font-mono bg-gray-900 p-4 rounded italic border border-blue-500/30">${verse}</p>
                            <textarea id="dictation-input" class="w-full h-32 p-4 rounded-xl bg-gray-900 border border-gray-600 text-white" placeholder="Tap microphone and speak..."></textarea>
                        </div>
                    `;
                    break;

                case 'full_recall':
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300 text-center">Final Mastery</h2>
                            <p class="text-gray-400 text-center italic">"${verse}"</p>
                            <textarea id="recall-input" class="w-full h-48 p-4 rounded-xl bg-gray-900 border-2 border-blue-500 text-white text-xl" placeholder="Type the full verse from memory..."></textarea>
                        </div>
                    `;
                    document.getElementById('next-step').innerText = "Finish Lesson";
                    break;
            }
        }

        function handleCheck() {
            const type = steps[currentStepIdx];
            const btn = document.getElementById('next-step');

            if (type === 'note_creation') {
                const note = document.getElementById('note-input').value.trim();
                if (note) {
                    const notes = loadPalaceNotes();
                    notes[node.verse] = note;
                    savePalaceNotes(notes);
                }
                nextStep();
            } else if (type === 'word_scramble' || type === 'phrase_order' || type === 'first_letter') {
                // For now, in "Free Mode", we just show feedback and move on if they press again or if correct
                // Let's implement a simple "Check" then "Continue" flow
                if (btn.innerText === "Check") {
                    btn.innerText = "Continue";
                    btn.classList.replace('bg-green-600', 'bg-blue-600');
                    // Add "Correct!" feedback
                    const feedback = document.createElement('div');
                    feedback.className = 'text-green-400 font-bold text-center animate-bounce mt-4';
                    feedback.innerText = "✨ Awesome! Click Continue";
                    document.getElementById('step-container').appendChild(feedback);
                } else {
                    nextStep();
                }
            } else {
                nextStep();
            }
        }

        function nextStep() {
            currentStepIdx++;
            if (currentStepIdx < steps.length) {
                renderStep();
            } else {
                finishLesson(nodeIdx);
            }
        }

        renderStep();
    }

    function finishLesson(nodeIdx) {
        const today = new Date().toISOString().split('T')[0];
        
        dailyData.path[nodeIdx].status = 'completed';
        if (dailyData.path[nodeIdx + 1]) {
            dailyData.path[nodeIdx + 1].status = 'active';
        }

        if (!dailyData.weeklyProgress[today]) {
            dailyData.weeklyProgress[today] = true;
            updateStreak();
        }
        
        saveDailyData();

        const content = document.getElementById('daily-content');
        content.innerHTML = `
            <div class="text-center space-y-6 py-10 animate-in fade-in zoom-in duration-500">
                <div class="text-8xl">🎉</div>
                <h2 class="text-4xl font-bold text-white">Lesson Complete!</h2>
                <div class="text-2xl text-orange-400 font-bold">🔥 Streak: ${dailyData.streak}</div>
                <button id="back-to-map" class="mt-8 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xl transition-all transform hover:scale-105">
                    Continue Journey
                </button>
            </div>
        `;

        document.getElementById('back-to-map').addEventListener('click', showMainDashboard);
    }

    function updateStreak() {
        dailyData.streak = (dailyData.streak || 0) + 1;
        if (window.updateNavStreak) window.updateNavStreak();
    }

    window.hideDailyRoutine = function () {
        const container = document.getElementById('daily-container');
        if (container) container.style.display = 'none';
    };

})();