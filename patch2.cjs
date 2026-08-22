const fs = require('fs');
const mainPath = 'C:/Users/DT.HANG/Downloads/piano solo/main.js';
let content = fs.readFileSync(mainPath, 'utf8');

// Remove the old parseABCToJSON and updateStudioFromABC
content = content.replace(/function parseABCToJSON[\s\S]*?function updateStudioFromABC[\s\S]*?}\r?\n}\r?\n/m, '');

const studioCode = `
// --- STUDIO TAB LOGIC (OPTION A) ---
let studioVisualObj = null;
let studioSynthControl = null;

window.renderStudioSheet = function() {
    const abcCode = document.getElementById('abc-code').value;
    let studioAbc = abcCode;
    
    // Inject Instrument (MIDI Program)
    const instrumentId = document.getElementById('studioInstrument') ? document.getElementById('studioInstrument').value : '0';
    if (!studioAbc.match(/^%%MIDI program/m)) {
        studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\\n%%MIDI program ' + instrumentId);
    } else {
        studioAbc = studioAbc.replace(/^%%MIDI program.*$/m, '%%MIDI program ' + instrumentId);
    }
    
    // Inject Tempo
    const tempoSlider = document.getElementById('studioTempo');
    const tempoPercent = tempoSlider ? parseInt(tempoSlider.value) : 100;
    const newTempo = Math.round(120 * (tempoPercent / 100));
    
    if (!studioAbc.match(/^Q:/m)) {
        studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\\nQ: 1/4=' + newTempo);
    } else {
        studioAbc = studioAbc.replace(/^Q:.*$/m, 'Q: 1/4=' + newTempo);
    }

    studioVisualObj = abcjs.renderAbc('studio-abc-paper', studioAbc, {
        add_classes: true,
        responsive: 'resize'
    });
};

window.toggleStudioPlay = function() {
    if (!abcjs.synth.supportsAudio()) {
        alert('Trình duyệt không hỗ trợ Audio!');
        return;
    }
    
    document.getElementById('studioPlayBtn').style.display = 'none';
    document.getElementById('studioStopBtn').style.display = 'block';
    
    const cursorControl = new CursorControl('#studio-abc-paper');
    studioSynthControl = new abcjs.synth.CreateSynth();
    
    studioSynthControl.init({ 
        visualObj: studioVisualObj[0],
        options: {
            cursorControl: cursorControl,
            onEnded: function() {
                document.getElementById('studioPlayBtn').style.display = 'block';
                document.getElementById('studioStopBtn').style.display = 'none';
                
                const lastSelection = document.querySelectorAll('#studio-abc-paper .abcjs-highlight');
                for (let i = 0; i < lastSelection.length; i++) {
                    lastSelection[i].classList.remove('abcjs-highlight');
                }
            }
        }
    }).then(() => {
        studioSynthControl.prime().then(() => {
            studioSynthControl.start();
        });
    });
};

window.stopStudioPlay = function() {
    if (studioSynthControl) studioSynthControl.stop();
    document.getElementById('studioPlayBtn').style.display = 'block';
    document.getElementById('studioStopBtn').style.display = 'none';
    
    const lastSelection = document.querySelectorAll('#studio-abc-paper .abcjs-highlight');
    for (let i = 0; i < lastSelection.length; i++) {
        lastSelection[i].classList.remove('abcjs-highlight');
    }
};

if (document.getElementById('studioTempo')) {
    document.getElementById('studioTempo').addEventListener('input', (e) => {
        window.renderStudioSheet();
        if (studioSynthControl && studioSynthControl.audioContext && studioSynthControl.audioContext.state === 'running') {
            studioSynthControl.stop();
            document.getElementById('studioPlayBtn').click();
        }
    });
}
`;

// Hook into tab listen click to call window.renderStudioSheet() instead of updateStudioFromABC()
content = content.replace(/updateStudioFromABC\(\);/g, 'if(window.renderStudioSheet) window.renderStudioSheet();');
content = content.replace(/if\(window\.drawSheet\)/g, '//');
content = content.replace(/if \(typeof window.drawSheet === 'function'\) window.drawSheet\(\);/g, '');

fs.writeFileSync(mainPath, content + '\n' + studioCode);
console.log('Main.js updated for Option A');
