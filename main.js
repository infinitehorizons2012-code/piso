import './style.css'
import abcjs from 'abcjs'

// --- Default ABC Notation ---
const DEFAULT_ABC = `X:1
T:Bản Nhạc Của Bé
M:4/4
L:1/4
K:C
C D E F | G A B c |`;

const abcTextarea = document.getElementById('abc-code');
const paperElement = document.getElementById('paper');

// Initialize the editor
abcTextarea.value = DEFAULT_ABC;

let currentVisualObj = null;

function renderSheetMusic() {
  const abcCode = abcTextarea.value;
  // Render using abcjs for the left panel
  abcjs.renderAbc("paper", abcCode, {
    add_classes: true,
    staffwidth: 700,
  });

  // Render for Karaoke mode (returns visual obj for synth)
  // Inject tempo Q: header for playback speed control
  let karaokeAbc = abcCode;
  const newTempo = Math.round(120 * (currentTempo / 100));
  
  if (!karaokeAbc.match(/^Q:/m)) {
      // If no Q: exists, inject it after K:
      karaokeAbc = karaokeAbc.replace(/^(K:.*)$/m, `$1\nQ: 1/4=${newTempo}`);
  } else {
      // Replace existing Q:
      karaokeAbc = karaokeAbc.replace(/^Q:.*$/m, `Q: 1/4=${newTempo}`);
  }

  currentVisualObj = abcjs.renderAbc("karaoke-paper", karaokeAbc, {
    add_classes: true,
    responsive: 'resize'
  });
}

// Render on startup
renderSheetMusic();

// Two-way binding (Text -> Sheet)
abcTextarea.addEventListener('input', () => {
  renderSheetMusic();
  if (window.renderStudioSheet) window.renderStudioSheet();
});

// --- View Toggle Logic ---
const toggleBtn = document.getElementById('toggle-view-btn');
const abcView = document.getElementById('abc-view');
const karaokeView = document.getElementById('karaoke-view');
let isKaraokeMode = false;

toggleBtn.addEventListener('click', () => {
  isKaraokeMode = !isKaraokeMode;
  if (isKaraokeMode) {
    abcView.style.display = 'none';
    karaokeView.style.display = 'flex';
    toggleBtn.innerText = '✍️ Viết ABC';
    // Re-render to ensure karaoke sheet sizing is correct when becoming visible
    renderSheetMusic();
  } else {
    abcView.style.display = 'flex';
    karaokeView.style.display = 'none';
    toggleBtn.innerText = '🎵 Xem Sheet Nhạc';
    // Stop playback if switching away
    if (synthControl) synthControl.stop();
    if(document.getElementById(playBtnId)) document.getElementById(playBtnId).style.display = 'block';
    if(document.getElementById(stopBtnId)) document.getElementById(stopBtnId).style.display = 'none';
  }
});

// --- Karaoke Playback & Cursor Control ---
let synthControl = null;
let currentTempo = 100; // default 100%

// A simplified cursor control that adds a CSS class to the active notes
function CursorControl(rootSelector, playBtnId = 'play-btn', stopBtnId = 'stop-btn') {
    this.onStart = function() {
        this.clearSelection();
    };
    
    this.onEvent = function(ev) {
        this.clearSelection();
        if (ev === null || ev === undefined) {
            // Playback finished naturally
            if(document.getElementById(playBtnId)) document.getElementById(playBtnId).style.display = 'block';
            if(document.getElementById(stopBtnId)) document.getElementById(stopBtnId).style.display = 'none';
            return;
        }
        if (ev.elements) {
            for (let i = 0; i < ev.elements.length; i++) {
                const noteElems = ev.elements[i];
                for (let j = 0; j < noteElems.length; j++) {
                    noteElems[j].classList.add("abcjs-highlight");
                }
            }
        }
    };
    
    this.onFinished = function() {
        this.clearSelection();
        // Reset play button
        if(document.getElementById(playBtnId)) document.getElementById(playBtnId).style.display = 'block';
        if(document.getElementById(stopBtnId)) document.getElementById(stopBtnId).style.display = 'none';
    };

    this.clearSelection = function() {
        const lastSelection = document.querySelectorAll(rootSelector + " .abcjs-highlight");
        for (let i = 0; i < lastSelection.length; i++) {
            lastSelection[i].classList.remove("abcjs-highlight");
        }
    }
}

document.getElementById('play-btn').addEventListener('click', () => {
    if (!abcjs.synth.supportsAudio()) {
        alert("Trình duyệt không hỗ trợ Audio!");
        return;
    }
    
    document.getElementById('play-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'block';
    
    const cursorControl = new CursorControl("#karaoke-paper");
    
    synthControl = new abcjs.synth.CreateSynth();
    // Calculate tempo multiplier from slider (50% to 200%)
    const tempoMultiplier = currentTempo / 100;
    
    // Find the default millisecondsPerMeasure from the visual object
    // If not found, use a default
    let defaultMpm = 1000;
    if (currentVisualObj[0].getBeatLength) {
        // Just let abcjs figure it out, we will use the audioContext playbackRate hack below, 
        // or just let it play at default if complex.
    }
    
    synthControl.init({ 
        visualObj: currentVisualObj[0],
        options: {
            cursorControl: cursorControl,
            onEnded: function() {
                // Playback finished naturally
                if(document.getElementById(playBtnId)) document.getElementById(playBtnId).style.display = 'block';
                if(document.getElementById(stopBtnId)) document.getElementById(stopBtnId).style.display = 'none';
                
                // Clear highlights
                const lastSelection = document.querySelectorAll("#karaoke-paper .abcjs-highlight");
                for (let i = 0; i < lastSelection.length; i++) {
                    lastSelection[i].classList.remove("abcjs-highlight");
                }
            }
        }
    }).then(() => {
        synthControl.prime().then(() => {
            // Apply tempo multiplier to the internal audioContext if available
            if (synthControl.audioContext && synthControl.audioContext.state !== 'closed') {
                // Not standard, but sometimes we can just change the audioContext rate? No.
            }
            synthControl.start();
        });
    });
});

document.getElementById('stop-btn').addEventListener('click', () => {
    if (synthControl) synthControl.stop();
    if(document.getElementById(playBtnId)) document.getElementById(playBtnId).style.display = 'block';
    if(document.getElementById(stopBtnId)) document.getElementById(stopBtnId).style.display = 'none';
    
    // Clear highlights manually just in case
    const lastSelection = document.querySelectorAll("#karaoke-paper .abcjs-highlight");
    for (let i = 0; i < lastSelection.length; i++) {
        lastSelection[i].classList.remove("abcjs-highlight");
    }
});

// Tempo slider
document.getElementById('tempo-slider').addEventListener('input', (e) => {
    currentTempo = e.target.value;
    document.getElementById('tempo-value').innerText = currentTempo;
    
    // Re-render karaoke sheet to apply new tempo
    renderSheetMusic();
    
    if (synthControl && synthControl.audioContext && synthControl.audioContext.state === 'running') {
        // If already playing, stop and restart with new tempo
        synthControl.stop();
        document.getElementById('play-btn').click();
    }
});

// --- Image Upload Logic ---
const uploadPrompt = document.getElementById('upload-prompt');
const imageUpload = document.getElementById('image-upload');
const uploadedImage = document.getElementById('uploaded-image');
const imageContainer = document.getElementById('image-container');

uploadPrompt.addEventListener('click', () => {
  imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadImage(file);
  }
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage.src = e.target.result;
      uploadedImage.style.display = 'block';
      uploadPrompt.style.display = 'none';
      imageContainer.style.justifyContent = 'flex-start';
    };
    reader.readAsDataURL(file);
}

// Handle Drag and Drop for Image
imageContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadPrompt.style.background = 'rgba(78, 205, 196, 0.2)';
});
imageContainer.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadPrompt.style.background = 'rgba(78, 205, 196, 0.05)';
});
imageContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadPrompt.style.background = 'rgba(78, 205, 196, 0.05)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  }
});



// --- Tab Switching Logic ---
document.getElementById('tab-btn-write').addEventListener('click', () => {
    document.getElementById('tab-btn-write').classList.add('active');
    document.getElementById('tab-btn-listen').classList.remove('active');
    document.getElementById('tab-write').style.display = 'flex';
    document.getElementById('tab-listen').style.display = 'none';
});

document.getElementById('tab-btn-listen').addEventListener('click', () => {
    document.getElementById('tab-btn-listen').classList.add('active');
    document.getElementById('tab-btn-write').classList.remove('active');
    document.getElementById('tab-listen').style.display = 'flex';
    document.getElementById('tab-write').style.display = 'none';
    // window.drawSheet();
});

// A basic regex parser to convert simple ABC to JSON for the studio engine





// --- STUDIO TAB LOGIC (OPTION A) ---
let studioVisualObj = null;
let studioAudioVisualObj = null;
let studioSynthControl = null;
let studioTimingCallbacks = null;

window.renderStudioSheet = function() {
    const abcCode = document.getElementById('abc-code').value;
    let studioAbc = abcCode;
    let studioAudioAbc = abcCode;
    
    // Inject Tempo
    const currentTempo = document.getElementById('studioTempo') ? parseInt(document.getElementById('studioTempo').value) : 100;
    const newTempo = Math.round(120 * (currentTempo / 100));
    
    if (!studioAbc.match(/^Q:/m)) {
        studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\nQ: 1/4=' + newTempo);
        studioAudioAbc = studioAudioAbc.replace(/^(K:.*)$/m, '$1\nQ: 1/4=' + newTempo);
    } else {
        studioAbc = studioAbc.replace(/^Q:.*$/m, 'Q: 1/4=' + newTempo);
        studioAudioAbc = studioAudioAbc.replace(/^Q:.*$/m, 'Q: 1/4=' + newTempo);
    }
    
    // Visual ABC: just the melody
    studioVisualObj = abcjs.renderAbc('studio-abc-paper', studioAbc, {
        add_classes: true,
        responsive: 'resize'
    });
    
    // Audio ABC: Melody + Injected Accompaniment
    if (window.generateAccompaniment) {
        studioAudioAbc = window.generateAccompaniment(studioAudioAbc);
    }
    
    // Inject Instrument for Melody
    const instrumentId = document.getElementById('studioInstrument') ? document.getElementById('studioInstrument').value : '0';
    if (studioAudioAbc.includes('V:1 name="Melody"')) {
        studioAudioAbc = studioAudioAbc.replace('V:1 name="Melody"\n', 'V:1 name="Melody"\n%%MIDI program ' + instrumentId + '\n');
    } else {
        if (!studioAudioAbc.match(/^%%MIDI program/m)) {
            studioAudioAbc = studioAudioAbc.replace(/^(K:.*)$/m, '$1\n%%MIDI program ' + instrumentId);
        } else {
            studioAudioAbc = studioAudioAbc.replace(/^%%MIDI program.*$/m, '%%MIDI program ' + instrumentId);
        }
    }
    
    // Render Audio ABC to hidden div
    studioAudioVisualObj = abcjs.renderAbc('hidden-audio-paper', studioAudioAbc, {
        add_classes: true
    });
};

window.toggleStudioPlay = function() {
    if (!abcjs.synth.supportsAudio()) {
        alert('Trình duyệt không hỗ trợ Audio!');
        return;
    }
    
    document.getElementById('studioPlayBtn').style.display = 'none';
    document.getElementById('studioStopBtn').style.display = 'block';
    
    const cursorControl = new CursorControl('#studio-abc-paper', 'studioPlayBtn', 'studioStopBtn');
    studioSynthControl = new abcjs.synth.CreateSynth();
    
    // Use studioVisualObj[0] for timing/highlighting (Visual)
    studioTimingCallbacks = new abcjs.TimingCallbacks(studioVisualObj[0], {
        eventCallback: function(ev) {
            cursorControl.onEvent(ev);
        }
    });

    // Use studioAudioVisualObj[0] for actual sound generation (Audio)
    studioSynthControl.init({ 
        visualObj: studioAudioVisualObj[0],
        options: {
            onEnded: function() {
                document.getElementById('studioPlayBtn').style.display = 'block';
                document.getElementById('studioStopBtn').style.display = 'none';
                
                const lastSelection = document.querySelectorAll('#studio-abc-paper .abcjs-highlight');
                for (let i = 0; i < lastSelection.length; i++) {
                    lastSelection[i].classList.remove('abcjs-highlight');
                }
                if(studioTimingCallbacks) studioTimingCallbacks.stop();
            }
        }
    }).then(() => {
        studioSynthControl.prime().then(() => {
            studioSynthControl.start();
            if(studioTimingCallbacks) studioTimingCallbacks.start();
        });
    });
};

window.stopStudioPlay = function() {
    if (studioSynthControl) studioSynthControl.stop();
    if (studioTimingCallbacks) studioTimingCallbacks.stop();
    
    document.getElementById('studioPlayBtn').style.display = 'block';
    document.getElementById('studioStopBtn').style.display = 'none';
    
    const lastSelection = document.querySelectorAll('#studio-abc-paper .abcjs-highlight');
    for (let i = 0; i < lastSelection.length; i++) {
        lastSelection[i].classList.remove('abcjs-highlight');
    }
};

// Add event listeners for volume sliders to update accompaniment dynamically
['volMelody', 'volChord', 'volBass', 'volDrum'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => {
            if (window.renderStudioSheet) window.renderStudioSheet();
            if (studioSynthControl && studioSynthControl.audioContext && studioSynthControl.audioContext.state === 'running') {
                window.stopStudioPlay();
                if(document.getElementById('studioPlayBtn')) document.getElementById('studioPlayBtn').click();
            }
        });
    }
});


// accompaniment.js
// Auto-generates Bass and Drum tracks based on chords in the ABC notation for audio synthesis.

window.generateAccompaniment = function(abcCode) {
    let lines = abcCode.split('\n');
    let header = [];
    let body = [];
    let inHeader = true;
    
    let timeSignature = '4/4';
    let beatsPerMeasure = 4;
    
    for (let line of lines) {
        if (inHeader) {
            header.push(line);
            if (line.startsWith('M:')) {
                timeSignature = line.substring(2).trim();
                if (timeSignature === '3/4') beatsPerMeasure = 3;
                else if (timeSignature === '2/4') beatsPerMeasure = 2;
                else if (timeSignature === '6/8') beatsPerMeasure = 2; 
                else beatsPerMeasure = 4;
            }
            if (line.startsWith('K:')) {
                inHeader = false; 
            }
        } else {
            body.push(line);
        }
    }
    
    let bodyText = body.join('\n');
    let measures = bodyText.split(/[:|\]]+/); 
    
    let bassTrack = [];
    let drumTrack = [];
    let currentChord = 'C'; 
    
    for (let m of measures) {
        if (m.trim() === '') continue;
        
        let chordMatch = m.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
        if (chordMatch) {
            currentChord = chordMatch[1];
        }
        
        let root = currentChord.charAt(0);
        let accidental = currentChord.length > 1 && (currentChord[1] === '#' || currentChord[1] === 'b') ? currentChord[1] : '';
        let bassNote = root + accidental + ',,'; 
        
        let bassMeasure = '';
        let drumMeasure = '';
        
        if (beatsPerMeasure === 4) {
            bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`;
            drumMeasure = `[C,2] [D,2]`; // Kick Snare
        } else if (beatsPerMeasure === 3) {
            bassMeasure = `${bassNote} ${bassNote} ${bassNote}`;
            drumMeasure = `[C,] [D,] [D,]`; 
        } else if (beatsPerMeasure === 2) {
            bassMeasure = `${bassNote}2`;
            drumMeasure = `[C,D,]`;
        }
        
        bassTrack.push(bassMeasure);
        drumTrack.push(drumMeasure);
    }
    
    const volMelody = document.getElementById('volMelody') ? document.getElementById('volMelody').value : 100;
    const volChord = document.getElementById('volChord') ? document.getElementById('volChord').value : 80;
    const volBass = document.getElementById('volBass') ? document.getElementById('volBass').value : 80;
    const volDrum = document.getElementById('volDrum') ? document.getElementById('volDrum').value : 100;
    
    let newAbc = header.join('\n') + '\n';
    newAbc += 'V:1 name="Melody"\n';
    newAbc += `%%MIDI control 7 ${Math.round(volMelody * 1.27)}\n`;
    newAbc += `%%MIDI chordvol ${Math.round(volChord * 1.27)}\n`;
    newAbc += bodyText + '\n\n';
    
    newAbc += 'V:2 name="Bass" clef=bass\n';
    newAbc += 'L:1/4\n';
    newAbc += '%%MIDI program 33\n';
    newAbc += `%%MIDI control 7 ${Math.round(volBass * 1.27)}\n`;
    newAbc += bassTrack.join(' | ') + ' |]\n\n';
    
    newAbc += 'V:3 name="Drums" clef=perc\n';
    newAbc += 'L:1/4\n';
    newAbc += '%%MIDI channel 10\n';
    newAbc += `%%MIDI control 7 ${Math.round(volDrum * 1.27)}\n`;
    newAbc += drumTrack.join(' | ') + ' |]\n';
    
    return newAbc;
};


// accompaniment.js
// Auto-generates Bass and Drum tracks based on chords in the ABC notation for audio synthesis.

window.generateAccompaniment = function(abcCode) {
    let lines = abcCode.split('\n');
    let header = [];
    let body = [];
    let inHeader = true;
    
    let timeSignature = '4/4';
    let beatsPerMeasure = 4;
    
    for (let line of lines) {
        if (inHeader) {
            header.push(line);
            if (line.startsWith('M:')) {
                timeSignature = line.substring(2).trim();
                if (timeSignature === '3/4') beatsPerMeasure = 3;
                else if (timeSignature === '2/4') beatsPerMeasure = 2;
                else if (timeSignature === '6/8') beatsPerMeasure = 2; 
                else beatsPerMeasure = 4;
            }
            if (line.startsWith('K:')) {
                inHeader = false; 
            }
        } else {
            body.push(line);
        }
    }
    
    let bodyText = body.join('\n');
    let measures = bodyText.split(/[:|\]]+/); 
    
    let bassTrack = [];
    let drumTrack = [];
    let currentChord = 'C'; 
    
    for (let m of measures) {
        if (m.trim() === '') continue;
        
        let chordMatch = m.match(/"([A-Ga-g][#b]?[a-zA-Z0-9]*)"/);
        if (chordMatch) {
            currentChord = chordMatch[1];
        }
        
        let root = currentChord.charAt(0);
        let accidental = currentChord.length > 1 && (currentChord[1] === '#' || currentChord[1] === 'b') ? currentChord[1] : '';
        let bassNote = root + accidental + ',,'; 
        
        let bassMeasure = '';
        let drumMeasure = '';
        
        if (beatsPerMeasure === 4) {
            bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`;
            drumMeasure = `[C,^F,] D, [C,^F,] D,`; 
        } else if (beatsPerMeasure === 3) {
            bassMeasure = `${bassNote} ${bassNote} ${bassNote}`;
            drumMeasure = `[C,^F,] D, D,`; 
        } else if (beatsPerMeasure === 2) {
            bassMeasure = `${bassNote} ${bassNote}`;
            drumMeasure = `[C,^F,] D,`;
        }
        
        bassTrack.push(bassMeasure);
        drumTrack.push(drumMeasure);
    }
    
    const volMelody = document.getElementById('volMelody') ? document.getElementById('volMelody').value : 100;
    const volChord = document.getElementById('volChord') ? document.getElementById('volChord').value : 80;
    const volBass = document.getElementById('volBass') ? document.getElementById('volBass').value : 80;
    const volDrum = document.getElementById('volDrum') ? document.getElementById('volDrum').value : 100;
    
    let newAbc = header.join('\n') + '\n';
    newAbc += 'V:1 name="Melody"\n';
    newAbc += `%%MIDI control 7 ${Math.round(volMelody * 1.27)}\n`;
    newAbc += `%%MIDI chordvol ${Math.round(volChord * 1.27)}\n`;
    newAbc += bodyText + '\n\n';
    
    newAbc += 'V:2 name="Bass" clef=bass\n';
    newAbc += 'L:1/4\n';
    newAbc += '%%MIDI program 33\n';
    newAbc += `%%MIDI control 7 ${Math.round(volBass * 1.27)}\n`;
    newAbc += bassTrack.join(' | ') + ' |]\n\n';
    
    newAbc += 'V:3 name="Drums" clef=perc\n';
    newAbc += 'L:1/4\n';
    newAbc += '%%MIDI channel 10\n';
    newAbc += `%%MIDI control 7 ${Math.round(volDrum * 1.27)}\n`;
    newAbc += drumTrack.join(' | ') + ' |]\n';
    
    return newAbc;
};
