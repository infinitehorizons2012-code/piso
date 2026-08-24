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
            return `
                <button onclick="window.switchGameSubTab('test')" style="${activeTab === 'test' ? activeStyle : inactiveStyle}">🎮 Làm Bài Test</button>
                <button onclick="window.switchGameSubTab('theory')" style="${activeTab === 'theory' ? activeStyle : inactiveStyle}">📖 Lý Thuyết</button>
                <button onclick="window.switchGameSubTab('flashcard')" style="${activeTab === 'flashcard' ? activeStyle : inactiveStyle}">🎴 Flashcard Nốt Nhạc</button>
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

    // Khóa Fa Level 1 (Dễ): Nốt có phẩy C, D, E, F, G, A, B, (Nằm chính giữa 5 dòng kẻ của Khóa Fa - C3 đến B3)
    const BASS_NOTES_LVL1 = [
        { abc: 'C,', name: 'Đô (C,)', noteOnly: 'C' },
        { abc: 'D,', name: 'Rê (D,)', noteOnly: 'D' },
        { abc: 'E,', name: 'Mi (E,)', noteOnly: 'E' },
        { abc: 'F,', name: 'Pha (F,)', noteOnly: 'F' },
        { abc: 'G,', name: 'Son (G,)', noteOnly: 'G' },
        { abc: 'A,', name: 'La (A,)', noteOnly: 'A' },
        { abc: 'B,', name: 'Si (B,)', noteOnly: 'B' }
    ];

    // Khóa Fa Level 2 (Vừa / Trung bình): Nốt hoa C D E F G A B (Nằm ở các dòng kẻ phụ phía trên Khóa Fa - C4 đến B4)
    const BASS_NOTES_LVL2 = [
        { abc: 'C', name: 'Đô (C)', noteOnly: 'C' },
        { abc: 'D', name: 'Rê (D)', noteOnly: 'D' },
        { abc: 'E', name: 'Mi (E)', noteOnly: 'E' },
        { abc: 'F', name: 'Pha (F)', noteOnly: 'F' },
        { abc: 'G', name: 'Son (G)', noteOnly: 'G' },
        { abc: 'A', name: 'La (A)', noteOnly: 'A' },
        { abc: 'B', name: 'Si (B)', noteOnly: 'B' }
    ];

    // Khóa Fa Level 3 (Khó): Nốt thường c d e f g (Rất cao trên dòng phụ) & Nốt phẩy đôi E,, F,, G,, (Rất trầm dưới dòng phụ)
    const BASS_NOTES_LVL3 = [
        { abc: 'c', name: 'Đô (c)', noteOnly: 'C' },
        { abc: 'd', name: 'Rê (d)', noteOnly: 'D' },
        { abc: 'e', name: 'Mi (e)', noteOnly: 'E' },
        { abc: 'f', name: 'Pha (f)', noteOnly: 'F' },
        { abc: 'g', name: 'Son (g)', noteOnly: 'G' },
        { abc: 'E,,', name: 'Mi (E,,)', noteOnly: 'E' },
        { abc: 'F,,', name: 'Pha (F,,)', noteOnly: 'F' },
        { abc: 'G,,', name: 'Son (G,,)', noteOnly: 'G' }
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

    // --- GAME 3: INTERVAL MATCH ---
    const INTERVALS = [
        { name: 'Quãng 1 (Unison)', semi: 0 },
        { name: 'Quãng 2 Trưởng (Major 2nd)', semi: 2 },
        { name: 'Quãng 3 Trưởng (Major 3rd)', semi: 4 },
        { name: 'Quãng 4 Đúng (Perfect 4th)', semi: 5 },
        { name: 'Quãng 5 Đúng (Perfect 5th)', semi: 7 },
        { name: 'Quãng 8 (Octave)', semi: 12 }
    ];

    function generateIntervalQuestion(cardBody) {
        const target = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
        const rootMidi = 60 + Math.floor(Math.random() * 5);
        window.GameState.currentQuestion = { target, rootMidi };

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎵 Nghe 2 nốt nhạc & xác định Quãng Âm (Interval):</h3>
                
                <button onclick="window.playIntervalQuestionSound()" style="font-size: 1.15rem; padding: 14px 30px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; cursor: pointer; font-weight: 800; margin: 15px 0; box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
                    🔊 Nghe Lại Quãng Âm
                </button>

                <div id="game-feedback" style="min-height: 32px; font-weight: 800; font-size: 1.2rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 15px;">
                    ${INTERVALS.map((item, idx) => `
                        <button onclick="window.checkIntervalAnswer(${idx})" style="padding: 18px; border-radius: 16px; border: 2.5px solid #bfdbfe; background: linear-gradient(135deg, #eff6ff, #dbeafe); font-weight: 800; font-size: 1.05rem; cursor: pointer; color: #1d4ed8; box-shadow: 0 4px 12px rgba(59,130,246,0.15); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='none'">
                            ${item.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.playIntervalQuestionSound();
    }

    window.playIntervalQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (q) {
            playSequence([q.rootMidi, q.rootMidi + q.target.semi], 0.5);
        }
    };

    window.checkIntervalAnswer = function(idx) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        if (INTERVALS[idx].name === q.target.name) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! Đó là ${q.target.name}</span>`;
            setTimeout(() => renderGameUI(), 900);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Chưa đúng! Đáp án là: ${q.target.name}</span>`;
        }
    };

    // --- GAME 4: SCALE MATCH ---
    const SCALES = [
        { name: 'Âm Giai Trưởng (Major Scale)', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
        { name: 'Âm Giai Thứ Tự Nhiên (Minor Scale)', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
        { name: 'Âm Giai Pentatonic (Ngũ Âm Trưởng)', intervals: [0, 2, 4, 7, 9, 12] },
        { name: 'Âm Giai Blues (Blues Scale)', intervals: [0, 3, 5, 6, 7, 10, 12] }
    ];

    function generateScaleQuestion(cardBody) {
        const target = SCALES[Math.floor(Math.random() * SCALES.length)];
        const rootMidi = 60;
        window.GameState.currentQuestion = { target, rootMidi };

        cardBody.innerHTML = `
            <div style="background: white; padding: 28px; border-radius: 20px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800;">🎹 Nghe chuỗi nốt & nhận biết loại Âm Giai (Scale):</h3>
                
                <button onclick="window.playScaleQuestionSound()" style="font-size: 1.15rem; padding: 14px 30px; border-radius: 30px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; cursor: pointer; font-weight: 800; margin: 15px 0; box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
                    🔊 Nghe Lại Âm Giai
                </button>

                <div id="game-feedback" style="min-height: 32px; font-weight: 800; font-size: 1.2rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 15px;">
                    ${SCALES.map((item, idx) => `
                        <button onclick="window.checkScaleAnswer(${idx})" style="padding: 18px; border-radius: 16px; border: 2.5px solid #fde047; background: linear-gradient(135deg, #fefce8, #fef9c3); font-weight: 800; font-size: 1.05rem; cursor: pointer; color: #854d0e; box-shadow: 0 4px 12px rgba(234,179,8,0.2); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='none'">
                            ${item.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        window.playScaleQuestionSound();
    }

    window.playScaleQuestionSound = function() {
        const q = window.GameState.currentQuestion;
        if (q) {
            const seq = q.target.intervals.map(i => q.rootMidi + i);
            playSequence(seq, 0.35);
        }
    };

    window.checkScaleAnswer = function(idx) {
        const q = window.GameState.currentQuestion;
        const feedback = document.getElementById('game-feedback');
        if (!q || !feedback) return;

        if (SCALES[idx].name === q.target.name) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Rất giỏi! Đây là ${q.target.name}</span>`;
            setTimeout(() => renderGameUI(), 900);
        } else {
            window.GameState.streak = 0;
            feedback.innerHTML = `<span style="color: #ef4444;">❌ Tiếc quá! Đáp án đúng là: ${q.target.name}</span>`;
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

    // --- GAME THEORY RENDERER WITH SHEET MUSIC DEMOS ---
    function renderGameTheory(gameId) {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        let htmlContent = '';

        if (gameId === 'ledger') {
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">📖 Lý Thuyết Dòng Kẻ Phụ & Tên Nốt Nhạc</h3>
                    <p style="font-size: 1rem; color: #475569;">Khuông nhạc gồm 5 dòng kẻ chính. Dưới đây là vị trí và tên gọi từng nốt nhạc trên <b>Khóa Sol</b> và <b>Khóa Fa</b>:</p>
                    
                    <!-- DEMO 1: KHÓA SOL -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #fff1f2, #fff7ed); padding: 20px; border-radius: 16px; border: 2px solid #fecdd3;">
                        <h4 style="margin: 0 0 10px 0; color: #e11d48; font-size: 1.15rem; font-weight: 800;">🎼 1. Vị Trí Các Nốt Trên Khóa Sol (Treble Clef):</h4>
                        <div id="theory-treble-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #fda4af;"></div>
                    </div>

                    <!-- DEMO 2: KHÓA FA -->
                    <div style="margin: 22px 0; background: linear-gradient(135deg, #eff6ff, #f0fdf4); padding: 20px; border-radius: 16px; border: 2px solid #bfdbfe;">
                        <h4 style="margin: 0 0 10px 0; color: #1d4ed8; font-size: 1.15rem; font-weight: 800;">𝄢 2. Vị Trí Các Nốt Trên Khóa Fa (Bass Clef):</h4>
                        <div id="theory-bass-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #93c5fd;"></div>
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
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800;">📖 Lý Thuyết Quãng Âm (Music Intervals)</h3>
                    <p style="font-size: 1rem; color: #475569;">Quãng âm là khoảng cách giữa 2 nốt nhạc vang lên nối tiếp hoặc cùng lúc:</p>
                    
                    <div style="margin: 20px 0; background: linear-gradient(135deg, #faf5ff, #eff6ff); padding: 20px; border-radius: 16px; border: 2px solid #e9d5ff;">
                        <div id="theory-interval-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #c084fc;"></div>
                    </div>
                </div>
            `;
        } else if (gameId === 'scale') {
            htmlContent = `
                <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #e2e8f0; line-height: 1.7; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #431407; font-size: 1.35rem; font-weight: 800;">📖 Lý Thuyết Âm Giai (Scales)</h3>
                    <p style="font-size: 1rem; color: #475569;">Âm giai là dãy nốt sắp xếp theo thứ tự cao độ tăng dần:</p>
                    
                    <div style="margin: 20px 0; background: linear-gradient(135deg, #fefce8, #f0fdf4); padding: 20px; border-radius: 16px; border: 2px solid #fde047;">
                        <div id="theory-scale-paper" style="min-height: 150px; background: white; border-radius: 12px; padding: 10px; border: 1px dashed #facc15;"></div>
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
            const trebleAbc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nC D E F | G A B c |\nw: "Đô(C)" "Rê(D)" "Mi(E)" "Pha(F)" "Son(G)" "La(A)" "Si(B)" "Đô(c)"`;
            const bassAbc = `X:1\nM:4/4\nL:1/4\nK:C clef=bass\nC, D, E, F, | G, A, B, C |\nw: "Đô(C,)" "Rê(D,)" "Mi(E,)" "Pha(F,)" "Son(G,)" "La(A,)" "Si(B,)" "Đô(C)"`;
            renderTheoryAbcHelper('theory-treble-paper', trebleAbc);
            renderTheoryAbcHelper('theory-bass-paper', bassAbc);
        } else if (gameId === 'rhythm') {
            const rhythmAbc = `X:1\nM:4/4\nL:1/4\nK:C clef=treble\nc c2 c/2 c/2 c4 |\nw: "Nốt_Đen(1phách)" "Trắng(2phách)" "Móc_đơn(1/2)" "Móc_đơn(1/2)" "Tròn(4phách)"`;
            renderTheoryAbcHelper('theory-rhythm-paper', rhythmAbc);
        } else if (gameId === 'interval') {
            const intervalAbc = `X:1\nM:4/4\nL:1/2\nK:C clef=treble\n[CE] [CG] [Cc] |\nw: "Quãng_3_Trưởng" "Quãng_5_Đúng" "Quãng_8_(Octave)"`;
            renderTheoryAbcHelper('theory-interval-paper', intervalAbc);
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

    window.switchFlashcardClef = function(clef) {
        window.GameState.flashcardClef = clef;
        window.GameState.flashcardIndex = 0;
        window.GameState.flashcardFlipped = false;
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
            { id: 'fa-1',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 1, lvlTitle: 'Level 1 (Dễ - Trong khuông)', pool: BASS_NOTES_LVL1,   bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#bfdbfe', text: '#1d4ed8' },
            { id: 'fa-2',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 2, lvlTitle: 'Level 2 (Vừa - Dòng kẻ phụ trên)', pool: BASS_NOTES_LVL2,   bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#bbf7d0', text: '#15803d' },
            { id: 'fa-3',  clef: 'fa',  clefTitle: '𝄢 Khóa Fa',  lvl: 3, lvlTitle: 'Level 3 (Khó - Phẩy đôi & cao)', pool: BASS_NOTES_LVL3,   bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fed7aa', text: '#c2410c' }
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
