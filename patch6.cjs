const fs = require('fs');
const file = 'C:/Users/DT.HANG/Downloads/piano solo/main.js';
let content = fs.readFileSync(file, 'utf8');

const targetFunctionStart = "// --- Karaoke Playback & Cursor Control ---";
const targetFunctionEnd = "// --- Image Upload Logic ---";

let startIndex = content.indexOf(targetFunctionStart);
let endIndex = content.indexOf(targetFunctionEnd);

if (startIndex !== -1 && endIndex !== -1) {
    let before = content.substring(0, startIndex);
    let after = content.substring(endIndex);
    
    let replacement = `// --- Karaoke Playback & Cursor Control ---
let synthControl = null;
let timingCallbacks = null;
let currentTempo = 100; // default 100%

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
});\n\n`;

    content = before + replacement + after;
    fs.writeFileSync(file, content);
    console.log("Patched karaoke playback logic.");
} else {
    console.log("Could not find markers.");
}
