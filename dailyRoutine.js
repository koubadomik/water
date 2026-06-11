(function () {
    const DAILY_KEY = 'dailyRoutineData_v2'; 
    const PALACE_KEY = 'memoryPalaceNotes';
    const EMOJI_KEY = 'userCustomEmojis';

    // Emoji data for shortcodes
    const emojiData = {
        // Czech — top words from Revelation (Zj)
        "země": "🌍", "zemi": "🌍", "zem": "🌍",
        "nebe": "🌌", "nebi": "🌌",
        "hlas": "🔊", "hlasem": "🔊",
        "anděl": "😇", "anděla": "😇", "andělu": "😇", "andělů": "😇",
        "trůn": "🪑", "trůnu": "🪑", "trůnem": "🪑",
        "sedm": "7️⃣", "sedmi": "7️⃣",
        "tisíc": "🔢",
        "dvanáct": "🔢",
        "čtyři": "4️⃣",
        "první": "1️⃣",
        "moc": "⚡", "mocným": "⚡", "pravomoc": "⚡",
        "jméno": "📛",
        "město": "🏙️", "města": "🏙️",
        "moře": "🌊", "moři": "🌊",
        "krev": "🩸",
        "slunce": "☀️",
        "smrt": "💀",
        "šelma": "🐉", "šelmy": "🐉", "šelmě": "🐉",
        "drak": "🐉",
        "beránek": "🐑",
        "svitek": "📜", "svitku": "📜",
        "národy": "🌍",
        "kmene": "👥",
        "hvězd": "⭐", "hvězda": "⭐", "hvězdy": "⭐",
        "skutky": "🤲",
        "duch": "🕊️",
        "svědectví": "📜",
        "slávu": "🌟", "sláva": "🌟",
        "starších": "👴",
        "svatý": "✨", "svatých": "✨", "svatyně": "⛪",
        "amen": "🙏",
        "pán": "👑",
        "zvuk": "🔊",
        "bůh": "👑", "boha": "👑", "bohu": "👑", "boží": "👑",
        "slovo": "📖", "slova": "📖",
        "život": "🌱", "života": "🌱",
        "věky": "♾️", "věků": "♾️",
        "běda": "⚠️",
        "třetina": "3️⃣",
        "napiš": "✍️",
        "otevřel": "🚪",
        "uviděl": "👁️", "spatřil": "👁️", "viděl": "👁️",
        "uslyšel": "👂",
        "hle": "👁️",
        "seděl": "🪑", "sedí": "🪑",
        "vítězí": "🏆",
        "přijdu": "🚶",
        "uši": "👂",
        "veliký": "🔥", "veliké": "🔥", "veliká": "🔥",
        "čas": "⏳",
        "deset": "🔟",
        "vod": "💧",
        "padl": "⬇️",
        "slyš": "👂",
        "sboru": "⛪", "sborům": "⛪",
        "roh": "📯", "rohů": "📯",
        "lidé": "👥", "lidí": "👥", "lidi": "👥",
        "tři": "3️⃣", "třetí": "3️⃣",
        "dým": "🌫️",
        "proroctví": "📜",
        "všemohoucí": "⚡", "mocný": "⚡", "mocná": "⚡",
        "ostrý": "⚔️",
        "hlasy": "🔊",
        "živé": "🌱", "živých": "🌱",
        "bytosti": "🦁", "bytost": "🦁",
        "pane": "👑",
        "pečeť": "🔒",
        "zemětřesení": "🌋",
        "hněv": "⚡", "hněvu": "⚡",
        "zatroubil": "🎺",
        "bezedné": "🕳️", "propast": "🕳️", "propasti": "🕳️",
        "tělo": "🫀", "těla": "🫀",
        "cejch": "🔖",
        "srp": "🌾",
        "vylil": "🫗", "miska": "🫗", "misku": "🫗",
        "duchů": "🕊️",
        "král": "👑", "králů": "👑",
        "krví": "🩸",
        "tvář": "😊",
        "pokání": "🙏",
        "žena": "👩", "ženu": "👩",
        "očí": "👁️", "oko": "👁️",
        "čtyřiadvacet": "🔢",
        "andělé": "😇",
        "obraz": "🖼️", "obrazu": "🖼️"
    };

    let dailyData = loadDailyData();
    let customEmojis = loadCustomEmojis();

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

    function loadCustomEmojis() {
        try {
            return JSON.parse(localStorage.getItem(EMOJI_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveCustomEmojis() {
        localStorage.setItem(EMOJI_KEY, JSON.stringify(customEmojis));
    }

    function getNoteForVerse(vRef) {
        const notes = loadPalaceNotes();
        const match = vRef.match(/^(\w+)\s+(\d+):(\d+)$/);
        if (!match) return notes[vRef] || '';
        const book = match[1], ch = parseInt(match[2]) - 1, vIdx = parseInt(match[3]) - 1;
        const key = `${book}_${ch}`;
        return (notes[key] && notes[key][vIdx]) ? notes[key][vIdx] : '';
    }

    function setNoteForVerse(vRef, text) {
        const notes = loadPalaceNotes();
        const match = vRef.match(/^(\w+)\s+(\d+):(\d+)$/);
        if (!match) {
            notes[vRef] = text;
        } else {
            const book = match[1], ch = parseInt(match[2]) - 1, vIdx = parseInt(match[3]) - 1;
            const key = `${book}_${ch}`;
            if (!notes[key]) notes[key] = {};
            if (text) {
                notes[key][vIdx] = text;
            } else {
                delete notes[key][vIdx];
                if (Object.keys(notes[key]).length === 0) delete notes[key];
            }
        }
        savePalaceNotes(notes);
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

    window.initSymbolicLanguage = function () {
        const container = document.getElementById('symbolic-container');
        if (container) container.style.display = 'block';
        const content = document.getElementById('symbolic-content');
        
        content.innerHTML = `
            <div class="space-y-6 text-white">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-blue-400">Symbolic Language Design</h2>
                    <p class="text-gray-400">Create your own visual mnemonics for common words and phrases.</p>
                </div>
                
                <div class="bg-gray-700/50 p-6 rounded-2xl space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Enter a Reference or Text to help you design</label>
                        <div class="flex gap-2">
                            <input id="symbolic-ref-input" type="text" placeholder="e.g. Rv 14:1" class="flex-1 p-3 rounded bg-gray-900 border border-gray-600">
                            <button id="symbolic-load-btn" class="bg-blue-600 px-6 py-2 rounded font-bold">Load</button>
                        </div>
                    </div>
                </div>

                <div id="symbolic-design-area" class="hidden animate-in fade-in duration-500">
                    <!-- This will hold the emoji_setup interface -->
                </div>

                <div class="bg-gray-700/50 p-6 rounded-2xl space-y-4">
                    <h3 class="text-xl font-bold text-blue-300">Your Global Symbol Library</h3>
                    <div id="global-emoji-list" class="flex flex-wrap gap-3"></div>
                </div>
            </div>
        `;

        const refInput = content.querySelector('#symbolic-ref-input');
        const loadBtn = content.querySelector('#symbolic-load-btn');
        const designArea = content.querySelector('#symbolic-design-area');
        const globalList = content.querySelector('#global-emoji-list');

        function showExpressionUsages(expression) {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300';
            
            const modal = document.createElement('div');
            modal.className = 'bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl';
            
            const b = window.bible || (typeof bible !== 'undefined' ? bible : null);
            const bookKeys = b ? Object.keys(b) : [];
            
            modal.innerHTML = `
                <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h3 class="text-xl font-black text-white italic">Usages of "${expression}"</h3>
                        <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Search through the whole Bible</p>
                    </div>
                    <button id="close-usages-btn" class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">×</button>
                </div>
                
                <div class="p-4 bg-gray-800/30 border-b border-gray-800 flex gap-4 items-center">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Filter by Book</label>
                        <select id="usage-book-filter" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
                            <option value="all">All Books</option>
                            ${bookKeys.map(k => `<option value="${k}">${k}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pt-4">
                        <button id="search-usages-btn" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all">Search</button>
                    </div>
                </div>
                
                <div id="usages-results" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div class="text-center py-20 text-gray-600 italic">Select a book and click search...</div>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            const resultsDiv = modal.querySelector('#usages-results');
            const bookFilter = modal.querySelector('#usage-book-filter');
            const searchBtn = modal.querySelector('#search-usages-btn');
            const closeBtn = modal.querySelector('#close-usages-btn');
            
            const performSearch = () => {
                if (!b) {
                    resultsDiv.innerHTML = '<div class="text-red-400 text-center py-10">Bible not loaded yet.</div>';
                    return;
                }
                
                resultsDiv.innerHTML = '<div class="text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div><p class="text-gray-500">Searching...</p></div>';
                
                setTimeout(() => {
                    const selectedBook = bookFilter.value;
                    const results = [];
                    const searchStr = expression.toLowerCase();
                    
                    const targetBooks = selectedBook === 'all' ? bookKeys : [selectedBook];
                    
                    targetBooks.forEach(bookKey => {
                        const book = b[bookKey];
                        book.chapters.forEach((chapter, chIdx) => {
                            chapter.forEach((verseText, vIdx) => {
                                if (verseText.toLowerCase().includes(searchStr)) {
                                    results.push({
                                        ref: `${bookKey} ${chIdx + 1}:${vIdx + 1}`,
                                        text: verseText
                                    });
                                }
                            });
                        });
                    });
                    
                    if (results.length === 0) {
                        resultsDiv.innerHTML = `<div class="text-center py-20 text-gray-500 italic">No usages found for "${expression}" in ${selectedBook === 'all' ? 'the whole Bible' : selectedBook}.</div>`;
                    } else {
                        resultsDiv.innerHTML = `
                            <div class="text-xs text-gray-500 mb-4 uppercase tracking-widest font-bold">Found ${results.length} usages</div>
                            ${results.map(r => `
                                <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group usage-item" data-ref="${r.ref}">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="text-blue-400 font-black text-sm group-hover:text-blue-300 transition-colors">${r.ref}</span>
                                        <span class="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded uppercase font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">Load</span>
                                    </div>
                                    <p class="text-gray-300 text-sm leading-relaxed">${r.text.replace(new RegExp(`(${expression})`, 'gi'), '<span class="bg-yellow-500/20 text-yellow-200 px-0.5 rounded font-bold border-b border-yellow-500/50">$1</span>')}</p>
                                </div>
                            `).join('')}
                        `;
                        
                        resultsDiv.querySelectorAll('.usage-item').forEach(item => {
                            item.onclick = () => {
                                const refInput = document.getElementById('symbolic-ref-input');
                                if (refInput) {
                                    refInput.value = item.dataset.ref;
                                    document.getElementById('symbolic-load-btn').click();
                                    overlay.remove();
                                }
                            };
                        });
                    }
                }, 10);
            };
            
            searchBtn.onclick = performSearch;
            closeBtn.onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        }

        const updateGlobalList = () => {
            globalList.innerHTML = '';

            // ── Custom symbols ──
            const customEntries = Object.entries(customEmojis);
            const customSection = document.createElement('div');
            customSection.className = 'w-full space-y-2';
            customSection.innerHTML = `<p class="text-xs font-bold uppercase tracking-widest text-blue-400">Your symbols (${customEntries.length})</p>`;
            const customGrid = document.createElement('div');
            customGrid.className = 'flex flex-wrap gap-2';
            if (customEntries.length === 0) {
                customGrid.innerHTML = '<p class="text-gray-500 italic text-sm">No custom symbols yet.</p>';
            } else {
                customEntries.forEach(([phrase, emoji]) => {
                    const tag = document.createElement('div');
                    tag.className = 'bg-gray-900 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-blue-700 shadow group';
                    tag.innerHTML = `
                        <span class="font-bold text-blue-200 cursor-help underline decoration-dotted decoration-blue-500/30 hover:decoration-blue-500 text-sm" title="Click to see usages">${phrase}</span>
                        <span class="text-xl">${emoji}</span>
                        <button class="text-red-400 hover:text-red-300 text-lg leading-none" data-phrase="${phrase}">×</button>
                    `;
                    tag.querySelector('span').onclick = () => showExpressionUsages(phrase);
                    tag.querySelector('button').onclick = () => {
                        if (confirm(`Delete symbol for "${phrase}"?`)) {
                            delete customEmojis[phrase];
                            saveCustomEmojis();
                            updateGlobalList();
                            if (designArea.dataset.currentVerse) renderSetupInterface(designArea.dataset.currentVerse);
                        }
                    };
                    customGrid.appendChild(tag);
                });
            }
            customSection.appendChild(customGrid);
            globalList.appendChild(customSection);

            // ── Built-in dictionary ──
            const builtinSection = document.createElement('div');
            builtinSection.className = 'w-full space-y-2 mt-4';

            const builtinEntries = Object.entries(emojiData);
            const toggleId = 'builtin-toggle';
            builtinSection.innerHTML = `
                <button id="${toggleId}" class="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-200 flex items-center gap-1">
                    <span id="builtin-arrow">▶</span> Built-in dictionary (${builtinEntries.length})
                </button>
                <div id="builtin-grid" class="hidden flex-wrap gap-2"></div>
            `;
            globalList.appendChild(builtinSection);

            const builtinGrid = builtinSection.querySelector('#builtin-grid');
            builtinEntries.forEach(([phrase, emoji]) => {
                const tag = document.createElement('div');
                tag.className = 'bg-gray-900/60 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-700';
                tag.innerHTML = `
                    <span class="text-gray-300 text-sm cursor-help" title="Click to see usages">${phrase}</span>
                    <span class="text-xl">${emoji}</span>
                `;
                tag.querySelector('span').onclick = () => showExpressionUsages(phrase);
                builtinGrid.appendChild(tag);
            });

            builtinSection.querySelector(`#${toggleId}`).onclick = () => {
                const grid = builtinSection.querySelector('#builtin-grid');
                const arrow = builtinSection.querySelector('#builtin-arrow');
                const isHidden = grid.classList.toggle('hidden');
                grid.classList.toggle('flex', !isHidden);
                arrow.textContent = isHidden ? '▶' : '▼';
            };
        };

        const renderSetupInterface = (text, refLabel = '') => {
            designArea.dataset.currentVerse = text;
            designArea.classList.remove('hidden');
            const setupWords = text.split(/\s+/).filter(w => w.length > 0);
            let selectedIndices = [];

            const renderWords = () => {
                const wordsHtml = setupWords.map((w, i) => {
                    const isSelected = selectedIndices.includes(i);
                    
                    // Identify if this word is part of any mapping
                    let mappedEmoji = '';
                    let isMappingHead = false;
                    
                    // Priority: custom phrases → custom single word → built-in emojiData
                    const cleanToken = (s) => s.toLowerCase().replace(/[^\wÀ-ɏ\s'-]/g, '');
                    const sortedPhrases = Object.keys(customEmojis).sort((a,b) => b.length - a.length);
                    for (const phrase of sortedPhrases) {
                        const pWords = phrase.split(/\s+/);
                        for (let start = 0; start <= setupWords.length - pWords.length; start++) {
                            const segment = setupWords.slice(start, start + pWords.length).join(' ');
                            if (cleanToken(segment) === cleanToken(phrase)) {
                                if (i >= start && i < start + pWords.length) {
                                    mappedEmoji = customEmojis[phrase];
                                    if (i === start) isMappingHead = true;
                                    break;
                                }
                            }
                        }
                        if (mappedEmoji) break;
                    }
                    // Fall back to built-in dictionary for single words
                    if (!mappedEmoji) {
                        const wordClean = cleanToken(setupWords[i]).replace(/\s+/g, '');
                        mappedEmoji = emojiData[wordClean] || '';
                        if (mappedEmoji) isMappingHead = true;
                    }

                    return `
                        <div class="relative flex flex-col items-center">
                            ${isMappingHead ? `<span class="absolute -top-6 text-xl animate-bounce pointer-events-none">${mappedEmoji}</span>` : ''}
                            <button class="setup-word-btn px-4 py-2 rounded-xl border-2 ${isSelected ? 'bg-blue-600 border-blue-400 scale-110 z-10 shadow-lg shadow-blue-500/50' : mappedEmoji ? 'bg-gray-700/50 border-blue-500/50 text-blue-200' : 'bg-gray-800 border-gray-700'} hover:border-blue-400 transition-all text-lg font-medium relative" data-index="${i}">
                                ${w}
                                ${mappedEmoji && !isSelected ? `<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>` : ''}
                            </button>
                        </div>`;
                }).join('');

                designArea.innerHTML = `
                    <div class="bg-gray-800/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-8">
                        <div class="flex justify-between items-center border-b border-gray-700 pb-4">
                            <div>
                                <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Symbol Designer</h2>
                                <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">${refLabel ? 'Verse: ' + refLabel : 'Select words to bind an emoticon'}</p>
                            </div>
                            <button id="clear-selection-btn" class="px-4 py-2 rounded-full text-xs font-bold bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-700 transition-all border border-gray-700">RESET SELECTION</button>
                        </div>
                        
                        <div class="bg-gray-900/80 p-10 rounded-2xl leading-[3.5rem] flex flex-wrap gap-x-4 gap-y-8 items-center justify-center border border-black/20 inner-shadow">
                            ${wordsHtml}
                        </div>

                        <div id="emoji-mapping-interface" class="${selectedIndices.length > 0 ? '' : 'invisible h-0'} space-y-6 transition-all duration-500 ease-out">
                            <div class="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-3xl border border-blue-400/30 backdrop-blur-xl relative">
                                <div class="absolute top-0 right-0 p-4 opacity-10">
                                    <span class="text-8xl">✨</span>
                                </div>
                                
                                <div class="relative z-10 flex flex-col gap-6">
                                    <div class="text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <span class="text-gray-400 text-sm font-bold uppercase tracking-tighter">Current Selection</span>
                                            <button id="show-usages-btn" class="text-blue-400 hover:text-blue-300 transition-colors" title="Find other usages of this expression">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="mt-2 text-3xl font-black text-white italic tracking-tight break-words">
                                            "${selectedIndices.map(i => setupWords[i]).join(' ')}"
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-center gap-4">
                                        <div class="group relative">
                                            <input type="text" id="emoji-input" placeholder=":" 
                                                class="w-24 h-24 bg-gray-900 border-4 border-blue-500 rounded-[2rem] text-5xl text-center text-white focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all shadow-2xl">
                                            <div class="absolute -top-2 -right-2 bg-teal-500 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg italic">SHORTCODE</div>
                                            <!-- Emoji Autocomplete -->
                                            <div id="emoji-autocomplete" class="absolute bottom-full left-0 w-64 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 hidden overflow-hidden">
                                            </div>
                                        </div>
                                        
                                        <button id="save-emoji-btn" 
                                            class="h-24 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 px-10 rounded-[2rem] font-black text-xl text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3">
                                            <span>SAVE SYMBOL</span>
                                            <span class="text-2xl">⚡</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-center gap-2 text-gray-500">
                            <div class="w-12 h-[1px] bg-gray-700"></div>
                            <span class="text-[10px] font-bold uppercase tracking-[0.3em]">Mnemonic Dictionary</span>
                            <div class="w-12 h-[1px] bg-gray-700"></div>
                        </div>
                    </div>
                `;

                const emojiInput = designArea.querySelector('#emoji-input');
                const autocomplete = designArea.querySelector('#emoji-autocomplete');
                const saveEmojiBtn = designArea.querySelector('#save-emoji-btn');
                const clearBtn = designArea.querySelector('#clear-selection-btn');
                const showUsagesBtn = designArea.querySelector('#show-usages-btn');

                if (showUsagesBtn) {
                    showUsagesBtn.onclick = () => {
                        const expression = selectedIndices.map(i => setupWords[i]).join(' ');
                        showExpressionUsages(expression);
                    };
                }

                if (emojiInput) {
                    emojiInput.oninput = () => {
                        const val = emojiInput.value.trim();
                        if (val.startsWith(':') && val.length > 1) {
                            const query = val.substring(1).toLowerCase();
                            const matches = Object.entries(emojiData)
                                .filter(([k]) => k.includes(query))
                                .slice(0, 5);

                            if (matches.length > 0) {
                                autocomplete.innerHTML = matches.map(([k, e]) => `
                                    <div class="emoji-suggestion p-3 hover:bg-blue-600 cursor-pointer flex items-center justify-between border-b border-gray-800 last:border-0" data-emoji="${e}">
                                        <span class="text-gray-300 font-mono text-xs">:${k}:</span>
                                        <span class="text-2xl">${e}</span>
                                    </div>
                                `).join('');
                                autocomplete.classList.remove('hidden');
                                
                                autocomplete.querySelectorAll('.emoji-suggestion').forEach(item => {
                                    item.onclick = (e) => {
                                        e.stopPropagation();
                                        emojiInput.value = item.dataset.emoji;
                                        autocomplete.classList.add('hidden');
                                    };
                                });
                            } else {
                                autocomplete.classList.add('hidden');
                            }
                        } else {
                            autocomplete.classList.add('hidden');
                        }
                    };

                    // Hide autocomplete when clicking outside
                    document.addEventListener('click', (e) => {
                        if (autocomplete && !autocomplete.contains(e.target) && e.target !== emojiInput) {
                            autocomplete.classList.add('hidden');
                        }
                    });
                }

                designArea.querySelectorAll('.setup-word-btn').forEach(btn => {
                    btn.onclick = () => {
                        const idx = parseInt(btn.dataset.index);
                        if (selectedIndices.includes(idx)) {
                            selectedIndices = selectedIndices.filter(i => i !== idx);
                        } else {
                            if (selectedIndices.length > 0) {
                                const min = Math.min(...selectedIndices);
                                const max = Math.max(...selectedIndices);
                                if (idx === min - 1 || idx === max + 1) {
                                    selectedIndices.push(idx);
                                } else {
                                    // User wants a new selection
                                    selectedIndices = [idx];
                                }
                            } else {
                                selectedIndices.push(idx);
                            }
                            selectedIndices.sort((a,b) => a-b);
                        }
                        renderWords();
                    };
                });

                if (clearBtn) clearBtn.onclick = () => {
                    selectedIndices = [];
                    renderWords();
                };

                if (saveEmojiBtn) {
                    saveEmojiBtn.onclick = () => {
                        const emoji = emojiInput.value.trim();
                        const phrase = selectedIndices.map(i => setupWords[i]).join(' ');
                        if (emoji && phrase) {
                            customEmojis[phrase] = emoji;
                            saveCustomEmojis();
                            updateGlobalList();
                            selectedIndices = [];
                            renderWords();
                        }
                    };
                }
            };

            renderWords();
        };

        loadBtn.onclick = () => {
            const input = refInput.value.trim();
            if (!input) return;

            // Use global bible object if available
            const b = window.bible || (typeof bible !== 'undefined' ? bible : null);
            
            if (b) {
                // Improved reference parsing: Book Ch:Vs
                // Handles "Rv 14:1", "Rv14:1", "Revelation 14:1", "1 John 1:1"
                const refMatch = input.match(/^([1-3]?\s*[a-zA-Z]+)\s*(\d+):(\d+)$/);
                if (refMatch) {
                    let bookKey = refMatch[1].replace(/\s+/g, '');
                    const ch = parseInt(refMatch[2]);
                    const v = parseInt(refMatch[3]);

                    // Try to find the book in bible (case insensitive)
                    const actualBook = Object.keys(b).find(k => k.toLowerCase() === bookKey.toLowerCase());
                    
                    if (actualBook && b[actualBook].chapters[ch - 1]) {
                        const text = b[actualBook].chapters[ch - 1][v - 1];
                        if (text) {
                            renderSetupInterface(text, input);
                            return;
                        }
                    }
                }
            }
            // Fallback: just use input as raw text if not found as a reference
            renderSetupInterface(input);
        };

        updateGlobalList();
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
        const todayDate = new Date();
        const today = todayDate.toISOString().split('T')[0];

        const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const todayIdx = (todayDate.getDay() + 6) % 7;

        let weeklyHtml = '';
        weekdays.forEach((day, i) => {
            const isToday = i === todayIdx;
            const offset = i - todayIdx;
            const slotDate = new Date(todayDate);
            slotDate.setDate(todayDate.getDate() + offset);
            const slotStr = slotDate.toISOString().split('T')[0];
            const completed = !!dailyData.weeklyProgress[slotStr];
            weeklyHtml += `
                <div class="flex flex-col items-center gap-0.5">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-base
                        ${completed ? 'bg-orange-500 text-white' : (isToday ? 'border-2 border-blue-400 text-blue-400' : 'bg-gray-700 text-gray-500')}">
                        ${completed ? '🔥' : (isToday ? '😴' : day)}
                    </div>
                    <span class="text-[9px] uppercase font-bold text-gray-500">${day}</span>
                </div>
            `;
        });

        content.innerHTML = `
            <div class="space-y-8">
                <div class="grid grid-cols-7 items-center bg-gray-900/50 px-2 py-3 rounded-2xl">
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
                
                <div class="text-center flex flex-col items-center gap-4">
                    <button id="dev-mode" class="text-xs text-blue-500 underline hover:text-blue-300">Run Development Test (All Exercises)</button>
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

        document.getElementById('dev-mode').addEventListener('click', () => {
            const firstNode = dailyData.path[0] || { verse: "Rv 14:1" };
            const devNode = { ...firstNode, isDev: true };
            // Temporarily inject devNode or just call startLesson with a synthetic index/node
            // To make it clean, we'll just modify startLesson to handle a special case
            startLesson(-1); 
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
        let node;
        if (nodeIdx === -1) {
            // Synthetic node for dev mode
            const firstInPath = dailyData.path && dailyData.path.length > 0 ? dailyData.path[0] : { verse: "Rv 14:1", lessonIndex: 0 };
            node = { ...firstInPath, isDev: true };
        } else {
            node = dailyData.path[nodeIdx];
        }
        const content = document.getElementById('daily-content');
        
        // Exercise Pool
        const introExercises = ['word_scramble', 'first_letter', 'phrase_order', 'emoji_guess', 'multiple_choice', 'flashcard_flip', 'missing_word'];
        const practiceExercises = ['word_scramble', 'first_letter', 'phrase_order', 'dictation', 'emoji_guess', 'fill_blanks', 'reference_match', 'verse_matcher', 'missing_word', 'note_recall', 'spot_error'];
        const masteryExercises = ['dictation', 'full_recall', 'first_letter', 'phrase_order', 'emoji_guess', 'fill_blanks', 'reference_match', 'note_recall', 'spot_error'];

        // Development / Testing sequence
        const devExercises = [
            'context', 'word_scramble', 'first_letter', 'phrase_order',
            'emoji_guess', 'multiple_choice', 'fill_blanks', 'reference_match',
            'verse_matcher', 'flashcard_flip', 'dictation', 'full_recall',
            'missing_word', 'note_recall', 'spot_error'
        ];

        let steps = [];
        if (node.isDev) {
            steps = [...devExercises];
        } else {
            steps = ['context']; // Always start with context/browser
            // Determine how many extra exercises to add (total 5-10)
            const numExtra = Math.floor(Math.random() * 6) + 4; // 4 to 9 extra exercises

            let pool = [];
            if (node.lessonIndex === 0) {
                pool = introExercises;
            } else if (node.lessonIndex === 1) {
                pool = practiceExercises;
            } else {
                pool = masteryExercises;
            }

            for (let i = 0; i < numExtra; i++) {
                const randomEx = pool[Math.floor(Math.random() * pool.length)];
                steps.push(randomEx);
            }
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
            // Store verseText in the outer scope (of startLesson) to make it accessible to handleCheck
            window.currentVerseText = vArr ? vArr.join(' ') : "Verse text loading error";
            const verseText = window.currentVerseText;
            
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
                        const vNote = getNoteForVerse(vRef);

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
                                <div class="bg-blue-900/20 p-4 rounded-xl space-y-2">
                                    <div class="flex justify-between items-center">
                                        <h4 class="text-xs uppercase font-bold text-blue-400">Palace Note</h4>
                                        <button id="save-browser-note" class="text-xs bg-blue-600 px-2 py-1 rounded hidden">Save</button>
                                    </div>
                                    <textarea id="browser-note-input" class="w-full bg-transparent italic text-gray-300 border-none focus:ring-0 p-0 resize-none h-20" placeholder="Add note...">${vNote}</textarea>
                                </div>
                                <p class="text-xs text-center text-gray-500">Current target: <span class="text-white">${verse}</span></p>
                            </div>
                        `;

                        const noteInput = container.querySelector('#browser-note-input');
                        const saveBtn = container.querySelector('#save-browser-note');

                        noteInput.oninput = () => {
                            saveBtn.classList.remove('hidden');
                        };

                        saveBtn.onclick = () => {
                            const newNote = noteInput.value.trim();
                            setNoteForVerse(vRef, newNote);
                            saveBtn.classList.add('hidden');
                        };

                        container.querySelector('#prev-v').onclick = () => { if(idx > 0) renderBrowser(idx - 1); };
                        container.querySelector('#next-v').onclick = () => { if(idx < chapterVerses.length - 1) renderBrowser(idx + 1); };
                    };

                    renderBrowser(browserIndex);
                    document.getElementById('next-step').innerText = "Got it!";
                    break;

                case 'note_creation':
                    // We remove this from startLesson, but keep here just in case or if we want to re-add later
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">Create Palace Note</h2>
                            <p class="text-gray-400">Describe the scene for: <span class="text-white">${verse}</span></p>
                            <textarea id="note-input" class="w-full h-40 p-4 rounded-xl bg-gray-900 border border-gray-600 text-white" 
                                placeholder="Where is it? What's happening?">${getNoteForVerse(verse)}</textarea>
                        </div>
                    `;
                    document.getElementById('next-step').innerText = "Save Note";
                    break;

                case 'emoji_setup':
                    // Redirect to the new Symbolic Language app mode if this ever gets called
                    if (window.switchApp) window.switchApp('symbolic');
                    break;

                case 'emoji_guess':
                    const wordsForEmoji = verseText.split(/\s+/);

                    // Resolve emojis (Priority: Custom Phrases > Custom Words > Dictionary)
                    const resolvedEmojis = wordsForEmoji.map(() => null);
                    const usedIndices = new Set();

                    // Helper to clean word for matching
                    const cleanForMatch = (str) => str.replace(/[^\wÀ-ɏ'-]/g, '').toLowerCase();

                    // 1. Check custom phrases (multiple words)
                    const customPhrases = Object.entries(customEmojis)
                        .filter(([phrase]) => phrase.split(/\s+/).filter(w => w.length > 0).length > 1)
                        .sort((a, b) => b[0].length - a[0].length);

                    customPhrases.forEach(([phrase, emoji]) => {
                        const phraseWords = phrase.split(/\s+/).filter(w => w.length > 0);
                        const cleanPhraseWords = phraseWords.map(cleanForMatch);
                        
                        for (let i = 0; i <= wordsForEmoji.length - cleanPhraseWords.length; i++) {
                            // Check if any word in this range is already used
                            let anyUsed = false;
                            for (let j = 0; j < cleanPhraseWords.length; j++) {
                                if (usedIndices.has(i + j)) { anyUsed = true; break; }
                            }
                            if (anyUsed) continue;

                            let match = true;
                            for (let j = 0; j < cleanPhraseWords.length; j++) {
                                if (cleanForMatch(wordsForEmoji[i + j]) !== cleanPhraseWords[j]) {
                                    match = false;
                                    break;
                                }
                            }
                            if (match) {
                                for (let j = 0; j < cleanPhraseWords.length; j++) {
                                    resolvedEmojis[i + j] = { emoji, isStart: j === 0, isEnd: j === cleanPhraseWords.length - 1, phrase };
                                    usedIndices.add(i + j);
                                }
                            }
                        }
                    });

                    // 2. Check custom single words
                    wordsForEmoji.forEach((w, i) => {
                        if (usedIndices.has(i)) return;
                        const clean = cleanForMatch(w);
                        if (!clean) return;
                        
                        // Look for a custom mapping that cleans to the same thing
                        const customMatch = Object.keys(customEmojis).find(k => {
                            const kClean = cleanForMatch(k);
                            return kClean === clean && kClean.length > 0;
                        });

                        if (customMatch) {
                            resolvedEmojis[i] = { emoji: customEmojis[customMatch], isStart: true, isEnd: true };
                            usedIndices.add(i);
                        }
                    });

                    // 3. Fallback to hand-coded emojiData
                    wordsForEmoji.forEach((w, i) => {
                        if (usedIndices.has(i)) return;
                        const clean = cleanForMatch(w);
                        if (!clean) return;

                        const emoji = emojiData[clean];
                        if (emoji) {
                            resolvedEmojis[i] = { emoji, isStart: true, isEnd: true };
                            usedIndices.add(i);
                        }
                    });

                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">Symbolic Reveal</h2>
                            <p class="text-gray-400 text-sm">Translate emoticons into words. Tap emoticons to reveal.</p>
                            <div id="emoji-reveal-container" class="bg-gray-900 p-6 rounded-xl text-2xl leading-relaxed flex flex-wrap justify-center gap-4 min-h-[150px] items-center">
                                ${wordsForEmoji.map((w, i) => {
                                    const res = resolvedEmojis[i];
                                    const displayEmoji = res ? res.emoji : '';
                                    const isPart = res && !res.isStart;
                                    
                                    if (isPart) return ''; // Skip rendering individual parts of a phrase

                                    // If it's a phrase, collect all words
                                    let displayWords = w;
                                    let count = 1;
                                    if (res && res.phrase) {
                                        const pWords = res.phrase.split(/\s+/).filter(pw => pw.length > 0);
                                        count = pWords.length;
                                        displayWords = wordsForEmoji.slice(i, i + count).join(' ');
                                    }

                                    // Words without an emoji stay visible; words with an emoji are hidden behind it
                                    if (!res) {
                                        return `<span class="text-white text-lg font-mono px-1">${displayWords}</span>`;
                                    }

                                    const emojiShortcode = Object.keys(emojiData).find(key => emojiData[key] === displayEmoji);
                                    const emojiTitle = emojiShortcode ? `:${emojiShortcode}:` : '';

                                    return `<button class="emoji-word-reveal flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-800 transition-colors" data-index="${i}" data-count="${count}" title="${emojiTitle}">
                                        <span class="emoji-icon text-4xl h-10 flex items-center justify-center">${displayEmoji}</span>
                                        <span class="reveal-text text-sm text-transparent font-mono border-t border-gray-700 pt-1">${displayWords.split(' ').map(dw => (dw[0] || '') + '___').join(' ')}</span>
                                    </button>`;
                                }).join('')}
                            </div>
                            <div class="flex justify-center pt-4">
                                <button id="reveal-all-btn" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all">Reveal All Symbols</button>
                            </div>
                        </div>
                    `;

                    const revealAllBtn = container.querySelector('#reveal-all-btn');
                    const wordButtons = container.querySelectorAll('.emoji-word-reveal');

                    wordButtons.forEach(btn => {
                        btn.onclick = () => {
                            const baseIdx = parseInt(btn.dataset.index);
                            const count = parseInt(btn.dataset.count);
                            const textSpan = btn.querySelector('.reveal-text');
                            
                            textSpan.innerText = wordsForEmoji.slice(baseIdx, baseIdx + count).join(' ');
                            textSpan.classList.remove('text-transparent');
                            textSpan.classList.add('text-blue-300');
                            btn.classList.add('bg-gray-800');
                        };
                    });

                    revealAllBtn.onclick = () => {
                        wordButtons.forEach(btn => btn.click());
                        revealAllBtn.disabled = true;
                        revealAllBtn.innerText = "All revealed!";
                        revealAllBtn.classList.replace('bg-blue-600', 'bg-gray-600');
                    };
                    break;

                case 'word_scramble':
                    const wordsForScramble = verseText.split(/\s+/).filter(w => w.length > 0);
                    let shuffledWords = [...wordsForScramble].sort(() => Math.random() - 0.5);
                    let selectedWords = [];
                    window.currentSelectedWords = selectedWords;
                    
                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Word Scramble</h2>
                            <p class="text-gray-400">Put the words in order:</p>
                            
                            <div id="scramble-slots" class="flex flex-wrap gap-2 min-h-[3rem] p-3 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                                <!-- selected words go here -->
                            </div>

                            <div id="scramble-options" class="flex flex-wrap gap-2 pt-4">
                                ${shuffledWords.map((w, i) => `<button class="scramble-btn bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all" data-word="${w.replace(/"/g, '&quot;')}" data-id="${i}">${w}</button>`).join('')}
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
                            btn.disabled = true;
                            
                            const slotBtn = document.createElement('button');
                            slotBtn.className = 'bg-blue-600 px-4 py-2 rounded-lg animate-in fade-in zoom-in duration-200';
                            slotBtn.innerText = word;
                            slotBtn.onclick = () => {
                                const idx = selectedWords.lastIndexOf(word);
                                if (idx > -1) selectedWords.splice(idx, 1);
                                slotBtn.remove();
                                btn.style.visibility = 'visible';
                                btn.disabled = false;
                            };
                            slots.appendChild(slotBtn);
                        });
                    });
                    break;

                case 'first_letter':
                    const wordsForReveal = verseText.split(/\s+/);
                    let revealIdx = 0;
                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">First Letter Reveal</h2>
                            <p class="text-gray-400 text-sm">Tap "Reveal Next" to show the words. Try to say them before tapping!</p>
                            <div id="reveal-container" class="bg-gray-900 p-6 rounded-xl text-xl leading-relaxed flex flex-wrap gap-2">
                                ${wordsForReveal.map((w, i) => `<span class="reveal-word border-b border-gray-700 px-1 text-gray-700" data-index="${i}">${w[0]}___</span>`).join(' ')}
                            </div>
                            <button id="reveal-btn" class="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xl transition-all">Reveal Next Word</button>
                        </div>
                    `;
                    const revealBtn = container.querySelector('#reveal-btn');
                    revealBtn.onclick = () => {
                        const wordSpan = container.querySelector(`.reveal-word[data-index="${revealIdx}"]`);
                        if (wordSpan) {
                            wordSpan.innerText = wordsForReveal[revealIdx];
                            wordSpan.classList.remove('text-gray-700', 'border-gray-700');
                            wordSpan.classList.add('text-white', 'border-blue-500', 'animate-in', 'fade-in', 'zoom-in', 'duration-200');
                            revealIdx++;
                        }
                        if (revealIdx >= wordsForReveal.length) {
                            revealBtn.disabled = true;
                            revealBtn.innerText = "All words revealed!";
                            revealBtn.classList.replace('bg-blue-600', 'bg-gray-600');
                        }
                    };
                    break;

                case 'phrase_order':
                    const phrases = verseText.split(/[,.;:]/).map(s => s.trim()).filter(s => s.length > 0);
                    let finalPhrases = [];
                    if (phrases.length < 6) {
                        // Split longer phrases to reach 6-12
                        phrases.forEach(p => {
                            const words = p.split(' ');
                            if (words.length > 4) {
                                const mid = Math.ceil(words.length / 2);
                                finalPhrases.push(words.slice(0, mid).join(' '));
                                finalPhrases.push(words.slice(mid).join(' '));
                            } else {
                                finalPhrases.push(p);
                            }
                        });
                    } else {
                        finalPhrases = phrases;
                    }
                    
                    let shuffledPhrases = [...finalPhrases].sort(() => Math.random() - 0.5);
                    let selectedPhrases = [];
                    window.currentSelectedPhrases = selectedPhrases;

                    container.innerHTML = `
                        <div class="space-y-4">
                            <h2 class="text-2xl font-bold text-blue-300">Phrase Ordering</h2>
                            <p class="text-gray-400">Assemble the verse by selecting phrases in order:</p>
                            <div id="phrase-slots" class="flex flex-col gap-2 min-h-[4rem] p-3 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                            </div>
                            <div id="phrase-options" class="flex flex-col gap-2 pt-4">
                                ${shuffledPhrases.map((p, i) => `<button class="phrase-btn bg-gray-700 p-3 rounded-lg text-left hover:bg-gray-600 transition-all" data-phrase="${p.replace(/"/g, '&quot;')}" data-id="${i}">${p}</button>`).join('')}
                            </div>
                        </div>
                    `;

                    const pSlots = container.querySelector('#phrase-slots');
                    const pOptions = container.querySelector('#phrase-options');

                    pOptions.querySelectorAll('.phrase-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const phrase = btn.dataset.phrase;
                            selectedPhrases.push(phrase);
                            btn.style.display = 'none';
                            btn.disabled = true;

                            const slotBtn = document.createElement('button');
                            slotBtn.className = 'bg-blue-600 p-3 rounded-lg text-left animate-in fade-in slide-in-from-bottom-2 duration-200';
                            slotBtn.innerText = phrase;
                            slotBtn.onclick = () => {
                                const idx = selectedPhrases.lastIndexOf(phrase);
                                if (idx > -1) selectedPhrases.splice(idx, 1);
                                slotBtn.remove();
                                btn.style.display = 'block';
                                btn.disabled = false;
                            };
                            pSlots.appendChild(slotBtn);
                        });
                    });
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

                case 'multiple_choice':
                    const goalVerses = dailyData.path.map(n => n.verse);
                    const uniqueGoalVerses = [...new Set(goalVerses)].filter(v => v !== verse);
                    const distractors = uniqueGoalVerses.sort(() => 0.5 - Math.random()).slice(0, 2);
                    
                    // Fallback to chapter if goal is too small
                    if (distractors.length < 2) {
                        const chapterVerses = getChapterVerses().filter(v => v !== verse && !uniqueGoalVerses.includes(v));
                        distractors.push(...chapterVerses.sort(() => 0.5 - Math.random()).slice(0, 2 - distractors.length));
                    }
                    
                    const referenceToText = (ref) => {
                        const parsed = parseReference(ref);
                        return parsed ? parsed.join(' ') : "";
                    };

                    let choices = [verseText, ...distractors.map(v => referenceToText(v))].filter(c => c !== "").sort(() => 0.5 - Math.random());

                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Multiple Choice</h2>
                            <p class="text-gray-400">Which is the correct text for <span class="text-white">${verse}</span>?</p>
                            <div class="flex flex-col gap-4">
                                ${choices.map(c => `<button class="choice-btn bg-gray-800 p-4 rounded-xl text-left hover:bg-gray-700 transition-all border border-transparent" data-text="${c.replace(/"/g, '&quot;')}">${c}</button>`).join('')}
                            </div>
                        </div>
                    `;
                    container.querySelectorAll('.choice-btn').forEach(btn => {
                        btn.onclick = () => {
                            container.querySelectorAll('.choice-btn').forEach(b => {
                                b.classList.remove('border-blue-500', 'bg-blue-900/40');
                                delete b.dataset.selected;
                            });
                            btn.classList.add('border-blue-500', 'bg-blue-900/40');
                            btn.dataset.selected = "true";
                        };
                    });
                    break;

                case 'fill_blanks':
                    const wordsForBlanks = verseText.split(/\s+/);
                    const blankIndices = [];
                    const numBlanks = Math.max(3, Math.min(7, Math.floor(wordsForBlanks.length * 0.4)));
                    
                    while(blankIndices.length < numBlanks) {
                        const r = Math.floor(Math.random() * wordsForBlanks.length);
                        const word = wordsForBlanks[r].replace(/[^\w]/g, '');
                        if(!blankIndices.includes(r) && word.length > 1) blankIndices.push(r);
                        if (blankIndices.length >= wordsForBlanks.length) break; 
                    }
                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Fill in the Blanks</h2>
                            <div class="bg-gray-900 p-6 rounded-xl text-xl leading-relaxed">
                                ${wordsForBlanks.map((w, i) => {
                                    if (blankIndices.includes(i)) {
                                        const clean = w.replace(/[^\w]/g, '');
                                        const width = Math.max(4, clean.length) * 1.2;
                                        return `<input type="text" class="blank-input bg-transparent border-b-2 border-blue-500 focus:outline-none text-center" style="width: ${width}ch" data-answer="${clean.toLowerCase()}">`;
                                    }
                                    return w;
                                }).join(' ')}
                            </div>
                        </div>
                    `;
                    break;

                case 'reference_match':
                    const otherRefs = getChapterVerses().filter(v => v !== verse).sort(() => 0.5 - Math.random()).slice(0, 2);
                    let refChoices = [verse, ...otherRefs].sort(() => 0.5 - Math.random());
                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Reference Match</h2>
                            <p class="text-gray-400 italic">"${verseText}"</p>
                            <p class="text-sm text-blue-400">Which reference is this?</p>
                            <div class="grid grid-cols-1 gap-4">
                                ${refChoices.map(r => `<button class="ref-choice-btn bg-gray-800 p-4 rounded-xl text-center hover:bg-gray-700 transition-all border border-transparent font-bold text-xl" data-ref="${r}">${r}</button>`).join('')}
                            </div>
                        </div>
                    `;
                    container.querySelectorAll('.ref-choice-btn').forEach(btn => {
                        btn.onclick = () => {
                            container.querySelectorAll('.ref-choice-btn').forEach(b => {
                                b.classList.remove('border-blue-500', 'bg-blue-900/40');
                                delete b.dataset.selected;
                            });
                            btn.classList.add('border-blue-500', 'bg-blue-900/40');
                            btn.dataset.selected = "true";
                        };
                    });
                    break;

                case 'verse_matcher':
                    const vWords = verseText.split(/\s+/);
                    const half = Math.floor(vWords.length / 2);
                    const part1 = vWords.slice(0, half).join(' ');
                    const part2 = vWords.slice(half).join(' ');
                    
                    const decoyVerse = getChapterVerses().filter(v => v !== verse)[0] || verse;
                    const dWords = parseReference(decoyVerse).join(' ').split(/\s+/);
                    const dPart2 = dWords.slice(Math.floor(dWords.length/2)).join(' ');

                    let parts2 = [part2, dPart2].sort(() => 0.5 - Math.random());

                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Verse Matcher</h2>
                            <p class="text-gray-400 text-sm">Match the beginning with the correct ending:</p>
                            <div class="bg-gray-900 p-4 rounded-xl border border-blue-500/30 mb-4">
                                <span class="text-white">${part1}...</span>
                            </div>
                            <div class="flex flex-col gap-4">
                                ${parts2.map(p => `<button class="match-btn bg-gray-800 p-4 rounded-xl text-left hover:bg-gray-700 transition-all border border-transparent" data-text="${p.replace(/"/g, '&quot;')}">...${p}</button>`).join('')}
                            </div>
                        </div>
                    `;
                    container.querySelectorAll('.match-btn').forEach(btn => {
                        btn.onclick = () => {
                            container.querySelectorAll('.match-btn').forEach(b => {
                                b.classList.remove('border-blue-500', 'bg-blue-900/40');
                                delete b.dataset.selected;
                            });
                            btn.classList.add('border-blue-500', 'bg-blue-900/40');
                            btn.dataset.selected = "true";
                        };
                    });
                    break;

                case 'flashcard_flip':
                    const allGoalVerses = [...new Set(dailyData.path.map(n => n.verse))];
                    const randomVerse = allGoalVerses[Math.floor(Math.random() * allGoalVerses.length)];
                    const randomVerseTextArr = parseReference(randomVerse);
                    const randomVerseText = randomVerseTextArr ? randomVerseTextArr.join(' ') : "...";
                    const randomVerseNote = getNoteForVerse(randomVerse);

                    container.innerHTML = `
                        <div class="space-y-6 flex flex-col items-center">
                            <h2 class="text-2xl font-bold text-blue-300">Flashcard Recall</h2>
                            <div id="flashcard" class="w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center p-6 text-center shadow-xl cursor-pointer transition-all duration-500 transform hover:scale-105 border-2 border-blue-500/30">
                                <div id="card-content" class="text-2xl font-bold text-white">${randomVerse}</div>
                            </div>
                            <p class="text-gray-500 text-sm">Tap the card to flip and reveal the text & note.</p>
                        </div>
                    `;
                    const card = container.querySelector('#flashcard');
                    const cardContent = container.querySelector('#card-content');
                    let flipped = false;
                    card.onclick = () => {
                        flipped = !flipped;
                        card.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0)';
                        setTimeout(() => {
                            if (flipped) {
                                cardContent.style.transform = 'rotateY(180deg)';
                                cardContent.innerHTML = `
                                    <div class="text-lg font-normal mb-2">${randomVerseText}</div>
                                    <div class="text-sm italic text-blue-300 border-t border-gray-600 pt-2">${randomVerseNote || 'No note yet'}</div>
                                `;
                            } else {
                                cardContent.style.transform = 'rotateY(0)';
                                cardContent.innerHTML = randomVerse;
                            }
                        }, 250);
                    };
                    break;

                case 'missing_word': {
                    const mwWords = verseText.split(/\s+/).filter(w => w.length > 0);
                    const mwContent = mwWords
                        .map((w, i) => ({ raw: w, clean: w.replace(/[^\w]/g, ''), i }))
                        .filter(x => x.clean.length > 3);
                    const mwTarget = mwContent[Math.floor(Math.random() * mwContent.length)];
                    window.currentMissingWord = mwTarget ? mwTarget.clean : '';

                    const mwDisplay = mwWords.map((w, i) =>
                        mwTarget && i === mwTarget.i
                            ? '<span class="text-blue-300 font-bold border-b-2 border-blue-400 px-2 mx-1">[?]</span>'
                            : w
                    ).join(' ');

                    const mwDistractors = mwContent
                        .filter(x => mwTarget && x.i !== mwTarget.i && x.clean.toLowerCase() !== mwTarget.clean.toLowerCase())
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 3)
                        .map(x => x.clean);

                    const mwChoices = [mwTarget ? mwTarget.clean : ''].concat(mwDistractors).filter(Boolean).sort(() => 0.5 - Math.random());

                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Missing Word</h2>
                            <p class="text-gray-400 text-sm">Which word fills the gap?</p>
                            <div class="bg-gray-900 p-6 rounded-xl text-xl leading-relaxed">${mwDisplay}</div>
                            <div class="grid grid-cols-2 gap-3">
                                ${mwChoices.map(c => `<button class="missing-choice bg-gray-800 p-4 rounded-xl font-bold text-lg hover:bg-gray-700 border border-transparent transition-all" data-word="${c.replace(/"/g, '&quot;')}">${c}</button>`).join('')}
                            </div>
                        </div>
                    `;
                    container.querySelectorAll('.missing-choice').forEach(btn => {
                        btn.onclick = () => {
                            container.querySelectorAll('.missing-choice').forEach(b => {
                                b.classList.remove('border-blue-500', 'bg-blue-900/40');
                                delete b.dataset.selected;
                            });
                            btn.classList.add('border-blue-500', 'bg-blue-900/40');
                            btn.dataset.selected = 'true';
                        };
                    });
                    break;
                }

                case 'note_recall': {
                    const nrNote = getNoteForVerse(node.verse);
                    container.innerHTML = nrNote ? `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Palace Note Recall</h2>
                            <p class="text-gray-400 text-sm">You wrote this memory cue — now recall the verse:</p>
                            <div class="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl italic text-gray-200 text-lg leading-relaxed">"${nrNote}"</div>
                            <p class="text-xs text-center text-gray-500">Reference: <span class="text-white font-bold">${node.verse}</span></p>
                            <textarea id="note-recall-input" class="w-full h-32 p-4 rounded-xl bg-gray-900 border-2 border-blue-500 text-white text-lg" placeholder="Type the verse from memory..."></textarea>
                        </div>
                    ` : `
                        <div class="space-y-4 text-center py-6">
                            <div class="text-5xl">📝</div>
                            <h2 class="text-2xl font-bold text-blue-300">Palace Note Recall</h2>
                            <p class="text-gray-400">No memory note yet for <span class="text-white">${node.verse}</span>.</p>
                            <p class="text-gray-500 text-sm">Add one in the Context step to unlock this exercise fully.</p>
                            <textarea id="note-recall-input" class="w-full h-32 p-4 rounded-xl bg-gray-900 border border-gray-600 text-white" placeholder="Type the verse anyway..."></textarea>
                        </div>
                    `;
                    break;
                }

                case 'spot_error': {
                    const seWords = verseText.split(/\s+/).filter(w => w.length > 0);
                    const seContent = seWords.map((w, i) => ({ w, i })).filter(x => x.w.replace(/[^\w]/g, '').length > 3);
                    const seTarget = seContent[Math.floor(Math.random() * seContent.length)];

                    let seIntruder = null;
                    for (const cv of getChapterVerses().filter(v => v !== verse).sort(() => 0.5 - Math.random())) {
                        const cvArr = parseReference(cv);
                        if (!cvArr) continue;
                        const cvWords = cvArr.join(' ').split(/\s+/).filter(w => w.replace(/[^\w]/g, '').length > 3);
                        const novel = cvWords.find(cw => !seWords.some(sw => sw.replace(/[^\w]/g, '').toLowerCase() === cw.replace(/[^\w]/g, '').toLowerCase()));
                        if (novel) { seIntruder = novel.replace(/[^\w]/g, ''); break; }
                    }

                    const seHasError = !!(seTarget && seIntruder);
                    window.currentSpotError = seHasError ? seTarget.i : null;
                    window.spotErrorFound = !seHasError;

                    const seDisplay = seHasError
                        ? seWords.map((w, i) => i === seTarget.i ? seIntruder : w)
                        : seWords;

                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Spot the Error</h2>
                            <p class="text-gray-400 text-sm">One word has been swapped out. Tap the intruder.</p>
                            <div class="bg-gray-900 p-6 rounded-xl text-xl leading-relaxed flex flex-wrap gap-2">
                                ${seDisplay.map((w, i) => `<button class="spot-word px-2 py-1 rounded border border-transparent hover:bg-gray-700 transition-all" data-index="${i}">${w}</button>`).join('')}
                            </div>
                            <div id="spot-feedback" class="text-center min-h-[1.5rem]"></div>
                        </div>
                    `;
                    container.querySelectorAll('.spot-word').forEach(btn => {
                        btn.onclick = () => {
                            container.querySelectorAll('.spot-word').forEach(b => {
                                b.classList.remove('bg-red-900/40', 'border-red-500', 'bg-green-900/40', 'border-green-500');
                            });
                            const clicked = parseInt(btn.dataset.index);
                            const fb = document.getElementById('spot-feedback');
                            if (seHasError && clicked === seTarget.i) {
                                btn.classList.add('bg-green-900/40', 'border-green-500');
                                fb.innerHTML = `<span class="text-green-400 font-bold">✓ That's the intruder!</span>`;
                                window.spotErrorFound = true;
                            } else {
                                btn.classList.add('bg-red-900/40', 'border-red-500');
                                fb.innerHTML = `<span class="text-orange-400 font-bold">✗ Not quite — keep looking.</span>`;
                            }
                        };
                    });
                    break;
                }

                case 'keyword_focus':
                    const words = verseText.split(/\s+/);
                    container.innerHTML = `
                        <div class="space-y-6">
                            <h2 class="text-2xl font-bold text-blue-300">Keyword Identification</h2>
                            <p class="text-gray-400">Select the most important words (nouns, verbs, names):</p>
                            <div class="bg-gray-900 p-6 rounded-xl flex flex-wrap gap-2 leading-relaxed">
                                ${words.map((w, i) => `<button class="keyword-btn px-2 rounded hover:bg-gray-700 transition-all border border-transparent" data-index="${i}">${w}</button>`).join(' ')}
                            </div>
                        </div>
                    `;
                    container.querySelectorAll('.keyword-btn').forEach(btn => {
                        btn.onclick = () => {
                            btn.classList.toggle('bg-blue-600');
                            btn.classList.toggle('text-white');
                        };
                    });
                    break;
            }
        }

        function handleCheck() {
            const type = steps[currentStepIdx];
            const btn = document.getElementById('next-step');

            if (type === 'note_creation' || type === 'context') {
                if (type === 'note_creation') {
                    const note = document.getElementById('note-input').value.trim();
                    setNoteForVerse(node.verse, note);
                } else if (type === 'context') {
                    // Also check if there's an unsaved note in the browser
                    const browserNoteInput = document.getElementById('browser-note-input');
                    const saveBtn = document.getElementById('save-browser-note');
                    if (browserNoteInput && saveBtn && !saveBtn.classList.contains('hidden')) {
                         const vRef = document.querySelector('.text-blue-400.font-bold').innerText;
                         setNoteForVerse(vRef, browserNoteInput.value.trim());
                    }
                }
                nextStep();
            } else if (['word_scramble', 'phrase_order', 'first_letter', 'emoji_guess', 'dictation', 'full_recall',
                        'multiple_choice', 'fill_blanks', 'reference_match', 'verse_matcher', 'flashcard_flip', 'keyword_focus',
                        'missing_word', 'note_recall', 'spot_error'].includes(type)) {
                if (btn.innerText === "Check" || btn.innerText === "Finish Lesson" || btn.innerText === "Save Note" || btn.innerText === "Got it!") {
                    
                    // Add simple visual feedback based on type
                    let isCorrect = true;
                    let feedbackMsg = "✨ Awesome! Click Continue";
                    const verseText = window.currentVerseText;
                    
                    if (type === 'multiple_choice') {
                        const selected = document.querySelector('.choice-btn[data-selected="true"]');
                        if (!selected || selected.dataset.text.trim() !== verseText.trim()) isCorrect = false;
                    } else if (type === 'emoji_setup') {
                        isCorrect = true; // Setup is always correct if they move forward
                        feedbackMsg = "✨ Symbols saved!";
                    } else if (type === 'reference_match') {
                        const selected = document.querySelector('.ref-choice-btn[data-selected="true"]');
                        if (!selected || selected.dataset.ref !== node.verse) isCorrect = false;
                    } else if (type === 'verse_matcher') {
                        const vWords = verseText.split(/\s+/);
                        const part2 = vWords.slice(Math.floor(vWords.length / 2)).join(' ');
                        const selected = document.querySelector('.match-btn[data-selected="true"]');
                        if (!selected || selected.dataset.text.trim() !== part2.trim()) isCorrect = false;
                    } else if (type === 'fill_blanks') {
                        document.querySelectorAll('.blank-input').forEach(input => {
                            if (input.value.trim().toLowerCase() !== input.dataset.answer) isCorrect = false;
                        });
                    } else if (type === 'word_scramble') {
                        const wordsForScramble = verseText.split(/\s+/).filter(w => w.length > 0);
                        const selectedWords = window.currentSelectedWords || [];
                        if (selectedWords.length !== wordsForScramble.length) {
                            isCorrect = false;
                        } else {
                            for(let i=0; i<wordsForScramble.length; i++) {
                                if (selectedWords[i] !== wordsForScramble[i]) {
                                    isCorrect = false;
                                    break;
                                }
                            }
                        }
                    } else if (type === 'phrase_order') {
                        // Re-calculate the expected phrases (consistent with loadStepContent)
                        const phrases = verseText.split(/[,.;:]/).map(s => s.trim()).filter(s => s.length > 0);
                        let finalPhrases = [];
                        if (phrases.length < 6) {
                            phrases.forEach(p => {
                                const words = p.split(' ');
                                if (words.length > 4) {
                                    const mid = Math.ceil(words.length / 2);
                                    finalPhrases.push(words.slice(0, mid).join(' '));
                                    finalPhrases.push(words.slice(mid).join(' '));
                                } else {
                                    finalPhrases.push(p);
                                }
                            });
                        } else {
                            finalPhrases = phrases;
                        }

                        const selectedPhrases = window.currentSelectedPhrases || [];
                        if (selectedPhrases.length !== finalPhrases.length) {
                            isCorrect = false;
                        } else {
                            for(let i=0; i<finalPhrases.length; i++) {
                                if (selectedPhrases[i] !== finalPhrases[i]) {
                                    isCorrect = false;
                                    break;
                                }
                            }
                        }
                    } else if (type === 'emoji_guess') {
                        const wordsForEmoji = verseText.split(/\s+/);
                        const revealBtn = document.getElementById('emoji-reveal-btn');
                        if (!revealBtn || !revealBtn.disabled) {
                            isCorrect = false;
                            feedbackMsg = "⚠️ Reveal all words first!";
                        }
                    } else if (type === 'first_letter') {
                        const revealBtn = document.getElementById('reveal-btn');
                        if (!revealBtn || !revealBtn.disabled) {
                            isCorrect = false;
                            feedbackMsg = "⚠️ Reveal all words first!";
                        }
                    } else if (type === 'full_recall') {
                        const val = document.getElementById('recall-input').value.trim();
                        if (val.length < 10) isCorrect = false;
                    } else if (type === 'dictation') {
                        const val = document.getElementById('dictation-input').value.trim();
                        if (val.length < 5) isCorrect = false;
                    } else if (type === 'missing_word') {
                        const selected = document.querySelector('.missing-choice[data-selected="true"]');
                        if (!selected || selected.dataset.word !== window.currentMissingWord) isCorrect = false;
                    } else if (type === 'note_recall') {
                        const val = document.getElementById('note-recall-input')?.value.trim();
                        if (!val || val.length < 10) isCorrect = false;
                    } else if (type === 'spot_error') {
                        if (!window.spotErrorFound) {
                            isCorrect = false;
                            feedbackMsg = "⚠️ Find the intruder word first!";
                        }
                    }

                    const feedback = document.createElement('div');
                    feedback.className = isCorrect ? 'text-green-400 font-bold text-center animate-bounce mt-4' : 'text-orange-400 font-bold text-center animate-pulse mt-4';
                    feedback.innerText = isCorrect ? feedbackMsg : (feedbackMsg.startsWith('✨') ? "⚠️ Keep trying! (or skip)" : feedbackMsg);
                    
                    const existingFeedback = document.querySelector('.animate-bounce, .animate-pulse');
                    if (existingFeedback) existingFeedback.remove();
                    
                    document.getElementById('step-container').appendChild(feedback);

                    if (isCorrect) {
                        if (btn.innerText === "Finish Lesson") {
                            nextStep();
                        } else {
                            btn.innerText = "Continue";
                            btn.classList.replace('bg-green-600', 'bg-blue-600');
                        }
                    }
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
        
        if (nodeIdx !== -1) {
            dailyData.path[nodeIdx].status = 'completed';
            if (dailyData.path[nodeIdx + 1]) {
                dailyData.path[nodeIdx + 1].status = 'active';
            }

            if (!dailyData.weeklyProgress[today]) {
                dailyData.weeklyProgress[today] = true;
                updateStreak();
            }
            saveDailyData();
        }

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
