/* Minimal Memory Palace - Notes per verse, easy chapter view
   Robust to asynchronous bible loading: shows a loading message and retries
*/

(function () {
    const PALACE_KEY = 'memoryPalaceNotes';
    const MAX_RETRIES = 30;   // 30 * 200ms = 6 seconds max wait
    const RETRY_DELAY = 200;  // ms

    let _retryCount = 0;

    function load() {
        try {
            return JSON.parse(localStorage.getItem(PALACE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function save(data) {
        try {
            localStorage.setItem(PALACE_KEY, JSON.stringify(data));
        } catch (e) {
        }
    }

    function esc(s) {
        return (s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    function getBooks() {
        // return array of book keys (may be empty if bible not loaded)
        const b = bible || {};
        return Object.keys(b);
    }

    function getChapterCount(book) {
        const b = bible && bible[book];
        return (b && b.chapters) ? b.chapters.length : 0;
    }

    function getVerses(book, ch) {
        const b = bible && bible[book];
        return (b && b.chapters && b.chapters[ch]) ? b.chapters[ch] : [];
    }

    function showLoadingMessage(msg) {
        const content = document.getElementById('palace-content');
        if (!content) return;
        content.innerHTML = `<div style="padding:20px;color:#cbd5e1;">${esc(msg)}</div>`;
    }

    // Book picker
    function showBooks() {
        const content = document.getElementById('palace-content');
        if (!content) return;

        const books = getBooks();
        if (!books || books.length === 0) {
            // bible not yet loaded
            _retryCount++;
            showLoadingMessage('Bible data not yet available. Loading...');

            if (_retryCount <= MAX_RETRIES) {
                setTimeout(showBooks, RETRY_DELAY);
            } else {
                content.innerHTML = `
          <div style="padding:20px;color:#cbd5e1;">
            Bible data still not loaded. Please load the Bible JSON from the main page (file upload) or check your network.
            <div style="margin-top:12px;">
              <button id="palace-retry-btn" style="padding:8px 12px;border-radius:6px;background:#3b82f6;border:none;color:#fff;cursor:pointer;">Retry now</button>
            </div>
          </div>
        `;
                const retryBtn = document.getElementById('palace-retry-btn');
                if (retryBtn) retryBtn.addEventListener('click', () => {
                    _retryCount = 0;
                    showBooks();
                });
            }
            return;
        }

        // reset retry count when we have data
        _retryCount = 0;

        let html = '<div style="padding:12px;max-width:100%;">';
        html += '<h2 style="color:#fff;margin:0 0 16px 0;font-size:20px;">🏛️ Memory Palace</h2>';

        // Import/Export buttons
        html += '<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">';
        html += '<button id="palace-export" style="padding:8px 12px;background:#4b5563;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">📤 Export JSON</button>';
        html += '<button id="palace-import-trigger" style="padding:8px 12px;background:#4b5563;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">📥 Import JSON</button>';
        html += '<input type="file" id="palace-import-file" accept=".json" style="display:none;"/>';
        html += '</div>';

        // Search box
        html += '<div style="margin-bottom:16px;">';
        html += '<input type="text" id="palace-book-search" placeholder="Search books..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#0b1220;color:#fff;font-size:14px;box-sizing:border-box;"/>';
        html += '</div>';

        html += '<h3 style="color:#cbd5e1;margin:0 0 12px 0;font-size:16px;">📚 Select Book</h3>';
        html += '<div id="palace-book-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">';

        books.forEach(book => {
            const ch = getChapterCount(book);
            html += `<button class="palace-book" data-book="${esc(book)}" style="padding:10px;background:#1f3a93;border:1px solid #444;border-radius:4px;color:#fff;cursor:pointer;font-size:13px;line-height:1.4;">
        ${esc(book)}<br/><small style="color:#cbd5e1;">${ch} ch</small>
      </button>`;
        });

        html += '</div></div>';
        content.innerHTML = html;

        // Wire up Search
        const searchInput = document.getElementById('palace-book-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.palace-book').forEach(btn => {
                    const bookName = btn.dataset.book.toLowerCase();
                    btn.style.display = bookName.includes(term) ? 'block' : 'none';
                });
            });
        }

        // Wire up Import/Export
        const exportBtn = document.getElementById('palace-export');
        if (exportBtn) exportBtn.addEventListener('click', exportData);

        const importTrigger = document.getElementById('palace-import-trigger');
        const importFile = document.getElementById('palace-import-file');
        if (importTrigger && importFile) {
            importTrigger.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', importData);
        }

        document.querySelectorAll('.palace-book').forEach(btn => {
            btn.addEventListener('click', () => {
                const book = btn.dataset.book;
                showChapters(book);
            });
        });
    }

    // Chapter picker
    function showChapters(book) {
        const content = document.getElementById('palace-content');
        if (!content) return;

        const count = getChapterCount(book);

        let html = '<div style="padding:12px;max-width:100%;">';
        html += `<button class="palace-back" style="padding:6px 10px;background:#555;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin-bottom:12px;">← Back</button>`;
        html += `<h2 style="color:#fff;margin:0 0 12px 0;font-size:18px;">${esc(book)}</h2>`;
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px;">';

        for (let ch = 0; ch < count; ch++) {
            html += `<button class="palace-chapter" data-book="${esc(book)}" data-ch="${ch}" style="padding:8px;background:#1f2937;border:1px solid #444;border-radius:3px;color:#e5e7eb;cursor:pointer;font-size:12px;">
        ${ch + 1}
      </button>`;
        }

        html += '</div></div>';
        content.innerHTML = html;

        const backBtn = document.querySelector('.palace-back');
        if (backBtn) backBtn.addEventListener('click', showBooks);

        document.querySelectorAll('.palace-chapter').forEach(btn => {
            btn.addEventListener('click', () => {
                const b = btn.dataset.book;
                const c = parseInt(btn.dataset.ch, 10);
                showChapter(b, c);
            });
        });
    }

    // Full chapter view with verses and notes
    function showChapter(book, ch) {
        const content = document.getElementById('palace-content');
        if (!content) return;

        const verses = getVerses(book, ch);
        const data = load();
        const key = `${book}_${ch}`;
        const notes = (data[key] || {});

        let html = '<div style="padding:12px;max-width:100%;">';
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:wrap;">
            <div style="display:flex;gap:8px;align-items:center;">
                <button class="palace-back" style="padding:6px 12px;background:#555;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;">← Back</button>
                <h2 style="color:#fff;margin:0;font-size:18px;">${esc(book)} ${ch + 1}</h2>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="palace-view-visual" style="padding:6px 12px;background:#3b82f6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">👀 Visual Mode</button>
                <button class="palace-save-all" style="padding:6px 12px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Save All</button>
            </div>
        </div>`;

        if (!verses || verses.length === 0) {
            html += `<div style="color:#cbd5e1;">No verses found for this chapter.</div>`;
        } else {
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));gap:12px;">';
            verses.forEach((verse, vi) => {
                const note = notes[vi] || '';
                const hasNote = note ? ' 📌' : '';
                html += `
          <div style="background:#1f2937;border:1px solid #444;border-radius:4px;padding:12px;display:flex;flex-direction:column;">
            <div style="color:#fbbf24;font-weight:600;font-size:13px;margin-bottom:6px;">${ch + 1}:${vi + 1}${hasNote}</div>
            <div style="color:#e5e7eb;font-size:13px;line-height:1.5;margin-bottom:10px;flex-grow:1;">${esc(verse)}</div>
            <textarea class="palace-note-input" data-vi="${vi}" placeholder="Add note..." style="width:100%;padding:8px;border:1px solid #333;border-radius:3px;background:#0b1220;color:#e5e7eb;font-size:12px;min-height:50px;box-sizing:border-box;font-family:Arial,sans-serif;resize:vertical;"></textarea>
          </div>
        `;
            });
            html += '</div>';
        }

        html += `<button class="palace-save-all" style="padding:12px 16px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;width:100%;margin:20px 0 40px 0;">Save All Notes</button>`;
        html += '</div>';

        content.innerHTML = html;

        // Load existing notes into textareas
        document.querySelectorAll('.palace-note-input').forEach(ta => {
            const vi = parseInt(ta.dataset.vi, 10);
            ta.value = notes[vi] || '';
        });

        const backBtn = document.querySelector('.palace-back');
        if (backBtn) backBtn.addEventListener('click', () => showChapters(book));

        const visualBtn = document.getElementById('palace-view-visual');
        if (visualBtn) visualBtn.addEventListener('click', () => showChapterVisual(book, ch));

        document.querySelectorAll('.palace-save-all').forEach(btn => {
            btn.addEventListener('click', () => {
                const data = load();
                const key = `${book}_${ch}`;
                const notesObj = {};

                document.querySelectorAll('.palace-note-input').forEach(ta => {
                    const vi = parseInt(ta.dataset.vi, 10);
                    const text = ta.value.trim();
                    if (text) notesObj[vi] = text;
                });

                if (Object.keys(notesObj).length > 0) {
                    data[key] = notesObj;
                } else {
                    delete data[key];
                }
                save(data);
                
                // update indicators (📌)
                showChapter(book, ch);
                
                // small confirmation
                const feedbackBtn = document.querySelector('.palace-save-all:last-of-type');
                if (feedbackBtn) {
                    feedbackBtn.textContent = 'Saved ✓';
                    feedbackBtn.style.background = '#10b981';
                    setTimeout(() => {
                        feedbackBtn.textContent = 'Save All Notes';
                        feedbackBtn.style.background = '#059669';
                    }, 1000);
                }
            });
        });
    }

    // Flashcard "Going Over" Mode
    function showChapterVisual(book, ch) {
        const content = document.getElementById('palace-content');
        if (!content) return;

        const verses = getVerses(book, ch);
        const data = load();
        const key = `${book}_${ch}`;
        const notes = (data[key] || {});

        let currentIndex = 0;

        function renderCard() {
            const verse = verses[currentIndex];
            const note = notes[currentIndex] || '(No note for this verse)';

            let html = '<div style="padding:12px;max-width:600px;margin:0 auto;display:flex;flex-direction:column;min-height:80vh;justify-content:center;">';
            
            // Header
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;gap:8px;">
                <button id="palace-visual-back" style="padding:6px 12px;background:#555;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;">← Back</button>
                <h2 style="color:#fff;margin:0;font-size:18px;">${esc(book)} ${ch + 1}:${currentIndex + 1}</h2>
                <div style="color:#94a3b8;font-size:12px;">${currentIndex + 1} / ${verses.length}</div>
            </div>`;

            // Flashcard Container
            html += `
            <div id="palace-flashcard-scene" style="perspective: 1000px; cursor: pointer; flex-grow: 1; display: flex; align-items: stretch; margin-bottom: 24px;">
                <div id="palace-flashcard" style="position: relative; width: 100%; transition: transform 0.6s; transform-style: preserve-3d; min-height: 300px; display: flex;">
                    
                    <!-- Front (Note) -->
                    <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="color: #3b82f6; font-size: 14px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">Note (Front)</div>
                        <div style="color: #cbd5e1; font-size: 22px; line-height: 1.6; text-align: center; white-space: pre-wrap;">${esc(note)}</div>
                        <div style="margin-top: 32px; color: #64748b; font-size: 12px; text-align: center;">(Tap to reveal verse)</div>
                    </div>

                    <!-- Back (Verse) -->
                    <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: #1e293b; border: 2px solid #10b981; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; transform: rotateY(180deg); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="color: #10b981; font-size: 14px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">Verse (Back)</div>
                        <div style="color: #f8fafc; font-size: 22px; line-height: 1.6; text-align: center;">${esc(verse)}</div>
                        <div style="margin-top: 32px; color: #64748b; font-size: 12px; text-align: center;">(Tap to flip back)</div>
                    </div>

                </div>
            </div>`;

            // Navigation
            html += `
            <div style="display:flex;gap:12px;justify-content:center;">
                <button id="palace-flash-prev" style="flex:1;padding:12px;background:#334155;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;" ${currentIndex === 0 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>← Previous</button>
                <button id="palace-flash-next" style="flex:1;padding:12px;background:#334155;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;" ${currentIndex === verses.length - 1 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>Next →</button>
            </div>
            <div style="text-align:center;margin-top:16px;color:#64748b;font-size:12px;">Tip: Swipe left/right or use arrow keys to navigate</div>
            `;

            html += '</div>';
            content.innerHTML = html;

            // Flip Logic
            const card = document.getElementById('palace-flashcard');
            let flipped = false;
            document.getElementById('palace-flashcard-scene').addEventListener('click', () => {
                flipped = !flipped;
                card.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0)';
            });

            // Nav Logic
            document.getElementById('palace-flash-prev').addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                    currentIndex--;
                    renderCard();
                }
            });
            document.getElementById('palace-flash-next').addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentIndex < verses.length - 1) {
                    currentIndex++;
                    renderCard();
                }
            });

            document.getElementById('palace-visual-back').addEventListener('click', () => showChapter(book, ch));

            // Swipe support
            let touchStartX = 0;
            const scene = document.getElementById('palace-flashcard-scene');
            scene.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, {passive: true});
            scene.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].screenX;
                const diff = touchEndX - touchStartX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0 && currentIndex > 0) {
                        currentIndex--;
                        renderCard();
                    } else if (diff < 0 && currentIndex < verses.length - 1) {
                        currentIndex++;
                        renderCard();
                    }
                }
            }, {passive: true});
        }

        renderCard();

        // Keyboard support
        const keyHandler = (e) => {
            if (!document.getElementById('palace-flashcard')) {
                window.removeEventListener('keydown', keyHandler);
                return;
            }
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                renderCard();
            } else if (e.key === 'ArrowRight' && currentIndex < verses.length - 1) {
                currentIndex++;
                renderCard();
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const card = document.getElementById('palace-flashcard');
                if (card) {
                    const isFlipped = card.style.transform === 'rotateY(180deg)';
                    card.style.transform = isFlipped ? 'rotateY(0)' : 'rotateY(180deg)';
                }
            } else if (e.key === 'Escape') {
                showChapter(book, ch);
            }
        };
        window.addEventListener('keydown', keyHandler);
    }

    // exported init for switchApp to call
    window.initMemoryPalace = function () {
        // ensure palace container is visible before rendering
        const palace = document.getElementById('palace-container');
        if (palace) palace.style.display = 'block';
        showBooks();
    };

    function exportData() {
        const data = load();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memory-palace-notes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('This will merge imported notes with your current notes. Continue?')) {
                    const currentData = load();
                    const mergedData = {...currentData, ...importedData};
                    save(mergedData);
                    alert('Import successful!');
                    showBooks();
                }
            } catch (err) {
                alert('Error importing JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    window.hideMemoryPalace = function () {
        const palace = document.getElementById('palace-container');
        if (palace) palace.style.display = 'none';
    };
})();