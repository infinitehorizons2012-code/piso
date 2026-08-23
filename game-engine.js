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
            <div class="game-header-bar" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; color: #f8fafc; display: flex; align-items: center; gap: 10px;">
                            ${getGameTitle(g.activeGame)}
                        </h2>
                        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 0.9rem;">${getGameDesc(g.activeGame)}</p>
                    </div>
                    <div style="display: flex; gap: 15px; background: rgba(255,255,255,0.1); padding: 8px 18px; border-radius: 30px; font-weight: bold;">
                        <span style="color: #4ade80;">⭐ Điểm: ${g.score}</span>
                        <span style="color: #facc15;">🔥 Chuỗi: ${g.streak}</span>
                    </div>
                </div>

                <!-- Sub Navigation Tabs for Selected Game -->
                <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                    ${getGameSubTabs(g.activeGame, g.activeSubTab)}
                </div>
            </div>
        `;

        // Render Level Selector if in Test mode
        if (g.activeSubTab !== 'theory') {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                    <span style="font-weight: bold; color: #334155;">🎯 Chọn Độ Khó:</span>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.setGameLevel(1)" class="level-btn ${g.level === 1 ? 'active' : ''}" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #cbd5e1; cursor: pointer; font-weight: bold; ${g.level === 1 ? 'background: #22c55e; color: white; border-color: #22c55e;' : 'background: #f8fafc; color: #475569;'}">Level 1 (Dễ)</button>
                        <button onclick="window.setGameLevel(2)" class="level-btn ${g.level === 2 ? 'active' : ''}" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #cbd5e1; cursor: pointer; font-weight: bold; ${g.level === 2 ? 'background: #eab308; color: white; border-color: #eab308;' : 'background: #f8fafc; color: #475569;'}">Level 2 (Vừa)</button>
                        <button onclick="window.setGameLevel(3)" class="level-btn ${g.level === 3 ? 'active' : ''}" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #cbd5e1; cursor: pointer; font-weight: bold; ${g.level === 3 ? 'background: #ef4444; color: white; border-color: #ef4444;' : 'background: #f8fafc; color: #475569;'}">Level 3 (Khó)</button>
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
        if (gameId === 'ledger') {
            return `
                <button onclick="window.switchGameSubTab('sol')" style="padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; ${activeTab === 'sol' ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.15); color: white;'}">🎼 Test Khóa Sol</button>
                <button onclick="window.switchGameSubTab('fa')" style="padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; ${activeTab === 'fa' ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.15); color: white;'}">𝄢 Test Khóa Fa</button>
                <button onclick="window.switchGameSubTab('theory')" style="padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; ${activeTab === 'theory' ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.15); color: white;'}">📖 Lý Thuyết</button>
            `;
        } else {
            return `
                <button onclick="window.switchGameSubTab('test')" style="padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; ${activeTab === 'test' ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.15); color: white;'}">🎮 Làm Bài Test</button>
                <button onclick="window.switchGameSubTab('theory')" style="padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; ${activeTab === 'theory' ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.15); color: white;'}">📖 Lý Thuyết</button>
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
        { abc: 'g', name: 'Son (g)', noteOnly: 'G' }
    ];

    const TREBLE_NOTES_LVL2 = [
        ...TREBLE_NOTES_LVL1,
        { abc: 'G,', name: 'Son (G,)', noteOnly: 'G' },
        { abc: 'A,', name: 'La (A,)', noteOnly: 'A' },
        { abc: 'B,', name: 'Si (B,)', noteOnly: 'B' },
        { abc: "a'", name: 'La (a\')', noteOnly: 'A' },
        { abc: "b'", name: 'Si (b\')', noteOnly: 'B' },
        { abc: "c''", name: 'Đô (c\'\')', noteOnly: 'C' }
    ];

    const BASS_NOTES_LVL1 = [
        { abc: 'C,', name: 'Đô (C,)', noteOnly: 'C' },
        { abc: 'D,', name: 'Rê (D,)', noteOnly: 'D' },
        { abc: 'E,', name: 'Mi (E,)', noteOnly: 'E' },
        { abc: 'F,', name: 'Pha (F,)', noteOnly: 'F' },
        { abc: 'G,', name: 'Son (G,)', noteOnly: 'G' },
        { abc: 'A,', name: 'La (A,)', noteOnly: 'A' },
        { abc: 'B,', name: 'Si (B,)', noteOnly: 'B' },
        { abc: 'C', name: 'Đô (C)', noteOnly: 'C' },
        { abc: 'D', name: 'Rê (D)', noteOnly: 'D' },
        { abc: 'E', name: 'Mi (E)', noteOnly: 'E' }
    ];

    const BASS_NOTES_LVL2 = [
        ...BASS_NOTES_LVL1,
        { abc: 'E,,', name: 'Mi (E,,)', noteOnly: 'E' },
        { abc: 'F,,', name: 'Pha (F,,)', noteOnly: 'F' },
        { abc: 'G,,', name: 'Son (G,,)', noteOnly: 'G' },
        { abc: 'F', name: 'Pha (F)', noteOnly: 'F' },
        { abc: 'G', name: 'Son (G)', noteOnly: 'G' },
        { abc: 'A', name: 'La (A)', noteOnly: 'A' },
        { abc: 'B', name: 'Si (B)', noteOnly: 'B' },
        { abc: 'c', name: 'Đô (c)', noteOnly: 'C' }
    ];

    function generateLedgerQuestion(cardBody) {
        const isTreble = window.GameState.activeSubTab === 'sol';
        const lvl = window.GameState.level;

        let pool = isTreble 
            ? (lvl === 1 ? TREBLE_NOTES_LVL1 : TREBLE_NOTES_LVL2)
            : (lvl === 1 ? BASS_NOTES_LVL1 : BASS_NOTES_LVL2);

        const target = pool[Math.floor(Math.random() * pool.length)];
        window.GameState.currentQuestion = target;

        const clefStr = isTreble ? 'treble' : 'bass';
        const abcCode = `X:1\nM:4/4\nL:1/4\nK:C clef=${clefStr}\n${target.abc} |`;

        cardBody.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #1e293b;">Hãy chọn tên nốt nhạc đang hiển thị trên khuông nhạc:</h3>
                
                <div id="game-abc-paper" style="min-height: 140px; display: flex; justify-content: center; align-items: center; margin: 15px 0;"></div>

                <div id="game-feedback" style="min-height: 30px; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;"></div>

                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    ${['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => `
                        <button onclick="window.checkLedgerAnswer('${note}')" style="font-size: 1.2rem; font-weight: bold; padding: 12px 22px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; color: #0f172a; cursor: pointer; transition: all 0.2s; min-width: 65px;">
                            ${getNoteDisplayName(note)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        if (typeof abcjs !== 'undefined') {
            abcjs.renderAbc('game-abc-paper', abcCode, { responsive: 'resize', staffwidth: 300 });
        }
        playNoteByName(target.abc, 0.4);
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

        if (answer === q.noteOnly) {
            window.GameState.score += 10;
            window.GameState.streak += 1;
            feedback.innerHTML = `<span style="color: #22c55e;">🎉 Chính xác! Đó là nốt ${q.name}</span>`;
            playNoteByName(q.abc, 0.6);
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
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #1e293b;">Bấm nút âm thanh & chọn nhịp điệu chính xác:</h3>
                
                <button onclick="window.playRhythmQuestionSound()" style="font-size: 1.1rem; padding: 12px 25px; border-radius: 30px; background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: bold; margin: 15px 0;">
                    🔊 Phát Âm Thanh Nhịp Điệu
                </button>

                <div id="game-feedback" style="min-height: 30px; font-weight: bold; font-size: 1.1rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 15px;">
                    ${RHYTHM_PATTERNS.map((item, idx) => `
                        <button onclick="window.checkRhythmAnswer(${idx})" style="padding: 15px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; font-weight: bold; cursor: pointer; color: #1e293b;">
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
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #1e293b;">Nghe 2 nốt nhạc & xác định Quãng Âm (Interval):</h3>
                
                <button onclick="window.playIntervalQuestionSound()" style="font-size: 1.1rem; padding: 12px 25px; border-radius: 30px; background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: bold; margin: 15px 0;">
                    🔊 Nghe Lại Quãng Âm
                </button>

                <div id="game-feedback" style="min-height: 30px; font-weight: bold; font-size: 1.1rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 15px;">
                    ${INTERVALS.map((item, idx) => `
                        <button onclick="window.checkIntervalAnswer(${idx})" style="padding: 15px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; font-weight: bold; cursor: pointer; color: #1e293b;">
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
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #1e293b;">Nghe chuỗi nốt & nhận biết loại Âm Giai (Scale):</h3>
                
                <button onclick="window.playScaleQuestionSound()" style="font-size: 1.1rem; padding: 12px 25px; border-radius: 30px; background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: bold; margin: 15px 0;">
                    🔊 Nghe Lại Âm Giai
                </button>

                <div id="game-feedback" style="min-height: 30px; font-weight: bold; font-size: 1.1rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 15px;">
                    ${SCALES.map((item, idx) => `
                        <button onclick="window.checkScaleAnswer(${idx})" style="padding: 15px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; font-weight: bold; cursor: pointer; color: #1e293b;">
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
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #1e293b;">Nghe hòa âm & xác định loại Hợp Âm (Chord):</h3>
                
                <button onclick="window.playChordQuestionSound()" style="font-size: 1.1rem; padding: 12px 25px; border-radius: 30px; background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: bold; margin: 15px 0;">
                    🔊 Nghe Lại Hợp Âm
                </button>

                <div id="game-feedback" style="min-height: 30px; font-weight: bold; font-size: 1.1rem; margin: 15px 0;"></div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 15px;">
                    ${CHORDS.map((item, idx) => `
                        <button onclick="window.checkChordAnswer(${idx})" style="padding: 15px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; font-weight: bold; cursor: pointer; color: #1e293b;">
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

    // --- GAME THEORY RENDERER ---
    function renderGameTheory(gameId) {
        const cardBody = document.getElementById('game-card-body');
        if (!cardBody) return;

        let content = '';
        if (gameId === 'ledger') {
            content = `
                <h3>📖 Lý Thuyết Dòng Kẻ Phụ (Ledger Lines)</h3>
                <p>Khung nhạc tiêu chuẩn gồm 5 dòng kẻ chính. Những nốt nhạc nằm ngoài 5 dòng kẻ này sẽ cần <b>Dòng Kẻ Phụ (Ledger Lines)</b> để xác định cao độ.</p>
                <ul>
                    <li><b>Khóa Sol (Treble Clef):</b> Dòng kẻ thứ 1 từ dưới lên là nốt E4 (Mi). Nốt Đô giữa (Middle C - C4) nằm ở 1 dòng kẻ phụ phía dưới khuông nhạc.</li>
                    <li><b>Khóa Fa (Bass Clef):</b> Dòng kẻ trên cùng là nốt F3 (Pha). Nốt Đô giữa (Middle C - C4) nằm ở 1 dòng kẻ phụ phía trên khuông nhạc.</li>
                </ul>
            `;
        } else if (gameId === 'rhythm') {
            content = `
                <h3>📖 Lý Thuyết Tiết Tấu & Nhịp Điệu (Rhythm)</h3>
                <p>Tiết tấu là sự phân bổ thời gian của các nốt nhạc theo trường độ:</p>
                <ul>
                    <li><b>Nốt Đen (Quarter Note):</b> 1 phách tròn.</li>
                    <li><b>Nốt Trắng (Half Note):</b> Ngân dài 2 phách.</li>
                    <li><b>Nốt Móc Đơn (Eighth Note):</b> 1/2 phách. Hai nốt móc đơn dính chùm tạo nên 1 phách tròn.</li>
                </ul>
            `;
        } else if (gameId === 'interval') {
            content = `
                <h3>📖 Lý Thuyết Quãng Âm (Music Intervals)</h3>
                <p>Quãng âm là khoảng cách độ cao giữa hai nốt nhạc:</p>
                <ul>
                    <li><b>Quãng 1 (Unison):</b> Hai nốt cùng độ cao.</li>
                    <li><b>Quãng 3 Trưởng (Major 3rd):</b> Khoảng cách 4 nửa cung (C - E). Mang sắc thái vui tươi.</li>
                    <li><b>Quãng 5 Đúng (Perfect 5th):</b> Khoảng cách 7 nửa cung (C - G). Âm thanh trong trẻo, vững chãi.</li>
                    <li><b>Quãng 8 (Octave):</b> Khoảng cách 12 nửa cung (C4 - C5).</li>
                </ul>
            `;
        } else if (gameId === 'scale') {
            content = `
                <h3>📖 Lý Thuyết Âm Giai (Scales)</h3>
                <p>Âm giai là dãy các nốt nhạc được xếp theo thứ tự độ cao tăng dần:</p>
                <ul>
                    <li><b>Major Scale (Trưởng):</b> Cấu trúc (1 - 1 - 1/2 - 1 - 1 - 1 - 1/2). Sáng sủa, vui vẻ.</li>
                    <li><b>Minor Scale (Thứ):</b> Sắc thái u buồn, trầm lắng.</li>
                    <li><b>Pentatonic (Ngũ âm):</b> Gồm 5 nốt mang âm hưởng dân ca Đông Á.</li>
                </ul>
            `;
        } else if (gameId === 'chord') {
            content = `
                <h3>📖 Lý Thuyết Hợp Âm (Chords)</h3>
                <p>Hợp âm được tạo thành khi vang lên cùng lúc từ 3 nốt nhạc trở lên:</p>
                <ul>
                    <li><b>Major Chord (Trưởng):</b> Nốt gốc + Quãng 3 Trưởng + Quãng 5 Đúng (Nghe vang, sáng).</li>
                    <li><b>Minor Chord (Thứ):</b> Nốt gốc + Quãng 3 Thứ + Quãng 5 Đúng (Nghe u buồn, tâm trạng).</li>
                </ul>
            `;
        }

        cardBody.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.7; color: #334155;">
                ${content}
            </div>
        `;
    }

})();
