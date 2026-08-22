import { initFullBandAudio, updateFullBandVolumes, playDrumHit, playBassHit, playChordPadHit, stopFullBandAudio } from './fullband-synth.js';

let activeChord = "";
let currentTempo = 100;
let offbeatTimeouts = [];

export function startAccompanimentEngine(tempo) {
    initFullBandAudio();
    updateFullBandVolumes();
    currentTempo = tempo || 100;
    activeChord = "";
    offbeatTimeouts = [];
}

export function stopAccompanimentEngine() {
    stopFullBandAudio();
    offbeatTimeouts.forEach(clearTimeout);
    offbeatTimeouts = [];
}

export function updateVolumes() {
    updateFullBandVolumes();
}

export function handleEventCallback(ev) {
    if (ev && ev.startChar !== undefined && window.studioAbcString) {
        // Extract chord directly from the ABC string chunk for this event
        const chunk = window.studioAbcString.substring(ev.startChar, ev.endChar || ev.startChar + 20);
        const match = chunk.match(/"([^"]+)"/);
        if (match) {
            activeChord = match[1].trim();
        }
    }
}

export function handleBeatCallback(beatNumber) {
    const styleEl = document.getElementById('drumStyle');
    const style = styleEl ? styleEl.value : 'pop';
    
    if (style === 'none') return;
    
    const beatDurationMs = 60000 / currentTempo;
    
    // Play Bass and Chords on every beat (quarter note)
    if (activeChord) {
        playBassHit(activeChord, 60 / currentTempo);
        playChordPadHit(activeChord, 60 / currentTempo);
    }
    
    // Play Drums based on style
    // beatNumber is 0-indexed absolute beat number across the song
    if (style === 'pop') {
        if (beatNumber % 2 === 0) playDrumHit('kick'); // Beats 1, 3 (0, 2)
        if (beatNumber % 2 === 1) playDrumHit('snare'); // Beats 2, 4 (1, 3)
        playDrumHit('hihat'); // On beat
        offbeatTimeouts.push(setTimeout(() => playDrumHit('hihat'), beatDurationMs / 2)); // Off beat
    } 
    else if (style === 'disco') {
        playDrumHit('kick'); // Four on the floor
        if (beatNumber % 2 === 1) playDrumHit('snare'); // Beats 2, 4
        offbeatTimeouts.push(setTimeout(() => playDrumHit('hihat'), beatDurationMs / 2)); // Off beat hihat
    }
    else if (style === 'swing') {
        if (beatNumber % 2 === 0) playDrumHit('kick'); // Beats 1, 3
        if (beatNumber % 2 === 1) playDrumHit('snare'); // Beats 2, 4
        playDrumHit('hihat'); // On beat ride
        // Swing off-beat is delayed (triplet feel)
        offbeatTimeouts.push(setTimeout(() => playDrumHit('hihat'), beatDurationMs * 0.66)); 
    }
    else if (style === 'ballad') {
        if (beatNumber % 4 === 0 || beatNumber % 4 === 3) playDrumHit('kick');
        if (beatNumber % 2 === 1) playDrumHit('snare');
        playDrumHit('hihat');
        offbeatTimeouts.push(setTimeout(() => playDrumHit('hihat'), beatDurationMs / 2));
    }
}
