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
        html += '<h2 style="color:#fff;margin:0 0 16px 0;font-size:20px;">📚 Select Book</h2>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">';

        books.forEach(book => {
            const ch = getChapterCount(book);
            html += `<button class="palace-book" data-book="${esc(book)}" style="padding:10px;background:#1f3a93;border:1px solid #444;border-radius:4px;color:#fff;cursor:pointer;font-size:13px;line-height:1.4;">
        ${esc(book)}<br/><small style="color:#cbd5e1;">${ch} ch</small>
      </button>`;
        });

        html += '</div></div>';
        content.innerHTML = html;

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
        html += `<button class="palace-back" style="padding:6px 10px;background:#555;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin-bottom:12px;">← Back</button>`;
        html += `<h2 style="color:#fff;margin:0 0 16px 0;font-size:18px;">${esc(book)} ${ch + 1}</h2>`;

        if (!verses || verses.length === 0) {
            html += `<div style="color:#cbd5e1;">No verses found for this chapter.</div>`;
        } else {
            verses.forEach((verse, vi) => {
                const note = notes[vi] || '';
                const hasNote = note ? ' 📌' : '';
                html += `
          <div style="background:#1f2937;border:1px solid #444;border-radius:4px;padding:12px;margin-bottom:12px;">
            <div style="color:#fbbf24;font-weight:600;font-size:13px;margin-bottom:6px;">${ch + 1}:${vi + 1}${hasNote}</div>
            <div style="color:#e5e7eb;font-size:13px;line-height:1.6;margin-bottom:10px;">${esc(verse)}</div>
            <textarea class="palace-note-input" data-vi="${vi}" placeholder="Add note..." style="width:100%;padding:8px;border:1px solid #333;border-radius:3px;background:#0b1220;color:#e5e7eb;font-size:12px;min-height:60px;box-sizing:border-box;font-family:Arial,sans-serif;resize:vertical;"></textarea>
          </div>
        `;
            });
        }

        html += `<button class="palace-save-all" style="padding:10px 16px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;width:100%;margin-bottom:20px;">Save Notes</button>`;
        html += '</div>';

        content.innerHTML = html;

        // Load existing notes into textareas
        document.querySelectorAll('.palace-note-input').forEach(ta => {
            const vi = parseInt(ta.dataset.vi, 10);
            ta.value = notes[vi] || '';
        });

        const backBtn = document.querySelector('.palace-back');
        if (backBtn) backBtn.addEventListener('click', () => showChapters(book));

        const saveBtn = document.querySelector('.palace-save-all');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
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
                // small confirmation (non-blocking)
                saveBtn.textContent = 'Saved ✓';
                setTimeout(() => {
                    saveBtn.textContent = 'Save Notes';
                }, 1000);
            });
        }
    }

    // exported init for switchApp to call
    window.initMemoryPalace = function () {
        // ensure palace container is visible before rendering
        const palace = document.getElementById('palace-container');
        if (palace) palace.style.display = 'block';
        showBooks();
    };

    window.hideMemoryPalace = function () {
        const palace = document.getElementById('palace-container');
        if (palace) palace.style.display = 'none';
    };
})();