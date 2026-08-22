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
    document.getElementById('play-btn').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'none';
  }
});

// --- Karaoke Playback & Cursor Control ---
let synthControl = null;
let currentTempo = 100; // default 100%

// A simplified cursor control that adds a CSS class to the active notes
function CursorControl(rootSelector) {
    this.onStart = function() {
        this.clearSelection();
    };
    
    this.onEvent = function(ev) {
        this.clearSelection();
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
        document.getElementById('play-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'none';
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
            cursorControl: cursorControl
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
    document.getElementById('play-btn').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'none';
    
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
