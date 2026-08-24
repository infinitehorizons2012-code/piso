/* --- GAME ENGINE: MUSIC LEARNING & EAR TRAINING GAMES --- */

(function() {
    // 1. Audio Synthesizer (Web Audio API)
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Convert Note Name or MIDI number to Frequency
    const NOTE_TO_MIDI = {
        'C,,': 36, 'D,,': 38, 'E,,': 40, 'F,,': 41, 'G,,': 43, 'A,,': 45, 'B,,': 47,
        'C,': 48, 'D,': 50, 'E,': 52, 'F,': 53, 'G,': 55, 'A,': 57, 'B,': 59,
        'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71,
        'c': 72, 'd': 74, 'e': 76, 'f': 77, 'g': 79, 'a': 81, 'b': 83,
        "c'": 84, "d'": 86, "e'": 88, "f'": 89, "g'": 91, "a'": 93, "b'": 95,
        "c''": 96, "d''": 98, "e''": 100, "f''": 101, "g''": 103
    };

    function midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function playTone(freq, duration = 0.5, type = 'triangle', delay = 0) {
        const ctx = getAudioContext();
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    function playNoteByName(noteStr, duration = 0.5, delay = 0) {
        const midi = NOTE_TO_MIDI[noteStr] || 60;
        playTone(midiToFreq(midi), duration, 'sine', delay);
    }

    function playChord(midiArray, duration = 1.0) {
        midiArray.forEach(midi => {
            playTone(midiToFreq(midi), duration, 'triangle', 0);
        });
    }

    function playSequence(midiArray, noteDuration = 0.4) {
        midiArray.forEach((midi, index) => {
            playTone(midiToFreq(midi), noteDuration * 0.9, 'triangle', index * noteDuration);
        });
    }

    function playRhythmClicks(beatsArray, beatDuration = 0.3) {
        const ctx = getAudioContext();
        beatsArray.forEach((isClick, index) => {
            if (isClick) {
                playTone(800, 0.08, 'square', index * beatDuration);
            }
        });
    }

    // 2. Game State
    window.GameState = {
        activeGame: 'ledger', // 'ledger', 'rhythm', 'interval', 'scale', 'chord'
        activeSubTab: 'sol', // 'theory', 'sol', 'fa', 'test'
        level: 1, // 1: Dễ, 2: Trung bình, 3: Khó
        score: 0,
        streak: 0,
        totalPlayed: 0,
        currentQuestion: null
    };

    // 3. Switch Main Game
    window.selectGame = function(gameId) {
        window.GameState.activeGame = gameId;
        window.GameState.score = 0;
        window.GameState.streak = 0;
        window.GameState.totalPlayed = 0;
        window.GameState.level = 1;
        
        if (gameId === 'ledger') window.GameState.activeSubTab = 'sol';
        else window.GameState.activeSubTab = 'test';

        if (window.closeAllDropdowns) window.closeAllDropdowns();

        // Show game main tab view
        if (window.switchTab) {
            window.switchTab('', 'tab-game');
        } else {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            document.getElementById('tab-game').style.display = 'block';
        }

        renderGameUI();
    };

    // 4. Render Game UI
    function renderGameUI() {
        const container = document.getElementById('game-main-content');
        if (!container) return;

        const g = window.GameState;

        // Render Game Header & Game Selector Bar
        let html = `
            <div class="game-header-bar" style="background: linear-gradient(135deg, #ff758c, #ff7eb3, #764ba2); color: white; padding: 22px 25px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(255, 117, 140, 0.35);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.6rem; color: #ffffff; display: flex; align-items: center; gap: 10px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                            ${getGameTitle(g.activeGame)}
                        </h2>
                        <p style="margin: 6px 0 0 0; color: #fce7f3; font-size: 0.95rem; font-weight: 600;">${getGameDesc(g.activeGame)}</p>
                    </div>
                    <div style="display: flex; gap: 15px; background: rgba(255,255,255,0.25); backdrop-filter: blur(8px); padding: 10px 22px; border-radius: 30px; font-weight: 800; border: 2px solid rgba(255,255,255,0.4); box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="color: #fef08a; font-size: 1.1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">⭐ Điểm: ${g.score}</span>
                        <span style="color: #ffedd5; font-size: 1.1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">🔥 Chuỗi: ${g.streak}</span>
                    </div>
                </div>

                <!-- Sub Navigation Tabs for Selected Game -->
                <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 16px;">
                    ${getGameSubTabs(g.activeGame, g.activeSubTab)}
                </div>
            </div>
        `;

        // Render Level Selector if in Test mode
        if (g.activeSubTab !== 'theory') {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #e0f2fe, #f0f9ff); padding: 14px 22px; border-radius: 16px; margin-bottom: 20px; border: 2px solid #7dd3fc; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);">
                    <span style="font-weight: 800; color: #0369a1; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">🎯 Chọn Độ Khó:</span>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.setGameLevel(1)" class="level-btn ${g.level === 1 ? 'active' : ''}" style="padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: 800; transition: all 0.2s; ${g.level === 1 ? 'background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);' : 'background: white; color: #334155; border: 2px solid #cbd5e1;'}">Level 1 (Dễ)</button>
                        <button onclick="window.setGameLevel(2)" class="level-btn ${g.level === 2 ? 'active' : ''}" style="padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: 800; transition: all 0.2s; ${g.level === 2 ? 'background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.35);' : 'background: white; color: #334155; border: 2px solid #cbd5e1;'}">Level 2 (Vừa)</button>
                        <button onclick="window.setGameLevel(3)" class="level-btn ${g.level === 3 ? 'active' : ''}" style="padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: 800; transition: all 0.2s; ${g.level === 3 ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.35);' : 'background: white; color: #334155; border: 2px solid #cbd5e1;'}">Level 3 (Khó)</button>
                    </div>
                </div>
            `;
        }

        // Body Content
        html += `<div id="game-card-body"></div>`;
        container.innerHTML = html;

        // Populate Game View Body
        if (g.activeSubTab === 'theory') {
            renderGameTheory(g.activeGame);
        } else if (g.activeSubTab === 'flashcard') {
            renderFlashcardView();
        } else if (g.activeSubTab === 'report') {
            renderProgressReportView();
        } else {
            generateNextQuestion();
        }
    }

    function getGameTitle(gameId) {
        switch(gameId) {
            case 'ledger': return '🎼 Ledger Lines — Sight-Reading Speed';
            case 'rhythm': return '🥁 Rhythm Match — Ear Training Nhịp Điệu';
            case 'interval': return '🎵 Interval Match — Ear Training Quãng Âm';
            case 'scale': return '🎹 Scale Match — Ear Training Âm Giai';
            case 'chord': return '🎼 Chord Match — Ear Training Hợp Âm';
            default: return '🎮 Game Âm Nhạc';
        }
    }

    function getGameDesc(gameId) {
        switch(gameId) {
            case 'ledger': return 'Luyện phản xạ đọc nốt nhạc trên dòng kẻ phụ (Khóa Sol & Khóa Fa)';
            case 'rhythm': return 'Luyện tai nghe phân biệt tiết tấu & mẫu nhịp điệu';
            case 'interval': return 'Luyện tai nghe nhận biết khoảng cách giữa 2 nốt nhạc (Quãng 2, 3, 5, 8...)';
            case 'scale': return 'Luyện tai nghe nhận biết các loại âm giai Trưởng, Thứ, Pentatonic, Blues';
            case 'chord': return 'Luyện tai nghe phân biệt hợp âm Trưởng, Thứ, Giảm, Tăng, Bảy';
            default: return '';
        }
    }

    function getGameSubTabs(gameId, activeTab) {
        const activeStyle = 'background: #facc15; color: #431407; font-weight: 800; border-radius: 20px; border: 2px solid #fde047; box-shadow: 0 4px 12px rgba(250, 204, 21, 0.45); padding: 9px 20px; cursor: pointer; transition: all 0.2s;';
        const inactiveStyle = 'background: rgba(255, 255, 255, 0.2); color: white; font-weight: 700; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.35); padding: 9px 20px; cursor: pointer; transition: all 0.2s;';

        if (gameId === 'ledger') {
            return `
                <button onclick="window.switchGameSubTab('sol')" style="${activeTab === 'sol' ? activeStyle : inactiveStyle}">🎼 Test Khóa Sol</button>
                <button onclick="window.switchGameSubTab('fa')" style="${activeTab === 'fa' ? activeStyle : inactiveStyle}">𝄢 Test Khóa Fa</button>
                <button onclick="window.switchGameSubTab('theory')" style="${activeTab === 'theory' ? activeStyle : inactiveStyle}">📖 Lý Thuyết</button>
                <button onclick="window.switchGameSubTab('flashcard')" style="${activeTab === 'flashcard' ? activeStyle : inactiveStyle}">🎴 Flashcard Nốt Nhạc</button>
                <button onclick="window.switchGameSubTab('report')" style="${activeTab === 'report' ? activeStyle : inactiveStyle}">📊 Báo Cáo Tiến Độ</button>
            `;
        } else {
            const flashcardLabel = gameId === 'interval' ? '🎴 Flashcard Quãng Âm' : '🎴 Flashcard';
            return `
                <button onclick="window.switchGameSubTab('test')" style="${activeTab === 'test' ? activeStyle : inactiveStyle}">🎮 Làm Bài Test</button>
                <button onclick="window.switchGameSubTab('theory')" style="${activeTab === 'theory' ? activeStyle : inactiveStyle}">📖 Lý Thuyết</button>
                <button onclick="window.switchGameSubTab('flashcard')" style="${activeTab === 'flashcard' ? activeStyle : inactiveStyle}">${flashcardLabel}</button>
                <button onclick="window.switchGameSubTab('report')" style="${activeTab === 'report' ? activeStyle : inactiveStyle}">📊 Báo Cáo Tiến Độ</button>
            `;
        }
    }

    window.switchGameSubTab = function(subTab) {
        window.GameState.activeSubTab = subTab;
        renderGameUI();
    };

    window.setGameLevel = function(lvl) {
        window.GameState.level = lvl;
        renderGameUI();
    };

    // 5. Question Generators
    function generateNextQuestion() {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        const g = window.GameState;

        if (g.activeGame === 'ledger') {
            generateLedgerQuestion(cardBody);
        } else if (g.activeGame === 'rhythm') {
            generateRhythmQuestion(cardBody);
        } else if (g.activeGame === 'interval') {
            generateIntervalQuestion(cardBody);
        } else if (g.activeGame === 'scale') {
            generateScaleQuestion(cardBody);
        } else if (g.activeGame === 'chord') {
            generateChordQuestion(cardBody);
        }
    }

    // --- GAME 1: LEDGER LINES ---
    // Khóa Sol Level 1 (Dễ): Các nốt trong khuông & Đô trung tâm (C D E F G A B c d e f g a b)
    const TREBLE_NOTES_LVL1 = [
        { abc: 'C', name: 'Đô (C)', noteOnly: 'C' },
        { abc: 'D', name: 'Rê (D)', noteOnly: 'D' },
        { abc: 'E', name: 'Mi (E)', noteOnly: 'E' },
        { abc: 'F', name: 'Pha (F)', noteOnly: 'F' },
        { abc: 'G', name: 'Son (G)', noteOnly: 'G' },
        { abc: 'A', name: 'La (A)', noteOnly: 'A' },
        { abc: 'B', name: 'Si (B)', noteOnly: 'B' },
        { abc: 'c', name: 'Đô (c)', noteOnly: 'C' },
        { abc: 'd', name: 'Rê (d)', noteOnly: 'D' },
        { abc: 'e', name: 'Mi (e)', noteOnly: 'E' },
        { abc: 'f', name: 'Pha (f)', noteOnly: 'F' },
        { abc: 'g', name: 'Son (g)', noteOnly: 'G' },
        { abc: 'a', name: 'La (a)', noteOnly: 'A' },
        { abc: 'b', name: 'Si (b)', noteOnly: 'B' }
    ];

    // Khóa Sol Level 2 (Vừa): Dòng kẻ phụ phía trên (c' d' e' f' g' a' b')
    const TREBLE_NOTES_LVL2 = [
        { abc: "c'", name: 'Đô (c\')', noteOnly: 'C' },
        { abc: "d'", name: 'Rê (d\')', noteOnly: 'D' },
        { abc: "e'", name: 'Mi (e\')', noteOnly: 'E' },
        { abc: "f'", name: 'Pha (f\')', noteOnly: 'F' },
        { abc: "g'", name: 'Son (g\')', noteOnly: 'G' },
        { abc: "a'", name: 'La (a\')', noteOnly: 'A' },
        { abc: "b'", name: 'Si (b\')', noteOnly: 'B' }
    ];

    // Khóa Sol Level 3 (Khó): Dòng kẻ phụ phía dưới (B, A, G, F, E, D, C,)
    const TREBLE_NOTES_LVL3 = [
        { abc: 'B,', name: 'Si (B,)', noteOnly: 'B' },
        { abc: 'A,', name: 'La (A,)', noteOnly: 'A' },
        { abc: 'G,', name: 'Son (G,)', noteOnly: 'G' },
        { abc: 'F,', name: 'Pha (F,)', noteOnly: 'F' },
        { abc: 'E,', name: 'Mi (E,)', noteOnly: 'E' },
        { abc: 'D,', name: 'Rê (D,)', noteOnly: 'D' },
        { abc: 'C,', name: 'Đô (C,)', noteOnly: 'C' }
    ];

    // Khóa Fa Level 1 (Dễ): Từ E,, đến C, rồi tới C (13 nốt: E,, F,, G,, A,, B,, C, D, E, F, G, A, B, C)
    const BASS_NOTES_LVL1 = [
        { abc: 'E,,', name: 'Mi (E,,)', noteOnly: 'E' },
        { abc: 'F,,', name: 'Pha (F,,)', noteOnly: 'F' },
        { abc: 'G,,', name: 'Son (G,,)', noteOnly: 'G' },
        { abc: 'A,,', name: 'La (A,,)', noteOnly: 'A' },
        { abc: 'B,,', name: 'Si (B,,)', noteOnly: 'B' },
        { abc: 'C,', name: 'Đô (C,)', noteOnly: 'C' },
        { abc: 'D,', name: 'Rê (D,)', noteOnly: 'D' },
        { abc: 'E,', name: 'Mi (E,)', noteOnly: 'E' },
        { abc: 'F,', name: 'Pha (F,)', noteOnly: 'F' },
        { abc: 'G,', name: 'Son (G,)', noteOnly: 'G' },
        { abc: 'A,', name: 'La (A,)', noteOnly: 'A' },
        { abc: 'B,', name: 'Si (B,)', noteOnly: 'B' },
        { abc: 'C', name: 'Đô (C)', noteOnly: 'C' }
    ];

    // Khóa Fa Level 2 (Vừa): Từ D đến B (6 nốt dòng kẻ phụ trên: D E F G A B)
    const BASS_NOTES_LVL2 = [
        { abc: 'D', name: 'Rê (D)', noteOnly: 'D' },
        { abc: 'E', name: 'Mi (E)', noteOnly: 'E' },
        { abc: 'F', name: 'Pha (F)', noteOnly: 'F' },
        { abc: 'G', name: 'Son (G)', noteOnly: 'G' },
        { abc: 'A', name: 'La (A)', noteOnly: 'A' },
        { abc: 'B', name: 'Si (B)', noteOnly: 'B' }
    ];

    // Khóa Fa Level 3 (Khó): D,, hạ xuống 6 nốt (6 nốt rất trầm: D,, C,, B,,, A,,, G,,, F,,,)
    const BASS_NOTES_LVL3 = [
        { abc: 'D,,', name: 'Rê (D,,)', noteOnly: 'D' },
        { abc: 'C,,', name: 'Đô (C,,)', noteOnly: 'C' },
        { abc: 'B,,,', name: 'Si (B,,,)', noteOnly: 'B' },
        { abc: 'A,,,', name: 'La (A,,,)', noteOnly: 'A' },
        { abc: 'G,,,', name: 'Son (G,,,)', noteOnly: 'G' },
        { abc: 'F,,,', name: 'Pha (F,,,)', noteOnly: 'F' }
    ];

    const NOTE_COLOR_MAP = {
        'C': { bg: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: '#f43f5e', text: '#be123c', shadow: 'rgba(244, 63, 94, 0.25)' },
        'D': { bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fb923c', text: '#c2410c', shadow: 'rgba(249, 115, 22, 0.25)' },
        'E': { bg: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '#facc15', text: '#a16207', shadow: 'rgba(234, 179, 8, 0.25)' },
        'F': { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#4ade80', text: '#15803d', shadow: 'rgba(34, 197, 94, 0.25)' },
        'G': { bg: 'linear-gradient(135deg, #ecfeff, #cffafe)', border: '#38bdf8', text: '#0891b2', shadow: 'rgba(56, 189, 248, 0.25)' },
        'A': { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#60a5fa', text: '#1d4ed8', shadow: 'rgba(59, 130, 246, 0.25)' },
        'B': { bg: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', border: '#c084fc', text: '#6b21a8', shadow: 'rgba(168, 85, 247, 0.25)' }
    };

    function generate3Options(correctNoteOnly) {
        const ALL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const distractors = ALL_NOTES.filter(n => n !== correctNoteOnly);
        for (let i = distractors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
        }
        const selected = [correctNoteOnly, distractors[0], distractors[1]];
        for (let i = selected.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selected[i], selected[j]] = [selected[j], selected[i]];
        }
        return selected;
    }

    function generateLedgerQuestion(cardBody) {
        const isTreble = window.GameState.activeSubTab === 'sol';
        const lvl = window.GameState.level;
        const clefKey = isTreble ? 'sol' : 'fa';

        let pool = isTreble 
            ? (lvl === 1 ? TREBLE_NOTES_LVL1 : (lvl === 2 ? TREBLE_NOTES_LVL2 : TREBLE_NOTES_LVL3))
            : (lvl === 1 ? BASS_NOTES_LVL1 : (lvl === 2 ? BASS_NOTES_LVL2 : BASS_NOTES_LVL3));

        const target = pool[Math.floor(Math.random() * pool.length)];
        window.GameState.currentQuestion = target;

        // Record seed encounter
        if (window.recordNoteTestResult) {
            window.recordNoteTestResult(clefKey, lvl, target, false);
        }

        const options3 = generate3Options(target.noteOnly);
        const clefStr = isTreble ? 'treble' : 'bass';
        const clefTitle = isTreble ? 'Khóa Sol' : 'Khóa Fa';
        const abcCode = `X:1\nM:4/4\nL:1/4\nK:C clef=${clefStr}\n${target.abc} |`;

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎼 [${clefTitle}] Hãy nhìn khuông nhạc & chọn 1 đáp án đúng trong 3 phương án:</h3>
                
                <div id="game-abc-paper" style="min-height: 160px; display: flex; justify-content: center; align-items: center; margin: 18px 0; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 15px; border: 2px dashed #cbd5e1;"></div>

                <div id="game-feedback" style="min-height: 32px; font-weight: 800; font-size: 1.2rem; margin-bottom: 18px;"></div>

                <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; max-width: 600px; margin: 0 auto;">
                    ${options3.map(note => {
                        const style = NOTE_COLOR_MAP[note];
                        return `
                        <button onclick="window.checkLedgerAnswer('${note}')" style="font-size: 1.35rem; font-weight: 800; padding: 16px 28px; border-radius: 20px; border: 3px solid ${style.border}; background: ${style.bg}; color: ${style.text}; cursor: pointer; transition: all 0.2s; min-width: 130px; box-shadow: 0 6px 18px ${style.shadow}; flex: 1;" onmouseover="this.style.transform='translateY(-4px) scale(1.08)'" onmouseout="this.style.transform='none'">
                            ${getNoteDisplayName(note)}
                        </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        setTimeout(() => {
            const paperEl = document.getElementById('game-abc-paper');
            const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
            if (paperEl && abcRenderer) {
                paperEl.innerHTML = '';
                abcRenderer.renderAbc('game-abc-paper', abcCode, {
                    responsive: 'resize',
                    scale: 1.4,
                    staffwidth: 360,
                    paddingtop: 15,
                    paddingbottom: 15,
                    add_classes: true
                });
            }
        }, 50);
    }

    function getNoteDisplayName(note) {
        switch(note) {
            case 'C': return 'Đô (C)';
            case 'D': return 'Rê (D)';
            case 'E': return 'Mi (E)';
            case 'F': return 'Pha (F)';
            case 'G': return 'Son (G)';
            case 'A': return 'La (A)';
            case 'B': return 'Si (B)';
            default: return note;
        }
    }

    window.checkLedgerAnswer = function(answer) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        const isTreble = window.GameState.activeSubTab === 'sol';
        const lvl = window.GameState.level;
        const clefKey = isTreble ? 'sol' : 'fa';
        const isCorrect = (answer === q.noteOnly);

        // Record progress & update note stage
        if (window.recordNoteTestResult) {
            window.recordNoteTestResult(clefKey, lvl, q, isCorrect);
        }

        if (isCorrect) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! Đó là nốt ${q.name}</span>`;
            setTimeout(() => {
                renderGameUI();
            }, 800);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Sai rồi! Đáp án đúng là nốt ${q.name}</span>`;
        }
    };

    // --- GAME 2: RHYTHM MATCH ---
    const RHYTHM_PATTERNS = [
        { name: '4 Nốt Đen (Quarter Notes)', clicks: [1,1,1,1], abc: 'c c c c |' },
        { name: '2 Nốt Trắng (Half Notes)', clicks: [1,0,1,0], abc: 'c2 c2 |' },
        { name: '1 Nốt Đen + 2 Móc Đơn + 2 Đen', clicks: [1,1,1,1,1], abc: 'c cc c c |' },
        { name: '4 Nốt Móc Đơn + 2 Nốt Đen', clicks: [1,1,1,1,1,1], abc: 'cc cc c c |' }
    ];

    function generateRhythmQuestion(cardBody) {
        const target = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
        window.GameState.currentQuestion = target;

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🥁 Bấm nút âm thanh & chọn nhịp điệu chính xác:</h3>
                
                <button onclick="window.playRhythmQuestionSound()" style="font-size: 1.15rem; padding: 14px 30px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; cursor: pointer; font-weight: 800; margin: 15px 0; box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
                    🔊 Phát Âm Thanh Nhịp Điệu
                </button>

                <div id="game-feedback" style="min-height: 32px; font-weight: 800; font-size: 1.2rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 15px;">
                    ${RHYTHM_PATTERNS.map((item, idx) => `
                        <button onclick="window.checkRhythmAnswer(${idx})" style="padding: 18px; border-radius: 16px; border: 2.5px solid #a5f3fc; background: linear-gradient(135deg, #f0fdf4, #ecfeff); font-weight: 800; font-size: 1.05rem; cursor: pointer; color: #0369a1; box-shadow: 0 4px 12px rgba(6,182,212,0.15); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='none'">
                            ${item.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.playRhythmQuestionSound();
    }

    window.playRhythmQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (q) playRhythmClicks(q.clicks, 0.35);
    };

    window.checkRhythmAnswer = function(idx) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        if (RHYTHM_PATTERNS[idx].name === q.name) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chúc mừng! Tiết tấu chính xác: ${q.name}</span>`;
            setTimeout(() => renderGameUI(), 900);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Sai rồi! Đáp án đúng là: ${q.name}</span>`;
        }
    };

    // --- GAME 3: INTERVAL MATCH (EAR TRAINING QUÃNG ÂM) ---
    const INTERVAL_LEVELS = {
        lvl1: [
            { id: 'P8', name: 'Quãng 8 Đúng (P8)', semi: 12, desc: 'Giống y hệt 1 nốt, chênh 1 octave', icon: '🌌' },
            { id: 'P5', name: 'Quãng 5 Đúng (P5)', semi: 7, desc: 'Vang dội, oai vệ (Star Wars)', icon: '⚔️' },
            { id: 'P4', name: 'Quãng 4 Đúng (P4)', semi: 5, desc: 'Vươn lên, ổn định (Nhạc Cưới)', icon: '🔔' },
            { id: 'M3', name: 'Quãng 3 Trưởng (M3)', semi: 4, desc: 'Cảm xúc Vui, sáng rực rỡ', icon: '☀️' },
            { id: 'm3', name: 'Quãng 3 Thứ (m3)', semi: 3, desc: 'Cảm xúc Buồn, u trầm', icon: '🌧️' }
        ],
        lvl2: [
            { id: 'm2', name: 'Quãng 2 Thứ (m2)', semi: 1, desc: 'Căng thẳng, ma quái (Nhạc Jaws)', icon: '🦈' },
            { id: 'M2', name: 'Quãng 2 Trưởng (M2)', semi: 2, desc: 'Bước đi bậc thang bình thường', icon: '🚶' },
            { id: 'M6', name: 'Quãng 6 Trưởng (M6)', semi: 9, desc: 'Bay bổng rực rỡ (Ballad)', icon: '🕊️' },
            { id: 'm6', name: 'Quãng 6 Thứ (m6)', semi: 8, desc: 'U buồn da diết (Ballad)', icon: '🥀' }
        ],
        lvl3: [
            { id: 'M7', name: 'Quãng 7 Trưởng (M7)', semi: 11, desc: 'Chói tai, đòi giải quyết vọt lên P8', icon: '⚡' },
            { id: 'm7', name: 'Quãng 7 Thứ (m7)', semi: 10, desc: 'Bụi bặm, lang bạt (Blues/Funk)', icon: '🎷' },
            { id: 'TT', name: 'Quãng 3 Cung (Tritone)', semi: 6, desc: 'Ma mị & bất ổn nhất âm nhạc', icon: '🔮' }
        ]
    };

    function getIntervalPool(level) {
        if (level === 1) return INTERVAL_LEVELS.lvl1;
        if (level === 2) return INTERVAL_LEVELS.lvl2;
        return INTERVAL_LEVELS.lvl3;
    }

    window.setIntervalMode = function(mode) {
        window.GameState.intervalMode = mode;
        renderGameUI();
    };

    window.switchIntervalTheorySubTab = function(subTab) {
        window.GameState.intervalTheorySubTab = subTab;
        renderGameUI();
    };

    function generateIntervalQuestion(cardBody) {
        const lvl = window.GameState.level || 1;
        const pool = getIntervalPool(lvl);
        const allPool = getIntervalPool(3); // All 12 intervals for distractors if needed

        const target = pool[Math.floor(Math.random() * pool.length)];

        // Select 2 wrong distractors to form exactly 3 multiple choice options
        let otherIntervals = pool.filter(x => x.id !== target.id);
        if (otherIntervals.length < 2) {
            otherIntervals = allPool.filter(x => x.id !== target.id);
        }
        
        otherIntervals.sort(() => Math.random() - 0.5);
        const options = [target, otherIntervals[0], otherIntervals[1]];
        options.sort(() => Math.random() - 0.5);

        const NATURAL_ROOTS = [60, 62, 64, 65, 67, 69, 71]; // 7 nốt tự nhiên C, D, E, F, G, A, B
        const rootMidi = NATURAL_ROOTS[Math.floor(Math.random() * NATURAL_ROOTS.length)];
        const mode = window.GameState.intervalMode || 'asc';

        window.GameState.currentQuestion = { target, rootMidi, mode, options };

        const modeBtnStyle = (m) => mode === m
            ? 'background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; font-weight: 800; padding: 8px 18px; border-radius: 20px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35); cursor: pointer;'
            : 'background: white; color: #475569; border: 2px solid #cbd5e1; font-weight: 700; padding: 8px 18px; border-radius: 20px; cursor: pointer;';

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <!-- Playback Mode Switcher -->
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #f8fafc; padding: 12px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <span style="font-weight: 800; color: #334155; font-size: 0.95rem;">🎧 Chế Độ Phát:</span>
                    <button onclick="window.setIntervalMode('asc')" style="${modeBtnStyle('asc')}">📈 Tăng Dần (Ascending)</button>
                    <button onclick="window.setIntervalMode('desc')" style="${modeBtnStyle('desc')}">📉 Giảm Dần (Descending)</button>
                    <button onclick="window.setIntervalMode('harm')" style="${modeBtnStyle('harm')}">🎹 Cùng Lúc (Harmonic)</button>
                </div>

                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎵 Luyện Tai Nghe Quãng Âm — Level ${lvl}:</h3>
                <p style="color: #64748b; font-size: 0.95rem; margin-top: -5px;">Nhấn vào nút dưới đây để nghe âm thanh quãng nhạc và chọn <b>1 trong 3 đáp án</b>:</p>
                
                <button onclick="window.playIntervalQuestionSound()" style="font-size: 1.2rem; padding: 16px 36px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; cursor: pointer; font-weight: 800; margin: 10px 0 20px 0; box-shadow: 0 8px 20px rgba(6, 182, 212, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px) scale(1.03)'" onmouseout="this.style.transform='none'">
                    🔊 Nghe Quãng Âm
                </button>

                <div id="game-feedback" style="min-height: 36px; font-weight: 800; font-size: 1.2rem; margin-bottom: 15px;"></div>

                <!-- Exactly 3 Multiple Choice Options -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; max-width: 760px; margin: 10px auto 0 auto;">
                    ${options.map((item) => `
                        <button onclick="window.checkIntervalAnswer('${item.id}')" style="padding: 20px 16px; border-radius: 20px; border: 3px solid #bfdbfe; background: linear-gradient(135deg, #ffffff, #eff6ff); font-weight: 800; font-size: 1.08rem; cursor: pointer; color: #1d4ed8; box-shadow: 0 6px 16px rgba(59,130,246,0.15); transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='#3b82f6';" onmouseout="this.style.transform='none'; this.style.borderColor='#bfdbfe';">
                            <span style="font-size: 1.4rem;">${item.icon} ${item.name}</span>
                            <span style="font-size: 0.85rem; font-weight: 600; color: #475569;">${item.desc}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    window.playIntervalQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (!q) return;

        const mode = window.GameState.intervalMode || 'asc';
        const root = q.rootMidi;
        const targetMidi = root + q.target.semi;

        if (mode === 'asc') {
            playSequence([root, targetMidi], 0.55);
        } else if (mode === 'desc') {
            playSequence([targetMidi, root], 0.55);
        } else if (mode === 'harm') {
            playChord([root, targetMidi], 0.7);
        }
    };

    window.checkIntervalAnswer = function(answerId) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        const mode = window.GameState.intervalMode || 'asc';
        const rootAbcMap = { 60: 'C', 62: 'D', 64: 'E', 65: 'F', 67: 'G', 69: 'A', 71: 'B' };
        const rootAbc = rootAbcMap[q.rootMidi] || 'C';
        const sampleKey = `${q.target.id}_${rootAbc}_${mode}`;

        const activeUser = window.getActiveChildUser ? window.getActiveChildUser() : null;
        const userId = activeUser ? activeUser.id : 'guest';
        const storageKey = `interval_samples_progress_${userId}`;
        let userProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');

        if (!userProgress[sampleKey]) {
            userProgress[sampleKey] = { score: 0, streak: 0, stage: 'seed' };
        }

        if (answerId === q.target.id) {
            window.GameState.score += 10;
            window.GameState.streak += 1;

            let itemData = userProgress[sampleKey];
            itemData.streak = (itemData.streak || 0) + 1;
            if (itemData.streak === 1) {
                itemData.stage = 'sprout';
                itemData.score = 1;
            } else if (itemData.streak === 2) {
                itemData.stage = 'tree';
                itemData.score = 3;
            } else if (itemData.streak >= 3) {
                itemData.stage = 'flower';
                itemData.score = 6;
            }
            localStorage.setItem(storageKey, JSON.stringify(userProgress));

            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! ${q.target.icon} ${q.target.name} (${q.target.desc})</span>`;
            setTimeout(() => renderGameUI(), 1000);
        } else {
            window.GameState.streak = 0;
            let itemData = userProgress[sampleKey];
            itemData.streak = 0;
            localStorage.setItem(storageKey, JSON.stringify(userProgress));

            feedback.innerHTML = `<span style="color: #ef4444;">❌ Chưa đúng! Đáp án là: ${q.target.icon} ${q.target.name}</span>`;
        }
    };

    // --- GAME 4: SCALE MATCH (3 LEVELS + 2 PLAYBACK MODES: SCALE RUN & MELODY/LICK + 3 MULTIPLE CHOICE) ---
    const SCALE_LEVELS = {
        lvl1: [
            { id: 'major', icon: '☀️', name: 'Âm Giai Trưởng (Major Scale)', desc: 'Vui vẻ, sáng sủa, hào hùng, trọn vẹn', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
            { id: 'natural_minor', icon: '🌧️', name: 'Âm Giai Thứ Tự Nhiên (Natural Minor)', desc: 'Buồn bã, da diết, tối tăm', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
            { id: 'major_pentatonic', icon: '🎋', name: 'Ngũ Cung Trưởng (Major Pentatonic)', desc: 'Đậm chất Dân ca, Á Đông, thoáng vãng', intervals: [0, 2, 4, 7, 9, 12] }
        ],
        lvl2: [
            { id: 'harmonic_minor', icon: '🏜️', name: 'Thứ Hòa Âm (Harmonic Minor)', desc: 'Ma mị, sa mạc Ai Cập, Trung Đông', intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
            { id: 'melodic_minor', icon: '🎻', name: 'Thứ Giai Điệu (Melodic Minor)', desc: 'Đầu buồn (Thứ), kết vút sáng (Trưởng)', intervals: [0, 2, 3, 5, 7, 9, 11, 12] },
            { id: 'minor_pentatonic', icon: '🎸', name: 'Ngũ Cung Thứ (Minor Pentatonic)', desc: 'Gai góc, mạnh mẽ, Solo Rock/Pop', intervals: [0, 3, 5, 7, 10, 12] }
        ],
        lvl3: [
            { id: 'blues', icon: '🎷', name: 'Âm Giai Blues (Blues Scale)', desc: 'Lả lướt, bụi bặm (Có nốt Blue chói)', intervals: [0, 3, 5, 6, 7, 10, 12] },
            { id: 'dorian', icon: '✨', name: 'Điệu Thức Dorian (Dorian Mode)', desc: 'Âm giai Thứ sáng sủa, bồng bềnh, Celtic', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
            { id: 'mixolydian', icon: '🕶️', name: 'Điệu Thức Mixolydian (Mixolydian)', desc: 'Âm giai Trưởng lười biếng, bụi bặm', intervals: [0, 2, 4, 5, 7, 9, 10, 12] }
        ]
    };

    function getScalePool(level) {
        if (level === 1) return SCALE_LEVELS.lvl1;
        if (level === 2) return SCALE_LEVELS.lvl2;
        return SCALE_LEVELS.lvl3;
    }

    window.setScalePlaybackMode = function(mode) {
        window.GameState.scalePlaybackMode = mode;
        renderGameUI();
    };

    function generateScaleQuestion(cardBody) {
        const lvl = window.GameState.level || 1;
        const pool = getScalePool(lvl);
        const allPool = [...SCALE_LEVELS.lvl1, ...SCALE_LEVELS.lvl2, ...SCALE_LEVELS.lvl3];

        const target = pool[Math.floor(Math.random() * pool.length)];

        // Select 2 wrong distractors to form exactly 3 multiple choice options
        let otherScales = pool.filter(x => x.id !== target.id);
        if (otherScales.length < 2) {
            otherScales = allPool.filter(x => x.id !== target.id);
        }
        otherScales.sort(() => Math.random() - 0.5);
        const options = [target, otherScales[0], otherScales[1]];
        options.sort(() => Math.random() - 0.5);

        const NATURAL_ROOTS = [60, 62, 64, 65, 67, 69, 71];
        const rootMidi = NATURAL_ROOTS[Math.floor(Math.random() * NATURAL_ROOTS.length)];
        const mode = window.GameState.scalePlaybackMode || 'run'; // 'run' (Scale Run) or 'lick' (Melody/Lick)

        window.GameState.currentQuestion = { target, rootMidi, mode, options };

        const modeBtnStyle = (m) => mode === m
            ? 'background: linear-gradient(135deg, #eab308, #ca8a04); color: white; border: none; font-weight: 800; padding: 8px 18px; border-radius: 20px; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35); cursor: pointer;'
            : 'background: white; color: #475569; border: 2px solid #cbd5e1; font-weight: 700; padding: 8px 18px; border-radius: 20px; cursor: pointer;';

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <!-- Playback Mode Switcher -->
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #fefce8; padding: 12px; border-radius: 16px; border: 1px solid #fef08a;">
                    <span style="font-weight: 800; color: #713f12; font-size: 0.95rem;">🎧 Chế Độ Luyện Âm Giai:</span>
                    <button onclick="window.setScalePlaybackMode('run')" style="${modeBtnStyle('run')}">📖 Chế Độ Học (Scale Run)</button>
                    <button onclick="window.setScalePlaybackMode('lick')" style="${modeBtnStyle('lick')}">🎸 Chế Độ Thực Chiến (Melody/Lick)</button>
                </div>

                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎹 Luyện Tai Âm Giai (Scale Match) — Level ${lvl}:</h3>
                <p style="color: #64748b; font-size: 0.95rem; margin-top: -5px;">
                    ${mode === 'run' ? 'Nghe chuỗi nốt chạy lần lượt và đoán loại Âm Giai:' : 'Nghe câu giai điệu thực chiến (Melody / Lick) 3 giây & chọn loại Âm Giai phù hợp:'}
                </p>
                
                <button onclick="window.playScaleQuestionSound()" style="font-size: 1.2rem; padding: 16px 36px; border-radius: 30px; background: linear-gradient(135deg, #eab308, #d97706); color: white; border: none; cursor: pointer; font-weight: 800; margin: 10px 0 20px 0; box-shadow: 0 8px 20px rgba(234, 179, 8, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px) scale(1.03)'" onmouseout="this.style.transform='none'">
                    🔊 Nghe Âm Giai ${mode === 'run' ? '(Scale Run)' : '(Câu Giai Điệu Lick)'}
                </button>

                <div id="game-feedback" style="min-height: 36px; font-weight: 800; font-size: 1.2rem; margin-bottom: 15px;"></div>

                <!-- Exactly 3 Multiple Choice Options -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; max-width: 780px; margin: 10px auto 0 auto;">
                    ${options.map((item) => `
                        <button onclick="window.checkScaleAnswer('${item.id}')" style="padding: 20px 16px; border-radius: 20px; border: 3px solid #fef08a; background: linear-gradient(135deg, #ffffff, #fefce8); font-weight: 800; font-size: 1.08rem; cursor: pointer; color: #854d0e; box-shadow: 0 6px 16px rgba(234,179,8,0.15); transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='#eab308';" onmouseout="this.style.transform='none'; this.style.borderColor='#fef08a';">
                            <span style="font-size: 1.4rem;">${item.icon} ${item.name}</span>
                            <span style="font-size: 0.85rem; font-weight: 600; color: #475569;">${item.desc}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.playScaleQuestionSound();
    }

    window.playScaleQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (!q) return;

        const mode = q.mode || 'run';
        if (mode === 'run') {
            const seq = q.target.intervals.map(i => q.rootMidi + i);
            playSequence(seq, 0.32);
        } else if (mode === 'lick') {
            const intervals = q.target.intervals;
            const root = q.rootMidi;
            const lickIndices = [0, 2, 4, 3, 5, 4, 0].map(idx => idx % intervals.length);
            const lickNotes = lickIndices.map(i => root + intervals[i]);
            playSequence(lickNotes, 0.28);
        }
    };

    window.checkScaleAnswer = function(answerId) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        if (answerId === q.target.id) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! ${q.target.icon} ${q.target.name} (${q.target.desc})</span>`;
            setTimeout(() => renderGameUI(), 1000);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Chưa đúng! Đáp án là: ${q.target.icon} ${q.target.name}</span>`;
        }
    };

    // --- GAME 5: CHORD MATCH ---
    const CHORDS = [
        { name: 'Hợp Âm Trưởng (Major Triad)', semitones: [0, 4, 7] },
        { name: 'Hợp Âm Thứ (Minor Triad)', semitones: [0, 3, 7] },
        { name: 'Hợp Âm Giảm (Diminished)', semitones: [0, 3, 6] },
        { name: 'Hợp Âm Bảy Trưởng (Major 7th)', semitones: [0, 4, 7, 11] }
    ];

    function generateChordQuestion(cardBody) {
        const target = CHORDS[Math.floor(Math.random() * CHORDS.length)];
        const rootMidi = 60;
        window.GameState.currentQuestion = { target, rootMidi };

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎼 Nghe hòa âm & xác định loại Hợp Âm (Chord):</h3>
                
                <button onclick="window.playChordQuestionSound()" style="font-size: 1.15rem; padding: 14px 30px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; cursor: pointer; font-weight: 800; margin: 15px 0; box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
                    🔊 Nghe Lại Hợp Âm
                </button>

                <div id="game-feedback" style="min-height: 32px; font-weight: 800; font-size: 1.2rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 15px;">
                    ${CHORDS.map((item, idx) => `
                        <button onclick="window.checkChordAnswer(${idx})" style="padding: 18px; border-radius: 16px; border: 2.5px solid #e9d5ff; background: linear-gradient(135deg, #faf5ff, #f3e8ff); font-weight: 800; font-size: 1.05rem; cursor: pointer; color: #6b21a8; box-shadow: 0 4px 12px rgba(168,85,247,0.2); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='none'">
                            ${item.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.playChordQuestionSound();
    }

    window.playChordQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (q) {
            const chordMidis = q.target.semitones.map(s => q.rootMidi + s);
            playChord(chordMidis, 1.2);
        }
    };

    window.checkChordAnswer = function(idx) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        if (CHORDS[idx].name === q.target.name) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! Bạn nhận biết đúng ${q.target.name}</span>`;
            setTimeout(() => renderGameUI(), 900);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Chưa chính xác! Đáp án đúng là: ${q.target.name}</span>`;
        }
    };

    window.playTheoryIntervalSound = function(semi) {
        const rootMidi = 60; // C4
        playSequence([rootMidi, rootMidi + semi], 0.55);
    };

    // --- GAME THEORY RENDERER WITH SHEET MUSIC DEMOS ---
    function renderGameTheory(gameId) {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        let htmlContent = '';

        if (gameId === 'ledger') {
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">📖 Lý Thuyết Dòng Kẻ Phụ & Tên Nốt Nhạc (Theo Level)</h3>
                    <p style="font-size: 1rem; color: #475569;">Dưới đây là vị trí và tên gọi từng nốt nhạc trên <b>Khóa Sol (3 Level)</b> và <b>Khóa Fa (3 Level)</b>:</p>
                    
                    <!-- DEMO 1: KHÓA SOL LEVEL 1 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #fff1f2, #fff7ed); padding: 20px; border-radius: 16px; border: 2px solid #fecdd3;">
                        <h4 style="margin: 0 0 10px 0; color: #e11d48; font-size: 1.15rem; font-weight: 800;">🎼 1. Khóa Sol — Level 1 (Dễ: 14 nốt C D E F G A B c d e f g a b):</h4>
                        <div id="theory-treble-lvl1-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #fda4af;"></div>
                    </div>

                    <!-- DEMO 2: KHÓA SOL LEVEL 2 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #fefce8, #fff7ed); padding: 20px; border-radius: 16px; border: 2px solid #fef08a;">
                        <h4 style="margin: 0 0 10px 0; color: #a16207; font-size: 1.15rem; font-weight: 800;">🎼 2. Khóa Sol — Level 2 (Vừa: Dòng phụ phía trên c' d' e' f' g' a' b'):</h4>
                        <div id="theory-treble-lvl2-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #facc15;"></div>
                    </div>

                    <!-- DEMO 3: KHÓA SOL LEVEL 3 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #faf5ff, #f3e8ff); padding: 20px; border-radius: 16px; border: 2px solid #e9d5ff;">
                        <h4 style="margin: 0 0 10px 0; color: #7e22ce; font-size: 1.15rem; font-weight: 800;">🎼 3. Khóa Sol — Level 3 (Khó: Dòng phụ trầm B, A, G, F, E, D, C,):</h4>
                        <div id="theory-treble-lvl3-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #c084fc;"></div>
                    </div>

                    <!-- DEMO 4: KHÓA FA LEVEL 1 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px; border-radius: 16px; border: 2px solid #bfdbfe;">
                        <h4 style="margin: 0 0 10px 0; color: #1d4ed8; font-size: 1.15rem; font-weight: 800;">𝄢 4. Khóa Fa — Level 1 (Dễ: 13 nốt từ E,, đến C):</h4>
                        <div id="theory-bass-lvl1-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #93c5fd;"></div>
                    </div>

                    <!-- DEMO 5: KHÓA FA LEVEL 2 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 16px; border: 2px solid #bbf7d0;">
                        <h4 style="margin: 0 0 10px 0; color: #15803d; font-size: 1.15rem; font-weight: 800;">𝄢 5. Khóa Fa — Level 2 (Vừa: 6 nốt D đến B trên dòng phụ):</h4>
                        <div id="theory-bass-lvl2-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #4ade80;"></div>
                    </div>

                    <!-- DEMO 6: KHÓA FA LEVEL 3 -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #fff7ed, #ffedd5); padding: 20px; border-radius: 16px; border: 2px solid #fed7aa;">
                        <h4 style="margin: 0 0 10px 0; color: #c2410c; font-size: 1.15rem; font-weight: 800;">𝄢 6. Khóa Fa — Level 3 (Khó: 6 nốt D,, hạ xuống trầm F,,,):</h4>
                        <div id="theory-bass-lvl3-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #fb923c;"></div>
                    </div>
                </div>
            `;
        } else if (gameId === 'rhythm') {
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800;">📖 Lý Thuyết Tiết Tấu & Trường Độ Nốt Nhạc</h3>
                    <p style="font-size: 1rem; color: #475569;">Mỗi loại nốt nhạc đại diện cho một độ dài thời gian (trường độ) khác nhau:</p>
                    
                    <div style="margin: 20px 0; background: linear-gradient(135deg, #ecfeff, #eff6ff); padding: 20px; border-radius: 16px; border: 2px solid #a5f3fc;">
                        <div id="theory-rhythm-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #38bdf8;"></div>
                    </div>
                </div>
            `;
        } else if (gameId === 'interval') {
            window.GameState.intervalTheorySubTab = window.GameState.intervalTheorySubTab || 'guide';
            const subTab = window.GameState.intervalTheorySubTab;

            const activeBtnStyle = 'background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; font-weight: 800; padding: 10px 22px; border-radius: 20px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35); cursor: pointer; transition: all 0.2s;';
            const inactiveBtnStyle = 'background: white; color: #475569; font-weight: 700; border-radius: 20px; border: 2px solid #cbd5e1; padding: 10px 22px; cursor: pointer; transition: all 0.2s;';

            let subTabHeader = `
                <div style="display: flex; gap: 12px; margin-bottom: 22px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.switchIntervalTheorySubTab('guide')" style="${subTab === 'guide' ? activeBtnStyle : inactiveBtnStyle}">📘 Cẩm Nang Lý Thuyết Quãng Âm (5 Mục Cốt Lõi)</button>
                    <button onclick="window.switchIntervalTheorySubTab('staves')" style="${subTab === 'staves' ? activeBtnStyle : inactiveBtnStyle}">🎼 12 Quãng Âm Chi Tiết & Sheet Nhạc</button>
                </div>
            `;

            if (subTab === 'guide') {
                htmlContent = subTabHeader + `
                    <div style="background: white; padding: 32px; border-radius: 24px; border: 2px solid #e2e8f0; line-height: 1.8; color: #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        <!-- HEADER BANNER -->
                        <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 24px; border-radius: 20px; margin-bottom: 28px; box-shadow: 0 10px 25px rgba(2,132,199,0.3);">
                            <span style="background: #facc15; color: #431407; font-weight: 800; padding: 4px 14px; border-radius: 14px; font-size: 0.85rem;">🎓 GIÁO TRÌNH NHẠC VIỆN</span>
                            <h2 style="margin: 8px 0 0 0; color: white; font-size: 1.7rem; font-weight: 800;">Cẩm Nang Lý Thuyết Quãng Âm (Interval Guide)</h2>
                            <p style="margin: 6px 0 0 0; color: #e0f2fe; font-weight: 600; font-size: 1rem;">Nền tảng tối thượng của Cảm Âm (Relative Pitch), Âm Giai (Scale) và Hợp Âm (Chord)</p>
                        </div>

                        <!-- MỤC 1: QUÃNG LÀ GÌ -->
                        <div style="margin-bottom: 28px; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 24px; border-radius: 20px; border: 2px solid #bfdbfe;">
                            <h3 style="margin-top: 0; color: #1d4ed8; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                1️⃣ Quãng (Interval) Là Gì?
                            </h3>
                            <p style="font-size: 1rem; color: #334155; margin-bottom: 14px;">
                                <b>Quãng</b> đơn giản là khoảng cách về cao độ giữa hai nốt nhạc, được tính bằng số lượng tên nốt (hoặc số bậc trên khuông nhạc) mà chúng trải dài qua.
                            </p>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #93c5fd; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                                    <h4 style="margin: 0 0 6px 0; color: #0284c7; font-weight: 800;">📈 Quãng Giai Điệu (Melodic Interval)</h4>
                                    <p style="margin: 0; font-size: 0.92rem; color: #475569;">Hai nốt vang lên <b>lần lượt</b> (nốt này sau nốt kia), tạo thành xương sống của các câu hát bắt tai.</p>
                                </div>
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #93c5fd; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                                    <h4 style="margin: 0 0 6px 0; color: #7e22ce; font-weight: 800;">🎹 Quãng Hòa Âm (Harmonic Interval)</h4>
                                    <p style="margin: 0; font-size: 0.92rem; color: #475569;">Hai nốt vang lên <b>cùng một lúc</b>, tạo ra cấu trúc chiều dọc của bản nhạc (chính là hợp âm).</p>
                                </div>
                            </div>
                        </div>

                        <!-- MỤC 2: TẠI SAO QUÃNG LẠI LÀ BÀI HỌC QUAN TRỌNG NHẤT -->
                        <div style="margin-bottom: 28px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 24px; border-radius: 20px; border: 2px solid #bbf7d0;">
                            <h3 style="margin-top: 0; color: #15803d; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                2️⃣ Tại Sao Quãng Lại Là Bài Học Quan Trọng Nhất?
                            </h3>
                            <p style="font-size: 1rem; color: #166534; margin-bottom: 14px;">
                                Nếu Âm giai (Scale) là <i>"bảng chữ cái"</i>, thì <b>Quãng chính là ngữ pháp</b> tạo nên mọi thứ trong âm nhạc. Nắm vững Quãng mang lại cho bạn <b>4 siêu năng lực</b>:
                            </p>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                                    <div style="font-weight: 800; color: #15803d; font-size: 1.02rem; margin-bottom: 4px;">👂 1. Chìa Khóa Cảm Âm (Relative Pitch)</div>
                                    <div style="font-size: 0.9rem; color: #475569;">Nhạc công chuyên nghiệp không nhớ vẹt từng nốt rời rạc, họ nghe khoảng cách (Quãng). Mở đầu bài hát bằng Quãng 5 Đúng (Star Wars), họ có thể dò giai điệu cực kỳ chuẩn xác!</div>
                                </div>
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                                    <div style="font-weight: 800; color: #15803d; font-size: 1.02rem; margin-bottom: 4px;">⚡ 2. "Hack" Công Thức Hợp Âm</div>
                                    <div style="font-size: 0.9rem; color: #475569;">Mọi hợp âm đều là các quãng xếp chồng lên nhau. Biết Quãng, bạn tự xếp được mọi hợp âm trên đời không cần học vẹt (VD: Hợp âm trưởng = Nốt gốc + Q3 trưởng + Q5 đúng).</div>
                                </div>
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                                    <div style="font-weight: 800; color: #15803d; font-size: 1.02rem; margin-bottom: 4px;">🎤 3. Tuyệt Chiêu Hát Bè / Đánh Bè</div>
                                    <div style="font-size: 0.9rem; color: #475569;">Để hát bè hòa quyện, người ta thường hát cao hơn nốt giai điệu chính một khoảng Quãng 3 hoặc Quãng 6.</div>
                                </div>
                                <div style="background: white; padding: 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                                    <div style="font-weight: 800; color: #15803d; font-size: 1.02rem; margin-bottom: 4px;">🔄 4. Dịch Giọng (Transpose) Siêu Tốc</div>
                                    <div style="font-size: 0.9rem; color: #475569;">Khi đổi tông bài hát từ Đô sang Rê, các nốt thực tế thay đổi, nhưng Quãng giữa các bậc nốt giữ nguyên. Tư duy Quãng giúp bạn nâng/hạ tông mọi bài hát dễ như trở bàn tay.</div>
                                </div>
                            </div>
                        </div>

                        <!-- MỤC 3: TAM GIÁC THẦN THÁNH -->
                        <div style="margin-bottom: 28px; background: linear-gradient(135deg, #fff7ed, #ffedd5); padding: 24px; border-radius: 20px; border: 2px solid #fed7aa;">
                            <h3 style="margin-top: 0; color: #c2410c; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                3️⃣ Tam Giác Thần Thánh: Interval — Scale — Chord
                            </h3>
                            <p style="font-size: 1rem; color: #9a3412; margin-bottom: 14px;">
                                Để dễ hình dung nhất, hãy tưởng tượng âm nhạc là quá trình xây dựng một ngôi nhà:
                            </p>
                            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                                <div style="background: white; padding: 14px 18px; border-radius: 14px; border-left: 6px solid #f97316; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                                    <b>Cấp độ 1: INTERVAL (Quãng) — "Viên gạch":</b> Đơn vị đo lường nhỏ nhất.
                                </div>
                                <div style="background: white; padding: 14px 18px; border-radius: 14px; border-left: 6px solid #eab308; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                                    <b>Cấp độ 2: SCALE (Âm giai) — "Kho vật liệu":</b> Là một chuỗi các Interval xếp nối tiếp theo chiều ngang. Khi chọn một Scale (VD: Đô Trưởng), bạn quy định chỉ được dùng 7 viên gạch cụ thể để xây nhà, 5 viên gạch đen bị loại.
                                </div>
                                <div style="background: white; padding: 14px 18px; border-radius: 14px; border-left: 6px solid #a855f7; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                                    <b>Cấp độ 3: CHORD (Hợp âm) — "Bức tường":</b> Là việc bốc các viên gạch (nốt nhạc) từ trong Scale ra, xếp chồng chúng lên nhau theo chiều dọc bằng các Interval nhất định (thường là chồng Quãng 3) và đánh vang lên cùng lúc.
                                </div>
                            </div>
                            <div style="background: #ffedd5; padding: 14px 20px; border-radius: 14px; color: #9a3412; font-weight: 800; font-size: 1rem; text-align: center; border: 1.5px dashed #f97316;">
                                🎯 TÓM LẠI: Interval kết hợp lại tạo ra Scale ➔ Lấy các nốt trong Scale nối với nhau bằng Interval ➔ Sinh ra Chord!
                            </div>
                        </div>

                        <!-- MỤC 4: BẢNG TRA CỨU 12 QUÃNG NỬA CUNG -->
                        <div style="margin-bottom: 28px; background: linear-gradient(135deg, #fefce8, #fff7ed); padding: 24px; border-radius: 20px; border: 2px solid #fef08a;">
                            <h3 style="margin-top: 0; color: #a16207; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                4️⃣ Bảng Tra Cứu 12 Quãng Nửa Cung (Chromatic Intervals)
                            </h3>
                            <p style="font-size: 1rem; color: #854d0e; margin-bottom: 16px;">
                                Nằm gọn trong một quãng 8, có 12 quãng riêng biệt đo bằng số lượng nửa cung (half steps). Mỗi độ rộng mang một "tính chất" (Đúng, Trưởng, Thứ, Tăng, Giảm) tạo ra những cảm xúc khác nhau:
                            </p>

                            <!-- CHROMATIC TABLE -->
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.04); font-size: 0.92rem;">
                                    <thead>
                                        <tr style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; text-align: left;">
                                            <th style="padding: 12px 14px; text-align: center;">Nửa Cung</th>
                                            <th style="padding: 12px 14px; text-align: center;">Ký Hiệu</th>
                                            <th style="padding: 12px 14px;">Tên Quãng (Việt - Anh)</th>
                                            <th style="padding: 12px 14px; text-align: center;">Ví Dụ (từ C)</th>
                                            <th style="padding: 12px 14px;">Đặc Điểm Âm Thanh</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">0</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">P1</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 1 Đúng (Perfect Unison)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ C</code></td><td style="padding: 10px 14px; color: #475569;">Hoàn toàn đồng âm</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">1</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">m2</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 2 Thứ (Minor 2nd)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ D♭</code></td><td style="padding: 10px 14px; color: #475569;">Căng thẳng, chói tai (Jaws)</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">2</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">M2</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 2 Trưởng (Major 2nd)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ D</code></td><td style="padding: 10px 14px; color: #475569;">Tiến bước nhẹ nhàng</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">3</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">m3</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 3 Thứ (Minor 3rd)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ E♭</code></td><td style="padding: 10px 14px; color: #475569;">Tối tăm, buồn bã</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">4</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">M3</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 3 Trưởng (Major 3rd)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ E</code></td><td style="padding: 10px 14px; color: #475569;">Sáng sủa, vui vẻ</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">5</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">P4</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 4 Đúng (Perfect 4th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ F</code></td><td style="padding: 10px 14px; color: #475569;">Hào hùng, ổn định (Nhạc Cưới)</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">6</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">A4/d5</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 3 Cung (Tritone)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ F♯</code></td><td style="padding: 10px 14px; color: #475569;">Cực kỳ ma mị, bất ổn</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">7</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">P5</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 5 Đúng (Perfect 5th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ G</code></td><td style="padding: 10px 14px; color: #475569;">Rộng lớn, uy nghi (Star Wars)</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">8</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">m6</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 6 Thứ (Minor 6th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ A♭</code></td><td style="padding: 10px 14px; color: #475569;">Trầm ngâm, da diết</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">9</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">M6</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 6 Trưởng (Major 6th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ A</code></td><td style="padding: 10px 14px; color: #475569;">Lãng mạn, ngọt ngào (My Bonnie)</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">10</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">m7</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 7 Thứ (Minor 7th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ B♭</code></td><td style="padding: 10px 14px; color: #475569;">Bụi bặm (đậm chất Blues)</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;"><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">11</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">M7</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 7 Trưởng (Major 7th)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ B</code></td><td style="padding: 10px 14px; color: #475569;">Bay bổng, sang trọng</td></tr>
                                        <tr><td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0284c7;">12</td><td style="padding: 10px 14px; text-align: center; font-weight: 800;">P8</td><td style="padding: 10px 14px; font-weight: 800;">Quãng 8 Đúng (Perfect Octave)</td><td style="padding: 10px 14px; text-align: center;"><code>C ➔ c</code></td><td style="padding: 10px 14px; color: #475569;">Trong vắt, hòa quyện</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- MỤC 5: PHƯƠNG PHÁP THỰC HÀNH -->
                        <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); padding: 24px; border-radius: 20px; border: 2px solid #e9d5ff;">
                            <h3 style="margin-top: 0; color: #7e22ce; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                5️⃣ Phương Pháp Thực Hành (Luyện Tai)
                            </h3>
                            <p style="font-size: 1rem; color: #6b21a8; margin-bottom: 14px;">
                                Cách hiệu quả nhất để nạp âm thanh của các quãng vào não bộ là <b>gắn chúng với các bài hát quen thuộc</b>:
                            </p>
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: white; padding: 12px 18px; border-radius: 12px; border: 1.5px solid #d8b4fe;">
                                    <b>🔔 Quãng 4 Đúng (P4):</b> Nghe giống 2 nốt mở đầu của bản nhạc kèn đám cưới <i>"Here Comes the Bride"</i>.
                                </div>
                                <div style="background: white; padding: 12px 18px; border-radius: 12px; border: 1.5px solid #d8b4fe;">
                                    <b>⚔️ Quãng 5 Đúng (P5):</b> Nghe giống tiếng kèn vang dội mở đầu nhạc phim <i>"Star Wars"</i>.
                                </div>
                                <div style="background: white; padding: 12px 18px; border-radius: 12px; border: 1.5px solid #d8b4fe;">
                                    <b>🕊️ Quãng 6 Trưởng (M6):</b> Nghe giống 2 nốt mở đầu của bài <i>"My Bonnie Lies Over the Ocean"</i>.
                                </div>
                            </div>
                            <p style="margin: 0; font-size: 0.95rem; color: #581c87; font-weight: 600; background: #f3e8ff; padding: 14px; border-radius: 14px; border: 1px dashed #c084fc;">
                                💡 Hãy tự tạo ra những mối liên hệ này với các bài hát bạn yêu thích. Qua luyện tập, âm thanh của chúng sẽ tự động biến thành phản xạ tự nhiên của bạn (Relative Pitch), giúp bạn nghe thấu mọi cấu trúc bài hát mà không cần nhìn vào sheet nhạc!
                            </p>
                        </div>
                    </div>
                `;
            } else {
                const intervalsTheoryData = [
                    {
                        lvlName: '🎼 Level 1 (Dễ — Nền Tảng & Rõ Rệt)',
                        color: '#0284c7', bg: 'linear-gradient(135deg, #ecfeff, #eff6ff)', border: '#a5f3fc',
                        items: [
                            { id: 'P8', name: 'Quãng 8 Đúng (P8 / Octave)', semi: 12, desc: 'Dễ nhất. Nghe y hệt 1 nốt nhạc nhưng độ cao chênh nhau hẳn 1 quãng 8.', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC c | [Cc]2 |\nw: Đô4 Đô5 | Octave(P8)' },
                            { id: 'P5', name: 'Quãng 5 Đúng (P5 / Perfect 5th)', semi: 7, desc: 'Nghe rất oai vệ, vang dội, rỗng (Ví dụ: Nhạc Star Wars).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC G | [CG]2 |\nw: Đô4 Son4 | 5-Đúng(P5)' },
                            { id: 'P4', name: 'Quãng 4 Đúng (P4 / Perfect 4th)', semi: 5, desc: 'Nghe vươn lên, ổn định (Ví dụ: Nhạc Cưới).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC F | [CF]2 |\nw: Đô4 Pha4 | 4-Đúng(P4)' },
                            { id: 'M3', name: 'Quãng 3 Trưởng (M3 / Major 3rd)', semi: 4, desc: 'Cảm xúc VUI, tươi sáng, rực rỡ.', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC E | [CE]2 |\nw: Đô4 Mi4 | 3-Trưởng(M3)' },
                            { id: 'm3', name: 'Quãng 3 Thứ (m3 / Minor 3rd)', semi: 3, desc: 'Cảm xúc BUỒN, u trầm, tối.', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _E | [C_E]2 |\nw: Đô4 Mi♭4 | 3-Thứ(m3)' }
                        ]
                    },
                    {
                        lvlName: '🎼 Level 2 (Trung Cấp — Bước Đi & Bay Bổng)',
                        color: '#a16207', bg: 'linear-gradient(135deg, #fefce8, #fff7ed)', border: '#fef08a',
                        items: [
                            { id: 'm2', name: 'Quãng 2 Thứ (m2 / Minor 2nd)', semi: 1, desc: 'Cực kỳ căng thẳng, ma quái (Nhạc phim Cá mập Jaws).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _D | [C_D]2 |\nw: Đô4 Rê♭4 | 2-Thứ(m2)' },
                            { id: 'M2', name: 'Quãng 2 Trưởng (M2 / Major 2nd)', semi: 2, desc: 'Nghe như bước đi bình thường lên bậc thang (Nốt Đô lên Rê).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC D | [CD]2 |\nw: Đô4 Rê4 | 2-Trưởng(M2)' },
                            { id: 'M6', name: 'Quãng 6 Trưởng (M6 / Major 6th)', semi: 9, desc: 'Bay bổng rực rỡ (Rất phổ biến trong các bản nhạc Ballad).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC A | [CA]2 |\nw: Đô4 La4 | 6-Trưởng(M6)' },
                            { id: 'm6', name: 'Quãng 6 Thứ (m6 / Minor 6th)', semi: 8, desc: 'U buồn da diết, đòi hỏi giữ nốt đầu tiên trong đầu.', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _A | [C_A]2 |\nw: Đô4 La♭4 | 6-Thứ(m6)' }
                        ]
                    },
                    {
                        lvlName: '🎼 Level 3 (Khó — Mâu Thuẫn & Căng Thẳng)',
                        color: '#be123c', bg: 'linear-gradient(135deg, #fff1f2, #fff7ed)', border: '#fecdd3',
                        items: [
                            { id: 'M7', name: 'Quãng 7 Trưởng (M7 / Major 7th)', semi: 11, desc: 'Nghe cực kỳ chói, gào thét đòi giải quyết vọt lên Quãng 8.', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC B | [CB]2 |\nw: Đô4 Si4 | 7-Trưởng(M7)' },
                            { id: 'm7', name: 'Quãng 7 Thứ (m7 / Minor 7th)', semi: 10, desc: 'Bụi bặm, lang bạt (Đậm chất Blues / Funk).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _B | [C_B]2 |\nw: Đô4 Si♭4 | 7-Thứ(m7)' },
                            { id: 'TT', name: 'Quãng 3 Cung / Tritone (A4/d5)', semi: 6, desc: 'Quãng ma mị & bất ổn nhất thế giới âm nhạc (Điềm dữ / Nghi vấn).', abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC ^F | [C^F]2 |\nw: Đô4 Pha♯4 | Tritone(TT)' }
                        ]
                    }
                ];

                let theoryHTML = subTabHeader + `
                    <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800;">📖 Lý Thuyết Chi Tiết Từng Quãng Âm (Ear Training Intervals)</h3>
                        
                        <!-- 21 AUDIO MATERIALS PEDAGOGICAL BANNER -->
                        <div style="margin: 16px 0 24px 0; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 18px 22px; border-radius: 16px; border: 2px solid #86efac; color: #166534;">
                            <h4 style="margin: 0 0 8px 0; font-size: 1.12rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                💡 Tư Duy Ma Trận 21 Âm Thanh Nguyên Liệu / Quãng:
                            </h4>
                            <p style="margin: 0; font-size: 0.96rem; line-height: 1.6; font-weight: 600; color: #15803d;">
                                Với <b>7 nốt nhạc cơ bản</b> (Đô, Rê, Mi, Pha, Son, La, Si) làm nốt gốc, khi kết hợp cùng <b>3 hướng nghe</b> (📈 Nghe Lên, 📉 Nghe Xuống, 🎹 Nghe Song Song) ➔ Mỗi Quãng Âm được nạp tổng cộng <b>21 biến thể âm thanh nguyên liệu độc lập</b>! Giúp phát triển phản xạ cảm âm toàn diện.
                            </p>
                        </div>

                        <p style="font-size: 1rem; color: #475569;">Dưới đây là định nghĩa, tính chất cảm xúc và khuông nhạc chi tiết của <b>từng Quãng Âm</b> theo 3 Level:</p>
                `;

                intervalsTheoryData.forEach((section, sIdx) => {
                    theoryHTML += `
                        <div style="margin: 24px 0; background: ${section.bg}; padding: 22px; border-radius: 18px; border: 2px solid ${section.border};">
                            <h4 style="margin: 0 0 15px 0; color: ${section.color}; font-size: 1.2rem; font-weight: 800;">${section.lvlName}:</h4>
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                    `;

                    section.items.forEach((item, iIdx) => {
                        const paperId = `theory-interval-paper-${sIdx}-${iIdx}`;
                        theoryHTML += `
                            <div style="background: white; border-radius: 14px; padding: 18px; border: 1.5px solid ${section.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                                    <div style="font-weight: 800; color: ${section.color}; font-size: 1.08rem;">🎵 ${item.name}</div>
                                    <button onclick="window.playTheoryIntervalSound(${item.semi})" style="padding: 7px 18px; border-radius: 20px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
                                        🔊 Nghe Ví Dụ
                                    </button>
                                </div>
                                <div style="color: #475569; font-size: 0.95rem; margin-bottom: 12px; font-weight: 600;">💡 <i>${item.desc}</i></div>
                                <div id="${paperId}" style="min-height: 120px; background: #fafafa; border-radius: 10px; padding: 8px; border: 1px dashed ${section.border};"></div>
                            </div>
                        `;
                    });

                    theoryHTML += `</div></div>`;
                });

                theoryHTML += `</div>`;
                htmlContent = theoryHTML;
            }
        } else if (gameId === 'scale') {
            htmlContent = `
                <div style="background: white; padding: 32px; border-radius: 24px; border: 2px solid #e2e8f0; line-height: 1.8; color: #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <!-- HEADER -->
                    <div style="background: linear-gradient(135deg, #eab308, #ca8a04); color: white; padding: 24px; border-radius: 20px; margin-bottom: 28px; box-shadow: 0 10px 25px rgba(234,179,8,0.3);">
                        <span style="background: #fef08a; color: #713f12; font-weight: 800; padding: 4px 14px; border-radius: 14px; font-size: 0.85rem;">🎓 GIÁO TRÌNH LÝ THUYẾT ÂM GIAI</span>
                        <h2 style="margin: 8px 0 0 0; color: white; font-size: 1.7rem; font-weight: 800;">Cẩm Nang Lý Thuyết Âm Giai (Scales Guide — 3 Levels)</h2>
                        <p style="margin: 6px 0 0 0; color: #fefce8; font-weight: 600; font-size: 1rem;">Kho vật liệu cảm xúc trong âm nhạc từ Trưởng, Thứ đến Blues và các Điệu thức (Modes)</p>
                    </div>

                    <!-- BANNER 2 PLAYBACK MODES -->
                    <div style="margin-bottom: 28px; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 22px; border-radius: 18px; border: 2px solid #bfdbfe;">
                        <h4 style="margin: 0 0 8px 0; color: #1d4ed8; font-size: 1.15rem; font-weight: 800;">💡 2 Chế Độ Luyện Tai Âm Giai:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                            <div style="background: white; padding: 14px; border-radius: 12px; border: 1.5px solid #93c5fd;">
                                <b>📖 Chế Độ Học (Scale Run):</b> Máy phát lần lượt từng nốt từ thấp lên cao (hoặc từ cao xuống thấp) để bạn ghi nhớ màu sắc tổng thể.
                            </div>
                            <div style="background: white; padding: 14px; border-radius: 12px; border: 1.5px solid #93c5fd;">
                                <b>🎸 Chế Độ Thực Chiến (Melody/Lick):</b> Máy không chạy lần lượt nữa mà bốc các nốt tạo thành câu giai điệu ngắn 3s (Lick) vô cùng cuốn hút và thực tế!
                            </div>
                        </div>
                    </div>

                    <!-- LEVEL 1 -->
                    <div style="margin-bottom: 28px; background: linear-gradient(135deg, #fefce8, #fff7ed); padding: 22px; border-radius: 18px; border: 2px solid #fef08a;">
                        <h4 style="margin: 0 0 14px 0; color: #a16207; font-size: 1.2rem; font-weight: 800;">☀️ Level 1 (Người mới bắt đầu): Màu Sắc Cơ Bản & Cực Đoan</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #fde047;">
                                <b>☀️ Major Scale (Âm giai Trưởng):</b> Cảm xúc Vui vẻ, Sáng sủa, Hào hùng, Trọn vẹn. Công thức: <code>1 2 3 4 5 6 7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #fde047;">
                                <b>🌧️ Natural Minor Scale (Âm giai Thứ tự nhiên):</b> Cảm xúc Buồn bã, Da diết, Tối tăm. Công thức: <code>1 2 ♭3 4 5 ♭6 ♭7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #fde047;">
                                <b>🎋 Major Pentatonic (Ngũ cung Trưởng):</b> Đậm chất nhạc Dân ca, Á Đông (Việt Nam, Trung Quốc). Thiếu nửa cung nên rất thoáng. Công thức: <code>1 2 3 5 6 8</code>
                            </div>
                        </div>
                    </div>

                    <!-- LEVEL 2 -->
                    <div style="margin-bottom: 28px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 22px; border-radius: 18px; border: 2px solid #bbf7d0;">
                        <h4 style="margin: 0 0 14px 0; color: #15803d; font-size: 1.2rem; font-weight: 800;">🌿 Level 2 (Trung cấp): Sắc Thái Văn Hóa & Cổ Điển</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #86efac;">
                                <b>🏜️ Harmonic Minor (Thứ Hòa âm):</b> Đậm chất sa mạc Ai Cập, Ba Tư, Trung Đông ma mị. Công thức: <code>1 2 ♭3 4 5 ♭6 7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #86efac;">
                                <b>🎻 Melodic Minor (Thứ Giai điệu):</b> Đoạn đầu buồn (Thứ), đoạn kết vút lên sáng rực rỡ (Trưởng). Phổ biến trong nhạc Cổ điển. Công thức: <code>1 2 ♭3 4 5 6 7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #86efac;">
                                <b>🎸 Minor Pentatonic (Ngũ cung Thứ):</b> Gai góc, mạnh mẽ. Thang âm quốc dân của các bài Solo Guitar Rock/Pop. Công thức: <code>1 ♭3 4 5 ♭7 8</code>
                            </div>
                        </div>
                    </div>

                    <!-- LEVEL 3 -->
                    <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); padding: 22px; border-radius: 18px; border: 2px solid #e9d5ff;">
                        <h4 style="margin: 0 0 14px 0; color: #7e22ce; font-size: 1.2rem; font-weight: 800;">🎷 Level 3 (Khó / Cao cấp): Nhạc Jazz, Blues và các Mode</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #d8b4fe;">
                                <b>🎷 Blues Scale:</b> Ngũ cung Thứ + "nốt chói" (Blue note). Nghe lả lướt, bụi bặm, đường phố đặc trưng Blues/Jazz. Công thức: <code>1 ♭3 4 ♭5 5 ♭7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #d8b4fe;">
                                <b>✨ Dorian Mode:</b> Âm giai Thứ nâng cấp sáng sủa hơn. Bồng bềnh, thần tiên (Phim viễn tưởng, Celtic). Công thức: <code>1 2 ♭3 4 5 6 ♭7 8</code>
                            </div>
                            <div style="background: white; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #d8b4fe;">
                                <b>🕶️ Mixolydian Mode:</b> Âm giai Trưởng làm tối 1 nốt (♭7). Vui nhưng có chút bụi bặm, lười biếng. Công thức: <code>1 2 3 4 5 6 ♭7 8</code>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (gameId === 'chord') {
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800;">📖 Lý Thuyết Hợp Âm (Chords)</h3>
                    <p style="font-size: 1rem; color: #475569;">Hợp âm được tạo thành khi vang lên cùng lúc 3 nốt nhạc trở lên:</p>
                    
                    <div style="margin: 20px 0; background: linear-gradient(135deg, #fff7ed, #faf5ff); padding: 20px; border-radius: 16px; border: 2px solid #fed7aa;">
                        <div id="theory-chord-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #fb923c;"></div>
                    </div>
                </div>
            `;
        }

        cardBody.innerHTML = htmlContent;

        // Render Sheet Music Demos
        if (gameId === 'ledger') {
            const trebleLvl1Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nC D E F | G A B c | d e f g | a b |\nw: Đô(C) Rê(D) Mi(E) Pha(F) | Son(G) La(A) Si(B) Đô(c) | Rê(d) Mi(e) Pha(f) Son(g) | La(a) Si(b)`;
            const trebleLvl2Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nc' d' e' f' | g' a' b' |\nw: Đô(c') Rê(d') Mi(e') Pha(f') | Son(g') La(a') Si(b')`;
            const trebleLvl3Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nC, D, E, F, | G, A, B, |\nw: Đô(C,) Rê(D,) Mi(E,) Pha(F,) | Son(G,) La(A,) Si(B,)`;

            const bassLvl1Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=bass\nE,, F,, G,, A,, | B,, C, D, E, | F, G, A, B, | C |\nw: Mi(E,,) Pha(F,,) Son(G,,) La(A,,) | Si(B,,) Đô(C,) Rê(D,) Mi(E,) | Pha(F,) Son(G,) La(A,) Si(B,) | Đô(C)`;
            const bassLvl2Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=bass\nD E F G | A B |\nw: Rê(D) Mi(E) Pha(F) Son(G) | La(A) Si(B)`;
            const bassLvl3Abc = `X:1\nM:4/4\nL:1/4\nK:C clef=bass\nD,, C,, B,,, A,,, | G,,, F,,, |\nw: Rê(D,,) Đô(C,,) Si(B,,,) La(A,,,) | Son(G,,,) Pha(F,,,)`;

            renderTheoryAbcHelper('theory-treble-lvl1-paper', trebleLvl1Abc);
            renderTheoryAbcHelper('theory-treble-lvl2-paper', trebleLvl2Abc);
            renderTheoryAbcHelper('theory-treble-lvl3-paper', trebleLvl3Abc);
            
            renderTheoryAbcHelper('theory-bass-lvl1-paper', bassLvl1Abc);
            renderTheoryAbcHelper('theory-bass-lvl2-paper', bassLvl2Abc);
            renderTheoryAbcHelper('theory-bass-lvl3-paper', bassLvl3Abc);
        } else if (gameId === 'rhythm') {
            const rhythmAbc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nc c2 c/2 c/2 c4 |\nw: Nốt_Đen(1phách) Trắng(2phách) Móc_đơn(1/2) Móc_đơn(1/2) Tròn(4phách)`;
            renderTheoryAbcHelper('theory-rhythm-paper', rhythmAbc);
        } else if (gameId === 'interval') {
            const intervalsTheoryData = [
                { items: [
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC c | [Cc]2 |\nw: Đô4 Đô5 | Quãng_8(P8)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC G | [CG]2 |\nw: Đô4 Son4 | Quãng_5(P5)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC F | [CF]2 |\nw: Đô4 Pha4 | Quãng_4(P4)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC E | [CE]2 |\nw: Đô4 Mi4 | Quãng_3_Trưởng(M3)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _E | [C_E]2 |\nw: Đô4 Mi_giáng4 | Quãng_3_Thứ(m3)' }
                ]},
                { items: [
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _D | [C_D]2 |\nw: Đô4 Rê_giáng4 | Quãng_2_Thứ(m2)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC D | [CD]2 |\nw: Đô4 Rê4 | Quãng_2_Trưởng(M2)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC A | [CA]2 |\nw: Đô4 La4 | Quãng_6_Trưởng(M6)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _A | [C_A]2 |\nw: Đô4 La_giáng4 | Quãng_6_Thứ(m6)' }
                ]},
                { items: [
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC B | [CB]2 |\nw: Đô4 Si4 | Quãng_7_Trưởng(M7)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC _B | [C_B]2 |\nw: Đô4 Si_giáng4 | Quãng_7_Thứ(m7)' },
                    { abc: 'X:1\nM:4/4\nL:1/2\nK:C clef=treble\nC ^F | [C^F]2 |\nw: Đô4 Pha_thăng4 | Tritone(A4/d5)' }
                ]}
            ];

            intervalsTheoryData.forEach((sec, sIdx) => {
                sec.items.forEach((item, iIdx) => {
                    const paperId = `theory-interval-paper-${sIdx}-${iIdx}`;
                    renderTheoryAbcHelper(paperId, item.abc);
                });
            });
        } else if (gameId === 'scale') {
            const scaleAbc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nC D E F | G A B c |\nw: C D E F G A B c`;
            renderTheoryAbcHelper('theory-scale-paper', scaleAbc);
        } else if (gameId === 'chord') {
            const chordAbc = `X:1\nM:4/4\nL:1/1\nK:C clef=treble\n[CEG] [A,CE] [G,B,DF] |\nw: "Đô_Trưởng_(C)" "La_Thứ_(Am)" "Son_Bảy_(G7)"`;
            renderTheoryAbcHelper('theory-chord-paper', chordAbc);
        }
    }

    function renderTheoryAbcHelper(elementId, abcCode) {
        setTimeout(() => {
            const el = document.getElementById(elementId);
            const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
            if (el && abcRenderer) {
                el.innerHTML = '';
                abcRenderer.renderAbc(elementId, abcCode, {
                    responsive: 'resize',
                    scale: 1.3,
                    staffwidth: 520,
                    paddingtop: 15,
                    paddingbottom: 15,
                    add_classes: true
                });
            }
        }, 60);
    }

    // --- 6. FLASHCARD LEARNING MODULE ---
    window.GameState.flashcardClef = 'sol'; // 'sol' or 'fa'
    window.GameState.flashcardIndex = 0;
    window.GameState.flashcardFlipped = false;
    window.GameState.intervalFlashcardIndex = 0;
    window.GameState.intervalFlashcardFilter = 'ALL';
    window.GameState.intervalFlashcardFlipped = false;

    const INTERVAL_DETAILS = {
        'P8': { semi: 12, formula: '12 Nửa cung (6 Cung / 1 Octave)', song: 'Nhạc giao hưởng / Giống nốt gốc', abc: 'C c | [Cc]2 |' },
        'P5': { semi: 7, formula: '7 Nửa cung (3.5 Cung)', song: 'Star Wars Theme, Superman Theme', abc: 'C G | [CG]2 |' },
        'P4': { semi: 5, formula: '5 Nửa cung (2.5 Cung)', song: 'Nhạc Cưới (Here Comes the Bride)', abc: 'C F | [CF]2 |' },
        'M3': { semi: 4, formula: '4 Nửa cung (2 Cung)', song: 'Tiếng Chuông Đồng Đồng, Nhạc Vui', abc: 'C E | [CE]2 |' },
        'm3': { semi: 3, formula: '3 Nửa cung (1.5 Cung)', song: 'Greensleeves, Nhạc Buồn', abc: 'C _E | [C_E]2 |' },
        'm2': { semi: 1, formula: '1 Nửa cung (0.5 Cung)', song: 'Nhạc phim Jaws (Cá mập)', abc: 'C _D | [C_D]2 |' },
        'M2': { semi: 2, formula: '2 Nửa cung (1 Cung)', song: 'Bước đi bậc thang (Đô lên Rê)', abc: 'C D | [CD]2 |' },
        'M6': { semi: 9, formula: '9 Nửa cung (4.5 Cung)', song: 'Nhạc Ballad bay bổng, My Bonnie', abc: 'C A | [CA]2 |' },
        'm6': { semi: 8, formula: '8 Nửa cung (4 Cung)', song: 'Ballad hoài niệm, Love Story', abc: 'C _A | [C_A]2 |' },
        'M7': { semi: 11, formula: '11 Nửa cung (5.5 Cung)', song: 'Take On Me, Nhạc Jazz chói', abc: 'C B | [CB]2 |' },
        'm7': { semi: 10, formula: '10 Nửa cung (5 Cung)', song: 'Nhạc Blues / Funk bụi bặm', abc: 'C _B | [C_B]2 |' },
        'TT': { semi: 6, formula: '6 Nửa cung (3 Cung / Tritone)', song: 'Nhạc Phim The Simpsons, Quãng ma mị', abc: 'C ^F | [C^F]2 |' }
    };

    const GRANULAR_ROOTS = [
        { midi: 60, name: 'Đô4 (C4)', abc: 'C' },
        { midi: 62, name: 'Rê4 (D4)', abc: 'D' },
        { midi: 64, name: 'Mi4 (E4)', abc: 'E' },
        { midi: 65, name: 'Pha4 (F4)', abc: 'F' },
        { midi: 67, name: 'Son4 (G4)', abc: 'G' },
        { midi: 69, name: 'La4 (A4)', abc: 'A' },
        { midi: 71, name: 'Si4 (B4)', abc: 'B' }
    ];

    const GRANULAR_MODES = [
        { id: 'asc', name: '📈 Nghe Lên (Ascending)' },
        { id: 'desc', name: '📉 Nghe Xuống (Descending)' },
        { id: 'harm', name: '🎹 Nghe Song Song (Harmonic)' }
    ];

    function getGranularIntervalCards(level) {
        const baseIntervals = getIntervalPool(level);
        const granularCards = [];

        baseIntervals.forEach(item => {
            GRANULAR_ROOTS.forEach(r => {
                GRANULAR_MODES.forEach(m => {
                    granularCards.push({
                        sampleKey: `${item.id}_${r.abc}_${m.id}`,
                        intervalId: item.id,
                        intervalName: item.name,
                        intervalIcon: item.icon,
                        semi: item.semi,
                        desc: item.desc,
                        rootMidi: r.midi,
                        rootName: r.name,
                        rootAbc: r.abc,
                        modeId: m.id,
                        modeName: m.name
                    });
                });
            });
        });

        const filter = window.GameState.intervalFlashcardFilter || 'ALL';
        if (filter === 'ALL') return granularCards;
        return granularCards.filter(c => c.intervalId === filter);
    }

    window.toggleFlashcardFlip = function() {
        window.GameState.flashcardFlipped = !window.GameState.flashcardFlipped;
        const cardInner = document.getElementById('flashcard-inner');
        if (cardInner) {
            if (window.GameState.flashcardFlipped) {
                cardInner.style.transform = 'rotateY(180deg)';
            } else {
                cardInner.style.transform = 'rotateY(0deg)';
            }
        }
    };

    window.toggleIntervalFlashcardFlip = function() {
        window.GameState.intervalFlashcardFlipped = !window.GameState.intervalFlashcardFlipped;
        const cardInner = document.getElementById('flashcard-interval-inner');
        if (cardInner) {
            if (window.GameState.intervalFlashcardFlipped) {
                cardInner.style.transform = 'rotateY(180deg)';
            } else {
                cardInner.style.transform = 'rotateY(0deg)';
            }
        }
    };

    window.switchFlashcardClef = function(clef) {
        window.GameState.flashcardClef = clef;
        window.GameState.flashcardIndex = 0;
        window.GameState.flashcardFlipped = false;
        renderGameUI();
    };

    window.setIntervalFlashcardFilter = function(filterId) {
        window.GameState.intervalFlashcardFilter = filterId;
        window.GameState.intervalFlashcardIndex = 0;
        window.GameState.intervalFlashcardFlipped = false;
        renderGameUI();
    };

    window.nextFlashcard = function() {
        const pool = getFlashcardPool();
        window.GameState.flashcardIndex = (window.GameState.flashcardIndex + 1) % pool.length;
        window.GameState.flashcardFlipped = false;
        renderGameUI();
    };

    window.prevFlashcard = function() {
        const pool = getFlashcardPool();
        window.GameState.flashcardIndex = (window.GameState.flashcardIndex - 1 + pool.length) % pool.length;
        window.GameState.flashcardFlipped = false;
        renderGameUI();
    };

    window.shuffleFlashcards = function() {
        const pool = getFlashcardPool();
        window.GameState.flashcardIndex = Math.floor(Math.random() * pool.length);
        window.GameState.flashcardFlipped = false;
        renderGameUI();
    };

    window.nextIntervalFlashcard = function() {
        const pool = getGranularIntervalCards(window.GameState.level || 1);
        window.GameState.intervalFlashcardIndex = (window.GameState.intervalFlashcardIndex + 1) % pool.length;
        window.GameState.intervalFlashcardFlipped = false;
        renderGameUI();
    };

    window.prevIntervalFlashcard = function() {
        const pool = getGranularIntervalCards(window.GameState.level || 1);
        window.GameState.intervalFlashcardIndex = (window.GameState.intervalFlashcardIndex - 1 + pool.length) % pool.length;
        window.GameState.intervalFlashcardFlipped = false;
        renderGameUI();
    };

    window.shuffleIntervalFlashcards = function() {
        const pool = getGranularIntervalCards(window.GameState.level || 1);
        window.GameState.intervalFlashcardIndex = Math.floor(Math.random() * pool.length);
        window.GameState.intervalFlashcardFlipped = false;
        renderGameUI();
    };

    window.playIntervalFlashcardSound = function() {
        const pool = getGranularIntervalCards(window.GameState.level || 1);
        if (!pool || pool.length === 0) return;

        if (window.GameState.intervalFlashcardIndex >= pool.length) {
            window.GameState.intervalFlashcardIndex = 0;
        }
        const card = pool[window.GameState.intervalFlashcardIndex];
        const root = card.rootMidi;
        const targetMidi = root + card.semi;

        if (card.modeId === 'asc') {
            playSequence([root, targetMidi], 0.55);
        } else if (card.modeId === 'desc') {
            playSequence([targetMidi, root], 0.55);
        } else if (card.modeId === 'harm') {
            playChord([root, targetMidi], 0.7);
        }
    };

    function getFlashcardPool() {
        const isSol = window.GameState.flashcardClef === 'sol';
        const lvl = window.GameState.level;
        if (isSol) {
            return lvl === 1 ? TREBLE_NOTES_LVL1 : (lvl === 2 ? TREBLE_NOTES_LVL2 : TREBLE_NOTES_LVL3);
        } else {
            return lvl === 1 ? BASS_NOTES_LVL1 : (lvl === 2 ? BASS_NOTES_LVL2 : BASS_NOTES_LVL3);
        }
    }

    function renderFlashcardView() {
        if (window.GameState.activeGame === 'interval') {
            renderIntervalFlashcardsView();
        } else {
            renderNoteFlashcardsView();
        }
    }

    function renderIntervalFlashcardsView() {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        const lvl = window.GameState.level || 1;
        const baseIntervals = getIntervalPool(lvl);
        const granularPool = getGranularIntervalCards(lvl);
        if (window.GameState.intervalFlashcardIndex >= granularPool.length) {
            window.GameState.intervalFlashcardIndex = 0;
        }

        const currentCard = granularPool[window.GameState.intervalFlashcardIndex];
        const details = INTERVAL_DETAILS[currentCard.intervalId] || { semi: currentCard.semi, formula: `${currentCard.semi} Nửa cung`, song: '', abc: 'C c | [Cc]2 |' };
        const lvlTitle = lvl === 1 ? 'Level 1 (5 Quãng × 21 Mẫu = 105 Thẻ)' : (lvl === 2 ? 'Level 2 (9 Quãng × 21 Mẫu = 189 Thẻ)' : 'Level 3 (12 Quãng × 21 Mẫu = 252 Thẻ)');
        const currentFilter = window.GameState.intervalFlashcardFilter || 'ALL';

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">🎴 Thẻ Học Quãng Âm Chi Tiết (Granular Interval Flashcards)</h3>
                <p style="margin: 0 0 16px 0; color: #64748b; font-size: 0.95rem;">Mỗi Quãng gồm <b>đủ 21 thẻ mẫu âm thanh độc lập</b> (7 nốt gốc × 3 hướng phát). Tổng ${granularPool.length} thẻ!</p>

                <!-- Interval Filter Tabs -->
                <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 22px; flex-wrap: wrap; background: #f8fafc; padding: 10px 14px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <button onclick="window.setIntervalFlashcardFilter('ALL')" style="padding: 6px 14px; border-radius: 16px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; ${currentFilter === 'ALL' ? 'background: #0284c7; color: white; border: none; box-shadow: 0 3px 8px rgba(2,132,199,0.3);' : 'background: white; color: #475569; border: 1.5px solid #cbd5e1;'}">🌐 Tất Cả Thẻ</button>
                    ${baseIntervals.map(inv => `
                        <button onclick="window.setIntervalFlashcardFilter('${inv.id}')" style="padding: 6px 12px; border-radius: 16px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; ${currentFilter === inv.id ? 'background: #0284c7; color: white; border: none; box-shadow: 0 3px 8px rgba(2,132,199,0.3);' : 'background: white; color: #475569; border: 1.5px solid #cbd5e1;'}">${inv.icon} ${inv.name} (21 Thẻ)</button>
                    `).join('')}
                </div>

                <!-- 3D Flip Card Container -->
                <div onclick="window.toggleIntervalFlashcardFlip()" style="perspective: 1000px; width: 100%; max-width: 520px; margin: 0 auto 22px auto; height: 330px; cursor: pointer;">
                    <div id="flashcard-interval-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; ${window.GameState.intervalFlashcardFlipped ? 'transform: rotateY(180deg);' : ''}">
                        
                        <!-- CARD FRONT: Audio Button & Granular Info -->
                        <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: linear-gradient(135deg, #ffffff, #eff6ff); border-radius: 24px; border: 3.5px solid #a5f3fc; box-shadow: 0 12px 32px rgba(6,182,212,0.12); padding: 22px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #bae6fd; padding-bottom: 10px;">
                                <span style="font-weight: 800; color: #0369a1; font-size: 0.92rem;">📌 ${lvlTitle}</span>
                                <span style="font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 14px; border-radius: 14px; font-size: 0.9rem;">Thẻ ${window.GameState.intervalFlashcardIndex + 1} / ${granularPool.length}</span>
                            </div>
                            
                            <div style="margin: 6px 0;">
                                <div style="font-size: 2.8rem; margin-bottom: 2px;">${currentCard.intervalIcon || '🎵'}</div>
                                <h2 style="margin: 0; color: #0c4a6e; font-size: 1.65rem; font-weight: 800;">${currentCard.intervalName}</h2>
                                <div style="display: inline-block; margin-top: 6px; background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 4px 16px; border-radius: 14px; font-size: 0.92rem; border: 1px solid #7dd3fc;">
                                    🎹 Mẫu: <b>${currentCard.rootName}</b> • <b>${currentCard.modeName}</b>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.playIntervalFlashcardSound();" style="padding: 12px 28px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; font-weight: 800; font-size: 1.05rem; cursor: pointer; box-shadow: 0 6px 16px rgba(6,182,212,0.35); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
                                🔊 Nghe Mẫu Âm Thanh (${currentCard.rootName} • ${currentCard.modeName})
                            </button>
                            
                            <div style="font-weight: 800; color: #d97706; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 6px; background: #fef3c7; padding: 6px; border-radius: 12px;">
                                👆 Bấm vào thẻ để lật xem nốt nhạc & công thức!
                            </div>
                        </div>

                        <!-- CARD BACK: Sheet Music & Formula -->
                        <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 24px; border: 3.5px solid #4ade80; box-shadow: 0 12px 32px rgba(34,197,94,0.15); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-sizing: border-box;">
                            <span style="font-weight: 800; color: #15803d; font-size: 0.95rem;">🎉 KHUÔNG NHẠC & CÔNG THỨC MẪU</span>
                            
                            <div id="flashcard-interval-paper" style="min-height: 120px; width: 100%; background: white; border-radius: 12px; padding: 8px; border: 1px dashed #86efac;"></div>

                            <div>
                                <div style="font-weight: 800; color: #166534; font-size: 1.1rem; margin-bottom: 2px;">📐 ${details.formula}</div>
                                <div style="font-size: 0.88rem; color: #374151; font-weight: 600;">🎶 <b>Ví dụ:</b> ${details.song || currentCard.desc}</div>
                            </div>

                            <button onclick="event.stopPropagation(); window.playIntervalFlashcardSound();" style="background: white; border: 2.5px solid #16a34a; color: #15803d; font-weight: 800; padding: 8px 20px; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
                                🔊 Nghe Lại Mẫu Âm Thanh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Navigation Bar -->
                <div style="display: flex; gap: 12px; justify-content: center; align-items: center; max-width: 520px; margin: 0 auto; flex-wrap: wrap;">
                    <button onclick="window.prevIntervalFlashcard()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #334155; border: 2px solid #cbd5e1; cursor: pointer; transition: all 0.2s; flex: 1; min-width: 100px;">⬅️ Thẻ Trước</button>
                    <button onclick="window.toggleIntervalFlashcardFlip()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #facc15, #eab308); color: #431407; border: 2px solid #fde047; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(250,204,21,0.3); flex: 1; min-width: 100px;">🔄 Lật Thẻ</button>
                    <button onclick="window.shuffleIntervalFlashcards()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #a855f7, #9333ea); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(168,85,247,0.3); flex: 1; min-width: 100px;">🔀 Ngẫu Nhiên</button>
                    <button onclick="window.nextIntervalFlashcard()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(2,132,199,0.3); flex: 1; min-width: 100px;">➡️ Thẻ Tiếp</button>
                </div>
            </div>
        `;

        // Render staff interval on card back
        const abcCode = `X:1\nM:4/4\nL:1/2\nK:C clef=treble\n${details.abc}`;
        setTimeout(() => {
            const paperEl = document.getElementById('flashcard-interval-paper');
            const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
            if (paperEl && abcRenderer) {
                paperEl.innerHTML = '';
                abcRenderer.renderAbc('flashcard-interval-paper', abcCode, {
                    responsive: 'resize',
                    scale: 1.3,
                    staffwidth: 340,
                    paddingtop: 10,
                    paddingbottom: 10,
                    add_classes: true
                });
            }
        }, 60);
    }

    function renderIntervalProgressReportView() {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        const lvl = window.GameState.level || 1;
        const baseIntervals = getIntervalPool(lvl);
        const activeUser = window.getActiveChildUser ? window.getActiveChildUser() : null;
        const userNameStr = activeUser ? activeUser.childName : 'Bé (Chưa đăng nhập)';
        const userId = activeUser ? activeUser.id : 'guest';
        const storageKey = `interval_samples_progress_${userId}`;
        const userProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');

        let totalEarned = 0;
        const totalMax = baseIntervals.length * 21 * 6; // 21 samples per interval * 6 max pts

        baseIntervals.forEach(inv => {
            GRANULAR_ROOTS.forEach(r => {
                GRANULAR_MODES.forEach(m => {
                    const key = `${inv.id}_${r.abc}_${m.id}`;
                    const p = userProgress[key] || { score: 0 };
                    totalEarned += (p.score || 0);
                });
            });
        });

        const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
        const lvlTitle = lvl === 1 ? 'Level 1 (5 Quãng × 21 Mẫu = 105 Mẫu)' : (lvl === 2 ? 'Level 2 (9 Quãng × 21 Mẫu = 189 Mẫu)' : 'Level 3 (12 Quãng × 21 Mẫu = 252 Mẫu)');

        let intervalSectionsHTML = baseIntervals.map(inv => {
            let invEarned = 0;
            const invMax = 21 * 6; // 126 max pts per interval

            let microCardsHTML = [];
            GRANULAR_ROOTS.forEach(r => {
                GRANULAR_MODES.forEach(m => {
                    const key = `${inv.id}_${r.abc}_${m.id}`;
                    const p = userProgress[key] || { stage: 'unseen', score: 0, streak: 0 };
                    invEarned += (p.score || 0);

                    let stageIcon = '⚪';
                    let stageBadgeStyle = 'background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;';

                    if (p.stage === 'seed') {
                        stageIcon = '🌱';
                        stageBadgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #fde047;';
                    } else if (p.stage === 'sprout') {
                        stageIcon = '🌿';
                        stageBadgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;';
                    } else if (p.stage === 'tree') {
                        stageIcon = '🌳';
                        stageBadgeStyle = 'background: #bbf7d0; color: #166534; border: 1.5px solid #4ade80; font-weight: 800;';
                    } else if (p.stage === 'flower') {
                        stageIcon = '🌸';
                        stageBadgeStyle = 'background: #fce7f3; color: #be185d; border: 2px solid #f472b6; font-weight: 800; box-shadow: 0 2px 8px rgba(244,114,182,0.3);';
                    }

                    microCardsHTML.push(`
                        <div style="background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 10px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 1.1rem;">${stageIcon}</span>
                                <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 8px; ${stageBadgeStyle}">${p.score || 0}/6pt</span>
                            </div>
                            <div style="font-weight: 800; color: #1e293b; font-size: 0.85rem;">${r.name}</div>
                            <div style="font-size: 0.75rem; color: #475569; font-weight: 700; margin-top: 2px;">${m.name}</div>
                        </div>
                    `);
                });
            });

            const invPercentage = Math.round((invEarned / invMax) * 100);

            return `
                <div style="margin-bottom: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 20px; border-radius: 20px; border: 2px solid #cbd5e1; box-shadow: 0 6px 16px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
                        <div>
                            <h4 style="margin: 0; color: #0f172a; font-size: 1.2rem; font-weight: 800;">${inv.icon} ${inv.name} (Trọn bộ 21 Mẫu Âm Thanh)</h4>
                            <p style="margin: 2px 0 0 0; color: #475569; font-size: 0.88rem; font-weight: 600;">Tích lũy: <b>${invEarned} / ${invMax} pt</b> (7 nốt gốc × 3 hướng nghe)</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-weight: 800; color: #0284c7; font-size: 1.25rem;">${invPercentage}% Tiết Độ</span>
                        </div>
                    </div>

                    <!-- Progress Bar for this Interval -->
                    <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
                        <div style="width: ${invPercentage}%; height: 100%; background: linear-gradient(90deg, #38bdf8, #0284c7); border-radius: 8px; transition: width 0.5s;"></div>
                    </div>

                    <!-- 21 Micro Cards Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;">
                        ${microCardsHTML.join('')}
                    </div>
                </div>
            `;
        }).join('');

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 24px; border: 2px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <!-- MASTER HEADER BANNER -->
                <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 24px; border-radius: 20px; margin-bottom: 28px; box-shadow: 0 10px 25px rgba(2,132,199,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <span style="background: #facc15; color: #431407; font-weight: 800; padding: 4px 14px; border-radius: 14px; font-size: 0.85rem;">📊 BÁO CÁO TIẾN ĐỘ 21 MẪU ÂM THANH / QUÃNG</span>
                            <h2 style="margin: 8px 0 0 0; color: white; font-size: 1.6rem; font-weight: 800;">Hành Trình Cảm Âm Granular — ${userNameStr}</h2>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2.2rem; font-weight: 800; color: #fde047;">${percentage}%</div>
                            <div style="font-size: 0.9rem; color: #e0f2fe; font-weight: 700;">Tiến Độ ${lvlTitle}</div>
                        </div>
                    </div>

                    <!-- Master Progress Bar -->
                    <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.2); border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(255,255,255,0.3); margin-bottom: 12px;">
                        <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #facc15, #4ade80); border-radius: 12px; transition: width 0.6s;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #e0f2fe; font-weight: 700;">
                        <span>🏆 Điểm Tích Lũy Level: <b style="color: #fde047;">${totalEarned} / ${totalMax} pt</b></span>
                        <span>🌱 Hạt (0pt) ➔ 🌿 Mầm (1pt) ➔ 🌳 Cây (3pt) ➔ 🌸 Hoa (6pt)</span>
                    </div>
                </div>

                <!-- 21 Micro Cards per Interval List -->
                <div>
                    ${intervalSectionsHTML}
            </div>
        `;
    }

    function renderNoteFlashcardsView() {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        const pool = getFlashcardPool();
        if (window.GameState.flashcardIndex >= pool.length) {
            window.GameState.flashcardIndex = 0;
        }

        const currentNote = pool[window.GameState.flashcardIndex];
        const isSol = window.GameState.flashcardClef === 'sol';
        const clefStr = isSol ? 'treble' : 'bass';
        const clefTitle = isSol ? 'Khóa Sol' : 'Khóa Fa';
        const lvlTitle = window.GameState.level === 1 ? 'Level 1 (Dễ)' : (window.GameState.level === 2 ? 'Level 2 (Vừa)' : 'Level 3 (Khó)');
        const colorStyle = NOTE_COLOR_MAP[currentNote.noteOnly] || { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8', shadow: 'rgba(59,130,246,0.2)' };

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">🎴 Thẻ Học Nốt Nhạc (Flashcard Learning)</h3>
                <p style="margin: 0 0 18px 0; color: #64748b; font-size: 0.95rem;">Chọn Khóa & Độ khó ở trên để xem thẻ. Đây chính là nguyên liệu cho các bài Test!</p>

                <!-- Clef Toggle Filter -->
                <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 22px;">
                    <button onclick="window.switchFlashcardClef('sol')" style="padding: 10px 22px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: all 0.2s; ${isSol ? 'background: linear-gradient(135deg, #ff758c, #ff7eb3); color: white; border: none; box-shadow: 0 4px 12px rgba(255,117,140,0.4);' : 'background: #f1f5f9; color: #475569; border: 2px solid #cbd5e1;'}">🎼 Khóa Sol (Treble)</button>
                    <button onclick="window.switchFlashcardClef('fa')" style="padding: 10px 22px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: all 0.2s; ${!isSol ? 'background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; box-shadow: 0 4px 12px rgba(59,130,246,0.4);' : 'background: #f1f5f9; color: #475569; border: 2px solid #cbd5e1;'}">𝄢 Khóa Fa (Bass)</button>
                </div>

                <!-- 3D Flip Card Container -->
                <div onclick="window.toggleFlashcardFlip()" style="perspective: 1000px; width: 100%; max-width: 480px; margin: 0 auto 22px auto; height: 300px; cursor: pointer;">
                    <div id="flashcard-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; ${window.GameState.flashcardFlipped ? 'transform: rotateY(180deg);' : ''}">
                        
                        <!-- CARD FRONT: Staff Note -->
                        <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 24px; border: 3.5px solid #cbd5e1; box-shadow: 0 12px 32px rgba(0,0,0,0.08); padding: 22px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 10px;">
                                <span style="font-weight: 800; color: #475569; font-size: 0.95rem;">📌 ${clefTitle} — ${lvlTitle}</span>
                                <span style="font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 14px; border-radius: 14px; font-size: 0.9rem;">Nốt ${window.GameState.flashcardIndex + 1} / ${pool.length}</span>
                            </div>
                            
                            <div id="flashcard-abc-paper" style="min-height: 150px; display: flex; justify-content: center; align-items: center;"></div>
                            
                            <div style="font-weight: 800; color: #d97706; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 6px; background: #fef3c7; padding: 6px; border-radius: 12px;">
                                👆 Bấm vào thẻ để lật xem tên nốt!
                            </div>
                        </div>

                        <!-- CARD BACK: Note Name & Info -->
                        <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); background: ${colorStyle.bg}; border-radius: 24px; border: 3.5px solid ${colorStyle.border}; box-shadow: 0 12px 32px ${colorStyle.shadow}; padding: 25px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-sizing: border-box;">
                            <span style="font-weight: 800; color: ${colorStyle.text}; font-size: 1rem; letter-spacing: 0.5px;">🎉 ĐÁP ÁN NỐT NHẠC</span>
                            
                            <div>
                                <h1 style="margin: 4px 0; font-size: 3.4rem; color: ${colorStyle.text}; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.1);">${currentNote.name}</h1>
                                <p style="margin: 4px 0 0 0; font-weight: 800; color: #475569; font-size: 1.1rem;">Ký hiệu ABC: <code style="background: white; padding: 4px 12px; border-radius: 10px; border: 1.5px solid ${colorStyle.border}; font-weight: 800;">${currentNote.abc}</code></p>
                            </div>

                            <button onclick="event.stopPropagation(); window.playFlashcardNoteSound();" style="background: white; border: 2.5px solid ${colorStyle.border}; color: ${colorStyle.text}; font-weight: 800; padding: 10px 22px; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
                                🔊 Nghe Nốt Nhạc
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Navigation Bar -->
                <div style="display: flex; gap: 12px; justify-content: center; align-items: center; max-width: 480px; margin: 0 auto; flex-wrap: wrap;">
                    <button onclick="window.prevFlashcard()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #334155; border: 2px solid #cbd5e1; cursor: pointer; transition: all 0.2s; flex: 1; min-width: 100px;">⬅️ Nốt Trước</button>
                    <button onclick="window.toggleFlashcardFlip()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #facc15, #eab308); color: #431407; border: 2px solid #fde047; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(250,204,21,0.3); flex: 1; min-width: 100px;">🔄 Lật Thẻ</button>
                    <button onclick="window.shuffleFlashcards()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #a855f7, #9333ea); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(168,85,247,0.3); flex: 1; min-width: 100px;">🔀 Ngẫu Nhiên</button>
                    <button onclick="window.nextFlashcard()" style="padding: 12px 20px; border-radius: 16px; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(59,130,246,0.3); flex: 1; min-width: 100px;">➡️ Nốt Tiếp</button>
                </div>
            </div>
        `;

        // Render staff note on card front
        const abcCode = `X:1\nM:4/4\nL:1/4\nK:C clef=${clefStr}\n${currentNote.abc} |`;
        setTimeout(() => {
            const paperEl = document.getElementById('flashcard-abc-paper');
            const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
            if (paperEl && abcRenderer) {
                paperEl.innerHTML = '';
                abcRenderer.renderAbc('flashcard-abc-paper', abcCode, {
                    responsive: 'resize',
                    scale: 1.4,
                    staffwidth: 320,
                    paddingtop: 10,
                    paddingbottom: 10,
                    add_classes: true
                });
            }
        }, 60);
    }

    window.playFlashcardNoteSound = function() {
        const pool = getFlashcardPool();
        const currentNote = pool[window.GameState.flashcardIndex];
        if (currentNote) {
            playNoteByName(currentNote.abc, 0.6);
        }
    };

    // --- 7. VISUAL COMPREHENSIVE PROGRESS REPORT DASHBOARD ---
    function renderProgressReportView() {
        if (window.GameState.activeGame === 'interval') {
            renderIntervalProgressReportView();
        } else {
            renderNoteProgressReportView();
        }
    }

    function renderNoteProgressReportView() {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        const master = window.getMasterProgress ? window.getMasterProgress() : { totalEarned: 0, totalMax: 282, percentage: 0 };
        const activeUser = window.getActiveChildUser ? window.getActiveChildUser() : null;
        const userNameStr = activeUser ? activeUser.childName : 'Bé (Chưa đăng nhập)';

        // Sections configuration
        const sections = [
            { id: 'sol-1', clef: 'sol', clefTitle: '🎼 Khóa Sol', lvl: 1, lvlTitle: 'Level 1 (Dễ - C D E F G A B c d e f g a b)', pool: TREBLE_NOTES_LVL1, bg: 'linear-gradient(135deg, #fff1f2, #fff7ed)', border: '#fecdd3', text: '#be123c' },
            { id: 'sol-2', clef: 'sol', clefTitle: '🎼 Khóa Sol', lvl: 2, lvlTitle: 'Level 2 (Vừa - Dòng kẻ phụ trên c\' đến b\')', pool: TREBLE_NOTES_LVL2, bg: 'linear-gradient(135deg, #fefce8, #fff7ed)', border: '#fef08a', text: '#a16207' },
            { id: 'sol-3', clef: 'sol', clefTitle: '🎼 Khóa Sol', lvl: 3, lvlTitle: 'Level 3 (Khó - Dòng phụ trầm B, A, G, F, E, D, C,)', pool: TREBLE_NOTES_LVL3, bg: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', border: '#e9d5ff', text: '#7e22ce' },
            { id: 'fa-1',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 1, lvlTitle: 'Level 1 (Dễ - 13 nốt từ E,, đến C)', pool: BASS_NOTES_LVL1,   bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#bfdbfe', text: '#1d4ed8' },
            { id: 'fa-2',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 2, lvlTitle: 'Level 2 (Vừa - 6 nốt D đến B trên dòng phụ)', pool: BASS_NOTES_LVL2,   bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#bbf7d0', text: '#15803d' },
            { id: 'fa-3',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 3, lvlTitle: 'Level 3 (Khó - 6 nốt D,, hạ xuống trầm F,,,)', pool: BASS_NOTES_LVL3,   bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fed7aa', text: '#c2410c' }
        ];

        let sectionsHTML = '';

        sections.forEach(sec => {
            const progress = window.getClefLevelProgress ? window.getClefLevelProgress(sec.clef, sec.lvl, sec.pool) : { earnedPoints: 0, maxPoints: sec.pool.length * 6, percentage: 0 };
            
            let notesGridHTML = sec.pool.map(note => {
                const p = window.getNoteProgress ? window.getNoteProgress(sec.clef, sec.lvl, note.abc) : { stage: 'unseen', score: 0, streak: 0 };
                
                let stageIcon = '⚪';
                let stageName = 'Chưa học';
                let stageBadgeStyle = 'background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;';

                if (p.stage === 'seed') {
                    stageIcon = '🌱';
                    stageName = 'Hạt (0pt)';
                    stageBadgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #fde047;';
                } else if (p.stage === 'sprout') {
                    stageIcon = '🌿';
                    stageName = 'Mầm (1pt)';
                    stageBadgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;';
                } else if (p.stage === 'tree') {
                    stageIcon = '🌳';
                    stageName = 'Cây (3pt)';
                    stageBadgeStyle = 'background: #bbf7d0; color: #166534; border: 1.5px solid #4ade80; font-weight: 800;';
                } else if (p.stage === 'flower') {
                    stageIcon = '🌸';
                    stageName = 'Hoa (6pt)';
                    stageBadgeStyle = 'background: #fce7f3; color: #be185d; border: 2px solid #f472b6; font-weight: 800; box-shadow: 0 2px 8px rgba(244,114,182,0.3);';
                }

                return `
                    <div style="background: white; border-radius: 16px; border: 2px solid #e2e8f0; padding: 14px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.4rem;">${stageIcon}</span>
                            <span style="font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; ${stageBadgeStyle}">${stageName}</span>
                        </div>
                        
                        <div>
                            <h4 style="margin: 4px 0; color: #1e293b; font-size: 1.2rem; font-weight: 800;">${note.name}</h4>
                            <code style="background: #f8fafc; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #e2e8f0;">ABC: ${note.abc}</code>
                        </div>

                        <div style="margin-top: 10px; font-size: 0.85rem; font-weight: 800; color: #0284c7; background: #f0f9ff; padding: 4px; border-radius: 8px;">
                            ${p.score} / 6 điểm
                        </div>
                    </div>
                `;
            }).join('');

            sectionsHTML += `
                <div style="margin-bottom: 28px; background: ${sec.bg}; padding: 24px; border-radius: 20px; border: 2.5px solid ${sec.border}; box-shadow: 0 8px 20px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <h4 style="margin: 0; color: ${sec.text}; font-size: 1.2rem; font-weight: 800;">${sec.clefTitle} — ${sec.lvlTitle}</h4>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem; font-weight: 700;">Gồm ${sec.pool.length} nốt • Tích lũy: <b>${progress.earnedPoints} / ${progress.maxPoints} điểm</b></p>
                        </div>
                        <div style="text-align: right; min-width: 140px;">
                            <span style="font-weight: 800; color: ${sec.text}; font-size: 1.3rem;">${progress.percentage}% Tiến Độ</span>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div style="width: 100%; height: 16px; background: rgba(255,255,255,0.8); border-radius: 10px; overflow: hidden; border: 1.5px solid ${sec.border}; margin-bottom: 20px;">
                        <div style="width: ${progress.percentage}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 10px; transition: width 0.5s;"></div>
                    </div>

                    <!-- Note Cards Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;">
                        ${notesGridHTML}
                    </div>
                </div>
            `;
        });

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 24px; border: 2px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <!-- MASTER HEADER BANNER -->
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 24px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(15,23,42,0.25);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <span style="background: #facc15; color: #431407; font-weight: 800; padding: 4px 14px; border-radius: 14px; font-size: 0.85rem;">📊 BÁO CÁO TIẾN ĐỘ TRỰC QUAN</span>
                            <h2 style="margin: 8px 0 0 0; color: white; font-size: 1.6rem; font-weight: 800;">Hành Trình Trồng Cây Nốt Nhạc — ${userNameStr}</h2>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2.2rem; font-weight: 800; color: #38bdf8;">${master.percentage}%</div>
                            <div style="font-size: 0.9rem; color: #94a3b8; font-weight: 700;">Tổng Tiến Độ Hệ Thống</div>
                        </div>
                    </div>

                    <!-- Master Progress Bar -->
                    <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.15); border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(255,255,255,0.25); margin-bottom: 12px;">
                        <div style="width: ${master.percentage}%; height: 100%; background: linear-gradient(90deg, #facc15, #10b981); border-radius: 12px; transition: width 0.6s;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #cbd5e1; font-weight: 700;">
                        <span>🏆 Tổng Điểm Tích Lũy: <b style="color: #fde047;">${master.totalEarned} / ${master.totalMax} pt</b></span>
                        <span>🌱 Hạt (0pt) ➔ 🌿 Mầm (1pt) ➔ 🌳 Cây (3pt) ➔ 🌸 Hoa (6pt)</span>
                    </div>
                </div>

                <!-- ALL 6 SECTIONS COMPREHENSIVE VIEW -->
                <div>
                    ${sectionsHTML}
                </div>
            </div>
        `;
    }

})();
