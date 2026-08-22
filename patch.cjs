const fs = require('fs');
const mainPath = 'C:/Users/DT.HANG/Downloads/piano solo/main.js';
const studioPath = 'C:/Users/DT.HANG/Downloads/piano solo/studio.js';
let mainJs = fs.readFileSync(mainPath, 'utf8');
let studioJs = fs.readFileSync(studioPath, 'utf8');

const tabLogic = `
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
    if(window.drawSheet) window.drawSheet();
});

// A basic regex parser to convert simple ABC to JSON for the studio engine
function parseABCToJSON(abcCode) {
    let song = {
        title: "Tự Chọn (Từ ABC)",
        composer: "",
        rhythmStyle: "ABC",
        timeSignature: "4/4",
        bpm: 100,
        drumPattern: "swing",
        staves: []
    };

    let lines = abcCode.split('\\n');
    let currentMeasure = 1;
    let measureNotes = [];
    let currentChord = "";
    
    lines.forEach(line => {
        if(line.startsWith('T:')) song.title = line.substring(2).trim();
        else if(line.match(/^Q:/)) {
            let match = line.match(/\\d+/g);
            if(match && match.length > 0) song.bpm = parseInt(match[match.length-1]);
        }
        else if(!line.match(/^[a-zA-Z]:/) && line.trim().length > 0) {
            let parts = line.split('|');
            parts.forEach(part => {
                if(!part.trim()) return;
                
                let chordMatch = part.match(/"([^"]+)"/);
                if(chordMatch) currentChord = chordMatch[1];
                
                let noteMatch = part.match(/([a-gA-Gz])([',]*)([1-9]*(\\/2)?)/g);
                if(noteMatch) {
                    noteMatch.forEach(n => {
                        let baseChar = n.charAt(0);
                        let isRest = (baseChar.toLowerCase() === 'z');
                        let duration = 0.5; // default 8th note
                        if(n.includes('2')) duration = 1.0;
                        if(n.includes('3')) duration = 1.5;
                        if(n.includes('4')) duration = 2.0;
                        if(n.includes('/2')) duration = 0.25;
                        
                        let pitch = "";
                        if(!isRest) {
                            let noteLetter = baseChar.toUpperCase();
                            let octave = 4;
                            if(baseChar === baseChar.toLowerCase()) octave = 5;
                            if(n.includes("'")) octave++;
                            if(n.includes(",")) octave--;
                            pitch = noteLetter + octave;
                        }
                        
                        measureNotes.push({ pitch: pitch, duration: duration, type: isRest? "rest" : "note" });
                    });
                }
                song.staves.push({ measureNum: currentMeasure++, chord: currentChord, notes: measureNotes });
                measureNotes = [];
                currentChord = "";
            });
        }
    });
    
    // Fallback if empty
    if(song.staves.length === 0) {
        song.staves.push({ measureNum:1, chord:"C", notes:[{pitch:"C4", duration:1.0, type:"note"}] });
    }
    return song;
}

function updateStudioFromABC() {
    if(typeof window.currentSong !== 'undefined') {
        const parsed = parseABCToJSON(document.getElementById('abc-code').value);
        window.currentSong = parsed;
        if(typeof window.drawSheet === 'function') window.drawSheet();
        if(document.getElementById('jsonEditor')) {
            document.getElementById('jsonEditor').value = JSON.stringify(parsed, null, 2);
        }
    }
}
`;

// Hook into existing listener
mainJs = mainJs.replace(/abcTextarea\.addEventListener\('input', \(\) => {[\s\S]*?renderSheetMusic\(\);/, 
`abcTextarea.addEventListener('input', () => {
  renderSheetMusic();
  updateStudioFromABC();`);

// Replace functions to window.functionName in studioJs
studioJs = studioJs.replace(/function loadPreset/g, 'window.loadPreset = function loadPreset');
studioJs = studioJs.replace(/function applyJsonEditor/g, 'window.applyJsonEditor = function applyJsonEditor');
studioJs = studioJs.replace(/function updateTempo/g, 'window.updateTempo = function updateTempo');
studioJs = studioJs.replace(/function changeDrumPattern/g, 'window.changeDrumPattern = function changeDrumPattern');
studioJs = studioJs.replace(/function changeInstrument/g, 'window.changeInstrument = function changeInstrument');
studioJs = studioJs.replace(/function initAudio/g, 'window.initAudio = function initAudio');
studioJs = studioJs.replace(/function updateVolumes/g, 'window.updateVolumes = function updateVolumes');
studioJs = studioJs.replace(/function togglePlay/g, 'window.togglePlay = function togglePlay');
studioJs = studioJs.replace(/function stopPlayback/g, 'window.stopPlayback = function stopPlayback');
studioJs = studioJs.replace(/function toggleRecording/g, 'window.toggleRecording = function toggleRecording');
studioJs = studioJs.replace(/function handleAudioUpload/g, 'window.handleAudioUpload = function handleAudioUpload');
studioJs = studioJs.replace(/function drawSheet/g, 'window.drawSheet = function drawSheet');

fs.writeFileSync(mainPath, mainJs + '\n\n' + tabLogic + '\n\n// --- STUDIO ENGINE ---\n' + studioJs, 'utf8');
console.log('Appended and exposed globals');
