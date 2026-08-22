
        // --- PRESET SONGS DATA ---
        const PRESETS = {
            devuong: {
                title: "Đế Vương",
                composer: "Sáng tác: Đình Dũng",
                rhythmStyle: "Swing",
                timeSignature: "4/4",
                bpm: 92,
                drumPattern: "swing",
                staves: [
                    {
                        measureNum: 1,
                        chord: "",
                        notes: [
                            { type: "rest", duration: 0.5 },
                            { type: "rest", duration: 0.5 },
                            { type: "rest", duration: 0.5 },
                            { pitch: "E4", duration: 0.5, lyric: "Một", solfege: "mi", beam: "b1" },
                            { pitch: "A4", duration: 0.5, lyric: "bậc", solfege: "la", beam: "b1" },
                            { pitch: "B4", duration: 0.5, lyric: "quân", solfege: "si", beam: "b1" }
                        ]
                    },
                    {
                        measureNum: 2,
                        chord: "Am",
                        notes: [
                            { pitch: "C5", duration: 0.5, lyric: "vương", solfege: "do2", beam: "b2" },
                            { pitch: "C5", duration: 0.5, lyric: "mang", solfege: "do2", beam: "b2" },
                            { pitch: "C5", duration: 0.5, lyric: "trong", solfege: "do2", beam: "b2" },
                            { pitch: "C5", duration: 0.5, lyric: "con", solfege: "do2", beam: "b2" },
                            { pitch: "C5", duration: 0.5, lyric: "tim", solfege: "do2", beam: "b3" },
                            { pitch: "C5", duration: 0.5, lyric: "hình", solfege: "do2", beam: "b3" },
                            { pitch: "C5", duration: 0.5, lyric: "hài", solfege: "do2", beam: "b3" },
                            { pitch: "D5", duration: 0.5, lyric: "đất", solfege: "re2", beam: "b3" }
                        ]
                    },
                    {
                        measureNum: 3,
                        chord: "C",
                        notes: [
                            { pitch: "E5", duration: 1.0, lyric: "nước.", solfege: "mi2" },
                            { type: "rest", duration: 1.0 },
                            { pitch: "D5", duration: 1.0, lyric: "Ngỡ", solfege: "re2 - mi2", tieToNext: true },
                            { pitch: "E5", duration: 1.0, lyric: "", solfege: "", isTieEnd: true }
                        ]
                    },
                    {
                        measureNum: 4,
                        chord: "G",
                        notes: [
                            { pitch: "D5", duration: 0.5, lyric: "như", solfege: "re2", beam: "b4" },
                            { pitch: "D5", duration: 0.5, lyric: "gian", solfege: "re2", beam: "b4" },
                            { pitch: "D5", duration: 0.5, lyric: "nan", solfege: "re2", beam: "b4" },
                            { pitch: "D5", duration: 0.5, lyric: "ta", solfege: "re2", beam: "b4" },
                            { pitch: "D5", duration: 0.5, lyric: "sẽ", solfege: "re2", beam: "b5" },
                            { pitch: "B4", duration: 0.5, lyric: "chẳng", solfege: "si", beam: "b5" },
                            { pitch: "C5", duration: 0.5, lyric: "bao", solfege: "do2", beam: "b5" },
                            { pitch: "B4", duration: 0.5, lyric: "giờ", solfege: "si", beam: "b5" }
                        ]
                    }
                ]
            },
            careless: {
                title: "Careless Whisper",
                composer: "George Michael",
                rhythmStyle: "Pop 4/4",
                timeSignature: "4/4",
                bpm: 100,
                drumPattern: "pop",
                staves: [
                    {
                        measureNum: 1,
                        chord: "Dm",
                        notes: [
                            { pitch: "D5", duration: 0.5, lyric: "Đô", solfege: "re2", beam: "c1" },
                            { pitch: "A5", duration: 0.5, lyric: "La", solfege: "la2", beam: "c1" },
                            { pitch: "F5", duration: 0.5, lyric: "Fa", solfege: "fa2", beam: "c1" },
                            { pitch: "D5", duration: 0.5, lyric: "Rê", solfege: "re2", beam: "c1" },
                            { pitch: "A4", duration: 0.5, lyric: "La", solfege: "la", beam: "c2" },
                            { pitch: "F4", duration: 0.5, lyric: "Fa", solfege: "fa", beam: "c2" },
                            { pitch: "D4", duration: 1.0, lyric: "Rê", solfege: "re" }
                        ]
                    },
                    {
                        measureNum: 2,
                        chord: "Gm",
                        notes: [
                            { pitch: "G4", duration: 0.5, lyric: "Sol", solfege: "sol", beam: "c3" },
                            { pitch: "Bb4", duration: 0.5, lyric: "Si", solfege: "sib", beam: "c3" },
                            { pitch: "D5", duration: 0.5, lyric: "Rê", solfege: "re2", beam: "c3" },
                            { pitch: "F5", duration: 0.5, lyric: "Fa", solfege: "fa2", beam: "c3" },
                            { pitch: "Bb4", duration: 1.0, lyric: "Sib", solfege: "sib" },
                            { type: "rest", duration: 1.0 }
                        ]
                    }
                ]
            }
        };

        const NOTE_FREQS = {
            "A2": 110.00, "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00,
            "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "Bb4": 466.16, "B4": 493.88,
            "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "B5": 987.77
        };

        const CHORD_FREQS = {
            "Am": [220.00, 261.63, 329.63],
            "C":  [261.63, 329.63, 392.00],
            "G":  [196.00, 246.94, 293.66],
            "Dm": [146.83, 220.00, 293.66],
            "Gm": [196.00, 233.08, 293.66]
        };

        const BASS_FREQS = {
            "Am": 110.00,
            "C":  130.81,
            "G":  98.00,
            "Dm": 73.42,
            "Gm": 98.00
        };

        const PITCH_SEMITONE_OFFSET = {
            "C4": -6, "D4": -5, "E4": -4, "F4": -3, "G4": -2, "A4": -1, "Bb4": 0, "B4": 0,
            "C5": 1, "D5": 2, "E5": 3, "F5": 4, "G5": 5, "A5": 6, "B5": 7
        };

        let currentSong = JSON.parse(JSON.stringify(PRESETS.devuong));
        let isPlaying = false;
        let isRecording = false;
        let currentBeat = 0;
        let playbackTimer = null;
        let audioCtx = null;
        let masterGain = null;
        let drumGain = null;
        let bassGain = null;
        let chordGain = null;
        let melodyGain = null;
        let mp3Gain = null;
        let activeNoteIndex = -1;
        let noteLayoutPositions = [];
        let currentInstrument = "piano";
        let mediaRecorder = null;
        let recordedChunks = [];
        let loadedAudioBuffer = null;
        let audioBufferSource = null;

        const canvas = document.getElementById("sheetCanvas");
        const ctx = canvas.getContext("2d");

        window.addEventListener("DOMContentLoaded", () => {
            loadPreset('devuong');
            drawSheet();
        });

        function loadPreset(presetKey) {
            document.querySelectorAll('.song-btn').forEach(btn => btn.classList.remove('active'));
            if (presetKey === 'devuong') {
                document.getElementById('btnPresetDeVuong').classList.add('active');
                currentSong = JSON.parse(JSON.stringify(PRESETS.devuong));
            } else if (presetKey === 'careless') {
                document.getElementById('btnPresetCareless').classList.add('active');
                currentSong = JSON.parse(JSON.stringify(PRESETS.careless));
            } else {
                document.getElementById('btnPresetCustom').classList.add('active');
            }

            document.getElementById('inputBpm').value = currentSong.bpm;
            document.getElementById('selectDrumPattern').value = currentSong.drumPattern || 'swing';
            document.getElementById('jsonEditor').value = JSON.stringify(currentSong, null, 2);
            stopPlayback();
            drawSheet();
        }

        function applyJsonEditor() {
            try {
                const updated = JSON.parse(document.getElementById('jsonEditor').value);
                currentSong = updated;
                drawSheet();
                alert("✅ Đã cập nhật Sheet nhạc thành công!");
            } catch(e) {
                alert("❌ Lỗi cú pháp JSON: " + e.message);
            }
        }

        function updateTempo(val) {
            currentSong.bpm = parseInt(val) || 90;
        }

        function changeDrumPattern(val) {
            currentSong.drumPattern = val;
        }

        function changeInstrument(val) {
            currentInstrument = val;
        }

        // --- AUDIO ENGINE ---
        function initAudio() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 1.0;
                masterGain.connect(audioCtx.destination);

                drumGain = audioCtx.createGain();
                drumGain.gain.value = parseFloat(document.getElementById('volDrum').value);
                drumGain.connect(masterGain);

                bassGain = audioCtx.createGain();
                bassGain.gain.value = parseFloat(document.getElementById('volBass').value);
                bassGain.connect(masterGain);

                chordGain = audioCtx.createGain();
                chordGain.gain.value = parseFloat(document.getElementById('volChord').value);
                chordGain.connect(masterGain);

                melodyGain = audioCtx.createGain();
                melodyGain.gain.value = parseFloat(document.getElementById('volMelody').value);
                melodyGain.connect(masterGain);

                mp3Gain = audioCtx.createGain();
                mp3Gain.gain.value = parseFloat(document.getElementById('volMp3').value);
                mp3Gain.connect(masterGain);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        function updateVolumes() {
            if (drumGain) drumGain.gain.value = parseFloat(document.getElementById('volDrum').value);
            if (bassGain) bassGain.gain.value = parseFloat(document.getElementById('volBass').value);
            if (chordGain) chordGain.gain.value = parseFloat(document.getElementById('volChord').value);
            if (melodyGain) melodyGain.gain.value = parseFloat(document.getElementById('volMelody').value);
            if (mp3Gain) mp3Gain.gain.value = parseFloat(document.getElementById('volMp3').value);
        }

        function playNoteSound(freq, durationSec) {
            if (!freq || !audioCtx) return;
            const now = audioCtx.currentTime;
            
            const osc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();

            if (currentInstrument === 'piano') {
                osc.type = 'triangle';
                noteGain.gain.setValueAtTime(0, now);
                noteGain.gain.linearRampToValueAtTime(0.8, now + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.3);
            } else if (currentInstrument === 'marimba') {
                osc.type = 'sine';
                noteGain.gain.setValueAtTime(0, now);
                noteGain.gain.linearRampToValueAtTime(1.0, now + 0.005);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(durationSec, 0.4));
            } else if (currentInstrument === 'flute') {
                osc.type = 'sine';
                noteGain.gain.setValueAtTime(0, now);
                noteGain.gain.linearRampToValueAtTime(0.5, now + 0.08);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.2);
            } else {
                osc.type = 'sawtooth';
                noteGain.gain.setValueAtTime(0, now);
                noteGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.1);
            }

            osc.frequency.setValueAtTime(freq, now);
            osc.connect(noteGain);
            noteGain.connect(melodyGain);

            osc.start(now);
            osc.stop(now + durationSec + 0.4);
        }

        function playBassHit(chordName, durationSec) {
            const freq = BASS_FREQS[chordName];
            if (!freq || !audioCtx) return;
            const now = audioCtx.currentTime;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 350;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.7, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.2);

            osc.frequency.setValueAtTime(freq, now);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(bassGain);

            osc.start(now);
            osc.stop(now + durationSec + 0.3);
        }

        function playChordPadHit(chordName, durationSec) {
            const freqs = CHORD_FREQS[chordName];
            if (!freqs || !audioCtx) return;
            const now = audioCtx.currentTime;

            freqs.forEach(freq => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.4);

                osc.frequency.setValueAtTime(freq, now);
                osc.connect(gain);
                gain.connect(chordGain);

                osc.start(now);
                osc.stop(now + durationSec + 0.5);
            });
        }

        function playDrumHit(type) {
            if (!audioCtx || document.getElementById('selectDrumPattern').value === 'none') return;
            const now = audioCtx.currentTime;

            if (type === 'kick') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.frequency.setValueAtTime(130, now);
                osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
                gain.gain.setValueAtTime(1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(drumGain);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'snare') {
                const bufferSize = audioCtx.sampleRate * 0.15;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 1000;

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(drumGain);
                noise.start(now);
            } else if (type === 'hihat') {
                const bufferSize = audioCtx.sampleRate * 0.05;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 7000;

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(drumGain);
                noise.start(now);
            }
        }

        function handleAudioUpload(input) {
            const file = input.files[0];
            if (!file) return;
            initAudio();

            const reader = new FileReader();
            reader.onload = function(e) {
                audioCtx.decodeAudioData(e.target.result, function(buffer) {
                    loadedAudioBuffer = buffer;
                    alert("🎵 Đã nạp thành công nhạc đệm MP3! Khi bấm 'Phát', nhạc MP3 gốc sẽ chạy cùng sheet nhạc!");
                }, function(err) {
                    alert("❌ Không thể đọc file audio: " + err.message);
                });
            };
            reader.readAsArrayBuffer(file);
        }

        // --- DRAWING CANVAS SHEET MUSIC (FIXED LAYOUT - NO OVERFLOW) ---
        function drawSheet() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background
            ctx.fillStyle = "#fffbf0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Header Banner
            ctx.fillStyle = "#facc15";
            ctx.fillRect(0, 0, canvas.width, 100);

            // Song Title
            ctx.font = "bold 38px 'Dancing Script', cursive";
            ctx.fillStyle = "#1e293b";
            ctx.textAlign = "center";
            ctx.fillText(currentSong.title, canvas.width / 2, 50);

            // Composer
            ctx.font = "italic 16px 'Dancing Script', cursive";
            ctx.fillStyle = "#334155";
            ctx.fillText(currentSong.composer, canvas.width / 2 + 110, 82);

            noteLayoutPositions = [];
            
            // Layout Configuration: Exactly 2 measures per row
            const measuresPerRow = 2;
            const rowYPositions = [210, 440]; // Y center of staff lines for Row 1 and Row 2
            const lineSpacing = 13;

            const marginLeft = 60;
            const marginRight = 900;
            const usableWidth = marginRight - marginLeft; // 840px usable width

            let globalNoteIdx = 0;

            for (let r = 0; r < Math.ceil(currentSong.staves.length / measuresPerRow); r++) {
                const staffY = rowYPositions[r] || (210 + r * 220);
                const rowStaves = currentSong.staves.slice(r * measuresPerRow, (r + 1) * measuresPerRow);

                // Draw Staff Lines across the row (5 lines)
                ctx.strokeStyle = "#1e293b";
                ctx.lineWidth = 1.5;
                for (let i = -2; i <= 2; i++) {
                    let ly = staffY + i * lineSpacing;
                    ctx.beginPath();
                    ctx.moveTo(marginLeft, ly);
                    ctx.lineTo(marginRight, ly);
                    ctx.stroke();
                }

                // Row Measure positions
                let measureStartXs = [];
                if (rowStaves.length === 2) {
                    // Allocating width based on note counts in measure 1 vs measure 2
                    const count1 = rowStaves[0].notes.length;
                    const count2 = rowStaves[1].notes.length;
                    const totalCount = count1 + count2;

                    const width1 = Math.floor((count1 / totalCount) * usableWidth);
                    measureStartXs = [marginLeft, marginLeft + width1];
                } else {
                    measureStartXs = [marginLeft];
                }

                rowStaves.forEach((staffMeasure, mInRowIdx) => {
                    const mIdx = r * measuresPerRow + mInRowIdx;
                    const mStartX = measureStartXs[mInRowIdx];
                    const nextMX = (mInRowIdx < measureStartXs.length - 1) ? measureStartXs[mInRowIdx + 1] : marginRight;
                    const mWidth = nextMX - mStartX;

                    // Barline at end of measure
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(nextMX, staffY - 2 * lineSpacing);
                    ctx.lineTo(nextMX, staffY + 2 * lineSpacing);
                    ctx.stroke();

                    // Clef & Time Signature at start of first measure in Row 1
                    let noteDrawStartX = mStartX + 20;
                    if (mIdx === 0) {
                        ctx.font = "bold 36px 'Outfit', sans-serif";
                        ctx.fillStyle = "#000";
                        ctx.textAlign = "center";
                        ctx.fillText("𝄞", mStartX + 25, staffY + 10);

                        ctx.font = "bold 20px 'Outfit', sans-serif";
                        ctx.fillText("4", mStartX + 52, staffY - 6);
                        ctx.fillText("4", mStartX + 52, staffY + 16);

                        ctx.font = "bold 18px 'Outfit', sans-serif";
                        ctx.textAlign = "left";
                        ctx.fillText(currentSong.rhythmStyle || "Swing", mStartX + 75, staffY - 45);

                        noteDrawStartX = mStartX + 120;
                    }

                    // Chord Symbol above Measure (e.g. Am, C, G)
                    if (staffMeasure.chord) {
                        ctx.font = "bold 24px 'Outfit', sans-serif";
                        ctx.fillStyle = "#dc2626";
                        ctx.textAlign = "left";
                        ctx.fillText(staffMeasure.chord, noteDrawStartX, staffY - 35);
                    }

                    // Calculate Note Positions inside measure
                    const noteCount = staffMeasure.notes.length;
                    const notePadding = 30;
                    const availableForNotes = (nextMX - noteDrawStartX) - notePadding;
                    const noteStep = availableForNotes / Math.max(noteCount - 0.5, 1);

                    let measureNotePositions = [];

                    staffMeasure.notes.forEach((note, nIdx) => {
                        let noteX = Math.round(noteDrawStartX + nIdx * noteStep + 15);
                        let semitone = PITCH_SEMITONE_OFFSET[note.pitch] || 0;
                        let noteY = staffY - (semitone * (lineSpacing / 2));

                        measureNotePositions.push({
                            x: noteX,
                            y: noteY,
                            pitch: note.pitch,
                            beam: note.beam
                        });

                        noteLayoutPositions.push({
                            index: globalNoteIdx,
                            measureNum: staffMeasure.measureNum,
                            chord: staffMeasure.chord,
                            x: noteX,
                            y: noteY,
                            staffY: staffY,
                            pitch: note.pitch,
                            duration: note.duration,
                            isRest: note.type === "rest"
                        });

                        const isActive = (globalNoteIdx === activeNoteIndex);

                        if (note.type === "rest") {
                            ctx.font = "bold 22px 'Outfit', sans-serif";
                            ctx.fillStyle = isActive ? "#e11d48" : "#1e293b";
                            ctx.textAlign = "center";
                            ctx.fillText("𝄽", noteX, staffY + 4);
                        } else {
                            // Ledger line for C4 / D4
                            if (semitone <= -4) {
                                ctx.beginPath();
                                ctx.moveTo(noteX - 12, staffY + 3 * lineSpacing);
                                ctx.lineTo(noteX + 12, staffY + 3 * lineSpacing);
                                ctx.stroke();
                            }

                            // Notehead
                            ctx.beginPath();
                            ctx.ellipse(noteX, noteY, 7, 5, -0.2, 0, Math.PI * 2);
                            ctx.fillStyle = isActive ? "#e11d48" : "#1e293b";
                            ctx.fill();

                            if (isActive) {
                                ctx.strokeStyle = "#f43f5e";
                                ctx.lineWidth = 3;
                                ctx.stroke();
                            }

                            // Stem
                            ctx.lineWidth = 2;
                            ctx.strokeStyle = isActive ? "#e11d48" : "#1e293b";
                            ctx.beginPath();
                            ctx.moveTo(noteX + 6, noteY);
                            ctx.lineTo(noteX + 6, noteY - 28);
                            ctx.stroke();

                            // Beam connecting八度音符
                            if (nIdx > 0 && note.beam && staffMeasure.notes[nIdx - 1].beam === note.beam) {
                                let prevX = measureNotePositions[nIdx - 1].x;
                                let prevY = measureNotePositions[nIdx - 1].y;
                                ctx.lineWidth = 3.5;
                                ctx.beginPath();
                                ctx.moveTo(prevX + 6, prevY - 28);
                                ctx.lineTo(noteX + 6, noteY - 28);
                                ctx.stroke();
                            }

                            // Slur / Tie arc
                            if (note.tieToNext) {
                                ctx.beginPath();
                                ctx.arc(noteX + 35, noteY - 10, 26, Math.PI * 1.2, Math.PI * 1.8);
                                ctx.lineWidth = 1.5;
                                ctx.stroke();
                            }

                            // Lyrics text
                            if (note.lyric) {
                                ctx.font = "15px 'Outfit', sans-serif";
                                ctx.fillStyle = isActive ? "#e11d48" : "#334155";
                                ctx.textAlign = "center";
                                ctx.fillText(note.lyric, noteX, staffY + 45);
                            }

                            // Solfège notation text (mi, la, si, do2, re2, mi2...)
                            if (note.solfege) {
                                ctx.font = "bold italic 16px 'Outfit', sans-serif";
                                ctx.fillStyle = isActive ? "#e11d48" : "#000000";
                                ctx.textAlign = "center";
                                ctx.fillText(note.solfege, noteX, staffY + 68);
                            }
                        }

                        globalNoteIdx++;
                    });
                });
            }

            // Playback Cursor Highlight
            if (isPlaying && activeNoteIndex >= 0 && activeNoteIndex < noteLayoutPositions.length) {
                const activePos = noteLayoutPositions[activeNoteIndex];
                ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
                ctx.fillRect(activePos.x - 20, activePos.staffY - 50, 40, 135);
                
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(activePos.x, activePos.staffY - 50);
                ctx.lineTo(activePos.x, activePos.staffY + 85);
                ctx.stroke();
            }
        }

        // --- PLAYBACK ENGINE ---
        function togglePlay() {
            if (isPlaying) {
                stopPlayback();
            } else {
                startPlayback();
            }
        }

        function startPlayback() {
            initAudio();
            isPlaying = true;
            document.getElementById('playIcon').innerText = "⏸";
            document.getElementById('playText').innerText = "Tạm Dừng";

            activeNoteIndex = 0;
            currentBeat = 0;

            const bpm = parseInt(document.getElementById('inputBpm').value) || 92;
            const eighthNoteDurationMs = (60 / bpm / 2) * 1000;

            if (loadedAudioBuffer) {
                if (audioBufferSource) {
                    try { audioBufferSource.stop(); } catch(e){}
                }
                audioBufferSource = audioCtx.createBufferSource();
                audioBufferSource.buffer = loadedAudioBuffer;
                audioBufferSource.connect(mp3Gain);
                audioBufferSource.start(0);
            }

            function step() {
                if (!isPlaying) return;

                if (activeNoteIndex >= noteLayoutPositions.length) {
                    activeNoteIndex = 0;
                    currentBeat = 0;
                }

                const notePos = noteLayoutPositions[activeNoteIndex];
                drawSheet();

                // 1. Play Lead Melody
                if (!notePos.isRest) {
                    const freq = NOTE_FREQS[notePos.pitch];
                    playNoteSound(freq, (notePos.duration * 60) / bpm);
                }

                // 2. Play Synthesized Bass & Chords
                let activeChord = notePos.chord || (activeNoteIndex > 0 ? noteLayoutPositions[activeNoteIndex-1].chord : "") || "Am";
                if (currentBeat % 2 === 0 && activeChord) {
                    playBassHit(activeChord, (60 / bpm));
                    playChordPadHit(activeChord, (60 / bpm));
                }

                // 3. Play Drums
                const pattern = document.getElementById('selectDrumPattern').value;
                if (pattern === 'swing') {
                    if (currentBeat % 2 === 0) playDrumHit('kick');
                    if (currentBeat % 4 === 2) playDrumHit('snare');
                    playDrumHit('hihat');
                } else if (pattern === 'pop') {
                    if (currentBeat % 4 === 0) playDrumHit('kick');
                    if (currentBeat % 4 === 2) playDrumHit('snare');
                    playDrumHit('hihat');
                } else if (pattern === 'ballad') {
                    if (currentBeat % 8 === 0 || currentBeat % 8 === 6) playDrumHit('kick');
                    if (currentBeat % 8 === 4) playDrumHit('snare');
                    playDrumHit('hihat');
                } else if (pattern === 'disco') {
                    playDrumHit('kick');
                    if (currentBeat % 2 === 1) playDrumHit('hihat');
                    if (currentBeat % 4 === 2) playDrumHit('snare');
                }

                activeNoteIndex++;
                currentBeat++;

                const stepTime = notePos ? (notePos.duration * (60 / bpm) * 1000) : eighthNoteDurationMs;
                playbackTimer = setTimeout(step, stepTime);
            }

            step();
        }

        function stopPlayback() {
            isPlaying = false;
            if (playbackTimer) clearTimeout(playbackTimer);
            if (audioBufferSource) {
                try { audioBufferSource.stop(); } catch(e){}
            }
            activeNoteIndex = -1;
            document.getElementById('playIcon').innerText = "▶";
            document.getElementById('playText').innerText = "Phát Toàn Bộ Nhạc Cụ";
            drawSheet();
        }

        // --- BUILT-IN SCREEN & AUDIO RECORDER ---
        async function toggleRecording() {
            const btn = document.getElementById('btnRecord');
            if (isRecording) {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
                isRecording = false;
                btn.classList.remove('recording');
                btn.innerText = "🎥 Quay Video Reel (MP4/WebM)";
            } else {
                initAudio();
                try {
                    const canvasStream = canvas.captureStream(60);
                    const audioDest = audioCtx.createMediaStreamDestination();
                    masterGain.connect(audioDest);

                    const combinedStream = new MediaStream([
                        ...canvasStream.getVideoTracks(),
                        ...audioDest.stream.getAudioTracks()
                    ]);

                    recordedChunks = [];
                    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        options = { mimeType: 'video/webm' };
                    }

                    mediaRecorder = new MediaRecorder(combinedStream, options);
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) recordedChunks.push(e.data);
                    };

                    mediaRecorder.onstop = () => {
                        const blob = new Blob(recordedChunks, { type: 'video/webm' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentSong.title.replace(/\s+/g, '_')}_perfect_sheet.webm`;
                        a.click();
                        alert("🎉 Đã xuất video Full Band thành công! Bạn có thể tải lên Facebook Reel / TikTok ngay!");
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    btn.classList.add('recording');
                    btn.innerText = "⏹ Đang Quay... (Bấm để Dừng & Tải Video)";

                    if (!isPlaying) startPlayback();

                } catch(err) {
                    alert("⚠️ Không thể tự động ghi hình: " + err.message + "\nBạn có thể dùng CapCut / OBS để quay trực tiếp.");
                }
            }
        }
    