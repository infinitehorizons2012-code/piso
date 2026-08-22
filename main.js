import * as AccompEngine from './accompaniment-engine.js';
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
let currentTempo = 100; // default 100%

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
let timingCallbacks = null;


function CursorControl(rootSelector, playBtnId = 'play-btn', stopBtnId = 'stop-btn') {
    this.onStart = function() {
        this.clearSelection();
    };
    
    this.onEvent = function(ev) {
        this.clearSelection();
        if (ev === null || ev === undefined) {
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
    
    const cursorControl = new CursorControl("#karaoke-paper", "play-btn", "stop-btn");
    
    synthControl = new abcjs.synth.CreateSynth();
    
    timingCallbacks = new abcjs.TimingCallbacks(currentVisualObj[0], {
        eventCallback: function(ev) {
            cursorControl.onEvent(ev);
        }
    });
    
    synthControl.init({ 
        visualObj: currentVisualObj[0],
        options: {
            onEnded: function() {
                document.getElementById('play-btn').style.display = 'block';
                document.getElementById('stop-btn').style.display = 'none';
                
                const lastSelection = document.querySelectorAll("#karaoke-paper .abcjs-highlight");
                for (let i = 0; i < lastSelection.length; i++) {
                    lastSelection[i].classList.remove("abcjs-highlight");
                }
                if(timingCallbacks) timingCallbacks.stop();
            }
        }
    }).then(() => {
        synthControl.prime().then(() => {
            synthControl.start();
            if(timingCallbacks) timingCallbacks.start();
        });
    });
});

document.getElementById('stop-btn').addEventListener('click', () => {
    if (synthControl) synthControl.stop();
    if (timingCallbacks) timingCallbacks.stop();
    
    document.getElementById('play-btn').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'none';
    
    const lastSelection = document.querySelectorAll("#karaoke-paper .abcjs-highlight");
    for (let i = 0; i < lastSelection.length; i++) {
        lastSelection[i].classList.remove("abcjs-highlight");
    }
});

// Tempo slider
document.getElementById('tempo-slider').addEventListener('input', (e) => {
    currentTempo = e.target.value;
    document.getElementById('tempo-value').innerText = currentTempo;
    
    renderSheetMusic();
    
    if (synthControl && synthControl.audioContext && synthControl.audioContext.state === 'running') {
        document.getElementById('stop-btn').click();
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
// --- TAB SWITCHING LOGIC ---
const tabs = ['tab-btn-library', 'tab-btn-write', 'tab-btn-listen'];
const panels = ['tab-library', 'tab-write', 'tab-listen'];

function switchTab(activeTabId, activePanelId) {
    tabs.forEach(tabId => {
        const el = document.getElementById(tabId);
        if (el) {
            if (tabId === activeTabId) el.classList.add('active');
            else el.classList.remove('active');
        }
    });
    panels.forEach(panelId => {
        const el = document.getElementById(panelId);
        if (el) {
            if (panelId === activePanelId) el.style.display = panelId === 'tab-library' ? 'block' : 'flex';
            else el.style.display = 'none';
        }
    });
}

document.getElementById('tab-btn-library')?.addEventListener('click', () => {
    switchTab('tab-btn-library', 'tab-library');
    window.fetchLibrary();
});

document.getElementById('tab-btn-write')?.addEventListener('click', () => {
    switchTab('tab-btn-write', 'tab-write');
});

document.getElementById('tab-btn-listen')?.addEventListener('click', () => {
    switchTab('tab-btn-listen', 'tab-listen');
});

// --- CLOUDFLARE LIBRARY API ---
const CF_WORKER_URL = 'https://piano-library.infinite-horizons-2012.workers.dev'; // User needs to update this

window.fetchLibrary = async function() {
    const listEl = document.getElementById('library-list');
    if (!listEl) return;
    listEl.innerHTML = '<p style="text-align: center; color: #888;">Đang tải danh sách...</p>';
    
    try {
        // In real app, fetch from CF_WORKER_URL + '/api/songs'
        // For now, if URL is dummy, simulate error/mock
        if (CF_WORKER_URL.includes('YOU.workers.dev')) {
            throw new Error("Vui lòng thay thế CF_WORKER_URL trong main.js bằng URL của Worker bạn đã deploy.");
        }
        const res = await fetch(CF_WORKER_URL + '/api/songs');
        const songs = await res.json();
        
        listEl.innerHTML = '';
        if (songs.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #888;">Thư viện trống.</p>';
            return;
        }
        
        songs.forEach(song => {
            const div = document.createElement('div');
            div.style = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
            
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <h3 style="margin: 0; font-size: 16px;">${song.title}</h3>
                <small style="color: #666;">${new Date(song.createdAt).toLocaleString()}</small>
            `;
            
            const btn = document.createElement('button');
            btn.className = 'ctrl-btn play';
            btn.style = 'font-size: 13px; padding: 5px 15px;';
            btn.innerText = 'Tải vào Editor';
            btn.onclick = () => window.loadSong(song.abc);
            
            div.appendChild(infoDiv);
            div.appendChild(btn);
            listEl.appendChild(div);
        });
    } catch (err) {
        listEl.innerHTML = `<p style="text-align: center; color: red;">Lỗi tải dữ liệu: ${err.message}</p>`;
    }
};

window.loadSong = function(abc) {
    document.getElementById('abc-code').value = abc;
    switchTab('tab-btn-write', 'tab-write');
    // Trigger input event to re-render sheet
    document.getElementById('abc-code').dispatchEvent(new Event('input'));
};

window.saveToCloud = async function() {
    const abc = document.getElementById('abc-code').value.trim();
    if (!abc) return alert("Không có dữ liệu ABC để lưu!");
    
    let title = "Bản nhạc không tên";
    const titleMatch = abc.match(/^T:\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1];
    else {
        title = prompt("Nhập tên bản nhạc:", "Bản nhạc mới");
        if (!title) return;
    }
    
    try {
        if (CF_WORKER_URL.includes('YOU.workers.dev')) {
            return alert("Vui lòng thay thế CF_WORKER_URL trong main.js bằng URL của Worker bạn đã deploy.");
        }
        const res = await fetch(CF_WORKER_URL + '/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, abc })
        });
        
        if (res.ok) {
            alert("Đã lưu bản nhạc thành công lên Cloud!");
        } else {
            alert("Lỗi khi lưu bản nhạc.");
        }
    } catch (err) {
        alert("Lỗi mạng: " + err.message);
    }
};

// A basic regex parser to convert simple ABC to JSON for the studio engine





// --- STUDIO TAB LOGIC (OPTION A) ---
import { initFullBandAudio, updateFullBandVolumes } from './fullband-synth.js';

let studioVisualObj = null;
let studioAudioVisualObj = null;
let studioSynthControl = null;
let abcjsAudioCtx = null;
let melodyMasterGain = null;
let proxyAudioCtx = null;

// Initialize custom audio context and proxy for abcjs
function initAbcjsAudioContext() {
    if (!abcjsAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        abcjsAudioCtx = new AudioContext();
        melodyMasterGain = abcjsAudioCtx.createGain();
        melodyMasterGain.gain.value = document.getElementById('volMelody') ? parseFloat(document.getElementById('volMelody').value) * 3.0 : 3.0;
        melodyMasterGain.connect(abcjsAudioCtx.destination);
        
        proxyAudioCtx = new Proxy(abcjsAudioCtx, {
            get: function(target, prop) {
                if (prop === 'destination') return melodyMasterGain;
                const val = target[prop];
                return typeof val === 'function' ? val.bind(target) : val;
            }
        });
    }
    if (abcjsAudioCtx.state === 'suspended') {
        abcjsAudioCtx.resume();
    }
}
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
    
    window.studioAbcString = studioAbc;
    
    // Visual ABC: just the melody
    studioVisualObj = abcjs.renderAbc('studio-abc-paper', studioAbc, {
        add_classes: true,
        responsive: 'resize'
    });
    
    // Inject Instrument
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

let volumeTimeout = null;
window.updateVolumes = function() {
    import('./fullband-synth.js').then(module => {
        module.updateFullBandVolumes();
    });
    if (melodyMasterGain) {
        const volMelody = document.getElementById('volMelody') ? parseFloat(document.getElementById('volMelody').value) : 1;
        // Map 0-1 slider to 0-3.0 gain (or up to 6.0 if needed, let's do 4.0 for extra headroom)
        melodyMasterGain.gain.value = volMelody * 4.0;
    }
    // Debounce to prevent stuttering while dragging slider
    if (volumeTimeout) clearTimeout(volumeTimeout);
    volumeTimeout = setTimeout(() => {
        AccompEngine.updateVolumes();
        window.renderStudioSheet();
        if (studioSynthControl && studioSynthControl.audioContext && studioSynthControl.audioContext.state === 'running') {
            window.stopStudioPlay();
            window.toggleStudioPlay();
        }
    }, 200);
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
            AccompEngine.handleEventCallback(ev);
        },
        beatCallback: function(beatNumber) {
            AccompEngine.handleBeatCallback(beatNumber);
        }
    });

    // Use studioAudioVisualObj[0] for actual sound generation (Audio)
    const volMelody = document.getElementById('volMelody') ? parseFloat(document.getElementById('volMelody').value) : 1;
    
    initAbcjsAudioContext();
    
    studioSynthControl.init({ 
        visualObj: studioAudioVisualObj[0],
        audioContext: proxyAudioCtx,
        options: {
            chordsOff: true,
            soundFontVolumeMultiplier: volMelody,
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
            AccompEngine.startAccompanimentEngine(document.getElementById('studioTempo').value);
            studioTimingCallbacks.start();
        }).catch(function (error) {
            console.error("Audio error", error);
        });
    });
};

window.stopStudioPlay = function() {
    AccompEngine.stopAccompanimentEngine();
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



window.exportToJson = function() {
    if (!studioVisualObj || !studioVisualObj[0]) {
        alert('Vui lòng Nhấn "Phát Nhạc" ít nhất 1 lần để hệ thống xử lý bản nhạc!');
        return;
    }

    const visualObj = studioVisualObj[0];
    const keySig = visualObj.getKeySignature ? visualObj.getKeySignature() : null;
    const keyAccidentals = {};
    if (keySig && keySig.accidentals) {
        keySig.accidentals.forEach(a => {
            if (a.note) keyAccidentals[a.note.toLowerCase()] = a.acc;
        });
    }

    const output = {
        title: visualObj.metaText.title || 'Bản Nhạc ABC',
        composer: visualObj.metaText.author || '',
        rhythmStyle: 'Pop',
        timeSignature: visualObj.getMeter ? (visualObj.getMeter().type || '4/4') : '4/4',
        bpm: visualObj.metaText.tempo ? visualObj.metaText.tempo.bpm : 100,
        drumPattern: 'pop',
        staves: []
    };

    let measureNum = 1;
    let currentChord = '';
    let currentMeasure = { measureNum, chord: currentChord, notes: [] };

    // Function to convert abcjs diatonic pitch to standard note name (e.g. 7 -> C5)
    function abcPitchToStandard(pitchVal, accidental, noteBaseName) {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        let normalized = pitchVal % 7;
        if (normalized < 0) normalized += 7;
        let noteName = notes[normalized];
        
        let finalAccidental = accidental;
        if (!finalAccidental && noteBaseName && keyAccidentals[noteBaseName.toLowerCase()]) {
            finalAccidental = keyAccidentals[noteBaseName.toLowerCase()];
        }

        if (finalAccidental === 'sharp') noteName += '#';
        else if (finalAccidental === 'flat') noteName += 'b';
        
        let octave = Math.floor(pitchVal / 7) + 4;
        return noteName + octave;
    }

    for (const line of visualObj.lines) {
        if (!line.staff) continue;
        const voice = line.staff[0].voices[0];
        
        for (const elem of voice) {
            if (elem.el_type === 'bar') {
                if (currentMeasure.notes.length > 0) {
                    output.staves.push(currentMeasure);
                }
                measureNum++;
                currentMeasure = { measureNum, chord: currentChord, notes: [] };
            } else if (elem.el_type === 'note') {
                if (elem.chord) {
                    currentChord = elem.chord[0].name;
                    currentMeasure.chord = currentChord;
                }
                
                let beatDuration = elem.duration * 4; 
                
                if (elem.rest) {
                    currentMeasure.notes.push({ type: 'rest', duration: beatDuration });
                } else {
                    let pitch = 'C4';
                    let solfege = '';
                    let tieToNext = false;
                    if (elem.pitches && elem.pitches.length > 0) {
                        let rawName = elem.pitches[0].name || '';
                        pitch = abcPitchToStandard(elem.pitches[0].pitch, elem.pitches[0].accidental, rawName);
                        // Optional: basic solfege guess (very naive)
                        let solfegeMap = { 'c': 'do', 'd': 're', 'e': 'mi', 'f': 'fa', 'g': 'sol', 'a': 'la', 'b': 'si' };
                        solfege = solfegeMap[rawName.toLowerCase().charAt(0)] || '';
                        
                        if (elem.pitches[0].startTie || elem.pitches[0].startSlur) {
                            tieToNext = true;
                        }
                    }

                    const noteObj = {
                        type: 'note',
                        pitch: pitch, 
                        duration: beatDuration,
                        lyric: elem.lyric ? elem.lyric[0].syllable : '',
                        solfege: solfege
                    };
                    if (tieToNext) noteObj.tieToNext = true;
                    
                    currentMeasure.notes.push(noteObj);
                }
            }
        }
    }
    
    if (currentMeasure.notes.length > 0) {
        output.staves.push(currentMeasure);
    }

    const resultBox = document.getElementById('jsonExportResult');
    if (resultBox) {
        resultBox.value = JSON.stringify(output, null, 2);
        resultBox.style.display = 'block';
        resultBox.select();
        document.execCommand('copy');
        alert('Đã tạo JSON và sao chép vào bộ nhớ tạm (Clipboard)! Bạn có thể dán vào Full Band Studio.');
    }
};



window.downloadMidi = function() {
    if (!studioAudioVisualObj || !studioAudioVisualObj[0]) {
        alert('Vui lòng Nhấn "Phát Nhạc" ít nhất 1 lần để hệ thống xử lý bản nhạc!');
        return;
    }

    try {
        // Generate MIDI data URI
        const midiDataUri = abcjs.synth.getMidiFile(studioAudioVisualObj[0], { midiOutputType: "encoded" });
        
        // Create an invisible download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = midiDataUri;
        
        // Use the title from the visual object if available
        let title = studioAudioVisualObj[0].metaText.title || "Ban_Nhac";
        a.download = title + ".mid";
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    } catch (e) {
        console.error("MIDI Export Error:", e);
        alert("Có lỗi xảy ra khi tạo file MIDI.");
    }
};
