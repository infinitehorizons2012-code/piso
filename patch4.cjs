const fs = require('fs');
const file = 'C:/Users/DT.HANG/Downloads/piano solo/main.js';
let content = fs.readFileSync(file, 'utf8');

const targetFunction = 'window.renderStudioSheet = function() {';
const replacement = `window.renderStudioSheet = function() {
    const abcCode = document.getElementById('abc-code').value;
    let studioAbc = abcCode;
    
    if (window.generateAccompaniment) {
        studioAbc = window.generateAccompaniment(studioAbc);
    }
    
    // Inject Instrument (MIDI Program) for Melody (V:1)
    const instrumentId = document.getElementById('studioInstrument') ? document.getElementById('studioInstrument').value : '0';
    if (studioAbc.includes('V:1 name="Melody"')) {
        studioAbc = studioAbc.replace('V:1 name="Melody"\\n', 'V:1 name="Melody"\\n%%MIDI program ' + instrumentId + '\\n');
    } else {
        if (!studioAbc.match(/^%%MIDI program/m)) {
            studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\\n%%MIDI program ' + instrumentId);
        } else {
            studioAbc = studioAbc.replace(/^%%MIDI program.*$/m, '%%MIDI program ' + instrumentId);
        }
    }
    
    const currentTempo = document.getElementById('studioTempo') ? parseInt(document.getElementById('studioTempo').value) : 100;
    const newTempo = Math.round(120 * (currentTempo / 100));
    
    if (!studioAbc.match(/^Q:/m)) {
        studioAbc = studioAbc.replace(/^(K:.*)$/m, '$1\\nQ: 1/4=' + newTempo);
    } else {
        studioAbc = studioAbc.replace(/^Q:.*$/m, 'Q: 1/4=' + newTempo);
    }`;

// Find the function start and the line with abcjs.renderAbc
let startIndex = content.indexOf(targetFunction);
if (startIndex !== -1) {
    let renderIndex = content.indexOf('studioVisualObj = abcjs.renderAbc(', startIndex);
    if (renderIndex !== -1) {
        let before = content.substring(0, startIndex);
        let after = content.substring(renderIndex);
        content = before + replacement + '\n\n    ' + after;
        
        // Add event listeners for sliders
        content += `\n\n// Add event listeners for volume sliders to update accompaniment dynamically
['volMelody', 'volChord', 'volBass', 'volDrum'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => {
            if (window.renderStudioSheet) window.renderStudioSheet();
            if (studioSynthControl && studioSynthControl.audioContext && studioSynthControl.audioContext.state === 'running') {
                studioSynthControl.stop();
                if(document.getElementById('studioPlayBtn')) document.getElementById('studioPlayBtn').click();
            }
        });
    }
});
`;
        fs.writeFileSync(file, content);
        console.log('Patched renderStudioSheet successfully.');
    }
}
