// --- PIANO SOLO ENGINE & VIRTUAL KEYBOARD MODULE ---

(function() {
    let audioCtx = null;
    let sustainPedal = false;
    let showKeyLabels = true;
    let isPlayingSong = false;
    let activePlaybackTimers = [];

    // 8 Classical & Modern Piano Solo Pieces (ABC Format with Grand Staff %%score {1 2})
    const PIANO_SOLO_SONGS = {
        fur_elise: {
            title: "Für Elise (Thư Gửi Elise) - L. v. Beethoven",
            bpm: 130,
            abc: `X:1\nT: Für Elise (Piano Solo)\nC: L. v. Beethoven\nM: 3/8\nL: 1/16\nQ: 3/8=55\n%%score {1 | 2}\nK: Am\nV:1 clef=treble\ne^d | e^deBdc | A2 z C EA | B2 z E ^G B | c2 z e ^d e |\ne^deBdc | A2 z C EA | B2 z E c B | A4 ||\nV:2 clef=bass\nz2 | z6 | A,, E, A, z z2 | E,, E, ^G, z z2 | A,, E, A, z z2 |\nz6 | A,, E, A, z z2 | E,, E, ^G, z z2 | A,, E, A, z ||`
        },
        canon_in_d: {
            title: "Canon in D (Piano Solo) - J. Pachelbel",
            bpm: 80,
            abc: `X:1\nT: Canon in D (Piano Solo)\nC: J. Pachelbel\nM: 4/4\nL: 1/8\nQ: 1/4=76\n%%score {1 | 2}\nK: D\nV:1 clef=treble\nf2 e2 d2 c2 | B2 A2 B2 c2 | f2 e2 d2 c2 | B2 A2 B2 c2 |\na2 g2 f2 e2 | d2 c2 d2 e2 | a2 g2 f2 e2 | d2 c2 d2 e2 ||\nV:2 clef=bass\nD,2 A,,2 B,,2 F,,2 | G,,2 D,,2 G,,2 A,,2 | D,2 A,,2 B,,2 F,,2 | G,,2 D,,2 G,,2 A,,2 |\nD,2 A,,2 B,,2 F,,2 | G,,2 D,,2 G,,2 A,,2 | D,2 A,,2 B,,2 F,,2 | G,,2 D,,2 G,,2 A,,2 ||`
        },
        mariage_damour: {
            title: "Mariage d'Amour (Đám Cưới Hoa) - R. Clayderman",
            bpm: 75,
            abc: `X:1\nT: Mariage d'Amour (Piano Solo)\nC: Paul de Senneville\nM: 4/4\nL: 1/8\nQ: 1/4=72\n%%score {1 | 2}\nK: Gm\nV:1 clef=treble\nDG B d g2 d2 | c3 B B2 A2 | CF A c f2 c2 | B3 A A2 G2 |\nDG B d g2 d2 | c3 B d2 g2 | ^f4 a4 | g8 ||\nV:2 clef=bass\nG,, D, G, B, D G B z | C, G, C E G c e z | F,, C, F, A, C F A z | B,,, F,, B,, D, F, B, D z |\nG,, D, G, B, D G B z | C, G, C E G c e z | D,, A,, D, ^F, A, D ^F z | G,, D, G, B, D4 ||`
        },
        river_flows_in_you: {
            title: "River Flows in You - Yiruma",
            bpm: 70,
            abc: `X:1\nT: River Flows in You (Piano Solo)\nC: Yiruma\nM: 4/4\nL: 1/16\nQ: 1/4=68\n%%score {1 | 2}\nK: A\nV:1 clef=treble\n[A4c4] [E4G4] [F4A4] [D4F4] | c2BA c2BA c2BA c2e2 |\nf4 e4 c4 B4 | c2BA c2BA c2BA B2A2 ||\nV:2 clef=bass\nF,, C, A, C E,, B,, G, B,, | F,, C, A, C D,, A,, F, A,, |\nF,, C, A, C E,, B,, G, B,, | D,, A,, F, A,, E,, B,, G, B,, ||`
        },
        moonlight_sonata: {
            title: "Moonlight Sonata (Ánh Trăng) - L. v. Beethoven",
            bpm: 60,
            abc: `X:1\nT: Moonlight Sonata (Piano Solo)\nC: L. v. Beethoven\nM: 4/4\nL: 1/8\nQ: 1/4=54\n%%score {1 | 2}\nK: C#m\nV:1 clef=treble\n(3G,,C,E, (3G,,C,E, (3G,,C,E, (3G,,C,E, | (3G,,C,E, (3G,,C,E, (3G,,C,E, (3G,,C,E, |\n(3A,,C,E, (3A,,C,E, (3G,,C,E, (3G,,C,E, | (3^F,,C,D, (3^F,,C,D, (3^G,,B,,E, (3^G,,B,,E, ||\nV:2 clef=bass\nC,,4 C,,4 | B,,,4 B,,,4 | A,,,4 G,,,4 | F,,,2 ^G,,,2 C,,4 ||`
        },
        sonata_facile: {
            title: "Sonata Facile in C Major - W. A. Mozart",
            bpm: 120,
            abc: `X:1\nT: Sonata Facile K.545 (Piano Solo)\nC: W. A. Mozart\nM: 4/4\nL: 1/8\nQ: 1/4=116\n%%score {1 | 2}\nK: C\nV:1 clef=treble\nc2 e2 g2 B2 | c2 d2 c4 | f2 a2 g2 c2 | d2 e2 d4 |\ne2 g2 f2 e2 | d2 f2 e2 d2 | c2 e2 d2 c2 | B2 d2 c4 ||\nV:2 clef=bass\n[C,E,G,]2 z2 [C,E,G,]2 z2 | [C,F,A,]2 [C,E,G,]2 [C,E,G,]4 | [C,F,A,]2 z2 [C,E,G,]2 z2 | [G,,B,,D,]2 [C,E,G,]2 [G,,B,,D,]4 |\n[C,E,G,]8 | [G,,B,,D,]8 | [C,E,G,]8 | [G,,B,,D,]4 [C,E,G,]4 ||`
        },
        nho_oi: {
            title: "Nhỏ Ơi (Piano Solo Trang Nhã)",
            bpm: 85,
            abc: `X:1\nT: Nhỏ Ơi (Piano Solo)\nC: Việt Anh\nM: 3/4\nL: 1/8\nQ: 1/4=84\n%%score {1 | 2}\nK: C\nV:1 clef=treble\nE2 G2 c2 | e3 d c2 | d2 E2 G2 | B3 A G2 |\nc2 E2 G2 | A3 G F2 | G2 C2 E2 | D6 ||\nV:2 clef=bass\nC, G, C E z2 | C, G, C E z2 | G,, D, G, B, z2 | G,, D, G, B, z2 |\nA,, E, A, C z2 | F,, C, F, A, z2 | C, G, C E z2 | G,, D, G, B, z2 ||`
        },
        tinh_don_phuong: {
            title: "Tình Đơn Phương (Piano Solo Ballad)",
            bpm: 90,
            abc: `X:1\nT: Tình Đơn Phương (Piano Solo)\nC: Nhạc Hoa / Lời Việt\nM: 4/4\nL: 1/8\nQ: 1/4=88\n%%score {1 | 2}\nK: Am\nV:1 clef=treble\nE2 A2 B2 c2 | B3 A G2 E2 | F2 A2 c2 e2 | d4 e4 |\ne2 c2 A2 c2 | d3 c B2 G2 | A2 E2 C2 E2 | A8 ||\nV:2 clef=bass\nA,, E, A, C4 | E,, B,, E, G,4 | F,, C, F, A,4 | G,, D, G, B,4 |\nA,, E, A, C4 | G,, D, G, B,4 | F,, C, F, A,4 | A,, E, A, C4 ||`
        }
    };

    // Computer Keyboard Mappings for Octave 4 (C4 - B4) & Octave 5 (C5 - C6)
    const KEY_BOARD_MAP = {
        // Octave 3 (C3 - B3)
        'z': { note: 'C3', midi: 48 }, 's': { note: 'C#3', midi: 49 },
        'x': { note: 'D3', midi: 50 }, 'd': { note: 'D#3', midi: 51 },
        'c': { note: 'E3', midi: 52 },
        'v': { note: 'F3', midi: 53 }, 'g': { note: 'F#3', midi: 54 },
        'b': { note: 'G3', midi: 55 }, 'h': { note: 'G#3', midi: 56 },
        'n': { note: 'A3', midi: 57 }, 'j': { note: 'A#3', midi: 58 },
        'm': { note: 'B3', midi: 59 },
        // Octave 4 (C4 - B4)
        'q': { note: 'C4', midi: 60 }, '2': { note: 'C#4', midi: 61 },
        'w': { note: 'D4', midi: 62 }, '3': { note: 'D#4', midi: 63 },
        'e': { note: 'E4', midi: 64 },
        'r': { note: 'F4', midi: 65 }, '5': { note: 'F#4', midi: 66 },
        't': { note: 'G4', midi: 67 }, '6': { note: 'G#4', midi: 68 },
        'y': { note: 'A4', midi: 69 }, '7': { note: 'A#4', midi: 70 },
        'u': { note: 'B4', midi: 71 },
        // Octave 5 (C5 - C6)
        'i': { note: 'C5', midi: 72 }, '9': { note: 'C#5', midi: 73 },
        'o': { note: 'D5', midi: 74 }, '0': { note: 'D#5', midi: 75 },
        'p': { note: 'E5', midi: 76 }
    };

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Play Acoustic Piano Tone with Overtones & Decay Envelope
    window.playPianoSoloTone = function(freq, duration = 1.8, velocity = 0.8) {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, now); // 2nd Harmonic

            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(freq * 3, now); // 3rd Harmonic

            const gain = ctx.createGain();
            const gain2 = ctx.createGain();
            const gain3 = ctx.createGain();
            const masterGain = ctx.createGain();

            const decay = sustainPedal ? duration * 2.2 : duration;

            gain.gain.setValueAtTime(0.7 * velocity, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            gain2.gain.setValueAtTime(0.25 * velocity, now);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.7);

            gain3.gain.setValueAtTime(0.1 * velocity, now);
            gain3.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.4);

            osc.connect(gain);
            osc2.connect(gain2);
            osc3.connect(gain3);

            gain.connect(masterGain);
            gain2.connect(masterGain);
            gain3.connect(masterGain);

            masterGain.connect(ctx.destination);

            osc.start(now);
            osc2.start(now);
            osc3.start(now);

            osc.stop(now + decay);
            osc2.stop(now + decay);
            osc3.stop(now + decay);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    };

    window.midiToFreq = function(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    };

    // Render Full Visual Piano 5-Octave Keyboard (C2 to C7: MIDI 36 to 96) for Complete 2-Hand Visibility
    window.renderVirtualPianoKeyboard = function() {
        const keyboardElem = document.getElementById('piano-solo-keyboard');
        if (!keyboardElem) return;

        keyboardElem.innerHTML = '';

        const startMidi = 36; // C2 (Low Bass - Left Hand)
        const endMidi = 96;   // C7 (High Treble - Right Hand)

        const notesInOctave = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let whiteKeyOffset = 0;

        for (let midi = startMidi; midi <= endMidi; midi++) {
            const noteIdx = midi % 12;
            const octave = Math.floor(midi / 12) - 1;
            const noteName = notesInOctave[noteIdx];
            const fullName = `${noteName}${octave}`;
            const isBlack = noteName.includes('#');
            const isLeftHandRange = (midi < 60);

            // Find key binding
            let keyBindStr = '';
            for (const [k, v] of Object.entries(KEY_BOARD_MAP)) {
                if (v.midi === midi) {
                    keyBindStr = k.toUpperCase();
                    break;
                }
            }

            const keyDiv = document.createElement('div');
            keyDiv.id = `piano-key-${midi}`;
            keyDiv.dataset.midi = midi;
            keyDiv.dataset.note = fullName;

            if (isBlack) {
                keyDiv.className = 'black-key';
                keyDiv.style.cssText = `
                    position: absolute;
                    left: ${whiteKeyOffset * 26 - 9}px;
                    width: 18px;
                    height: 100px;
                    background: linear-gradient(180deg, #1e293b, #0f172a);
                    border: 1px solid #020617;
                    border-radius: 0 0 5px 5px;
                    z-index: 2;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: center;
                    padding-bottom: 6px;
                    color: ${isLeftHandRange ? '#38bdf8' : '#facc15'};
                    font-size: 0.62rem;
                    font-weight: 800;
                    transition: background 0.1s, transform 0.1s;
                `;
            } else {
                keyDiv.className = 'white-key';
                keyDiv.style.cssText = `
                    position: relative;
                    width: 25px;
                    height: 160px;
                    margin-right: 1px;
                    background: linear-gradient(180deg, #ffffff, #f1f5f9);
                    border: 1.5px solid #cbd5e1;
                    border-radius: 0 0 7px 7px;
                    z-index: 1;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: center;
                    padding-bottom: 10px;
                    color: #1e293b;
                    font-size: 0.7rem;
                    font-weight: 800;
                    transition: background 0.1s, transform 0.1s;
                `;
                whiteKeyOffset++;
            }

            keyDiv.innerHTML = `
                ${showKeyLabels ? `<span style="font-size: 0.65rem; color: ${isLeftHandRange ? '#0284c7' : '#e11d48'}; font-weight: 800;">${fullName}</span>` : ''}
                ${keyBindStr ? `<span style="font-size: 0.62rem; opacity: 0.85; font-weight: bold; background: ${isBlack ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}; padding: 1px 3px; border-radius: 3px; margin-top: 2px;">${keyBindStr}</span>` : ''}
            `;

            keyDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                window.triggerPianoKey(midi, 400, isLeftHandRange ? 'left' : 'right');
            });

            keyboardElem.appendChild(keyDiv);
        }
    };

    // Trigger key playback with distinct color coding for Left Hand (Cyan/Blue #0284c7) vs Right Hand (Rose/Gold #e11d48 / #fde047)
    window.triggerPianoKey = function(midi, durMs = 400, hand = null) {
        const freq = window.midiToFreq(midi);
        const durSec = Math.max(0.3, durMs / 1000);
        window.playPianoSoloTone(freq, durSec, 0.85);

        const keyElem = document.getElementById(`piano-key-${midi}`);
        if (keyElem) {
            const isBlack = keyElem.classList.contains('black-key');
            const isLeft = (hand === 'left') || (midi < 60);

            // Left Hand = Royal Blue/Cyan (#0284c7), Right Hand = Rose/Gold (#e11d48 / #fde047)
            const activeColor = isLeft ? '#0284c7' : (isBlack ? '#f43f5e' : '#fde047');
            const glowShadow = isLeft ? '0 0 14px #0284c7' : '0 0 14px #e11d48';

            keyElem.style.background = activeColor;
            keyElem.style.boxShadow = glowShadow;
            keyElem.style.transform = 'scale(0.96)';

            setTimeout(() => {
                keyElem.style.background = isBlack ? 'linear-gradient(180deg, #1e293b, #0f172a)' : 'linear-gradient(180deg, #ffffff, #f1f5f9)';
                keyElem.style.boxShadow = isBlack ? '0 4px 8px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.1)';
                keyElem.style.transform = 'none';
            }, Math.min(300, durMs));
        }
    };

    // Computer Keyboard Event Listener
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const key = e.key.toLowerCase();
        if (KEY_BOARD_MAP[key]) {
            const midi = KEY_BOARD_MAP[key].midi;
            window.triggerPianoKey(midi, 400, midi < 60 ? 'left' : 'right');
        }
    });

    window.togglePianoSustainPedal = function() {
        sustainPedal = !sustainPedal;
        const btn = document.getElementById('btn-piano-pedal');
        if (btn) {
            btn.innerHTML = sustainPedal ? '🌊 Pedal Vang: ON (Ngân Rút)' : '🌊 Pedal Vang: OFF';
            btn.style.background = sustainPedal ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255,255,255,0.2)';
        }
    };

    window.togglePianoKeyLabels = function() {
        showKeyLabels = !showKeyLabels;
        const btn = document.getElementById('btn-piano-labels');
        if (btn) {
            btn.innerHTML = showKeyLabels ? '🏷️ Tên Nốt: ON' : '🏷️ Tên Nốt: OFF';
        }
        window.renderVirtualPianoKeyboard();
    };

    window.loadPianoSoloSong = function(songKey) {
        const song = PIANO_SOLO_SONGS[songKey] || PIANO_SOLO_SONGS.fur_elise;
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) {
            textarea.value = song.abc;
        }
        window.renderPianoSoloSheet(song.abc);
    };

    // Renders ABC sheet music dynamically as user types or selects a song
    window.renderPianoSoloSheet = function(abcCode) {
        const paper = document.getElementById('piano-solo-paper');
        if (!paper) return;
        paper.innerHTML = '';

        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (!abcRenderer) return;

        try {
            abcRenderer.renderAbc('piano-solo-paper', abcCode, {
                responsive: 'resize',
                scale: 1.15,
                staffwidth: 780,
                paddingtop: 15,
                paddingbottom: 15,
                add_classes: true
            });
        } catch (err) {
            console.warn('ABC Render error:', err);
        }
    };

    window.renderPianoSoloAbcFromEditor = function() {
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) {
            window.renderPianoSoloSheet(textarea.value);
        }
    };

    window.togglePianoSoloEditor = function() {
        const container = document.getElementById('piano-solo-editor-container');
        if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'block' : 'none';
        }
    };

    // DYNAMIC PARSER: Parses current ABC Notation string directly from editor into exact note events with Left/Right hand assignments
    function parseAbcToNoteEvents(abcCode) {
        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (!abcRenderer || !abcRenderer.parseOnly) {
            return [];
        }

        try {
            const parsed = abcRenderer.parseOnly(abcCode);
            if (!parsed || parsed.length === 0) return [];

            const tune = parsed[0];
            let tempoBpm = 100;
            if (tune.metaText && tune.metaText.tempo) {
                tempoBpm = tune.metaText.tempo.bpm || 100;
            }

            const quarterMs = (60000 / tempoBpm);
            const noteEvents = [];

            if (tune.lines) {
                tune.lines.forEach((line) => {
                    if (!line.staff) return;
                    line.staff.forEach((staff) => {
                        const isBassClef = (staff.clef && staff.clef.type === 'bass');
                        if (!staff.voices) return;
                        staff.voices.forEach((voice, vIdx) => {
                            let currentTime = 0;
                            const isLeftHand = isBassClef || vIdx === 1;

                            voice.forEach((elem) => {
                                const dur = elem.duration || 0;
                                if (elem.el_type === 'note' && elem.pitches) {
                                    elem.pitches.forEach((p) => {
                                        const midi = p.pitch + 60;
                                        const noteHand = isLeftHand || midi < 60 ? 'left' : 'right';
                                        noteEvents.push({
                                            midi: midi,
                                            hand: noteHand,
                                            timeMs: Math.round(currentTime * quarterMs * 4),
                                            durMs: Math.max(150, Math.round(dur * quarterMs * 4))
                                        });
                                    });
                                }
                                currentTime += dur;
                            });
                        });
                    });
                });
            }

            noteEvents.sort((a, b) => a.timeMs - b.timeMs);
            return noteEvents;
        } catch (e) {
            console.warn('Error parsing ABC string:', e);
            return [];
        }
    }

    // Auto Play Piano Solo Song (Parses current ABC string & plays actual notes on Piano Virtual Keyboard)
    window.playPianoSoloSong = function() {
        window.stopPianoSoloSong();

        const textarea = document.getElementById('piano-solo-abc-editor');
        const abcCode = textarea ? textarea.value : (PIANO_SOLO_SONGS.fur_elise.abc);

        // Render sheet first to guarantee 100% sync
        window.renderPianoSoloSheet(abcCode);

        // Extract exact note events from the ABC notation
        const noteEvents = parseAbcToNoteEvents(abcCode);

        if (noteEvents.length === 0) {
            alert('Không tìm thấy nốt nhạc hợp lệ trong mã ABC! Vui lòng kiểm tra lại mã ABC.');
            return;
        }

        isPlayingSong = true;
        const btnPlay1 = document.getElementById('btn-play-piano-solo');
        const btnPlay2 = document.getElementById('btn-play-sheet-abc');
        const textStr = `🔄 Đang Phát (${noteEvents.length} Nốt ABC)...`;
        if (btnPlay1) btnPlay1.innerHTML = textStr;
        if (btnPlay2) btnPlay2.innerHTML = textStr;

        let maxEndMs = 0;

        noteEvents.forEach(n => {
            const endMs = n.timeMs + n.durMs;
            if (endMs > maxEndMs) maxEndMs = endMs;

            const timer = setTimeout(() => {
                if (isPlayingSong) {
                    window.triggerPianoKey(n.midi, n.durMs, n.hand);
                }
            }, n.timeMs);
            activePlaybackTimers.push(timer);
        });

        const stopTimer = setTimeout(() => {
            window.stopPianoSoloSong();
        }, maxEndMs + 800);
        activePlaybackTimers.push(stopTimer);
    };

    window.stopPianoSoloSong = function() {
        isPlayingSong = false;
        activePlaybackTimers.forEach(t => clearTimeout(t));
        activePlaybackTimers = [];

        const btnPlay1 = document.getElementById('btn-play-piano-solo');
        const btnPlay2 = document.getElementById('btn-play-sheet-abc');
        if (btnPlay1) btnPlay1.innerHTML = '▶️ Bắt Đầu Độc Tấu';
        if (btnPlay2) btnPlay2.innerHTML = '▶️ Nghe Độc Tấu Sheet ABC Này';
    };

    window.initPianoSoloView = function() {
        setTimeout(() => {
            window.renderVirtualPianoKeyboard();
            window.loadPianoSoloSong('fur_elise');
        }, 50);
    };
})();
