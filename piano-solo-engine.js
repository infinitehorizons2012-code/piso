// --- PIANO SOLO ENGINE & VIRTUAL KEYBOARD MODULE ---

(function() {
    let audioCtx = null;
    let sustainPedal = false;
    let showKeyLabels = true;
    let isPlayingSong = false;
    let activePlaybackTimers = [];

    // Real Acoustic Grand Piano Soundfont Sample Engine Cache (FluidR3_GM / Steinway Soundfont)
    const soundfontCache = {};
    const soundfontLoadingMap = {};
    const SOUNDFONT_BASE_URL = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/';
    const notesInOctaveFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    function midiToSoundfontFileName(midi) {
        const noteIdx = midi % 12;
        const octave = Math.floor(midi / 12) - 1;
        const noteName = notesInOctaveFlats[noteIdx];
        return `${noteName}${octave}.mp3`;
    }

    async function loadSoundfontSample(midi) {
        if (soundfontCache[midi]) return soundfontCache[midi];
        if (soundfontLoadingMap[midi]) return soundfontLoadingMap[midi];

        const fileName = midiToSoundfontFileName(midi);
        const url = SOUNDFONT_BASE_URL + fileName;

        const promise = (async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const ctx = getAudioContext();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                soundfontCache[midi] = audioBuffer;
                return audioBuffer;
            } catch (err) {
                console.warn(`Failed loading Soundfont sample for MIDI ${midi} (${fileName}):`, err);
                return null;
            } finally {
                delete soundfontLoadingMap[midi];
            }
        })();

        soundfontLoadingMap[midi] = promise;
        return promise;
    }

    function preloadCommonSoundfontSamples() {
        // Pre-cache Octaves 3, 4, 5 (MIDI 48 to 84) for instant response
        for (let midi = 48; midi <= 84; midi++) {
            loadSoundfontSample(midi);
        }
    }

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

    // Play High-Definition Acoustic Grand Piano (Soundfont Audio Sample with Natural Resonance & Smooth Envelope)
    window.playPianoSoloTone = function(freq, duration = 1.8, velocity = 0.8, midi = null) {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            if (midi === null && freq) {
                midi = Math.round(69 + 12 * Math.log2(freq / 440));
            }

            // 1. PLAY REAL RECORDED ACOUSTIC GRAND PIANO SAMPLE IF CACHED
            if (midi && soundfontCache[midi]) {
                const source = ctx.createBufferSource();
                source.buffer = soundfontCache[midi];

                const gainNode = ctx.createGain();
                const decaySec = sustainPedal ? Math.max(2.8, duration * 2.2) : Math.max(1.0, duration * 1.3);

                gainNode.gain.setValueAtTime(0.0001, now);
                gainNode.gain.linearRampToValueAtTime(1.0 * velocity, now + 0.003); // Smooth 3ms attack
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

                source.connect(gainNode);
                gainNode.connect(ctx.destination);

                source.start(now);
                source.stop(now + decaySec + 0.1);
                return;
            }

            // Trigger background pre-fetch if not cached yet
            if (midi) {
                loadSoundfontSample(midi);
            }

            // 2. PHYSICAL MODELING SYNTHESIZER FALLBACK (Smooth 5ms envelope + Overtones)
            const noteGain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(Math.min(3500, freq * 4.5), now);
            filter.Q.setValueAtTime(0.8, now);

            const oscFundamental = ctx.createOscillator();
            oscFundamental.type = 'sine';
            oscFundamental.frequency.setValueAtTime(freq, now);

            const oscWarmth = ctx.createOscillator();
            oscWarmth.type = 'triangle';
            oscWarmth.frequency.setValueAtTime(freq, now);

            const oscHarmonic2 = ctx.createOscillator();
            oscHarmonic2.type = 'sine';
            oscHarmonic2.frequency.setValueAtTime(freq * 2.001, now);

            const oscHarmonic3 = ctx.createOscillator();
            oscHarmonic3.type = 'sine';
            oscHarmonic3.frequency.setValueAtTime(freq * 3.003, now);

            const gFund = ctx.createGain();
            const gWarm = ctx.createGain();
            const gHarm2 = ctx.createGain();
            const gHarm3 = ctx.createGain();

            const decay = sustainPedal ? duration * 2.5 : Math.max(0.7, duration);

            gFund.gain.setValueAtTime(0.0001, now);
            gFund.gain.linearRampToValueAtTime(0.65 * velocity, now + 0.005);
            gFund.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            gWarm.gain.setValueAtTime(0.0001, now);
            gWarm.gain.linearRampToValueAtTime(0.25 * velocity, now + 0.005);
            gWarm.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.85);

            gHarm2.gain.setValueAtTime(0.0001, now);
            gHarm2.gain.linearRampToValueAtTime(0.12 * velocity, now + 0.005);
            gHarm2.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.5);

            gHarm3.gain.setValueAtTime(0.0001, now);
            gHarm3.gain.linearRampToValueAtTime(0.05 * velocity, now + 0.005);
            gHarm3.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.3);

            noteGain.gain.setValueAtTime(0.0001, now);
            noteGain.gain.linearRampToValueAtTime(1.0, now + 0.004);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            oscFundamental.connect(gFund);
            oscWarmth.connect(gWarm);
            oscHarmonic2.connect(gHarm2);
            oscHarmonic3.connect(gHarm3);

            gFund.connect(filter);
            gWarm.connect(filter);
            gHarm2.connect(filter);
            gHarm3.connect(filter);

            filter.connect(noteGain);
            noteGain.connect(ctx.destination);

            oscFundamental.start(now);
            oscWarmth.start(now);
            oscHarmonic2.start(now);
            oscHarmonic3.start(now);

            oscFundamental.stop(now + decay + 0.05);
            oscWarmth.stop(now + decay + 0.05);
            oscHarmonic2.stop(now + decay + 0.05);
            oscHarmonic3.stop(now + decay + 0.05);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    };

    window.midiToFreq = function(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    };

    // Render Full Visual Piano 5-Octave Keyboard (C2 to C7: MIDI 36 to 96) with 100% Precise Nested Black Keys
    window.renderVirtualPianoKeyboard = function() {
        const keyboardElem = document.getElementById('piano-solo-keyboard');
        if (!keyboardElem) return;

        keyboardElem.innerHTML = '';

        const startMidi = 36; // C2 (Low Bass - Left Hand)
        const endMidi = 96;   // C7 (High Treble - Right Hand)

        const notesInOctave = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        for (let midi = startMidi; midi <= endMidi; midi++) {
            const noteIdx = midi % 12;
            const octave = Math.floor(midi / 12) - 1;
            const noteName = notesInOctave[noteIdx];
            const fullName = `${noteName}${octave}`;
            const isBlack = noteName.includes('#');

            if (isBlack) continue;

            const isLeftHandRange = (midi < 60);

            let keyBindStr = '';
            for (const [k, v] of Object.entries(KEY_BOARD_MAP)) {
                if (v.midi === midi) {
                    keyBindStr = k.toUpperCase();
                    break;
                }
            }

            const whiteKeyDiv = document.createElement('div');
            whiteKeyDiv.id = `piano-key-${midi}`;
            whiteKeyDiv.className = 'white-key';
            whiteKeyDiv.dataset.midi = midi;
            whiteKeyDiv.dataset.note = fullName;
            whiteKeyDiv.style.cssText = `
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
                user-select: none;
                transition: background 0.1s, transform 0.1s;
            `;

            whiteKeyDiv.innerHTML = `
                ${showKeyLabels ? `<span style="font-size: 0.65rem; color: ${isLeftHandRange ? '#0284c7' : '#e11d48'}; font-weight: 800; pointer-events: none;">${fullName}</span>` : ''}
                ${keyBindStr ? `<span style="font-size: 0.62rem; opacity: 0.85; font-weight: bold; background: #e2e8f0; padding: 1px 3px; border-radius: 3px; margin-top: 2px; pointer-events: none;">${keyBindStr}</span>` : ''}
            `;

            whiteKeyDiv.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('black-key') || e.target.closest('.black-key')) return;
                e.preventDefault();
                window.triggerPianoKey(midi, 400, isLeftHandRange ? 'left' : 'right');
            });

            if (midi + 1 <= endMidi) {
                const nextNoteName = notesInOctave[(midi + 1) % 12];
                if (nextNoteName.includes('#')) {
                    const blackMidi = midi + 1;
                    const blackFullName = `${nextNoteName}${octave}`;
                    const isBlackLeftHand = (blackMidi < 60);

                    let blackKeyBindStr = '';
                    for (const [k, v] of Object.entries(KEY_BOARD_MAP)) {
                        if (v.midi === blackMidi) {
                            blackKeyBindStr = k.toUpperCase();
                            break;
                        }
                    }

                    const blackKeyDiv = document.createElement('div');
                    blackKeyDiv.id = `piano-key-${blackMidi}`;
                    blackKeyDiv.className = 'black-key';
                    blackKeyDiv.dataset.midi = blackMidi;
                    blackKeyDiv.dataset.note = blackFullName;
                    blackKeyDiv.style.cssText = `
                        position: absolute;
                        top: -1px;
                        right: -9px;
                        width: 17px;
                        height: 100px;
                        background: linear-gradient(180deg, #1e293b, #0f172a);
                        border: 1px solid #020617;
                        border-radius: 0 0 5px 5px;
                        z-index: 10;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                        align-items: center;
                        padding-bottom: 6px;
                        color: ${isBlackLeftHand ? '#38bdf8' : '#facc15'};
                        font-size: 0.6rem;
                        font-weight: 800;
                        transition: background 0.1s, transform 0.1s;
                    `;

                    blackKeyDiv.innerHTML = `
                        ${showKeyLabels ? `<span style="font-size: 0.6rem; color: ${isBlackLeftHand ? '#38bdf8' : '#fde047'}; font-weight: 800; pointer-events: none;">${blackFullName}</span>` : ''}
                        ${blackKeyBindStr ? `<span style="font-size: 0.58rem; opacity: 0.85; font-weight: bold; background: rgba(255,255,255,0.2); padding: 1px 3px; border-radius: 3px; margin-top: 2px; pointer-events: none;">${blackKeyBindStr}</span>` : ''}
                    `;

                    blackKeyDiv.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        window.triggerPianoKey(blackMidi, 400, isBlackLeftHand ? 'left' : 'right');
                    });

                    whiteKeyDiv.appendChild(blackKeyDiv);
                }
            }

            keyboardElem.appendChild(whiteKeyDiv);
        }
    };

    // Trigger key playback with distinct color coding for Left Hand (Cyan/Blue #0284c7) vs Right Hand (Rose/Gold #e11d48 / #fde047)
    window.triggerPianoKey = function(midi, durMs = 400, hand = null) {
        const freq = window.midiToFreq(midi);
        const durSec = Math.max(0.3, durMs / 1000);
        window.playPianoSoloTone(freq, durSec, 0.85, midi);

        const keyElem = document.getElementById(`piano-key-${midi}`);
        if (keyElem) {
            const isBlack = keyElem.classList.contains('black-key');
            const isLeft = (hand === 'left') || (midi < 60);

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

    function pitchToMidi(pitchObj, keySig = 'C') {
        if (!pitchObj || typeof pitchObj.pitch !== 'number') return 60;
        const step = pitchObj.pitch;
        const octave = Math.floor(step / 7);
        const degree = ((step % 7) + 7) % 7;
        const diatonicSemitones = [0, 2, 4, 5, 7, 9, 11][degree];
        let midi = 60 + diatonicSemitones + (octave * 12);

        if (pitchObj.accidental) {
            if (pitchObj.accidental === 'sharp') midi += 1;
            else if (pitchObj.accidental === 'flat') midi -= 1;
            else if (pitchObj.accidental === 'dblsharp') midi += 2;
            else if (pitchObj.accidental === 'dblflat') midi -= 2;
        } else {
            const keyMap = {
                'G': { 3: 1 }, 'Em': { 3: 1 },
                'D': { 3: 1, 0: 1 }, 'Bm': { 3: 1, 0: 1 },
                'A': { 3: 1, 0: 1, 4: 1 }, 'F#m': { 3: 1, 0: 1, 4: 1 },
                'E': { 3: 1, 0: 1, 4: 1, 1: 1 }, 'C#m': { 3: 1, 0: 1, 4: 1, 1: 1 },
                'F': { 6: -1 }, 'Dm': { 6: -1 },
                'Bb': { 6: -1, 2: -1 }, 'Gm': { 6: -1, 2: -1 },
                'Eb': { 6: -1, 2: -1, 5: -1 }, 'Cm': { 6: -1, 2: -1, 5: -1 },
                'Ab': { 6: -1, 2: -1, 5: -1, 1: -1 }, 'Fm': { 6: -1, 2: -1, 5: -1, 1: -1 }
            };
            const activeKey = keyMap[keySig];
            if (activeKey && activeKey[degree] !== undefined) {
                midi += activeKey[degree];
            }
        }
        return midi;
    }

    function parseAbcToNoteEvents(abcCode) {
        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (!abcRenderer || !abcRenderer.parseOnly) {
            return [];
        }

        try {
            const parsed = abcRenderer.parseOnly(abcCode);
            if (!parsed || parsed.length === 0) return [];

            const tune = parsed[0];
            let tempoBpm = 90;
            if (tune.metaText && tune.metaText.tempo) {
                tempoBpm = tune.metaText.tempo.bpm || 90;
            } else {
                const matchQ = abcCode.match(/Q:\s*(?:\d\/\d=)?(\d+)/i);
                if (matchQ) tempoBpm = parseInt(matchQ[1], 10);
            }

            let keySig = 'C';
            const matchK = abcCode.match(/K:\s*([A-Ga-g][#b]?m?)/);
            if (matchK) keySig = matchK[1];

            const quarterMs = (60000 / tempoBpm);
            const voiceTimeMap = {};
            const noteEvents = [];

            if (tune.lines) {
                tune.lines.forEach((line) => {
                    if (!line.staff) return;
                    line.staff.forEach((staff, sIdx) => {
                        const isBassClef = (staff.clef && staff.clef.type === 'bass');
                        if (!staff.voices) return;
                        staff.voices.forEach((voice, vIdx) => {
                            const vKey = `${sIdx}_${vIdx}`;
                            if (voiceTimeMap[vKey] === undefined) {
                                voiceTimeMap[vKey] = 0;
                            }
                            const isLeftHand = isBassClef || vIdx === 1;

                            voice.forEach((elem) => {
                                const dur = elem.duration || 0;
                                if (elem.el_type === 'note' && elem.pitches) {
                                    elem.pitches.forEach((p) => {
                                        const midi = pitchToMidi(p, keySig);
                                        const noteHand = isLeftHand || midi < 60 ? 'left' : 'right';
                                        noteEvents.push({
                                            midi: midi,
                                            hand: noteHand,
                                            timeMs: Math.round(voiceTimeMap[vKey] * quarterMs * 4),
                                            durMs: Math.max(150, Math.round(dur * quarterMs * 4))
                                        });
                                    });
                                }
                                voiceTimeMap[vKey] += dur;
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

        window.renderPianoSoloSheet(abcCode);

        const noteEvents = parseAbcToNoteEvents(abcCode);

        if (noteEvents.length === 0) {
            alert('Không tìm thấy nốt nhạc hợp lệ trong mã ABC! Vui lòng kiểm tra lại mã ABC.');
            return;
        }

        isPlayingSong = true;
        const btnPlay = document.getElementById('btn-play-sheet-abc');
        if (btnPlay) btnPlay.innerHTML = `🔄 Đang Phát (${noteEvents.length} Nốt ABC Soundfont)...`;

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

        const btnPlay = document.getElementById('btn-play-sheet-abc');
        if (btnPlay) btnPlay.innerHTML = '▶️ Nghe Độc Tấu Sheet ABC Này';
    };

    window.switchPianoSubTab = function(tabName) {
        const contentInteractive = document.getElementById('piano-subcontent-interactive');
        const contentWeek1 = document.getElementById('piano-subcontent-week1');
        const contentTheory = document.getElementById('piano-subcontent-theory');

        if (contentInteractive) contentInteractive.style.display = (tabName === 'interactive' ? 'block' : 'none');
        if (contentWeek1) contentWeek1.style.display = (tabName === 'week1' ? 'block' : 'none');
        if (contentTheory) contentTheory.style.display = (tabName === 'theory' ? 'block' : 'none');

        if (tabName === 'week1' && typeof window.initWeek1PedagogyView === 'function') {
            window.initWeek1PedagogyView();
        }
    };

    // --- WEEK 1 PEDAGOGY ENGINE (LUYỆN PIANO THEO DÒNG CHO TRẺ EM & NHẠC CÔNG - BỘI NGỌC SOLO METHOD) ---
    const WEEK1_PRESETS = {
        thang_cuoi: {
            title: "Thằng Cuội (Bội Ngọc Solo Method - Tuần 1)",
            abc: `X:1\nT: Thằng Cuội (Tuần 1 - Nhịp 2/4)\nM: 2/4\nL: 1/8\nQ: 1/4=70\nK: C\n% --- DÒNG 1 ---\n"C" G3 A | G2 E2 | "C" C3 E | G4 |\n% --- DÒNG 2 ---\n"Am" E3 D | C2 A,2 | "Am" A,4 | z4 |\n% --- DÒNG 3 ---\n"Am" E3 G | A2 c2 | "F" C3 E | F4 |\n% --- DÒNG 4 ---\n"Dm" D3 F | E2 D2 | "G" G4 | z4 |`
        },
        proud_of_you: {
            title: "Proud Of You (Bội Ngọc Solo Method - Tuần 1)",
            abc: `X:1\nT: Proud Of You (Tuần 1 - Nhịp 2/4)\nM: 2/4\nL: 1/8\nQ: 1/4=72\nK: G\n% --- DÒNG 1 ---\n"G" d2 B2 | "Em" g3 f | "C" e2 d2 | "D" d4 |\n% --- DÒNG 2 ---\n"C" c2 B2 | "Bm" B2 A2 | "Am" A2 G2 | "D" A4 |`
        },
        endless_love: {
            title: "Endless Love (Bội Ngọc Solo Method - Tuần 1)",
            abc: `X:1\nT: Endless Love (Tuần 1 - Nhịp 2/4)\nM: 2/4\nL: 1/8\nQ: 1/4=65\nK: C\n% --- DÒNG 1 ---\n"C" E2 G2 | "Am" c3 B | "F" A2 c2 | "G" G4 |\n% --- DÒNG 2 ---\n"F" F2 A2 | "G" G2 F2 | "C" E4 | z4 |`
        },
        ban_nhac_cua_be: {
            title: "Bản Nhạc Của Bé (Đô Trưởng C)",
            abc: `X:1\nT: Bản Nhạc Của Bé\nM: 4/4\nL: 1/4\nQ: 1/4=100\nK: C\n% --- DÒNG 1 ---\n"C" C D E F | "C" G A B c |\n% --- DÒNG 2 ---\n"F" c B A G | "G" F E D C |`
        },
        fur_elise: {
            title: "Für Elise (Đoạn A Đơn Giản)",
            abc: `X:1\nT: Für Elise\nM: 3/8\nL: 1/16\nQ: 3/8=55\nK: Am\n% --- DÒNG 1 ---\n"Am" e^d eBdc | "Am" A2 z C EA | "E7" B2 z E ^GB |\n% --- DÒNG 2 ---\n"Am" c2 z e ^de | "Am" e^d eBdc | "Am" A2 z C EA |\n% --- DÒNG 3 ---\n"E7" B2 z E cB | "Am" A4 z2 |`
        }
    };

    window.week1State = {
        abcInput: WEEK1_PRESETS.thang_cuoi.abc,
        activeStep: 0,
        parsedLines: [],
        lineConfigs: {},
        masterModalOpen: false
    };

    window.loadWeek1PresetSong = function(presetKey) {
        const p = WEEK1_PRESETS[presetKey] || WEEK1_PRESETS.thang_cuoi;
        window.week1State.abcInput = p.abc;
        const textarea = document.getElementById('week1-abc-input');
        if (textarea) textarea.value = p.abc;
        window.renderWeek1MasterPreview();
    };

    window.renderWeek1MasterPreview = function() {
        const textarea = document.getElementById('week1-abc-input');
        if (textarea) {
            window.week1State.abcInput = textarea.value;
        }

        const paper = document.getElementById('week1-master-preview-paper');
        if (!paper) return;
        paper.innerHTML = '';

        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (!abcRenderer) return;

        try {
            abcRenderer.renderAbc('week1-master-preview-paper', window.week1State.abcInput, {
                responsive: 'resize',
                scale: 1.1,
                staffwidth: 780,
                add_classes: true
            });
        } catch (e) {
            console.warn('Week 1 Master Preview error:', e);
        }
    };

    window.switchWeek1Step = function(stepIdx) {
        window.week1State.activeStep = stepIdx;

        for (let i = 0; i <= 2; i++) {
            const btn = document.getElementById(`week1-step-btn-${i}`);
            const content = document.getElementById(`week1-step-${i}-content`);
            if (content) content.style.display = (i === stepIdx ? 'block' : 'none');

            if (btn) {
                if (i === stepIdx) {
                    btn.style.background = '#0284c7';
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                    btn.style.boxShadow = '0 4px 12px rgba(2,132,199,0.3)';
                } else {
                    btn.style.background = 'white';
                    btn.style.color = '#475569';
                    btn.style.border = '1.5px solid #cbd5e1';
                    btn.style.boxShadow = 'none';
                }
            }
        }

        if (stepIdx === 1) {
            window.parseWeek1Lines();
            window.renderWeek1Step1Lines();
        } else if (stepIdx === 2) {
            window.parseWeek1Lines();
            window.renderWeek1Step2Lines();
        }
    };

    window.parseWeek1Lines = function() {
        const rawAbc = window.week1State.abcInput || '';
        const lines = rawAbc.split('\n');

        let headerLines = [];
        let bodyLines = [];

        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('X:') || trimmed.startsWith('T:') || trimmed.startsWith('M:') ||
                trimmed.startsWith('L:') || trimmed.startsWith('Q:') || trimmed.startsWith('K:') ||
                trimmed.startsWith('C:') || trimmed.startsWith('V:')) {
                headerLines.push(trimmed);
            } else if (trimmed.length > 0) {
                bodyLines.push(line);
            }
        }

        const headerStr = headerLines.join('\n');
        // Filter out T: (title) and X: (index) for clean staff-only line snippets!
        const snippetHeader = headerLines.filter(l => !l.startsWith('T:') && !l.startsWith('X:')).join('\n');

        const parsedLines = [];
        let currentTitle = null;
        let currentAbcLines = [];
        let lineCounter = 1;

        for (let line of bodyLines) {
            const trimmed = line.trim();
            if (trimmed.match(/^%\s*---?\s*DÒNG/i) || trimmed.match(/^%\s*DÒNG/i)) {
                const text = currentAbcLines.join('\n').trim();
                if (text.includes('|') || text.match(/[A-Ga-g]/)) {
                    parsedLines.push({
                        id: `line_${lineCounter}`,
                        title: currentTitle || `DÒNG ${lineCounter}`,
                        abcContent: text,
                        headerStr: headerStr,
                        snippetHeader: snippetHeader
                    });
                    lineCounter++;
                }
                currentTitle = trimmed.replace(/^%\s*-*\s*/, '').replace(/\s*-*$/, '').toUpperCase();
                currentAbcLines = [];
            } else {
                currentAbcLines.push(line);
            }
        }

        const text = currentAbcLines.join('\n').trim();
        if (text.includes('|') || text.match(/[A-Ga-g]/)) {
            parsedLines.push({
                id: `line_${lineCounter}`,
                title: currentTitle || `DÒNG ${lineCounter}`,
                abcContent: text,
                headerStr: headerStr,
                snippetHeader: snippetHeader
            });
        }

        window.week1State.parsedLines = parsedLines;
    };

    window.parseLineMeasures = function(abcContent) {
        const rawMeasures = abcContent.split('|').map(m => m.trim()).filter(m => m.length > 0);
        let measures = [];
        let lastChord = 'None';

        rawMeasures.forEach((mText, idx) => {
            const chordMatch = mText.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
            let chord = chordMatch ? chordMatch[1] : null;

            if (chord) {
                lastChord = chord;
            }

            measures.push({
                index: idx + 1,
                text: mText,
                chord: chord || (mText.includes('"') ? 'None' : lastChord),
                hasExplicitChord: !!chord
            });
        });

        return measures;
    };

    window.getMeasureConfig = function(lineIdx, mIdx, defaultChord) {
        const key = `${lineIdx}_${mIdx}`;
        if (!window.week1State.measureConfigs[key]) {
            const isNoChord = (defaultChord === 'None' || !defaultChord);
            window.week1State.measureConfigs[key] = {
                chord: defaultChord || 'None',
                rhythmPattern: isNoChord ? 'none' : '3_beat',
                chordVoicing: '3_note'
            };
        }
        return window.week1State.measureConfigs[key];
    };

    window.updateMeasureConfig = function(lineIdx, mIdx, field, value) {
        const key = `${lineIdx}_${mIdx}`;
        if (!window.week1State.measureConfigs[key]) {
            window.week1State.measureConfigs[key] = { chord: 'C', rhythmPattern: '3_beat', chordVoicing: '3_note' };
        }
        window.week1State.measureConfigs[key][field] = value;

        if (field === 'chord' && value === 'None') {
            window.week1State.measureConfigs[key].rhythmPattern = 'none';
        } else if (field === 'chord' && value !== 'None' && window.week1State.measureConfigs[key].rhythmPattern === 'none') {
            window.week1State.measureConfigs[key].rhythmPattern = '3_beat';
        }

        window.renderWeek1Step1Lines();
    };

    window.autoApplyWeek1Defaults = function() {
        window.parseWeek1Lines();
        window.week1State.measureConfigs = {};
        window.renderWeek1Step1Lines();
        alert('⚡ Đã tự động cấu hình tiết tấu (1 2 3) và tên nốt hợp âm (C E G / A C E) chuẩn cho từng ô nhịp!');
    };

    const CHORD_NOTE_SOLFEGE_MAP = {
        'C': { solfege: 'C - E - G', notes: ['C', 'E', 'G'] },
        'Am': { solfege: 'A - C - E', notes: ['A', 'C', 'E'] },
        'F': { solfege: 'F - A - C', notes: ['F', 'A', 'C'] },
        'Dm': { solfege: 'D - F - A', notes: ['D', 'F', 'A'] },
        'G': { solfege: 'G - B - D', notes: ['G', 'B', 'D'] },
        'Em': { solfege: 'E - G - B', notes: ['E', 'G', 'B'] },
        'E7': { solfege: 'E - ^G - B', notes: ['E', '^G', 'B'] },
        'Bm': { solfege: 'B - D - F#', notes: ['B', 'D', 'F#'] },
        'D': { solfege: 'D - F# - A', notes: ['D', 'F#', 'A'] },
        'None': { solfege: '', notes: [] }
    };

    function generateStep1AnnotatedAbc(lineObj, lineIdx) {
        const snippetHeader = lineObj.snippetHeader || 'M: 2/4\nL: 1/8\nK: C';
        const measures = window.parseLineMeasures(lineObj.abcContent);

        let numberLyrics = [];
        let chordNoteLyrics = [];

        measures.forEach((mObj, mIdx) => {
            const cfg = window.getMeasureConfig(lineIdx, mIdx, mObj.chord);
            const chordKey = cfg.chord || 'C';
            const chordObj = CHORD_NOTE_SOLFEGE_MAP[chordKey] || CHORD_NOTE_SOLFEGE_MAP['C'];

            if (cfg.rhythmPattern === 'none' || chordKey === 'None') {
                numberLyrics.push(' ');
                chordNoteLyrics.push(' ');
            } else if (cfg.rhythmPattern === '4_beat') {
                numberLyrics.push(' 1 2 3 4 ');
                chordNoteLyrics.push(` ${chordObj.notes.join(' ')} ${chordObj.notes[0]} `);
            } else {
                numberLyrics.push(' 1 2 3 ');
                chordNoteLyrics.push(` ${chordObj.notes.join(' ')} `);
            }
        });

        const w1 = 'w:' + numberLyrics.join('|');
        const w2 = 'w:' + chordNoteLyrics.join('|');

        return `${snippetHeader}\n${lineObj.abcContent}\n${w1}\n${w2}`;
    }

    window.renderWeek1Step1Lines = function() {
        const container = document.getElementById('week1-step1-lines-container');
        if (!container) return;
        container.innerHTML = '';

        const lines = window.week1State.parsedLines;
        if (lines.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có dữ liệu dòng nhạc. Vui lòng kiểm tra lại mã ABC ở Tab 0.</div>`;
            return;
        }

        lines.forEach((lineObj, idx) => {
            const measures = window.parseLineMeasures(lineObj.abcContent);

            const card = document.createElement('div');
            card.style.cssText = `
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 18px;
                padding: 18px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            `;

            const activeChords = measures.map((m, mIdx) => {
                const c = window.getMeasureConfig(idx, mIdx, m.chord).chord;
                return c !== 'None' ? c : null;
            }).filter(Boolean);
            const chordsList = Array.from(new Set(activeChords));
            const chordNamesStr = chordsList.length > 0 ? chordsList.join(' - ') : 'None';

            const measureControlsHtml = measures.map((mObj, mIdx) => {
                const cfg = window.getMeasureConfig(idx, mIdx, mObj.chord);
                return `
                    <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                      <div style="font-weight: 800; color: #0369a1; font-size: 0.88rem; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span>🎼 Ô Nhịp ${mObj.index}</span>
                        <span style="font-size: 0.78rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 8px;">${mObj.text}</span>
                      </div>

                      <div style="margin-bottom: 8px;">
                        <label style="display: block; font-weight: 700; color: #475569; font-size: 0.78rem; margin-bottom: 3px;">🎸 Hợp Âm Ô Này:</label>
                        <select onchange="window.updateMeasureConfig(${idx}, ${mIdx}, 'chord', this.value)" style="width: 100%; padding: 6px 10px; border-radius: 8px; border: 1.5px solid #94a3b8; font-weight: 700; font-size: 0.82rem; outline: none; cursor: pointer;">
                          <option value="None" ${cfg.chord === 'None' ? 'selected' : ''}>None (Không có / Ô lướt)</option>
                          <option value="C" ${cfg.chord === 'C' ? 'selected' : ''}>C (Đô Trưởng: C - E - G)</option>
                          <option value="Am" ${cfg.chord === 'Am' ? 'selected' : ''}>Am (La Thứ: A - C - E)</option>
                          <option value="F" ${cfg.chord === 'F' ? 'selected' : ''}>F (Fa Trưởng: F - A - C)</option>
                          <option value="Dm" ${cfg.chord === 'Dm' ? 'selected' : ''}>Dm (Rê Thứ: D - F - A)</option>
                          <option value="G" ${cfg.chord === 'G' ? 'selected' : ''}>G (Sol Trưởng: G - B - D)</option>
                          <option value="Em" ${cfg.chord === 'Em' ? 'selected' : ''}>Em (Mi Thứ: E - G - B)</option>
                        </select>
                      </div>

                      <div>
                        <label style="display: block; font-weight: 700; color: #475569; font-size: 0.78rem; margin-bottom: 3px;">🥁 Tiết Tấu Tay Trái:</label>
                        <select onchange="window.updateMeasureConfig(${idx}, ${mIdx}, 'rhythmPattern', this.value)" style="width: 100%; padding: 6px 10px; border-radius: 8px; border: 1.5px solid #94a3b8; font-weight: 700; font-size: 0.82rem; outline: none; cursor: pointer;">
                          <option value="none" ${cfg.rhythmPattern === 'none' ? 'selected' : ''}>Nghỉ (Không chọn gì hết)</option>
                          <option value="3_beat" ${cfg.rhythmPattern === '3_beat' ? 'selected' : ''}>Tiết tấu 3 nốt (1-2-3 ➔ C-E-G)</option>
                          <option value="4_beat" ${cfg.rhythmPattern === '4_beat' ? 'selected' : ''}>Tiết tấu 4 nốt (1-2-3-4 ➔ C-E-G-C)</option>
                        </select>
                      </div>
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                  <span style="background: #0284c7; color: white; font-weight: 800; padding: 4px 14px; border-radius: 12px; font-size: 0.88rem;">📌 ${lineObj.title}</span>
                  <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 4px 14px; border-radius: 12px; font-size: 0.85rem;">🎸 Hợp Âm Dòng Này: ${chordNamesStr}</span>
                </div>

                <div id="week1-step1-paper-${idx}" style="background: white; border-radius: 14px; padding: 12px; border: 1.5px solid #cbd5e1; margin-bottom: 14px; min-height: 90px;"></div>

                <div style="background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px;">
                  <h4 style="margin: 0 0 10px 0; color: #0369a1; font-size: 0.9rem; font-weight: 800;">⚙️ Cấu Hình Tiết Tấu & Hợp Âm Từng Ô Nhịp (Dòng này có ${measures.length} ô nhịp):</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px;">
                    ${measureControlsHtml}
                  </div>
                </div>
            `;

            container.appendChild(card);

            setTimeout(() => {
                const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
                if (abcRenderer) {
                    const fullSnippetAbc = generateStep1AnnotatedAbc(lineObj, idx);
                    try {
                        abcRenderer.renderAbc(`week1-step1-paper-${idx}`, fullSnippetAbc, {
                            responsive: 'resize',
                            scale: 1.15,
                            staffwidth: 720,
                            add_classes: true
                        });
                    } catch (e) {
                        console.warn(`Error rendering Step 1 snippet ${idx}:`, e);
                    }
                }
            }, 30);
        });
    };

    window.renderWeek1Step2Lines = function() {
        const container = document.getElementById('week1-step2-lines-container');
        if (!container) return;
        container.innerHTML = '';

        const lines = window.week1State.parsedLines;
        if (lines.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có dữ liệu dòng nhạc.</div>`;
            return;
        }

        lines.forEach((lineObj, idx) => {
            const cfg = window.week1State.lineConfigs[idx] || {};

            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border: 2px solid #cbd5e1;
                border-radius: 20px;
                padding: 20px;
                box-shadow: 0 6px 18px rgba(0,0,0,0.04);
            `;

            const grandStaffAbc = window.generateWeek1LineGrandStaffAbc(lineObj, cfg);

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 12px 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #16a34a; color: white; font-weight: 800; padding: 4px 14px; border-radius: 12px; font-size: 0.9rem;">🎹 ${lineObj.title} - KHÓA SOL & KHÓA FA</span>
                    <span style="font-size: 0.85rem; color: #166534; font-weight: 700;">Tiết tấu: ${cfg.rhythmPattern || '4/4'} | Thế ngón: ${cfg.customFingeringStr || '1-5-8-3'}</span>
                  </div>
                  <button onclick="window.playWeek1LineAudio(${idx})" style="padding: 8px 16px; border-radius: 12px; font-weight: 800; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; cursor: pointer; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                    ▶️ Nghe Thử Dòng Này
                  </button>
                </div>

                <div id="week1-step2-paper-${idx}" style="background: #f8fafc; border-radius: 14px; padding: 16px; border: 2px dashed #cbd5e1; margin-bottom: 14px; min-height: 160px;"></div>

                <div style="display: flex; gap: 12px; font-size: 0.85rem; font-weight: 700; flex-wrap: wrap;">
                  <span style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 10px;">🫱 Tay Phải (Khóa Sol): Giai Điệu + Số Phách Đếm</span>
                  <span style="background: #fce7f3; color: #be123c; padding: 6px 12px; border-radius: 10px;">🫲 Tay Trái (Khóa Fa): Nốt Hợp Âm Rải Quãng 10</span>
                </div>
            `;

            container.appendChild(card);

            setTimeout(() => {
                const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
                if (abcRenderer) {
                    try {
                        abcRenderer.renderAbc(`week1-step2-paper-${idx}`, grandStaffAbc, {
                            responsive: 'resize',
                            scale: 1.15,
                            staffwidth: 740,
                            add_classes: true
                        });
                    } catch (e) {
                        console.warn(`Error rendering Step 2 Grand Staff ${idx}:`, e);
                    }
                }
            }, 30);
        });
    };

    window.generateWeek1LineGrandStaffAbc = function(lineObj, cfg) {
        const header = lineObj.snippetHeader || 'M:4/4\nL:1/8\nK:C';
        let bodyTreble = lineObj.abcContent;

        const chordMap = {
            'C': 'C, G, C E',
            'Am': 'A,, E, A, C',
            'F': 'F,, C, F, A,',
            'Dm': 'D,, A,, D, F,',
            'G': 'G,, D, G, B,',
            'Em': 'E,, B,, E, G,',
            'E7': 'E,, B,, E, ^G,'
        };

        const measures = bodyTreble.split('|');
        let bassMeasures = [];

        measures.forEach(m => {
            if (!m.trim()) return;
            const match = m.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
            const chord = match ? match[1] : 'C';
            const bassArpeggio = chordMap[chord] || 'C, G, C E';
            bassMeasures.push(` ${bassArpeggio} `);
        });

        const bassBody = bassMeasures.join('|');

        return `X:1\nT: ${lineObj.title}\n${header}\n%%score {1 | 2}\nV:1 clef=treble\n${bodyTreble}\nV:2 clef=bass\n${bassBody}`;
    };

    window.toggleWeek1MasterScoreModal = function() {
        const modal = document.getElementById('week1-master-modal');
        if (!modal) return;
        const isHidden = (modal.style.display === 'none' || !modal.style.display);
        modal.style.display = isHidden ? 'flex' : 'none';

        if (isHidden) {
            const paper = document.getElementById('week1-modal-paper');
            const textarea = document.getElementById('week1-modal-abc-text');
            if (textarea) textarea.value = window.week1State.abcInput;

            if (paper) {
                paper.innerHTML = '';
                const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
                if (abcRenderer) {
                    try {
                        abcRenderer.renderAbc('week1-modal-paper', window.week1State.abcInput, {
                            responsive: 'resize',
                            scale: 1.1,
                            staffwidth: 760
                        });
                    } catch (e) {
                        console.warn('Master Modal render error:', e);
                    }
                }
            }
        }
    };

    window.playWeek1LineAudio = function(lineIdx) {
        const lineObj = window.week1State.parsedLines[lineIdx];
        if (!lineObj) return;
        const cfg = window.week1State.lineConfigs[lineIdx] || {};
        const grandStaffAbc = window.generateWeek1LineGrandStaffAbc(lineObj, cfg);
        window.renderPianoSoloSheet(grandStaffAbc);
        window.playPianoSoloSong();
    };

    window.initWeek1PedagogyView = function() {
        setTimeout(() => {
            window.loadWeek1PresetSong('thang_cuoi');
        }, 50);
    };

    window.initPianoSoloView = function() {
        setTimeout(() => {
            window.renderVirtualPianoKeyboard();
            window.loadPianoSoloSong('fur_elise');
            preloadCommonSoundfontSamples();
        }, 50);
    };
})();
