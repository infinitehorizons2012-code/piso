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
            btn.innerHTML = sustainPedal ? '🌊 Pedal: ON' : '🌊 Pedal: OFF';
            btn.style.background = sustainPedal ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255,255,255,0.2)';
        }
    };

    window.togglePianoKeyLabels = function() {
        showKeyLabels = !showKeyLabels;
        const btn = document.getElementById('btn-piano-labels');
        if (btn) {
            btn.innerHTML = showKeyLabels ? '🏷️ Nốt: ON' : '🏷️ Nốt: OFF';
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

    window.renderPianoSoloSheet = function(abcCode, isInternal = false) {
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

        if (!isInternal && typeof window.updateInteractivePlayControls === 'function') {
            window.updateInteractivePlayControls();
        }
    };

    window.renderPianoSoloAbcFromEditor = function() {
        if (typeof window.refreshInteractiveSheetDisplay === 'function') {
            window.refreshInteractiveSheetDisplay();
        } else {
            const textarea = document.getElementById('piano-solo-abc-editor');
            if (textarea) {
                window.renderPianoSoloSheet(textarea.value);
            }
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
                tune.lines.forEach((line, lineIdx) => {
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

                            let currentMeasureIdx = 0;

                            voice.forEach((elem) => {
                                const dur = elem.duration || 0;
                                if (elem.el_type === 'bar') {
                                    currentMeasureIdx++;
                                }
                                if (elem.el_type === 'note' && elem.pitches) {
                                    elem.pitches.forEach((p) => {
                                        const midi = pitchToMidi(p, keySig);
                                        const noteHand = isLeftHand || midi < 60 ? 'left' : 'right';
                                        noteEvents.push({
                                            midi: midi,
                                            hand: noteHand,
                                            timeMs: Math.round(voiceTimeMap[vKey] * quarterMs * 4),
                                            durMs: Math.max(150, Math.round(dur * quarterMs * 4)),
                                            lineIdx: lineIdx,
                                            measureIdx: currentMeasureIdx
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

    // Playback Range Selection Engine (Cả Bài / Dòng Nào / Ô Nhịp Nào)
    window.getInteractiveParsedLines = function() {
        const textarea = document.getElementById('piano-solo-abc-editor');
        const abcCode = textarea && textarea.value.trim() ? textarea.value : PIANO_SOLO_SONGS.fur_elise.abc;
        const parsed = parseAbcToNoteEvents(abcCode);

        // Extract unique line indices
        const lineIndices = Array.from(new Set(parsed.map(n => n.lineIdx))).sort((a, b) => a - b);
        
        if (lineIndices.length === 0) {
            return [{ index: 1, title: '📌 Dòng 1', measuresCount: 4 }];
        }

        return lineIndices.map((lIdx, idx) => {
            const lineNotes = parsed.filter(n => n.lineIdx === lIdx);
            const maxMIdx = Math.max(0, ...lineNotes.map(n => n.measureIdx));
            const measuresCount = maxMIdx + 1;
            return {
                index: lIdx,
                title: `📌 Dòng ${idx + 1}`,
                measuresCount: measuresCount
            };
        });
    };

    window.scrollToInteractiveLine = function(lineIdx) {
        const paper = document.getElementById('piano-solo-paper');
        if (!paper) return;
        if (lineIdx === undefined || lineIdx === null || lineIdx < 0) {
            paper.scrollTop = 0;
            return;
        }

        const systems = paper.querySelectorAll('.abcjs-system, svg > g');
        if (systems && systems.length > 0) {
            const target = systems[Math.min(lineIdx, systems.length - 1)];
            if (target && target.scrollIntoView) {
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }
        }
        paper.scrollTop = lineIdx * 160;
    };

    window.sliceAbcByRange = function(abcCode, mode, targetLineIdx, targetMeasureIdx) {
        if (!mode || mode === 'all') return abcCode;

        const lines = abcCode.split('\n');
        const headerLines = [];
        const lineBlocks = [];

        let bodyStartIndex = lines.length;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('X:') || trimmed.startsWith('T:') || trimmed.startsWith('M:') || 
                trimmed.startsWith('L:') || trimmed.startsWith('Q:') || trimmed.startsWith('K:') || 
                trimmed.startsWith('%%')) {
                headerLines.push(line);
            } else if (trimmed.length > 0) {
                bodyStartIndex = i;
                break;
            }
        }

        const hasVoiceTags = abcCode.includes('V:1') || abcCode.includes('[V:1]');

        if (hasVoiceTags) {
            let i = bodyStartIndex;
            let activeBlock = [];

            while (i < lines.length) {
                const line = lines[i];
                const trimmed = line.trim();

                if (trimmed.startsWith('% --- DÒNG') || (trimmed.startsWith('%') && !trimmed.startsWith('%%'))) {
                    if (activeBlock.length > 0) {
                        lineBlocks.push([...activeBlock]);
                        activeBlock = [];
                    }
                    i++;
                    continue;
                }

                if (trimmed.length === 0) {
                    i++;
                    continue;
                }

                const isV1 = trimmed.startsWith('V:1') || trimmed.startsWith('[V:1]');
                const hasV1 = activeBlock.some(l => l.trim().startsWith('V:1') || l.trim().startsWith('[V:1]'));
                const hasV2 = activeBlock.some(l => l.trim().startsWith('V:2') || l.trim().startsWith('[V:2]'));

                if (isV1 && (hasV1 && (hasV2 || activeBlock.length > 1))) {
                    lineBlocks.push([...activeBlock]);
                    activeBlock = [];
                }

                activeBlock.push(line);
                i++;
            }
            if (activeBlock.length > 0) lineBlocks.push([...activeBlock]);
        } else {
            let currentBlock = [];
            for (let i = bodyStartIndex; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                if (trimmed.startsWith('% --- DÒNG') || (trimmed.startsWith('%') && !trimmed.startsWith('%%'))) {
                    if (currentBlock.length > 0) {
                        lineBlocks.push([...currentBlock]);
                        currentBlock = [];
                    }
                } else if (trimmed.length > 0) {
                    currentBlock.push(line);
                }
            }
            if (currentBlock.length > 0) lineBlocks.push([...currentBlock]);
        }

        if (lineBlocks.length === 0) return abcCode;

        const selectedBlock = lineBlocks[Math.min(targetLineIdx, lineBlocks.length - 1)] || lineBlocks[0];

        if (mode === 'line') {
            return [...headerLines, `% --- CHỈ HIỂN THỊ DÒNG ${targetLineIdx + 1} ---`, ...selectedBlock].join('\n');
        }

        if (mode === 'measure') {
            const slicedBlock = [];
            selectedBlock.forEach(l => {
                const trimmed = l.trim();
                if (trimmed.startsWith('V:') || trimmed.startsWith('[V:')) {
                    const match = l.match(/^((?:\[V:\d+\]|V:\d+)(?:\s+clef=[^\s]+)?)\s*(.*)/);
                    if (match) {
                        const vHeader = match[1];
                        const musicContent = match[2];
                        if (!musicContent || !musicContent.includes('|')) {
                            slicedBlock.push(l);
                        } else {
                            const measures = musicContent.split('|').map(m => m.trim()).filter(m => m.length > 0);
                            const targetM = measures[Math.min(targetMeasureIdx, measures.length - 1)] || measures[0] || '';
                            slicedBlock.push(`${vHeader} ${targetM} |`);
                        }
                    } else {
                        slicedBlock.push(l);
                    }
                } else if (trimmed.startsWith('w:')) {
                    const lyricContent = trimmed.replace(/^w:\s*/, '');
                    const measures = lyricContent.split('|').map(m => m.trim());
                    const targetM = measures[Math.min(targetMeasureIdx, measures.length - 1)] || measures[0] || '*';
                    slicedBlock.push(`w: ${targetM}`);
                } else if (trimmed.includes('|')) {
                    const measures = trimmed.split('|').map(m => m.trim()).filter(m => m.length > 0);
                    const targetM = measures[Math.min(targetMeasureIdx, measures.length - 1)] || measures[0] || '';
                    slicedBlock.push(`${targetM} |`);
                } else {
                    slicedBlock.push(l);
                }
            });

            return [...headerLines, `% --- CHỈ HIỂN THỊ Ô ${targetMeasureIdx + 1} (DÒNG ${targetLineIdx + 1}) ---`, ...slicedBlock].join('\n');
        }

        return abcCode;
    };

    window.refreshInteractiveSheetDisplay = function() {
        const textarea = document.getElementById('piano-solo-abc-editor');
        const fullAbc = textarea && textarea.value.trim() ? textarea.value : PIANO_SOLO_SONGS.fur_elise.abc;

        const modeSelect = document.getElementById('interactive-play-mode-select');
        const lineSelect = document.getElementById('interactive-line-select');
        const measureSelect = document.getElementById('interactive-measure-select');

        const mode = modeSelect ? modeSelect.value : 'all';
        const lineIdx = lineSelect ? (parseInt(lineSelect.value, 10) || 0) : 0;
        const measureIdx = measureSelect ? (parseInt(measureSelect.value, 10) || 0) : 0;

        const slicedAbc = window.sliceAbcByRange(fullAbc, mode, lineIdx, measureIdx);
        window.renderPianoSoloSheet(slicedAbc, true);
    };

    window.updateInteractivePlayControls = function() {
        const modeSelect = document.getElementById('interactive-play-mode-select');
        const lineSelect = document.getElementById('interactive-line-select');
        const measureSelect = document.getElementById('interactive-measure-select');

        if (!modeSelect || !lineSelect || !measureSelect) return;

        const mode = modeSelect.value;
        const parsedLines = window.getInteractiveParsedLines();

        const savedLineValue = lineSelect.value;

        if (mode === 'all') {
            lineSelect.style.display = 'none';
            measureSelect.style.display = 'none';
            window.scrollToInteractiveLine(0);
        } else if (mode === 'line') {
            lineSelect.style.display = 'inline-block';
            measureSelect.style.display = 'none';

            lineSelect.innerHTML = parsedLines.map((l, idx) => 
                `<option value="${l.index}">${l.title}</option>`
            ).join('');

            if (savedLineValue && parsedLines.some(l => l.index == savedLineValue)) {
                lineSelect.value = savedLineValue;
            }

            const activeLine = parseInt(lineSelect.value, 10) || 0;
            window.scrollToInteractiveLine(activeLine);
        } else if (mode === 'measure') {
            lineSelect.style.display = 'inline-block';
            measureSelect.style.display = 'inline-block';

            lineSelect.innerHTML = parsedLines.map((l, idx) => 
                `<option value="${l.index}">${l.title}</option>`
            ).join('');

            if (savedLineValue && parsedLines.some(l => l.index == savedLineValue)) {
                lineSelect.value = savedLineValue;
            }

            window.updateInteractiveMeasureDropdown(true);
            return;
        }

        window.refreshInteractiveSheetDisplay();
    };

    window.updateInteractiveMeasureDropdown = function(keepMeasureSelection = false) {
        const lineSelect = document.getElementById('interactive-line-select');
        const measureSelect = document.getElementById('interactive-measure-select');
        if (!lineSelect || !measureSelect) return;

        const savedMeasureValue = measureSelect.value;

        const lineIdx = parseInt(lineSelect.value, 10) || 0;
        const parsedLines = window.getInteractiveParsedLines();
        const targetLine = parsedLines.find(l => l.index === lineIdx) || parsedLines[0];

        const count = targetLine ? targetLine.measuresCount : 4;
        let optionsHtml = '';
        for (let i = 0; i < count; i++) {
            optionsHtml += `<option value="${i}">Ô ${i + 1}</option>`;
        }
        measureSelect.innerHTML = optionsHtml;

        if (keepMeasureSelection && savedMeasureValue !== '' && savedMeasureValue !== null && parseInt(savedMeasureValue, 10) < count) {
            measureSelect.value = savedMeasureValue;
        }

        window.scrollToInteractiveLine(lineIdx);
        window.refreshInteractiveSheetDisplay();
    };

    // Auto Play Piano Solo Song (Parses current ABC string & plays actual notes on Piano Virtual Keyboard based on selected range)
    window.playPianoSoloSong = function() {
        window.stopPianoSoloSong();

        const textarea = document.getElementById('piano-solo-abc-editor');
        const abcCode = textarea && textarea.value.trim() ? textarea.value : PIANO_SOLO_SONGS.fur_elise.abc;

        window.refreshInteractiveSheetDisplay();

        const modeSelect = document.getElementById('interactive-play-mode-select');
        const lineSelect = document.getElementById('interactive-line-select');
        const measureSelect = document.getElementById('interactive-measure-select');
        const mode = modeSelect ? modeSelect.value : 'all';

        const allEvents = parseAbcToNoteEvents(abcCode);

        if (allEvents.length === 0) {
            alert('Không tìm thấy nốt nhạc hợp lệ trong mã ABC! Vui lòng kiểm tra lại.');
            return;
        }

        let filteredEvents = allEvents;
        let playLabel = 'Cả Bài';

        if (mode === 'line') {
            const targetLineIdx = lineSelect ? (parseInt(lineSelect.value, 10) || 0) : 0;
            filteredEvents = allEvents.filter(n => n.lineIdx === targetLineIdx);
            playLabel = `Dòng ${targetLineIdx + 1}`;
        } else if (mode === 'measure') {
            const targetLineIdx = lineSelect ? (parseInt(lineSelect.value, 10) || 0) : 0;
            const targetMeasureIdx = measureSelect ? (parseInt(measureSelect.value, 10) || 0) : 0;
            filteredEvents = allEvents.filter(n => n.lineIdx === targetLineIdx && n.measureIdx === targetMeasureIdx);
            playLabel = `Ô ${targetMeasureIdx + 1} - Dòng ${targetLineIdx + 1}`;
        }

        if (filteredEvents.length === 0) {
            filteredEvents = allEvents;
        }

        // Shift timestamps so playback starts immediately at 0ms
        const minTimeMs = Math.min(...filteredEvents.map(n => n.timeMs));
        const noteEvents = filteredEvents.map(n => ({
            ...n,
            timeMs: Math.max(0, n.timeMs - minTimeMs)
        }));

        isPlayingSong = true;
        const btnPlay = document.getElementById('btn-play-sheet-abc');
        if (btnPlay) {
            btnPlay.innerHTML = `⏹️ Dừng Độc Tấu (${playLabel})`;
            btnPlay.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btnPlay.style.boxShadow = '0 4px 12px rgba(239,68,68,0.35)';
        }

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

    window.togglePlayPianoSoloSong = function() {
        if (isPlayingSong) {
            window.stopPianoSoloSong();
        } else {
            window.playPianoSoloSong();
        }
    };

    window.stopPianoSoloSong = function() {
        isPlayingSong = false;
        activePlaybackTimers.forEach(t => clearTimeout(t));
        activePlaybackTimers = [];

        const btnPlay = document.getElementById('btn-play-sheet-abc');
        if (btnPlay) {
            btnPlay.innerHTML = '▶️ Nghe';
            btnPlay.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btnPlay.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
        }
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
        measureConfigs: {},
        masterModalOpen: false
    };

    window.week1LibCurrentFolder = '/';
    window.week1LibTargetMode = 'week1';

    window.openWeek1LibraryModal = function(targetMode = 'week1') {
        window.week1LibTargetMode = targetMode;
        const modal = document.getElementById('week1-library-modal');
        if (modal) modal.style.display = 'flex';
        if (typeof window.fetchLibrary === 'function') {
            window.fetchLibrary(true);
        }
        window.renderWeek1LibraryModalFolder(window.week1LibCurrentFolder || '/');
    };

    window.closeWeek1LibraryModal = function() {
        const modal = document.getElementById('week1-library-modal');
        if (modal) modal.style.display = 'none';
    };

    window.renderWeek1LibraryModalFolder = function(folderPath = '/') {
        window.week1LibCurrentFolder = folderPath;
        const listEl = document.getElementById('week1-library-modal-list');
        const breadcrumbEl = document.getElementById('week1-library-modal-breadcrumb');
        const searchVal = (document.getElementById('week1-library-modal-search')?.value || '').trim().toLowerCase();

        if (!listEl) return;

        // 1. Render Breadcrumbs
        if (breadcrumbEl) {
            breadcrumbEl.innerHTML = '';
            const parts = folderPath.split('/').filter(Boolean);

            const homeBtn = document.createElement('span');
            homeBtn.style = 'cursor: pointer; color: #0284c7; transition: all 0.2s;';
            homeBtn.innerHTML = '🏠 Gốc';
            homeBtn.onclick = () => window.renderWeek1LibraryModalFolder('/');
            breadcrumbEl.appendChild(homeBtn);

            let pathAccumulator = '';
            parts.forEach((part, index) => {
                pathAccumulator += '/' + part;
                const targetPath = pathAccumulator;
                const sep = document.createElement('span');
                sep.innerHTML = ' ❯ ';
                sep.style.color = '#94a3b8';
                breadcrumbEl.appendChild(sep);

                const partBtn = document.createElement('span');
                partBtn.style = `cursor: pointer; color: ${index === parts.length - 1 ? '#0f172a' : '#0284c7'}; font-weight: 800;`;
                partBtn.innerHTML = `📁 ${part}`;
                partBtn.onclick = () => window.renderWeek1LibraryModalFolder(targetPath);
                breadcrumbEl.appendChild(partBtn);
            });
        }

        // 2. Get Cached Library Items
        let libraryItems = [];
        try {
            const cached = localStorage.getItem('piso_library_cache');
            if (cached) libraryItems = JSON.parse(cached);
        } catch (e) {}

        listEl.innerHTML = '';

        // 3. Filter Items
        let displayItems = [];
        if (searchVal) {
            displayItems = libraryItems.filter(item => 
                (item.title || item.name || '').toLowerCase().includes(searchVal)
            );
        } else {
            const subfolderNames = new Set();
            libraryItems.forEach(item => {
                const itemFolder = item.folderPath || '/';
                if (itemFolder === folderPath) {
                    displayItems.push(item);
                } else if (itemFolder.startsWith(folderPath === '/' ? '/' : folderPath + '/')) {
                    const relative = itemFolder.substring(folderPath === '/' ? 1 : folderPath.length + 1);
                    const firstPart = relative.split('/')[0];
                    if (firstPart) subfolderNames.add(firstPart);
                }
            });

            subfolderNames.forEach(subName => {
                if (!displayItems.some(i => i.type === 'folder' && i.title === subName)) {
                    displayItems.push({
                        type: 'folder',
                        title: subName,
                        folderPath: folderPath
                    });
                }
            });
        }

        // Show Parent Back Button
        if (folderPath !== '/' && !searchVal) {
            const backDiv = document.createElement('div');
            backDiv.style = 'display: flex; align-items: center; padding: 10px 16px; background: #e0f2fe; border-radius: 12px; cursor: pointer; font-weight: 800; color: #0369a1; border: 1.5px dashed #38bdf8; transition: all 0.2s; font-size: 0.9rem;';
            backDiv.innerHTML = '<span>⬆ Quay lại thư mục cha</span>';
            backDiv.onclick = () => {
                const parts = folderPath.split('/').filter(Boolean);
                parts.pop();
                const parentPath = parts.length > 0 ? '/' + parts.join('/') : '/';
                window.renderWeek1LibraryModalFolder(parentPath);
            };
            listEl.appendChild(backDiv);
        }

        if (displayItems.length === 0) {
            listEl.innerHTML += searchVal 
                ? '<p style="text-align: center; color: #64748b; padding: 30px; font-weight: 700;">Không tìm thấy bản nhạc hoặc thư mục khớp với từ khóa.</p>'
                : '<p style="text-align: center; color: #64748b; padding: 30px; font-weight: 700;">Thư mục này hiện tại chưa có bản nhạc. Hãy lưu bản nhạc ở Bước 1 & Bước 2 để xuất hiện tại đây!</p>';
            return;
        }

        // Sort: Folders first, then Songs
        displayItems.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return (a.title || '').localeCompare(b.title || '');
        });

        // Render Cards
        displayItems.forEach(item => {
            const isFolder = item.type === 'folder';
            const icon = isFolder ? '📁' : '🎵';
            
            const div = document.createElement('div');
            div.style = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: white; border-radius: 14px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.02); transition: all 0.2s;';

            const infoDiv = document.createElement('div');
            infoDiv.style = 'display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1;';
            if (isFolder) {
                infoDiv.onclick = () => {
                    const newPath = (item.folderPath === '/' ? '' : item.folderPath) + '/' + item.title;
                    window.renderWeek1LibraryModalFolder(newPath);
                };
            }

            infoDiv.innerHTML = `
                <span style="font-size: 1.6rem;">${icon}</span>
                <div>
                    <h4 style="margin: 0; font-size: 0.95rem; color: ${isFolder ? '#0369a1' : '#0f172a'}; font-weight: 800;">${item.title || 'Bản Nhạc'}</h4>
                    <small style="color: #64748b; font-weight: 600;">${isFolder ? 'Thư mục' : (item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Bản nhạc Thư viện')}</small>
                </div>
            `;

            div.appendChild(infoDiv);

            if (!isFolder) {
                const selectBtn = document.createElement('button');
                selectBtn.style = 'padding: 8px 16px; border-radius: 12px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; cursor: pointer; font-size: 0.88rem; box-shadow: 0 3px 10px rgba(16,185,129,0.25); display: flex; align-items: center; gap: 6px;';
                selectBtn.innerHTML = '✅ Nạp Bài Này';
                selectBtn.onclick = () => {
                    if (item.abc) {
                        if (window.week1LibTargetMode === 'interactive') {
                            const editorTextarea = document.getElementById('piano-solo-abc-editor');
                            if (editorTextarea) editorTextarea.value = item.abc;
                            window.renderPianoSoloSheet(item.abc);
                            window.closeWeek1LibraryModal();
                            alert(`🎉 Đã nạp thành công bản nhạc '${item.title}' vào Bàn Phím Độc Tấu Tương Tác!`);
                        } else {
                            window.populateWeek1LibraryDropdown();
                            const select = document.getElementById('week1-preset-song-select');
                            if (select) {
                                const val = String(item.id).startsWith('lib_') ? String(item.id) : `lib_${item.id}`;
                                select.value = val;
                            }
                            window.loadWeek1PresetSong(`lib_${item.id}`);
                            window.closeWeek1LibraryModal();
                            alert(`🎉 Đã nạp thành công bản nhạc '${item.title}' từ Thư Viện vào Thực Hành!`);
                        }
                    } else {
                        alert('Bản nhạc này không chứa dữ liệu ABC notation!');
                    }
                };
                div.appendChild(selectBtn);
            } else {
                const openFolderBtn = document.createElement('button');
                openFolderBtn.style = 'padding: 6px 14px; border-radius: 10px; font-weight: 800; background: #e0f2fe; color: #0369a1; border: 1.5px solid #38bdf8; cursor: pointer; font-size: 0.84rem;';
                openFolderBtn.innerHTML = '📂 Mở';
                openFolderBtn.onclick = () => {
                    const newPath = (item.folderPath === '/' ? '' : item.folderPath) + '/' + item.title;
                    window.renderWeek1LibraryModalFolder(newPath);
                };
                div.appendChild(openFolderBtn);
            }

            listEl.appendChild(div);
        });
    };

    window.populateWeek1LibraryDropdown = function() {
        const select = document.getElementById('week1-preset-song-select');
        if (!select) return;

        let libraryItems = [];
        try {
            const cached = localStorage.getItem('piso_library_cache');
            if (cached) libraryItems = JSON.parse(cached);
        } catch (e) {
            console.warn('Error reading piso_library_cache:', e);
        }

        if (!libraryItems || libraryItems.length === 0) {
            select.innerHTML = `<option disabled selected value="">(Chưa có bài trong Thư Viện - Hãy lưu bài ở Bước 1 & 2)</option>`;
            return;
        }

        const currentValue = select.value;
        let html = `<option value="" disabled ${!currentValue ? 'selected' : ''}>-- Chọn bài từ Thư Viện (${libraryItems.length} bài) --</option>`;
        html += libraryItems.map(item => {
            const title = item.title || item.name || 'Bản Nhạc Không Tên';
            const folder = item.folderPath ? ` [${item.folderPath}]` : '';
            const val = String(item.id).startsWith('lib_') ? String(item.id) : `lib_${item.id}`;
            const isSelected = (currentValue === val) ? 'selected' : '';
            return `<option value="${val}" ${isSelected}>📚 ${title}${folder}</option>`;
        }).join('');

        select.innerHTML = html;
    };

    window.loadWeek1PresetSong = function(presetKey) {
        if (!presetKey) return;
        let abcContent = '';

        const songId = presetKey.startsWith('lib_') ? presetKey.replace('lib_', '') : presetKey;
        let libraryItems = [];
        try {
            const cached = localStorage.getItem('piso_library_cache');
            if (cached) libraryItems = JSON.parse(cached);
        } catch (e) {}

        const targetSong = libraryItems.find(item => String(item.id) === String(songId) || String(item.id) === String(presetKey));
        if (targetSong && targetSong.abc) {
            abcContent = targetSong.abc;
        } else if (WEEK1_PRESETS[presetKey]) {
            abcContent = WEEK1_PRESETS[presetKey].abc;
        } else {
            alert('Không tìm thấy dữ liệu bài hát này trong Thư Viện!');
            return;
        }

        window.week1State.abcInput = abcContent;
        const textarea = document.getElementById('week1-abc-input');
        if (textarea) textarea.value = abcContent;
        window.renderWeek1MasterPreview();
        window.parseWeek1Lines();
        if (window.week1State.activeStep === 1) {
            window.renderWeek1Step1Lines();
        } else if (window.week1State.activeStep === 2) {
            window.renderWeek1Step2Lines();
        }
    };

    window.getChordIntervalNotes = function(chord, intervalPattern) {
        const chordDict = {
            'C': { '1': 'C,', '3': 'E,', '5': 'G,', '8': 'C' },
            'Am': { '1': 'A,,', '3': 'C,', '5': 'E,', '8': 'A,' },
            'F': { '1': 'F,,', '3': 'A,,', '5': 'C,', '8': 'F,' },
            'Dm': { '1': 'D,,', '3': 'F,,', '5': 'A,,', '8': 'D,' },
            'G': { '1': 'G,,', '3': 'B,,', '5': 'D,', '8': 'G,' },
            'Em': { '1': 'E,,', '3': 'G,,', '5': 'B,,', '8': 'E,' },
            'E7': { '1': 'E,,', '3': '^G,,', '5': 'B,,', '8': 'E,' },
            'Bm': { '1': 'B,,', '3': 'D,', '5': 'F,', '8': 'B,' },
            'D': { '1': 'D,,', '3': '^F,,', '5': 'A,,', '8': 'D,' }
        };

        const dict = chordDict[chord] || chordDict['C'];
        const digits = (intervalPattern || '1-3-5').match(/[1358]/g) || ['1', '3', '5'];
        return digits.map(d => dict[d] || dict['1']);
    };

    window.getBassRhythmNotes = function(chord, rhythmText, intervalText) {
        if (!chord || chord === 'None' || rhythmText === 'none' || rhythmText === 'Nghỉ') {
            return 'z4';
        }

        const notes = window.getChordIntervalNotes(chord, intervalText);
        const n1 = notes[0] || 'C,';
        const n2 = notes[1] || notes[0] || 'E,';
        const n3 = notes[2] || notes[1] || 'G,';

        const cleanRhythm = (rhythmText || '').toLowerCase().trim();

        // 1. "1 đơn - 2 đơn - 3 đen" or "1-2-3" or "don_don_den"
        if (cleanRhythm.includes('don_don_den') || cleanRhythm.includes('3_beat') || (cleanRhythm.includes('đơn') && cleanRhythm.includes('đen')) || cleanRhythm.includes('1-2-3') || cleanRhythm.includes('1 2 3') || cleanRhythm.includes('dd')) {
            return `${n1} ${n2} ${n3}2`;
        }

        // 2. "1 đen - 2 đen" or "den_den"
        if (cleanRhythm.includes('den_den') || cleanRhythm.includes('đen - đen') || cleanRhythm.includes('2 nốt đen') || cleanRhythm.includes('1-2')) {
            return `${n1}2 ${n3}2`;
        }

        // 3. "4 nốt đơn" or "bon_don"
        if (cleanRhythm.includes('bon_don') || cleanRhythm.includes('4_beat') || cleanRhythm.includes('4 nốt đơn') || cleanRhythm.includes('4 đơn')) {
            return `${n1} ${n2} ${n3} ${n2}`;
        }

        // 4. "nốt trắng" or "trang"
        if (cleanRhythm.includes('trang') || cleanRhythm.includes('trắng')) {
            return `${n1}4`;
        }

        // Default: 1 đơn - 2 đơn - 3 đen
        return `${n1} ${n2} ${n3}2`;
    };

    window.getMeasureConfig = function(lineIdx, mIdx, defaultChord) {
        if (!window.week1State.measureConfigs) {
            window.week1State.measureConfigs = {};
        }
        const key = `${lineIdx}_${mIdx}`;
        if (!window.week1State.measureConfigs[key]) {
            const isNoChord = (defaultChord === 'None' || !defaultChord);
            window.week1State.measureConfigs[key] = {
                chord: defaultChord || 'None',
                rhythmText: isNoChord ? 'Nghỉ' : '1 đơn - 2 đơn - 3 đen',
                intervalText: '1 - 3 - 5',
                fingeringText: '1 3 5'
            };
        }
        return window.week1State.measureConfigs[key];
    };

    window.updateMeasureConfig = function(lineIdx, mIdx, field, value) {
        if (!window.week1State.measureConfigs) {
            window.week1State.measureConfigs = {};
        }
        const key = `${lineIdx}_${mIdx}`;
        if (!window.week1State.measureConfigs[key]) {
            window.week1State.measureConfigs[key] = { chord: 'C', rhythmText: '1 đơn 2 đơn 3 đen', intervalText: '3-3-5 / 1-3-5', fingeringText: '1 3 5' };
        }
        window.week1State.measureConfigs[key][field] = value;
    };

    window.renderWeek1MasterPreview = function() {
        const textarea = document.getElementById('week1-abc-input');
        if (textarea) {
            window.week1State.abcInput = textarea.value;
        }

        window.parseWeek1Lines();

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
        let contentLines = [];

        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('X:') || trimmed.startsWith('T:') || trimmed.startsWith('M:') ||
                trimmed.startsWith('L:') || trimmed.startsWith('Q:') || trimmed.startsWith('K:') ||
                trimmed.startsWith('C:') || trimmed.startsWith('V:')) {
                headerLines.push(trimmed);
            } else {
                contentLines.push(line);
            }
        }

        const headerStr = headerLines.join('\n');
        const snippetHeader = headerLines.filter(l => !l.startsWith('T:') && !l.startsWith('X:')).join('\n');

        let parsedLines = [];
        let lineCounter = 1;
        let currentTitle = null;
        let currentBlockLines = [];

        function flushBlock() {
            if (currentBlockLines.length === 0) return;

            const noteLines = currentBlockLines.filter(l => {
                const t = l.trim();
                return t.length > 0 && !t.startsWith('%') && !/^w[0-9]*:?/i.test(t);
            });

            if (noteLines.length === 0) {
                currentBlockLines = [];
                return;
            }

            const blockText = currentBlockLines.join('\n').trim();
            const fullNotesAbc = noteLines.join(' ');
            const cleanNotesAbc = fullNotesAbc.replace(/\|\s*\]/g, '|').replace(/\|\s*\|/g, '|').replace(/:\s*\|/g, '|').replace(/\|\s*:/g, '|');
            const rawMeasures = cleanNotesAbc.split('|').map(m => m.trim()).filter(m => m.length > 0 && /[A-Ga-gZz]/.test(m));

            if (rawMeasures.length <= 4) {
                parsedLines.push({
                    id: `line_${lineCounter}`,
                    title: currentTitle || `DÒNG ${lineCounter}`,
                    abcContent: blockText,
                    headerStr: headerStr,
                    snippetHeader: snippetHeader
                });
                lineCounter++;
            } else {
                let lyricLines = [];
                currentBlockLines.forEach(l => {
                    const t = l.trim();
                    if (/^w[0-9]*:?/i.test(t)) {
                        lyricLines.push(t.replace(/^w[0-9]*:?/i, '').trim());
                    }
                });

                const lyricRows = lyricLines.map(line => line.split('|').map(m => m.trim()));

                for (let i = 0; i < rawMeasures.length; i += 4) {
                    const chunkNotes = rawMeasures.slice(i, i + 4).join(' | ');
                    let chunkLyricRows = [];

                    lyricRows.forEach(row => {
                        const sliced = row.slice(i, i + 4);
                        if (sliced.some(w => w && w !== '*')) {
                            chunkLyricRows.push('w: ' + sliced.join(' | '));
                        }
                    });

                    const chunkText = chunkNotes + (chunkLyricRows.length > 0 ? ('\n' + chunkLyricRows.join('\n')) : '');

                    parsedLines.push({
                        id: `line_${lineCounter}`,
                        title: currentTitle ? `${currentTitle} (${Math.floor(i / 4) + 1})` : `DÒNG ${lineCounter}`,
                        abcContent: chunkText,
                        headerStr: headerStr,
                        snippetHeader: snippetHeader
                    });
                    lineCounter++;
                }
            }

            currentBlockLines = [];
            currentTitle = null;
        }

        for (let line of contentLines) {
            const trimmed = line.trim();
            if (trimmed.match(/^%\s*---?\s*DÒNG/i) || trimmed.match(/^%\s*DÒNG/i)) {
                flushBlock();
                currentTitle = trimmed.replace(/^%\s*-*\s*/, '').replace(/\s*-*$/, '').toUpperCase();
            } else if (trimmed.length > 0) {
                const isNoteLine = !trimmed.startsWith('%') && !/^w[0-9]*:?/i.test(trimmed);
                const hasNoteLineInBlock = currentBlockLines.some(l => {
                    const t = l.trim();
                    return t.length > 0 && !t.startsWith('%') && !/^w[0-9]*:?/i.test(t);
                });

                if (isNoteLine && hasNoteLineInBlock && !currentTitle) {
                    flushBlock();
                }

                currentBlockLines.push(line);
            }
        }
        flushBlock();

        window.week1State.parsedLines = parsedLines;
    };

    window.parseLineMeasures = function(abcContent) {
        if (!abcContent || !abcContent.trim()) return [];

        const lines = abcContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let noteLines = [];
        let lyricLines = [];

        lines.forEach(l => {
            if (l.startsWith('%')) return;
            if (/^w[0-9]*:?/i.test(l)) {
                lyricLines.push(l.replace(/^w[0-9]*:?/i, '').trim());
            } else {
                noteLines.push(l);
            }
        });

        const fullNotesAbc = noteLines.join(' ').trim();
        if (!fullNotesAbc) return [];

        const cleanNotesAbc = fullNotesAbc.replace(/\|\s*\]/g, '|').replace(/\|\s*\|/g, '|').replace(/:\s*\|/g, '|').replace(/\|\s*:/g, '|');

        let noteMeasures = [];
        if (cleanNotesAbc.includes('|')) {
            noteMeasures = cleanNotesAbc.split('|').map(m => m.trim()).filter(m => m.length > 0 && /[A-Ga-gZz]/.test(m));
        } else {
            noteMeasures = [cleanNotesAbc];
        }

        const lyricRows = lyricLines.map(line => line.split('|').map(m => m.trim()));

        let measures = [];
        let lastChord = 'None';

        noteMeasures.forEach((mNotesText, idx) => {
            const chordMatch = mNotesText.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
            let chord = chordMatch ? chordMatch[1] : null;

            if (chord) {
                lastChord = chord;
            }

            let mLyrics = [];
            lyricRows.forEach(row => {
                if (row[idx] && row[idx] !== '*') {
                    mLyrics.push('w: ' + row[idx]);
                }
            });

            const fullMeasureText = mNotesText + (mLyrics.length > 0 ? ('\n' + mLyrics.join('\n')) : '');

            measures.push({
                index: idx + 1,
                text: fullMeasureText,
                notes: mNotesText,
                chord: chord || (mNotesText.includes('"') ? 'None' : lastChord),
                hasExplicitChord: !!chord
            });
        });

        return measures;
    };

    function compileLineAbcFromMeasures(measures) {
        let noteMeasures = [];
        let lyricRows = [];

        measures.forEach((mObj, mIdx) => {
            const lines = mObj.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let mNotes = [];
            let mLyrics = [];

            lines.forEach(l => {
                if (l.startsWith('%')) return;
                if (/^w[0-9]*:?/i.test(l)) {
                    const words = l.replace(/^w[0-9]*:?/i, '').trim();
                    if (words) mLyrics.push(words);
                } else {
                    mNotes.push(l);
                }
            });

            noteMeasures.push(mNotes.join(' '));

            mLyrics.forEach((wStr, rIdx) => {
                if (!lyricRows[rIdx]) lyricRows[rIdx] = [];
                lyricRows[rIdx][mIdx] = wStr;
            });
        });

        const numMeasures = measures.length;
        lyricRows.forEach(row => {
            for (let i = 0; i < numMeasures; i++) {
                if (!row[i]) row[i] = '*';
            }
        });

        const notesLine = noteMeasures.join(' | ');
        const lyricsLines = lyricRows.map(row => 'w: ' + row.join(' | ')).join('\n');

        return `${notesLine}\n${lyricsLines ? lyricsLines + '\n' : ''}`;
    }

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

    window.updateStep1Paper = function(lineIdx) {
        const lineObj = window.week1State.parsedLines[lineIdx];
        if (!lineObj) return;

        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (abcRenderer) {
            const fullSnippetAbc = generateStep1AnnotatedAbc(lineObj, lineIdx);
            try {
                abcRenderer.renderAbc(`week1-step1-paper-${lineIdx}`, fullSnippetAbc, {
                    responsive: 'resize',
                    scale: 1.15,
                    staffwidth: 720,
                    add_classes: true
                });
            } catch (e) {
                console.warn(`Error rendering Step 1 snippet ${lineIdx}:`, e);
            }
        }
    };

    window.updateMeasureAbcText = function(lineIdx, mIdx, newText) {
        const lineObj = window.week1State.parsedLines[lineIdx];
        if (!lineObj) return;

        const measures = window.parseLineMeasures(lineObj.abcContent);
        if (measures[mIdx]) {
            measures[mIdx].text = newText;
            const chordMatch = newText.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
            if (chordMatch) {
                const key = `${lineIdx}_${mIdx}`;
                if (!window.week1State.measureConfigs[key]) {
                    window.week1State.measureConfigs[key] = { chord: chordMatch[1], rhythmPattern: '3_beat', chordVoicing: '3_note' };
                } else {
                    window.week1State.measureConfigs[key].chord = chordMatch[1];
                }
            }
        }

        lineObj.abcContent = compileLineAbcFromMeasures(measures);

        const allLineContents = window.week1State.parsedLines.map(l => l.abcContent);
        window.week1State.abcInput = `${lineObj.headerStr}\n${allLineContents.join('\n')}`;

        const inputEl = document.getElementById('week1-abc-input');
        if (inputEl) inputEl.value = window.week1State.abcInput;

        window.updateStep1Paper(lineIdx);
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

        let noteMeasures = [];
        let lyricRows = [];

        measures.forEach((mObj, mIdx) => {
            const lines = mObj.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let notesParts = [];
            let mLyrics = [];

            lines.forEach(l => {
                if (l.startsWith('%')) return;
                if (/^w[0-9]*:?/i.test(l)) {
                    const cleanWords = l.replace(/^w[0-9]*:?/i, '').trim();
                    if (cleanWords) mLyrics.push(cleanWords);
                } else {
                    notesParts.push(l);
                }
            });

            const mNotesText = notesParts.join(' ');
            noteMeasures.push(mNotesText);

            mLyrics.forEach((wStr, rIdx) => {
                if (!lyricRows[rIdx]) lyricRows[rIdx] = [];
                lyricRows[rIdx][mIdx] = wStr;
            });
        });

        const numMeasures = measures.length;
        lyricRows.forEach(row => {
            for (let i = 0; i < numMeasures; i++) {
                if (!row[i]) row[i] = '*';
            }
        });

        const lineNotesAbc = noteMeasures.join(' | ');
        const customW = lyricRows.map(row => 'w:' + row.join(' | ')).join('\n');

        return `${snippetHeader}\n${lineNotesAbc}\n${customW ? customW + '\n' : ''}`;
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
                        <span style="font-size: 0.76rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 8px; font-weight: 800;">Hợp Âm: ${cfg.chord}</span>
                      </div>

                      <div style="margin-bottom: 8px;">
                        <label style="display: block; font-weight: 700; color: #0369a1; font-size: 0.78rem; margin-bottom: 3px;">📝 Mã ABC Notation Ô Nhịp ${mObj.index}:</label>
                        <textarea rows="4" oninput="window.updateMeasureAbcText(${idx}, ${mIdx}, this.value)" style="width: 100%; min-height: 95px; padding: 8px 12px; border-radius: 10px; border: 1.5px solid #38bdf8; font-family: monospace; font-weight: 700; font-size: 0.88rem; color: #0f172a; outline: none; background: #f0f9ff; resize: vertical; line-height: 1.45;">${mObj.text}</textarea>
                      </div>

                      <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <label style="font-weight: 700; color: #be123c; font-size: 0.78rem;">🥁 Tiết Tấu Tay Trái:</label>
                          <select onchange="const inp=this.parentElement.nextElementSibling; inp.value=this.value; window.updateMeasureConfig(${idx}, ${mIdx}, 'rhythmText', this.value);" style="padding: 2px 6px; border-radius: 6px; border: 1px solid #f43f5e; font-size: 0.74rem; font-weight: 800; color: #be123c; background: #fff1f2; cursor: pointer; outline: none; max-width: 145px;">
                            <option value="">⚡ Chọn Tiết tấu...</option>
                            <option value="1 đơn 2 đơn 3 đen" ${cfg.rhythmText === '1 đơn 2 đơn 3 đen' ? 'selected' : ''}>1 đơn 2 đơn 3 đen (3 nốt)</option>
                            <option value="1 đơn 2 đơn 3 đơn 4 đơn" ${cfg.rhythmText === '1 đơn 2 đơn 3 đơn 4 đơn' ? 'selected' : ''}>1 đơn 2 đơn 3 đơn 4 đơn (4 nốt)</option>
                            <option value="1 đơn 2 đơn 3 đơn 4 đơn 5 đen" ${cfg.rhythmText === '1 đơn 2 đơn 3 đơn 4 đơn 5 đen' ? 'selected' : ''}>1 đơn 2 đơn 3 đơn 4 đơn 5 đen (5 nốt)</option>
                            <option value="1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đen" ${cfg.rhythmText === '1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đen' ? 'selected' : ''}>1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đen (7 nốt)</option>
                            <option value="1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đơn 8 đơn" ${cfg.rhythmText === '1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đơn 8 đơn' ? 'selected' : ''}>1 đơn 2 đơn 3 đơn 4 đơn 5 đơn 6 đơn 7 đơn 8 đơn (8 nốt)</option>
                          </select>
                        </div>
                        <input type="text" value="${cfg.rhythmText || '1 đơn 2 đơn 3 đen'}" oninput="window.updateMeasureConfig(${idx}, ${mIdx}, 'rhythmText', this.value)" placeholder="Ví dụ: 1 đơn 2 đơn 3 đen..." style="width: 100%; padding: 7px 10px; border-radius: 8px; border: 1.5px solid #f43f5e; font-weight: 700; font-size: 0.82rem; color: #881337; outline: none; background: #fff1f2;">
                      </div>

                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <label style="font-weight: 700; color: #0369a1; font-size: 0.78rem;">🎼 Quãng / Bậc Nốt Đệm:</label>
                          <select onchange="const inp=this.parentElement.nextElementSibling; inp.value=this.value; window.updateMeasureConfig(${idx}, ${mIdx}, 'intervalText', this.value);" style="padding: 2px 6px; border-radius: 6px; border: 1px solid #38bdf8; font-size: 0.74rem; font-weight: 800; color: #0284c7; background: #e0f2fe; cursor: pointer; outline: none; max-width: 145px;">
                            <option value="">⚡ Chọn Quãng/Bậc...</option>
                            <option value="3-3-5 / 1-3-5" ${cfg.intervalText === '3-3-5 / 1-3-5' ? 'selected' : ''}>3-3-5 / 1-3-5 (Thế 3 nốt cơ bản)</option>
                            <option value="5-4-8 / 1-5-8" ${cfg.intervalText === '5-4-8 / 1-5-8' ? 'selected' : ''}>5-4-8 / 1-5-8 (Thế 3 nốt giãn ngón)</option>
                            <option value="5-4-4 / 1-5-1 cao-5" ${cfg.intervalText === '5-4-4 / 1-5-1 cao-5' ? 'selected' : ''}>5-4-4 / 1-5-1 cao-5 (Thế 4 nốt K1)</option>
                            <option value="3-3-4 / 1-3-5-1 cao" ${cfg.intervalText === '3-3-4 / 1-3-5-1 cao' ? 'selected' : ''}>3-3-4 / 1-3-5-1 cao (Thế 4 nốt K2)</option>
                            <option value="5-4-4-6 / 1-5-1 cao-5-3 cao" ${cfg.intervalText === '5-4-4-6 / 1-5-1 cao-5-3 cao' ? 'selected' : ''}>5-4-4-6 / 1-5-1 cao-5-3 cao (Thế 5 nốt)</option>
                            <option value="5-4-4-6-6-4 / 1-5-1 cao-5-3 cao-5-1 cao" ${cfg.intervalText === '5-4-4-6-6-4 / 1-5-1 cao-5-3 cao-5-1 cao' ? 'selected' : ''}>5-4-4-6-6-4 / 1-5-1 cao-5-3 cao-5-1 cao (Thế 7 nốt)</option>
                            <option value="5-4-4-6-6-4-4 / 1-5-1 cao-5-3 cao-5-1 cao-5" ${cfg.intervalText === '5-4-4-6-6-4-4 / 1-5-1 cao-5-3 cao-5-1 cao-5' ? 'selected' : ''}>5-4-4-6-6-4-4 / 1-5-1 cao-5-3 cao-5-1 cao-5 (Thế 8 nốt)</option>
                          </select>
                        </div>
                        <input type="text" value="${cfg.intervalText || '3-3-5 / 1-3-5'}" oninput="window.updateMeasureConfig(${idx}, ${mIdx}, 'intervalText', this.value)" placeholder="Ví dụ: 3-3-5 / 1-3-5 hoặc 5-4-8 / 1-5-8..." style="width: 100%; padding: 7px 10px; border-radius: 8px; border: 1.5px solid #38bdf8; font-weight: 700; font-size: 0.82rem; color: #0369a1; outline: none; background: #f0f9ff;">
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
                  <h4 style="margin: 0 0 10px 0; color: #0369a1; font-size: 0.9rem; font-weight: 800;">⚙️ Cấu Hình Tiết Tấu Từng Ô Nhịp (Dòng này có ${measures.length} ô nhịp):</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px;">
                    ${measureControlsHtml}
                  </div>
                </div>
            `;

            container.appendChild(card);

            setTimeout(() => {
                const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
                if (abcRenderer) {
                    try {
                        abcRenderer.renderAbc(`week1-step1-paper-${idx}`, lineObj.abcContent, {
                            responsive: 'resize',
                            scale: 1.15,
                            staffwidth: 740,
                            add_classes: true
                        });
                    } catch (e) {
                        console.warn(`Error rendering Step 1 staff line ${idx}:`, e);
                    }
                }
            }, 30);
        });
    };

    window.updateStep2MeasureAbc = function(lineIdx, mIdx, hand, newText) {
        if (hand === 'treble') {
            window.updateMeasureAbcText(lineIdx, mIdx, newText);
        } else if (hand === 'bass') {
            if (!window.week1State.step2BassMeasures) {
                window.week1State.step2BassMeasures = {};
            }
            window.week1State.step2BassMeasures[`${lineIdx}_${mIdx}`] = newText;
        }

        const lineObj = window.week1State.parsedLines[lineIdx];
        if (lineObj) {
            const updatedGrandAbc = window.generateWeek1LineGrandStaffAbc(lineObj, lineIdx);
            const textarea = document.getElementById(`week1-step2-abc-text-${lineIdx}`);
            if (textarea) textarea.value = updatedGrandAbc;
            window.updateStep2GrandStaffAbc(lineIdx, updatedGrandAbc);
        }
    };

    window.updateStep2GrandStaffAbc = function(lineIdx, newAbc) {
        const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
        if (abcRenderer) {
            try {
                abcRenderer.renderAbc(`week1-step2-paper-${lineIdx}`, newAbc, {
                    responsive: 'resize',
                    scale: 1.15,
                    staffwidth: 740,
                    add_classes: true
                });
            } catch (e) {
                console.warn(`Error rendering updated Step 2 Grand Staff ${lineIdx}:`, e);
            }
        }
    };

    window.renderWeek1Step2Lines = function() {
        const container = document.getElementById('week1-step2-lines-container');
        if (!container) return;
        container.innerHTML = '';

        const lines = window.week1State.parsedLines;
        if (!lines || lines.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có dữ liệu dòng nhạc. Vui lòng nạp bài hát ở Tab 0 hoặc nhập ở Bước 1.</div>`;
            return;
        }

        lines.forEach((lineObj, idx) => {
            const measures = window.parseLineMeasures(lineObj.abcContent);
            const grandStaffAbc = window.generateWeek1LineGrandStaffAbc(lineObj, idx);

            const measureControlsHtml = measures.map((mObj, mIdx) => {
                const cfg = window.getMeasureConfig(idx, mIdx, mObj.chord);
                const customBassKey = `${idx}_${mIdx}`;
                const defaultBass = window.getBassRhythmNotes(cfg.chord, cfg.rhythmPattern);
                const mBassAbc = (window.week1State.step2BassMeasures && window.week1State.step2BassMeasures[customBassKey] !== undefined)
                    ? window.week1State.step2BassMeasures[customBassKey]
                    : defaultBass;

                return `
                    <div style="background: white; border: 1.5px solid #86efac; border-radius: 14px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                      <div style="font-weight: 800; color: #15803d; font-size: 0.88rem; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span>🎼 Ô Nhịp ${mObj.index} (2 Tay)</span>
                        <span style="font-size: 0.76rem; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 8px; font-weight: 800;">Hợp Âm: ${cfg.chord}</span>
                      </div>

                      <div style="margin-bottom: 8px;">
                        <label style="display: block; font-weight: 700; color: #0369a1; font-size: 0.78rem; margin-bottom: 3px;">🫱 Tay Phải (Khóa Sol):</label>
                        <textarea rows="3" oninput="window.updateStep2MeasureAbc(${idx}, ${mIdx}, 'treble', this.value)" style="width: 100%; min-height: 75px; padding: 8px 10px; border-radius: 10px; border: 1.5px solid #38bdf8; font-family: monospace; font-weight: 700; font-size: 0.86rem; color: #0f172a; outline: none; background: #f0f9ff; resize: vertical; line-height: 1.4;">${mObj.text}</textarea>
                      </div>

                      <div>
                        <label style="display: block; font-weight: 700; color: #be123c; font-size: 0.78rem; margin-bottom: 3px;">🫲 Tay Trái (Khóa Fa):</label>
                        <textarea rows="3" oninput="window.updateStep2MeasureAbc(${idx}, ${mIdx}, 'bass', this.value)" style="width: 100%; min-height: 75px; padding: 8px 10px; border-radius: 10px; border: 1.5px solid #f43f5e; font-family: monospace; font-weight: 700; font-size: 0.86rem; color: #0f172a; outline: none; background: #fff1f2; resize: vertical; line-height: 1.4;">${mBassAbc}</textarea>
                      </div>
                    </div>
                `;
            }).join('');

            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border: 2px solid #cbd5e1;
                border-radius: 20px;
                padding: 20px;
                box-shadow: 0 6px 18px rgba(0,0,0,0.04);
            `;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 12px 16px; border-radius: 14px; border: 1.5px solid #86efac;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #16a34a; color: white; font-weight: 800; padding: 4px 14px; border-radius: 12px; font-size: 0.9rem;">🎹 ${lineObj.title} - KHÓA SOL & KHÓA FA (2 TAY)</span>
                  </div>
                </div>

                <div id="week1-step2-paper-${idx}" style="background: #f8fafc; border-radius: 14px; padding: 16px; border: 2px dashed #cbd5e1; margin-bottom: 14px; min-height: 160px;"></div>

                <div style="display: flex; gap: 12px; font-size: 0.85rem; font-weight: 700; flex-wrap: wrap; margin-bottom: 14px;">
                  <span style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 10px;">🫱 Tay Phải (Khóa Sol): Giai Điệu Bài Hát</span>
                  <span style="background: #fce7f3; color: #be123c; padding: 6px 12px; border-radius: 10px;">🫲 Tay Trái (Khóa Fa): Nốt Hợp Âm Rải Theo Ô Nhịp</span>
                </div>

                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 14px;">
                  <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 0.9rem; font-weight: 800;">⚙️ Mã ABC Notation 2 Tay Từng Ô Nhịp (Dòng này có ${measures.length} ô nhịp):</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px;">
                    ${measureControlsHtml}
                  </div>
                </div>

                <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-weight: 800; color: #166534; font-size: 0.88rem;">📝 Mã ABC Notation Tổng Thể 2 Tay (Khóa Sol & Fa) Dòng Này:</label>
                    <span style="font-size: 0.78rem; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 8px; font-weight: 800;">Tự Động Đồng Bộ 2 Tay</span>
                  </div>
                  <textarea id="week1-step2-abc-text-${idx}" rows="5" oninput="window.updateStep2GrandStaffAbc(${idx}, this.value)" style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #4ade80; font-family: monospace; font-weight: 700; font-size: 0.86rem; color: #0f172a; outline: none; background: white; resize: vertical; line-height: 1.4;">${grandStaffAbc}</textarea>
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

    window.generateWeek1LineGrandStaffAbc = function(lineObj, lineIdx) {
        const snippetHeader = lineObj.snippetHeader || 'M:2/4\nL:1/8\nK:C';
        const measures = window.parseLineMeasures(lineObj.abcContent);

        let noteMeasures = [];
        let lyricRows = [];
        let bassMeasures = [];

        measures.forEach((mObj, mIdx) => {
            const lines = mObj.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let mNotes = [];
            let mWords = [];

            lines.forEach(l => {
                if (l.startsWith('%')) return;
                if (/^w[0-9]*:?/i.test(l)) {
                    const words = l.replace(/^w[0-9]*:?/i, '').trim();
                    if (words) mWords.push(words);
                } else {
                    mNotes.push(l);
                }
            });

            const mNotesText = mNotes.join(' ');
            noteMeasures.push(mNotesText);

            mWords.forEach((wStr, rIdx) => {
                if (!lyricRows[rIdx]) lyricRows[rIdx] = [];
                lyricRows[rIdx][mIdx] = wStr;
            });

            const customBassKey = `${lineIdx}_${mIdx}`;
            if (window.week1State.step2BassMeasures && window.week1State.step2BassMeasures[customBassKey] !== undefined) {
                bassMeasures.push(` ${window.week1State.step2BassMeasures[customBassKey]} `);
            } else {
                const cfg = window.getMeasureConfig(lineIdx, mIdx, mObj.chord);
                const bassNotes = window.getBassRhythmNotes(cfg.chord, cfg.rhythmText, cfg.intervalText);
                bassMeasures.push(` ${bassNotes} `);
            }
        });

        const numMeasures = measures.length;
        lyricRows.forEach(row => {
            for (let i = 0; i < numMeasures; i++) {
                if (!row[i]) row[i] = '*';
            }
        });

        const lineNotesAbc = noteMeasures.join(' | ');
        const customW = lyricRows.map(row => 'w:' + row.join(' | ')).join('\n');
        const bassBody = bassMeasures.join(' | ');

        return `X:1\nT: ${lineObj.title}\n${snippetHeader}\n%%score {1 | 2}\nV:1 clef=treble\n${lineNotesAbc}\n${customW ? customW + '\n' : ''}V:2 clef=bass\n${bassBody}`;
    };

    window.generateFullSongStep1MelodyAbc = function() {
        const lines = window.week1State.parsedLines;
        if (!lines || lines.length === 0) return window.week1State.abcInput;

        const firstLineHeader = (lines[0].snippetHeader || 'M:2/4\nL:1/8\nK:C').trim();
        let lineBlocks = [];

        lines.forEach((lineObj) => {
            const measures = window.parseLineMeasures(lineObj.abcContent);
            let noteMeasures = [];
            let lyricRows = [];

            measures.forEach((mObj, mIdx) => {
                const mLines = mObj.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                let mNotes = [];
                let mWords = [];

                mLines.forEach(l => {
                    if (l.startsWith('%')) return;
                    if (/^w[0-9]*:?/i.test(l)) {
                        const words = l.replace(/^w[0-9]*:?/i, '').trim();
                        if (words) mWords.push(words);
                    } else {
                        mNotes.push(l);
                    }
                });

                noteMeasures.push(mNotes.join(' '));

                mWords.forEach((wStr, rIdx) => {
                    if (!lyricRows[rIdx]) lyricRows[rIdx] = [];
                    lyricRows[rIdx][mIdx] = wStr;
                });
            });

            const numMeasures = measures.length;
            lyricRows.forEach(row => {
                for (let i = 0; i < numMeasures; i++) {
                    if (!row[i]) row[i] = '*';
                }
            });

            const trebleLineNotes = noteMeasures.join(' | ');
            const customW = lyricRows.map(row => 'w:' + row.join(' | ')).join('\n');

            lineBlocks.push(`${trebleLineNotes} |\n${customW ? customW + '\n' : ''}`);
        });

        return `X:1\nT: THẰNG CUỘI (BÀN NHẠC GIAI ĐIỆU BƯỚC 1)\n${firstLineHeader}\n${lineBlocks.join('')}`;
    };

    window.generateFullSongGrandStaffAbc = function() {
        const lines = window.week1State.parsedLines;
        if (!lines || lines.length === 0) return window.week1State.abcInput;

        const firstLineHeader = (lines[0].snippetHeader || 'M:2/4\nL:1/8\nK:C').trim();
        let lineBlocks = [];

        lines.forEach((lineObj, lineIdx) => {
            const measures = window.parseLineMeasures(lineObj.abcContent);
            let noteMeasures = [];
            let lyricRows = [];
            let bassMeasures = [];

            measures.forEach((mObj, mIdx) => {
                const mLines = mObj.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                let mNotes = [];
                let mWords = [];

                mLines.forEach(l => {
                    if (l.startsWith('%')) return;
                    if (/^w[0-9]*:?/i.test(l)) {
                        const words = l.replace(/^w[0-9]*:?/i, '').trim();
                        if (words) mWords.push(words);
                    } else {
                        mNotes.push(l);
                    }
                });

                noteMeasures.push(mNotes.join(' '));

                mWords.forEach((wStr, rIdx) => {
                    if (!lyricRows[rIdx]) lyricRows[rIdx] = [];
                    lyricRows[rIdx][mIdx] = wStr;
                });

                const customBassKey = `${lineIdx}_${mIdx}`;
                if (window.week1State.step2BassMeasures && window.week1State.step2BassMeasures[customBassKey] !== undefined) {
                    bassMeasures.push(` ${window.week1State.step2BassMeasures[customBassKey]} `);
                } else {
                    const cfg = window.getMeasureConfig(lineIdx, mIdx, mObj.chord);
                    const bassNotes = window.getBassRhythmNotes(cfg.chord, cfg.rhythmText, cfg.intervalText);
                    bassMeasures.push(` ${bassNotes} `);
                }
            });

            const numMeasures = measures.length;
            lyricRows.forEach(row => {
                for (let i = 0; i < numMeasures; i++) {
                    if (!row[i]) row[i] = '*';
                }
            });

            const trebleLineNotes = noteMeasures.join(' | ');
            const customW = lyricRows.map(row => 'w:' + row.join(' | ')).join('\n');
            const bassLineNotes = bassMeasures.join(' | ');

            lineBlocks.push(`V:1 clef=treble\n${trebleLineNotes} |\n${customW ? customW + '\n' : ''}V:2 clef=bass\n${bassLineNotes} |`);
        });

        return `X:1\nT: THẰNG CUỘI (2 TAY PIANO SOLO)\n${firstLineHeader}\n%%score {1 | 2}\n${lineBlocks.join('\n')}`;
    };

    window.toggleWeek1MasterScoreModal = function() {
        const modal = document.getElementById('week1-master-modal');
        if (!modal) return;
        const isHidden = (modal.style.display === 'none' || !modal.style.display);
        modal.style.display = isHidden ? 'flex' : 'none';

        if (isHidden) {
            const paper = document.getElementById('week1-modal-paper');
            const textarea = document.getElementById('week1-modal-abc-text');

            const masterAbc = (window.week1State.activeStep === 2)
                ? window.generateFullSongGrandStaffAbc()
                : window.generateFullSongStep1MelodyAbc();

            if (textarea) textarea.value = masterAbc;

            if (paper) {
                paper.innerHTML = '';
                const abcRenderer = window.abcjs || window.ABCJS || (typeof abcjs !== 'undefined' ? abcjs : null);
                if (abcRenderer) {
                    try {
                        abcRenderer.renderAbc('week1-modal-paper', masterAbc, {
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

    window.saveSongToLibrary = async function(titleName, abcContent, folderPath = '/') {
        if (!titleName || !abcContent) return;
        const CF_WORKER_URL = 'https://piano-library.infinite-horizons-2012.workers.dev';
        
        const newSong = {
            id: 'song_' + Date.now(),
            title: titleName,
            abc: abcContent,
            folderPath: folderPath || '/',
            createdAt: new Date().toISOString()
        };

        // Always save to localStorage immediately so it's instantly available in all Library views
        try {
            const cached = localStorage.getItem('piso_library_cache');
            let items = cached ? JSON.parse(cached) : [];
            items.unshift(newSong);
            localStorage.setItem('piso_library_cache', JSON.stringify(items));
        } catch (e) {
            console.warn('Error updating piso_library_cache:', e);
        }

        try {
            const payload = { title: titleName, abc: abcContent, folderPath: folderPath || '/' };
            const res = await fetch(CF_WORKER_URL + '/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert(`🎉 Đã lưu bản nhạc '${titleName}' thành công vào Thư viện!`);
            } else {
                throw new Error(data.error || 'Server error');
            }
        } catch(err) {
            console.warn('Cloud save fallback to localStorage:', err);
            alert(`🎉 Đã lưu bản nhạc '${titleName}' vào Thư Viện!`);
        }

        if (typeof window.fetchLibrary === 'function') window.fetchLibrary(true);
        if (typeof window.renderLibraryCurrentView === 'function') window.renderLibraryCurrentView();
        if (typeof window.populateWeek1LibraryDropdown === 'function') window.populateWeek1LibraryDropdown();
        if (typeof window.renderWeek1LibraryModalFolder === 'function') window.renderWeek1LibraryModalFolder('/');
    };

    window.loadStep1ToInteractiveTab = function() {
        if (!window.week1State.parsedLines || window.week1State.parsedLines.length === 0) {
            window.parseWeek1Lines();
        }
        const abcContent = window.generateFullSongStep1MelodyAbc();
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) {
            textarea.value = abcContent;
        }
        window.renderPianoSoloSheet(abcContent);
        if (typeof window.switchPianoSubTab === 'function') {
            window.switchPianoSubTab('interactive');
        }
        alert('🚀 Đã nạp thành công bản nhạc Bước 1 (Giai Điệu) sang Tab Tương Tác!');
    };

    window.loadStep2ToInteractiveTab = function() {
        if (!window.week1State.parsedLines || window.week1State.parsedLines.length === 0) {
            window.parseWeek1Lines();
        }
        const abcContent = window.generateFullSongGrandStaffAbc();
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) {
            textarea.value = abcContent;
        }
        window.renderPianoSoloSheet(abcContent);
        if (typeof window.switchPianoSubTab === 'function') {
            window.switchPianoSubTab('interactive');
        }
        alert('🚀 Đã nạp thành công bản nhạc Bước 2 (2 Tay Piano Solo) sang Tab Tương Tác!');
    };

    window.saveStep1ToLibrary = async function() {
        if (!window.week1State.parsedLines || window.week1State.parsedLines.length === 0) {
            window.parseWeek1Lines();
        }
        const abcContent = window.generateFullSongStep1MelodyAbc();
        const songTitleMatch = abcContent.match(/T:\s*(.+)/);
        const defaultTitle = songTitleMatch ? songTitleMatch[1].trim() + ' (Bước 1 Giai Điệu)' : 'Bản Nhạc Bước 1 Giai Điệu';
        
        const userTitle = prompt('Nhập tên bản nhạc muốn lưu vào Thư Viện (Bước 1 - Giai Điệu):', defaultTitle);
        if (!userTitle) return;

        await window.saveSongToLibrary(userTitle, abcContent, '/Tuần 1 - Giai Điệu');
        
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) textarea.value = abcContent;
        window.renderPianoSoloSheet(abcContent);
    };

    window.saveStep2ToLibrary = async function() {
        if (!window.week1State.parsedLines || window.week1State.parsedLines.length === 0) {
            window.parseWeek1Lines();
        }
        const abcContent = window.generateFullSongGrandStaffAbc();
        const songTitleMatch = abcContent.match(/T:\s*(.+)/);
        const defaultTitle = songTitleMatch ? songTitleMatch[1].trim() + ' (Bước 2 Piano Solo 2 Tay)' : 'Bản Nhạc Bước 2 Piano Solo';

        const userTitle = prompt('Nhập tên bản nhạc muốn lưu vào Thư Viện (Bước 2 - 2 Tay Sol & Fa):', defaultTitle);
        if (!userTitle) return;

        await window.saveSongToLibrary(userTitle, abcContent, '/Tuần 1 - Piano Solo 2 Tay');
        
        const textarea = document.getElementById('piano-solo-abc-editor');
        if (textarea) textarea.value = abcContent;
        window.renderPianoSoloSheet(abcContent);
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
