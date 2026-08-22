const fs = require('fs');
const file = 'C:/Users/DT.HANG/Downloads/piano solo/main.js';
let content = fs.readFileSync(file, 'utf8');

// Strip out anything after "// --- Tab Switching Logic ---" and rebuild the whole Studio block
let stripIndex = content.indexOf('// --- STUDIO TAB LOGIC');
if (stripIndex !== -1) {
    content = content.substring(0, stripIndex);
}

const studioLogic = `
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
        studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\\nQ: 1/4=' + newTempo);
        studioAudioAbc = studioAudioAbc.replace(/^(K:.*)$/m, '$1\\nQ: 1/4=' + newTempo);
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
        studioAudioAbc = studioAudioAbc.replace('V:1 name="Melody"\\n', 'V:1 name="Melody"\\n%%MIDI program ' + instrumentId + '\\n');
    } else {
        if (!studioAudioAbc.match(/^%%MIDI program/m)) {
            studioAudioAbc = studioAudioAbc.replace(/^(K:.*)$/m, '$1\\n%%MIDI program ' + instrumentId);
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
`;

fs.writeFileSync(file, content + studioLogic);
console.log('Patched main.js successfully.');
