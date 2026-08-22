// Full Band Studio Custom Web Audio API Synthesizer

export const BASS_FREQS = {
    'C': 65.41, 'C#': 69.30, 'Db': 69.30,
    'D': 73.42, 'D#': 77.78, 'Eb': 77.78,
    'E': 82.41, 'F': 87.31, 'F#': 92.50, 'Gb': 92.50,
    'G': 98.00, 'G#': 103.83, 'Ab': 103.83,
    'A': 55.00, 'A#': 58.27, 'Bb': 58.27,
    'B': 61.74
};

export const CHORD_FREQS = {
    "Am": [220.00, 261.63, 329.63],
    "A": [220.00, 277.18, 329.63],
    "C":  [261.63, 329.63, 392.00],
    "Cm": [261.63, 311.13, 392.00],
    "G":  [196.00, 246.94, 293.66],
    "Gm": [196.00, 233.08, 293.66],
    "Dm": [146.83, 220.00, 293.66],
    "D": [146.83, 185.00, 220.00], 
    "F": [174.61, 220.00, 261.63],
    "Fm": [174.61, 207.65, 261.63],
    "Em": [164.81, 196.00, 246.94],
    "E": [164.81, 207.65, 246.94],
    "Bb": [233.08, 293.66, 349.23],
    "Bbm": [233.08, 277.18, 349.23],
    "B": [246.94, 311.13, 369.99],
    "Bm": [246.94, 293.66, 369.99]
};

let audioCtx = null;
let masterGain = null;
let drumGain = null;
let bassGain = null;
let chordGain = null;

export function initFullBandAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.2; // Drastically reduce accompaniment to let melody shine
        masterGain.connect(audioCtx.destination);

        drumGain = audioCtx.createGain();
        drumGain.connect(masterGain);

        bassGain = audioCtx.createGain();
        bassGain.connect(masterGain);

        chordGain = audioCtx.createGain();
        chordGain.connect(masterGain);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    updateFullBandVolumes();
}

export function updateFullBandVolumes() {
    if (!audioCtx) return;
    const getVol = (id, def) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : def;
    };
    if (drumGain) drumGain.gain.value = getVol('volDrum', 0.75);
    if (bassGain) bassGain.gain.value = getVol('volBass', 0.65);
    if (chordGain) chordGain.gain.value = getVol('volChord', 0.5);
}

export function playBassHit(chordName, durationSec) {
    if (!audioCtx || !chordName) return;
    // Extract root note (e.g. "C#m7" -> "C#")
    const baseMatch = chordName.match(/^[A-G][#b]?/);
    const baseChord = baseMatch ? baseMatch[0] : 'C';
    const freq = BASS_FREQS[baseChord] || 65.41; // Default to C2 if not found
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';

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

export function playChordPadHit(chordName, durationSec) {
    if (!audioCtx || !chordName) return;
    let freqs = CHORD_FREQS[chordName];
    if (!freqs) {
        // Fallback to major chord of the root note if specific chord (like G7, Cadd9) is not found
        const baseMatch = chordName.match(/^[A-G][#b]?/);
        const baseChord = baseMatch ? baseMatch[0] : 'C';
        freqs = CHORD_FREQS[baseChord] || CHORD_FREQS['C'];
    }
    
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

export function playDrumHit(type) {
    if (!audioCtx) return;
    const styleEl = document.getElementById('drumStyle');
    if (styleEl && styleEl.value === 'none') return;
    
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

export function stopFullBandAudio() { /* Do nothing for now */ }
