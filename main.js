import * as AccompEngine from './accompaniment-engine.js';
import 'abcjs/abcjs-audio.css';
import './style.css';
import abcjs from 'abcjs';

window.abcjs = abcjs;
window.ABCJS = abcjs;

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

/* --- EDITOR SECTION TAB MANAGER --- */
let editorSections = [
    { id: 'total', title: '🌐 Tổng thể', isTotal: true },
    { id: 'sec_header', title: 'HEADER', content: 'X:1\nT:Bản Nhạc Của Bé\nM:4/4\nL:1/4\nK:C' },
    { id: 'sec_line1', title: 'DÒNG 1', content: 'C D E F | G A B c |' }
];
let activeTabId = 'total';

function parseAbcToSections(abcText) {
    if (!abcText) abcText = '';
    const lines = abcText.split('\n');
    const parsedSections = [];
    let currentTitle = null;
    let currentLines = [];
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Match 3-line header pattern: % === ... % TITLE ... % ===
        if (trimmed.startsWith('% ===') && i + 2 < lines.length && lines[i+1].trim().startsWith('%') && lines[i+2].trim().startsWith('% ===')) {
            if (currentTitle !== null || currentLines.length > 0) {
                const titleStr = currentTitle || 'HEADER';
                const cleanText = currentLines.filter(l => l.trim().length > 0).join('\n').trim();
                parsedSections.push({
                    id: 'sec_' + Date.now() + '_' + Math.floor(Math.random()*10000),
                    title: titleStr.toUpperCase(),
                    content: cleanText
                });
            }
            currentTitle = lines[i+1].trim().replace(/^%\s*/, '').trim();
            currentLines = [];
            i += 3;
            continue;
        }
        
        // Match single-line marker pattern: % HEADER or % DÒNG 1
        if (trimmed.match(/^%\s*(HEADER|DÒNG\s*\d+|DOAN\s*\d+|SECTION\s*\d+|ĐOẠN\s*\d+|ĐIỆP\s*KHÚC|LỜI\s*\d+)/i)) {
            if (currentTitle !== null || currentLines.length > 0) {
                const titleStr = currentTitle || 'HEADER';
                const cleanText = currentLines.filter(l => l.trim().length > 0).join('\n').trim();
                parsedSections.push({
                    id: 'sec_' + Date.now() + '_' + Math.floor(Math.random()*10000),
                    title: titleStr.toUpperCase(),
                    content: cleanText
                });
            }
            currentTitle = trimmed.replace(/^%\s*/, '').trim();
            currentLines = [];
            i++;
            continue;
        }
        
        currentLines.push(line);
        i++;
    }
    
    if (currentTitle !== null || currentLines.length > 0) {
        const titleStr = currentTitle || (parsedSections.length === 0 ? 'HEADER' : 'DÒNG 1');
        const cleanText = currentLines.filter(l => l.trim().length > 0).join('\n').trim();
        parsedSections.push({
            id: 'sec_' + Date.now() + '_' + Math.floor(Math.random()*10000),
            title: titleStr.toUpperCase(),
            content: cleanText
        });
    }
    
    // Auto-split header vs body if no markers found
    if (parsedSections.length <= 1) {
        const full = abcText.trim();
        const kIndex = full.search(/^K:.*$/m);
        if (kIndex !== -1) {
            const endOfK = full.indexOf('\n', kIndex);
            const headerPart = endOfK !== -1 ? full.substring(0, endOfK).trim() : full;
            const bodyPart = endOfK !== -1 ? full.substring(endOfK + 1).trim() : '';
            return [
                { id: 'total', title: '🌐 Tổng thể', isTotal: true },
                { id: 'sec_header', title: 'HEADER', content: headerPart.split('\n').filter(l => l.trim().length > 0).join('\n') },
                { id: 'sec_line1', title: 'DÒNG 1', content: bodyPart.split('\n').filter(l => l.trim().length > 0).join('\n') }
            ];
        }
    }
    
    return [
        { id: 'total', title: '🌐 Tổng thể', isTotal: true },
        ...parsedSections
    ];
}
window.parseAbcToSections = parseAbcToSections;

function combineSectionsToAbc() {
    let lines = [];
    editorSections.forEach(sec => {
        if (sec.isTotal) return;
        lines.push(`% ===============================`);
        lines.push(`% ${sec.title}`);
        lines.push(`% ===============================`);
        if (sec.content) {
            const cleanContentLines = sec.content
                .split('\n')
                .map(l => l.trimEnd())
                .filter(l => l.trim().length > 0);
            if (cleanContentLines.length > 0) {
                lines.push(...cleanContentLines);
            }
        }
    });
    return lines.join('\n');
}
window.combineSectionsToAbc = combineSectionsToAbc;

function syncCurrentEditorTab() {
    const abcEl = document.getElementById('abc-code');
    if (!abcEl) return;
    
    const activeSec = editorSections.find(s => s.id === activeTabId);
    if (!activeSec) return;
    
    if (activeSec.isTotal) {
        activeSec.content = combineSectionsToAbc();
        abcEl.value = activeSec.content;
    } else {
        abcEl.value = activeSec.content || '';
    }
}
window.syncCurrentEditorTab = syncCurrentEditorTab;

function onEditorInput() {
    const abcEl = document.getElementById('abc-code');
    if (!abcEl) return;
    const val = abcEl.value;
    
    const activeSec = editorSections.find(s => s.id === activeTabId);
    if (!activeSec) return;
    
    if (activeSec.isTotal) {
        activeSec.content = val;
        if (val.includes('% ===')) {
            editorSections = parseAbcToSections(val);
            renderEditorTabs();
        }
    } else {
        activeSec.content = val;
        const totalSec = editorSections.find(s => s.isTotal);
        if (totalSec) totalSec.content = combineSectionsToAbc();
    }
    
    renderSheetMusic();
    if (window.renderStudioSheet) window.renderStudioSheet();
}
window.onEditorInput = onEditorInput;

function switchEditorTab(tabId) {
    const abcEl = document.getElementById('abc-code');
    if (abcEl) {
        const currentSec = editorSections.find(s => s.id === activeTabId);
        if (currentSec) {
            currentSec.content = abcEl.value;
            if (!currentSec.isTotal) {
                const totalSec = editorSections.find(s => s.isTotal);
                if (totalSec) totalSec.content = combineSectionsToAbc();
            }
        }
    }
    
    activeTabId = tabId;
    renderEditorTabs();
    syncCurrentEditorTab();
}
window.switchEditorTab = switchEditorTab;

function renderEditorTabs() {
    const wrapper = document.getElementById('editor-tabs-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = '';
    editorSections.forEach(sec => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `editor-tab-btn ${sec.id === activeTabId ? 'active' : ''}`;
        btn.onclick = () => switchEditorTab(sec.id);
        
        btn.innerHTML = `<span>${sec.title}</span>`;
        
        if (!sec.isTotal && sec.title !== 'HEADER' && editorSections.length > 3) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close-icon';
            closeBtn.innerHTML = ' ✕';
            closeBtn.title = 'Xóa tab này';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                removeEditorTab(sec.id);
            };
            btn.appendChild(closeBtn);
        }
        
        wrapper.appendChild(btn);
    });
}
window.renderEditorTabs = renderEditorTabs;

function addNewEditorTab() {
    let nextNum = editorSections.filter(s => !s.isTotal && s.title !== 'HEADER').length + 1;
    let name = prompt("Nhập tên tab/dòng mới:", "DÒNG " + nextNum);
    if (!name || !name.trim()) return;
    
    name = name.trim().toUpperCase();
    switchEditorTab(activeTabId);
    
    const newSec = {
        id: 'sec_' + Date.now(),
        title: name,
        content: ''
    };
    
    editorSections.push(newSec);
    activeTabId = newSec.id;
    renderEditorTabs();
    syncCurrentEditorTab();
    
    const abcEl = document.getElementById('abc-code');
    if (abcEl) abcEl.focus();
}
window.addNewEditorTab = addNewEditorTab;

function removeEditorTab(tabId) {
    const sec = editorSections.find(s => s.id === tabId);
    if (!sec) return;
    if (confirm(`Bạn có chắc muốn xóa tab '${sec.title}'?`)) {
        editorSections = editorSections.filter(s => s.id !== tabId);
        if (activeTabId === tabId) {
            activeTabId = 'total';
        }
        renderEditorTabs();
        syncCurrentEditorTab();
        renderSheetMusic();
        if (window.renderStudioSheet) window.renderStudioSheet();
    }
}
window.removeEditorTab = removeEditorTab;

window.currentSheetScale = 1.0;
window.zoomSheet = function(delta) {
    window.currentSheetScale += delta;
    if (window.currentSheetScale < 0.4) window.currentSheetScale = 0.4;
    if (window.currentSheetScale > 3.0) window.currentSheetScale = 3.0;
    document.getElementById('abc-code').dispatchEvent(new Event('input'));
};

window.currentImageScale = 1.0;
window.zoomImage = function(delta) {
    window.currentImageScale += delta;
    if (window.currentImageScale < 0.2) window.currentImageScale = 0.2;
    if (window.currentImageScale > 5.0) window.currentImageScale = 5.0;
    document.getElementById('uploaded-image').style.transform = `scale(${window.currentImageScale})`;
};

window.currentTextSize = 14;
window.zoomText = function(delta) {
    window.currentTextSize += delta;
    if (window.currentTextSize < 8) window.currentTextSize = 8;
    if (window.currentTextSize > 32) window.currentTextSize = 32;
    document.getElementById('abc-code').style.fontSize = window.currentTextSize + 'px';
};

function renderSheetMusic() {
  const totalSec = (typeof editorSections !== 'undefined') ? editorSections.find(s => s.isTotal) : null;
  const abcCode = (totalSec && totalSec.content) ? totalSec.content : abcTextarea.value;
  let visualAbc = abcCode;
  try {
      if (abcCode.includes('"')) {
          let accomp = window.generateAccompaniment(abcCode);
          let v3Index = accomp.indexOf('V:3 name="Drums"');
          if (v3Index !== -1) accomp = accomp.substring(0, v3Index);
          accomp = accomp.replace(/V:1 name="Melody"/, "%%score {1 | 2}\nV:1 name=\"Melody\"");
          visualAbc = accomp;
      }
  } catch(e) {}
  
  // Render using abcjs for the left panel
  abcjs.renderAbc("paper", visualAbc, {
    add_classes: true,
    staffwidth: 700,
    scale: window.currentSheetScale
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

// Render on startup & initialize section tabs
editorSections = window.parseAbcToSections(abcTextarea.value);
window.renderEditorTabs();
window.syncCurrentEditorTab();
renderSheetMusic();

// Two-way binding (Text -> Sheet & Section Tabs)
abcTextarea.addEventListener('input', () => {
  window.onEditorInput();
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



// --- TAB SWITCHING LOGIC ---
const panels = ['tab-library', 'tab-write', 'tab-listen', 'tab-game', 'tab-piano-solo'];

window.closeAllDropdowns = function() {
    const writeWrapper = document.getElementById('dropdown-write-wrapper');
    const gameWrapper = document.getElementById('dropdown-game-wrapper');
    const pianoWrapper = document.getElementById('dropdown-piano-wrapper');
    if (writeWrapper) writeWrapper.classList.remove('open');
    if (gameWrapper) gameWrapper.classList.remove('open');
    if (pianoWrapper) pianoWrapper.classList.remove('open');
};

window.switchTab = function(activeTabId, activePanelId) {
    panels.forEach(panelId => {
        const el = document.getElementById(panelId);
        if (el) {
            if (panelId === activePanelId) {
                el.style.display = (panelId === 'tab-library' || panelId === 'tab-game' || panelId === 'tab-piano-solo') ? 'block' : 'flex';
            } else {
                el.style.display = 'none';
            }
        }
    });

    const writeWrapper = document.getElementById('dropdown-write-wrapper');
    const gameWrapper = document.getElementById('dropdown-game-wrapper');
    const pianoWrapper = document.getElementById('dropdown-piano-wrapper');

    if (activePanelId === 'tab-game') {
        if (gameWrapper) gameWrapper.classList.add('active');
        if (writeWrapper) writeWrapper.classList.remove('active');
        if (pianoWrapper) pianoWrapper.classList.remove('active');
    } else if (activePanelId === 'tab-piano-solo') {
        if (pianoWrapper) pianoWrapper.classList.add('active');
        if (writeWrapper) writeWrapper.classList.remove('active');
        if (gameWrapper) gameWrapper.classList.remove('active');
        if (window.initPianoSoloView) {
            window.initPianoSoloView();
        }
    } else {
        if (writeWrapper) writeWrapper.classList.add('active');
        if (gameWrapper) gameWrapper.classList.remove('active');
        if (pianoWrapper) pianoWrapper.classList.remove('active');
    }

    window.closeAllDropdowns();
};

document.addEventListener('DOMContentLoaded', () => {
    const writeWrapper = document.getElementById('dropdown-write-wrapper');
    const gameWrapper = document.getElementById('dropdown-game-wrapper');
    const pianoWrapper = document.getElementById('dropdown-piano-wrapper');
    const writeBtn = document.getElementById('dropdown-write-btn');
    const gameBtn = document.getElementById('dropdown-game-btn');
    const pianoBtn = document.getElementById('dropdown-piano-btn');

    if (writeBtn && writeWrapper) {
        writeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            writeWrapper.classList.toggle('open');
            if (gameWrapper) gameWrapper.classList.remove('open');
            if (pianoWrapper) pianoWrapper.classList.remove('open');
        });
    }

    if (gameBtn && gameWrapper) {
        gameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            gameWrapper.classList.toggle('open');
            if (writeWrapper) writeWrapper.classList.remove('open');
            if (pianoWrapper) pianoWrapper.classList.remove('open');
        });
    }

    if (pianoBtn && pianoWrapper) {
        pianoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pianoWrapper.classList.toggle('open');
            if (writeWrapper) writeWrapper.classList.remove('open');
            if (gameWrapper) gameWrapper.classList.remove('open');
        });
    }

    const btnTranspose = document.getElementById('btn-open-transpose');
    if (btnTranspose) {
        btnTranspose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.openTransposeModal();
        });
    }

    const btnSaveTransposed = document.getElementById('btn-save-transposed');
    if (btnSaveTransposed) {
        btnSaveTransposed.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.saveTransposedToCloud();
        });
    }

    document.addEventListener('click', (e) => {
        if (writeWrapper && !writeWrapper.contains(e.target)) {
            writeWrapper.classList.remove('open');
        }
        if (gameWrapper && !gameWrapper.contains(e.target)) {
            gameWrapper.classList.remove('open');
        }
    });
});

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

// --- CLOUDFLARE LIBRARY API WITH NESTED FOLDERS & INSTANT CACHE ---
const CF_WORKER_URL = 'https://piano-library.infinite-horizons-2012.workers.dev';

let libraryItemsCache = [];
let currentFolderPath = '/';

window.fetchLibrary = async function(forceRefresh = false) {
    const listEl = document.getElementById('library-list');
    if (!listEl) return;
    
    // 1. Instant Render from LocalStorage Cache (0ms Latency)
    const cachedData = localStorage.getItem('piso_library_cache');
    if (cachedData && !forceRefresh) {
        try {
            libraryItemsCache = JSON.parse(cachedData);
            window.renderLibraryCurrentView();
        } catch(e) {}
    } else if (!libraryItemsCache || libraryItemsCache.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">⚡ Đang tải danh sách từ Cloud...</p>';
    }
    
    // 2. Background Parallel Fetch from Cloud Worker
    try {
        if (CF_WORKER_URL.includes('YOU.workers.dev')) {
            throw new Error("Vui lòng thay thế CF_WORKER_URL trong main.js bằng URL của Worker bạn đã deploy.");
        }
        const res = await fetch(CF_WORKER_URL + '/api/songs');
        const data = await res.json();
        const songsList = Array.isArray(data) ? data : (data && Array.isArray(data.songs) ? data.songs : []);
        
        if (songsList) {
            // Merge with local unsynced cache if any
            let localCache = [];
            try {
                const c = localStorage.getItem('piso_library_cache');
                if (c) localCache = JSON.parse(c);
            } catch (e) {}

            const mergedMap = new Map();
            const existingCloudKeys = new Set();

            songsList.forEach(item => {
                if (!item) return;
                const key = item.id ? String(item.id) : `${(item.title || '').trim().toLowerCase()}_${item.folderPath || '/'}`;
                const titleKey = `${(item.title || '').trim().toLowerCase()}_${item.folderPath || '/'}`;
                mergedMap.set(key, item);
                existingCloudKeys.add(key);
                existingCloudKeys.add(titleKey);
            });

            if (Array.isArray(localCache)) {
                localCache.forEach(item => {
                    if (!item) return;
                    const itemKey = item.id ? String(item.id) : `${(item.title || '').trim().toLowerCase()}_${item.folderPath || '/'}`;
                    const titleKey = `${(item.title || '').trim().toLowerCase()}_${item.folderPath || '/'}`;
                    
                    if (!existingCloudKeys.has(itemKey) && !existingCloudKeys.has(titleKey)) {
                        mergedMap.set(itemKey, item);
                    }
                });
            }

            libraryItemsCache = Array.from(mergedMap.values());
            localStorage.setItem('piso_library_cache', JSON.stringify(libraryItemsCache));
            window.renderLibraryCurrentView();
            if (typeof window.populateWeek1LibraryDropdown === 'function') {
                window.populateWeek1LibraryDropdown();
            }
        }
    } catch (err) {
        if (!cachedData) {
            listEl.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Lỗi tải dữ liệu: ${err.message}</p>`;
        }
    }
};

window.renderLibraryCurrentView = function() {
    const listEl = document.getElementById('library-list');
    const breadcrumbEl = document.getElementById('library-breadcrumb');
    const searchVal = (document.getElementById('search-library')?.value || '').trim().toLowerCase();
    
    if (!listEl) return;
    
    // Render Breadcrumb Bar
    if (breadcrumbEl) {
        breadcrumbEl.innerHTML = '';
        const parts = currentFolderPath.split('/').filter(Boolean);
        
        const homeBtn = document.createElement('span');
        homeBtn.style = 'cursor: pointer; color: #2563eb; transition: all 0.2s;';
        homeBtn.innerHTML = '🏠 Gốc';
        homeBtn.onclick = () => window.navigateToFolder('/');
        breadcrumbEl.appendChild(homeBtn);
        
        let pathAccumulator = '';
        parts.forEach((part, index) => {
            pathAccumulator += '/' + part;
            const sep = document.createElement('span');
            sep.innerHTML = ' ❯ ';
            sep.style.color = '#94a3b8';
            breadcrumbEl.appendChild(sep);
            
            const partBtn = document.createElement('span');
            const targetPath = pathAccumulator;
            partBtn.style = `cursor: pointer; color: ${index === parts.length - 1 ? '#0f172a' : '#2563eb'}; font-weight: bold;`;
            partBtn.innerHTML = `📁 ${part}`;
            partBtn.onclick = () => window.navigateToFolder(targetPath);
            breadcrumbEl.appendChild(partBtn);
        });
    }
    
    listEl.innerHTML = '';
    
    // Filter items & auto-discover subfolders
    let displayItems = [];
    if (searchVal) {
        displayItems = libraryItemsCache.filter(item => 
            (item.title || item.name || '').toLowerCase().includes(searchVal)
        );
    } else {
        const subfolderNames = new Set();
        libraryItemsCache.forEach(item => {
            const itemFolder = item.folderPath || '/';
            if (itemFolder === currentFolderPath) {
                displayItems.push(item);
            } else if (itemFolder.startsWith(currentFolderPath === '/' ? '/' : currentFolderPath + '/')) {
                const relative = itemFolder.substring(currentFolderPath === '/' ? 1 : currentFolderPath.length + 1);
                const firstPart = relative.split('/')[0];
                if (firstPart) subfolderNames.add(firstPart);
            }
        });

        subfolderNames.forEach(subName => {
            if (!displayItems.some(i => i.title === subName)) {
                displayItems.push({
                    id: 'folder_' + subName,
                    title: subName,
                    type: 'folder',
                    folderPath: currentFolderPath
                });
            }
        });
    }
    
    // Show "Go Back" button if not in root
    if (currentFolderPath !== '/' && !searchVal) {
        const backDiv = document.createElement('div');
        backDiv.style = 'display: flex; align-items: center; padding: 10px 15px; background: #f1f5f9; border-radius: 8px; cursor: pointer; font-weight: bold; color: #475569; border: 1px dashed #cbd5e1; transition: all 0.2s;';
        backDiv.innerHTML = '<span>⬆ Quay lại thư mục cha</span>';
        backDiv.onclick = () => {
            const parts = currentFolderPath.split('/').filter(Boolean);
            parts.pop();
            const parentPath = parts.length > 0 ? '/' + parts.join('/') : '/';
            window.navigateToFolder(parentPath);
        };
        listEl.appendChild(backDiv);
    }
    
    if (displayItems.length === 0) {
        listEl.innerHTML += searchVal 
            ? '<p style="text-align: center; color: #888; padding: 20px;">Không tìm thấy bản nhạc hoặc thư mục nào khớp với từ khóa.</p>'
            : '<p style="text-align: center; color: #888; padding: 20px;">Thư mục này hiện đang trống. Bấm <b>"📁 Tạo Thư Mục Mới"</b> hoặc chọn <b>"☁️ Lưu lên Cloud"</b> để thêm bản nhạc vào đây!</p>';
        return;
    }
    
    // Sort: Folders first, then Songs
    displayItems.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return (a.title || '').localeCompare(b.title || '');
    });
    
    displayItems.forEach(item => {
        const div = document.createElement('div');
        div.style = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s;';
        
        const isFolder = item.type === 'folder';
        const icon = isFolder ? '📁' : '🎵';
        
        const infoDiv = document.createElement('div');
        infoDiv.style = 'display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1;';
        infoDiv.onclick = () => {
            if (isFolder) {
                const newPath = (item.folderPath === '/' ? '' : item.folderPath) + '/' + item.title;
                window.navigateToFolder(newPath);
            } else {
                window.loadSong(item);
            }
        };
        
        infoDiv.innerHTML = `
            <span style="font-size: 1.5rem;">${icon}</span>
            <div>
                <h3 style="margin: 0; font-size: 15px; color: ${isFolder ? '#1e293b' : '#0f172a'}; font-weight: bold;">${item.title}</h3>
                <small style="color: #64748b;">${isFolder ? 'Thư mục' : new Date(item.createdAt).toLocaleString()}</small>
            </div>
        `;
        
        const btnGroup = document.createElement('div');
        btnGroup.style = 'display: flex; gap: 8px; align-items: center;';
        
        if (!isFolder) {
            const moveBtn = document.createElement('button');
            moveBtn.className = 'toggle-btn';
            moveBtn.style = 'font-size: 12px; padding: 5px 10px; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;';
            moveBtn.innerText = '🚚 Chuyển';
            moveBtn.onclick = (e) => {
                e.stopPropagation();
                window.moveItemToFolder(item);
            };
            btnGroup.appendChild(moveBtn);

            const loadBtn = document.createElement('button');
            loadBtn.className = 'ctrl-btn play';
            loadBtn.style = 'font-size: 12px; padding: 5px 12px;';
            loadBtn.innerText = 'Tải vào Editor';
            loadBtn.onclick = (e) => {
                e.stopPropagation();
                window.loadSong(item);
            };
            btnGroup.appendChild(loadBtn);
        } else {
            const openBtn = document.createElement('button');
            openBtn.className = 'ctrl-btn play';
            openBtn.style = 'font-size: 12px; padding: 5px 12px; background: #3b82f6;';
            openBtn.innerText = 'Mở Thư Mục';
            openBtn.onclick = (e) => {
                e.stopPropagation();
                const newPath = (item.folderPath === '/' ? '' : item.folderPath) + '/' + item.title;
                window.navigateToFolder(newPath);
            };
            btnGroup.appendChild(openBtn);
        }
        
        const delBtn = document.createElement('button');
        delBtn.className = 'ctrl-btn stop';
        delBtn.style = 'font-size: 12px; padding: 5px 12px; background: #ef4444;';
        delBtn.innerText = 'Xóa';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            window.deleteLibraryItem(item);
        };
        btnGroup.appendChild(delBtn);
        
        div.appendChild(infoDiv);
        div.appendChild(btnGroup);
        listEl.appendChild(div);
    });
};

window.navigateToFolder = function(folderPath) {
    currentFolderPath = folderPath;
    window.renderLibraryCurrentView();
};

function saveLibraryCache(items) {
    libraryItemsCache = items;
    try {
        localStorage.setItem('piso_library_cache', JSON.stringify(items));
    } catch (e) {
        console.warn('Error saving piso_library_cache:', e);
    }
    window.renderLibraryCurrentView();
    if (typeof window.populateWeek1LibraryDropdown === 'function') {
        window.populateWeek1LibraryDropdown();
    }
}

window.createFolderInCurrentPath = async function() {
    const name = prompt("Nhập tên thư mục mới:", "Thư Mục Mới");
    if (!name || !name.trim()) return;
    
    const folderName = name.trim();
    const exists = libraryItemsCache.some(item => 
        item.type === 'folder' && 
        (item.folderPath || '/') === currentFolderPath && 
        item.title.toLowerCase() === folderName.toLowerCase()
    );
    if (exists) {
        return alert("Thư mục này đã tồn tại trong đường dẫn hiện tại!");
    }
    
    const newFolderObj = {
        id: 'folder_' + Date.now(),
        title: folderName,
        type: 'folder',
        folderPath: currentFolderPath,
        createdAt: new Date().toISOString()
    };
    
    // 1. Instant local update (0ms latency)
    let cache = [...libraryItemsCache];
    cache.unshift(newFolderObj);
    saveLibraryCache(cache);

    // 2. Background Cloud Sync
    try {
        const res = await fetch(CF_WORKER_URL + '/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: folderName,
                type: 'folder',
                folderPath: currentFolderPath
            })
        });
        const data = await res.json();
        if (data && data.id) {
            newFolderObj.id = data.id;
            saveLibraryCache(libraryItemsCache);
        }
    } catch(err) {
        console.warn("Cloud worker folder create sync fallback to local:", err);
    }
};

window.moveItemToFolder = async function(item) {
    const availableFolders = ['/'];
    libraryItemsCache.forEach(i => {
        if (i.type === 'folder') {
            const fPath = (i.folderPath === '/' ? '' : i.folderPath) + '/' + i.title;
            if (!availableFolders.includes(fPath)) availableFolders.push(fPath);
        }
    });
    
    const folderListStr = availableFolders.map((f, idx) => `${idx + 1}. ${f}`).join('\n');
    const choice = prompt(`Chọn số thứ tự thư mục muốn chuyển bài '${item.title}' tới:\n\n${folderListStr}`, "1");
    if (!choice) return;
    
    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= availableFolders.length) {
        return alert("Lựa chọn không hợp lệ!");
    }
    
    const targetFolder = availableFolders[idx];
    item.folderPath = targetFolder;
    saveLibraryCache(libraryItemsCache);
    
    try {
        await fetch(CF_WORKER_URL + '/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
    } catch(err) {
        console.warn("Cloud move error (local already updated):", err);
    }
};

window.deleteLibraryItem = async function(item) {
    const isFolder = item.type === 'folder';
    const msg = isFolder 
        ? `Bạn có chắc chắn muốn xóa thư mục '${item.title}' cùng toàn bộ bản nhạc bên trong?`
        : `Bạn có chắc chắn muốn xóa bản nhạc '${item.title}'?`;
        
    if (!confirm(msg)) return;
    
    const folderFullPath = (item.folderPath === '/' ? '' : item.folderPath) + '/' + item.title;

    // 1. Instant local removal (0ms latency!)
    let newCache = libraryItemsCache.filter(i => {
        if (isFolder) {
            if (i.id === item.id || (i.type === 'folder' && i.title === item.title)) return false;
            const itemFolder = i.folderPath || '/';
            if (itemFolder === folderFullPath || itemFolder.startsWith(folderFullPath + '/')) return false;
            return true;
        } else {
            // Delete ONLY the specific song matching exact ID or object reference
            if (item.id && i.id && String(i.id) === String(item.id)) return false;
            if (i === item) return false;
            return true;
        }
    });

    saveLibraryCache(newCache);

    // 2. Background Cloud Sync
    try {
        if (item.id && !String(item.id).startsWith('folder_') && !String(item.id).startsWith('song_')) {
            await fetch(CF_WORKER_URL + '/api/songs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id })
            });
        }
        
        if (isFolder) {
            const childItems = libraryItemsCache.filter(i => (i.folderPath || '').startsWith(folderFullPath));
            for (const child of childItems) {
                if (child.id && !String(child.id).startsWith('folder_') && !String(child.id).startsWith('song_')) {
                    await fetch(CF_WORKER_URL + '/api/songs', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: child.id })
                    });
                }
            }
        }
    } catch(err) {
        console.warn("Cloud delete sync fallback (local updated):", err);
    }
};

let currentSongId = null;

window.loadSong = function(song) {
    currentSongId = song.id; // Store ID for overwriting
    editorSections = window.parseAbcToSections(song.abc);
    activeTabId = 'total';
    window.renderEditorTabs();
    window.syncCurrentEditorTab();
    switchTab('tab-btn-write', 'tab-write');
    renderSheetMusic();
    if (window.renderStudioSheet) window.renderStudioSheet();
};

window.saveToCloud = async function() {
    window.switchEditorTab(activeTabId); // Sync active tab
    const totalSec = (typeof editorSections !== 'undefined') ? editorSections.find(s => s.isTotal) : null;
    const abc = (totalSec && totalSec.content) ? totalSec.content.trim() : document.getElementById('abc-code').value.trim();
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
        
        const payload = { title, abc, folderPath: currentFolderPath || '/' };
        if (currentSongId) payload.id = currentSongId; // Attach ID if updating
        
        const res = await fetch(CF_WORKER_URL + '/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.success) {
            currentSongId = data.id; // Update current ID (either new or existing)
            alert("Đã lưu thành công!");
            window.fetchLibrary(true);
        } else {
            alert("Lỗi khi lưu: " + data.error);
        }
    } catch (err) {
        alert("Không thể kết nối đến máy chủ: " + err.message);
    }
};


// A basic regex parser to convert simple ABC to JSON for the studio engine





// --- STUDIO TAB LOGIC (OPTION A) ---
import { initFullBandAudio, updateFullBandVolumes, getAudioCtx, getMasterGain } from './fullband-synth.js';

let studioVisualObj = null;
let studioAudioVisualObj = null;
let studioSynthControl = null;
let abcjsAudioCtx = null;
let melodyMasterGain = null;
let proxyAudioCtx = null;

// Initialize custom audio context and proxy for abcjs
function initAbcjsAudioContext() {
    if (!abcjsAudioCtx) {
        initFullBandAudio();
        abcjsAudioCtx = getAudioCtx();
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
    const totalSec = (typeof editorSections !== 'undefined') ? editorSections.find(s => s.isTotal) : null;
    const abcCode = (totalSec && totalSec.content) ? totalSec.content : document.getElementById('abc-code').value;
    let studioAbc = abcCode;
    try {
        if (abcCode.includes('"')) {
            let accomp = window.generateAccompaniment(abcCode);
            let v3Index = accomp.indexOf('V:3 name="Drums"');
            if (v3Index !== -1) accomp = accomp.substring(0, v3Index);
            accomp = accomp.replace(/V:1 name="Melody"/, "%%score {1 | 2}\nV:1 name=\"Melody\"");
            studioAbc = accomp;
        }
    } catch(e) {}
    
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
        scale: window.currentSheetScale
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

/* --- New Song & Theory Modal Functions --- */
window.createNewSong = function() {
    if (confirm("Bạn có muốn tạo trang viết nhạc mới? Thao tác này sẽ làm sạch vùng soạn thảo và xóa ID cũ để sẵn sàng lưu thành một bản nhạc mới.")) {
        currentSongId = null; // Release old ID
        const defaultAbc = `X:1\nT:Bản Nhạc Mới\nM:4/4\nL:1/8\nQ:1/4=100\nK:C\n\n|: C2 E2 G2 c2 | c2 G2 E2 C2 :|`;
        editorSections = window.parseAbcToSections(defaultAbc);
        activeTabId = 'total';
        window.renderEditorTabs();
        window.syncCurrentEditorTab();
        renderSheetMusic();
        if (window.renderStudioSheet) window.renderStudioSheet();
        
        const img = document.getElementById('uploaded-image');
        const prompt = document.getElementById('upload-prompt');
        if (img) img.style.display = 'none';
        if (prompt) prompt.style.display = 'block';
        alert("Đã làm sạch editor! Khi bạn bấm '☁️ Lưu lên Cloud', bản nhạc mới sẽ được tạo độc lập với mã ID mới.");
    }
};

window.openTheoryModal = function() {
    const modal = document.getElementById('theory-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderModalAbcBlocks();
    }
};

window.closeTheoryModal = function() {
    const modal = document.getElementById('theory-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.switchTheoryTab = function(tabName) {
    const pianoTab = document.getElementById('theory-tab-piano');
    const drumTab = document.getElementById('theory-tab-drum');
    const pianoContent = document.getElementById('theory-content-piano');
    const drumContent = document.getElementById('theory-content-drum');

    if (tabName === 'piano') {
        if (pianoTab) pianoTab.classList.add('active');
        if (drumTab) drumTab.classList.remove('active');
        if (pianoContent) pianoContent.style.display = 'block';
        if (drumContent) drumContent.style.display = 'none';
    } else {
        if (drumTab) drumTab.classList.add('active');
        if (pianoTab) pianoTab.classList.remove('active');
        if (drumContent) drumContent.style.display = 'block';
        if (pianoContent) pianoContent.style.display = 'none';
    }
    renderModalAbcBlocks();
};

function renderModalAbcBlocks() {
    if (typeof abcjs === 'undefined') return;
    const demos = document.querySelectorAll('.theory-abc-demo');
    demos.forEach((block, index) => {
        const sourceEl = block.querySelector('.theory-abc-source');
        const paperEl = block.querySelector('.theory-abc-paper');
        if (sourceEl && paperEl && !paperEl.dataset.rendered) {
            const source = sourceEl.innerText.trim();
            abcjs.renderAbc(paperEl, source, {
                responsive: 'resize',
                staffwidth: 800
            });
            paperEl.dataset.rendered = 'true';
        }
    });
}

/* --- TRANSPOSE KEY SYSTEM --- */

const KEY_SEMITONES = {
    'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5,
    'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11,
    'AM': 9, 'A#M': 10, 'BBM': 10, 'BM': 11, 'CM': 0, 'C#M': 1, 'DM': 2, 'EBM': 3, 'EM': 4, 'FM': 5, 'F#M': 6, 'GM': 7, 'G#M': 8
};

const SEMITONE_TO_MAJOR_KEY = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SEMITONE_TO_MINOR_KEY = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];

window.getCurrentSongKey = function() {
    let fullAbc = '';
    const abcEl = document.getElementById('abc-code');
    if (abcEl) {
        const curSec = (typeof editorSections !== 'undefined') ? editorSections.find(s => s.id === activeTabId) : null;
        if (curSec) curSec.content = abcEl.value;
    }
    if (typeof combineSectionsToAbc === 'function') {
        fullAbc = combineSectionsToAbc();
    }
    if (!fullAbc || !fullAbc.trim()) {
        const totalSec = (typeof editorSections !== 'undefined') ? editorSections.find(s => s.isTotal) : null;
        fullAbc = (totalSec && totalSec.content) ? totalSec.content : (abcEl ? abcEl.value : '');
    }
    const match = fullAbc.match(/^K:\s*([^\s%]+)/m);
    return match ? match[1].trim() : 'C';
};

window.openTransposeModal = function() {
    try {
        const modal = document.getElementById('transpose-modal');
        const badge = document.getElementById('current-key-badge');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            if (badge && window.getCurrentSongKey) {
                badge.innerText = window.getCurrentSongKey();
            }
        }
    } catch(err) {
        console.error("Lỗi khi mở popup dịch giọng:", err);
    }
};

window.closeTransposeModal = function() {
    const modal = document.getElementById('transpose-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
};

window.transposeAbcText = function(abcText, deltaSemitones, targetKeyName = null) {
    if (!abcText) return '';
    const lines = abcText.split('\n');
    const transposedLines = [];

    let currentKey = 'C';
    for (let l of lines) {
        if (l.trim().startsWith('K:')) {
            const kMatch = l.trim().match(/^K:\s*([^\s%]+)/);
            if (kMatch) currentKey = kMatch[1].trim();
            break;
        }
    }

    const isMinor = currentKey.toLowerCase().endsWith('m');
    const curKeyUpper = currentKey.toUpperCase();
    const curSemi = KEY_SEMITONES[curKeyUpper] !== undefined ? KEY_SEMITONES[curKeyUpper] : 0;

    let calcTargetKey = targetKeyName;
    if (!calcTargetKey) {
        let targetSemi = (curSemi + deltaSemitones) % 12;
        if (targetSemi < 0) targetSemi += 12;
        calcTargetKey = isMinor ? SEMITONE_TO_MINOR_KEY[targetSemi] : SEMITONE_TO_MAJOR_KEY[targetSemi];
    } else {
        const targetUpper = targetKeyName.toUpperCase();
        const targetSemi = KEY_SEMITONES[targetUpper] !== undefined ? KEY_SEMITONES[targetUpper] : 0;
        deltaSemitones = targetSemi - curSemi;
    }

    const NOTE_TO_VAL = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    const VAL_TO_NOTE_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const VAL_TO_NOTE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const useSharps = (calcTargetKey.includes('#') || ['G', 'D', 'A', 'E', 'B', 'F#', 'Em', 'Bm', 'F#m', 'C#m'].includes(calcTargetKey));
    const noteMap = useSharps ? VAL_TO_NOTE_SHARP : VAL_TO_NOTE_FLAT;

    for (let line of lines) {
        let trimmed = line.trim();

        if (trimmed.match(/^K:\s*/i)) {
            transposedLines.push(`K:${calcTargetKey}`);
            continue;
        }

        if (trimmed.startsWith('%') || trimmed.match(/^[A-Za-z]:/) || trimmed.startsWith('%%')) {
            transposedLines.push(line);
            continue;
        }

        let newLine = line;

        newLine = newLine.replace(/"([^"]+)"/g, (match, chord) => {
            const transposedChord = chord.replace(/([A-G][#b]?)/g, (m, root) => {
                let rootSemi = KEY_SEMITONES[root.toUpperCase()] !== undefined ? KEY_SEMITONES[root.toUpperCase()] : 0;
                let newSemi = (rootSemi + deltaSemitones) % 12;
                if (newSemi < 0) newSemi += 12;
                return noteMap[newSemi];
            });
            return `"${transposedChord}"`;
        });

        const voiceTags = [];
        newLine = newLine.replace(/(\[V:[^\]]+\])/gi, (match) => {
            voiceTags.push(match);
            return `___VOICETAG_${voiceTags.length - 1}___`;
        });

        const noteRegex = /([\^_=+]*)([A-Ga-g])([,']*)/g;
        newLine = newLine.replace(noteRegex, (match, acc, baseNote, octaves) => {
            let isLower = baseNote === baseNote.toLowerCase();
            let upperNote = baseNote.toUpperCase();

            let baseVal = NOTE_TO_VAL[upperNote];
            if (baseVal === undefined) return match;

            if (acc === '^') baseVal += 1;
            else if (acc === '^^') baseVal += 2;
            else if (acc === '_') baseVal -= 1;
            else if (acc === '__') baseVal -= 2;

            let octaveOffset = 0;
            if (isLower) octaveOffset += 12;
            for (let ch of octaves) {
                if (ch === "'") octaveOffset += 12;
                if (ch === ",") octaveOffset -= 12;
            }

            let totalPitch = baseVal + octaveOffset + deltaSemitones;

            let newBaseVal = totalPitch % 12;
            if (newBaseVal < 0) newBaseVal += 12;
            let newOctaveVal = Math.floor(totalPitch / 12);

            let newNoteName = noteMap[newBaseVal];
            let newAcc = '';
            if (newNoteName.includes('#')) {
                newAcc = '^';
                newNoteName = newNoteName.replace('#', '');
            } else if (newNoteName.includes('b')) {
                newAcc = '_';
                newNoteName = newNoteName.replace('b', '');
            }

            let finalNote = newNoteName;
            let finalOctave = '';

            if (newOctaveVal >= 1) {
                finalNote = finalNote.toLowerCase();
                for (let k = 1; k < newOctaveVal; k++) {
                    finalOctave += "'";
                }
            } else if (newOctaveVal < 0) {
                finalNote = finalNote.toUpperCase();
                for (let k = 0; k > newOctaveVal; k--) {
                    finalOctave += ",";
                }
            } else {
                finalNote = finalNote.toUpperCase();
            }

            return newAcc + finalNote + finalOctave;
        });

        newLine = newLine.replace(/___VOICETAG_(\d+)___/g, (match, idx) => {
            return voiceTags[parseInt(idx, 10)] || match;
        });

        transposedLines.push(newLine);
    }

    return transposedLines.join('\n');
};

window.applyTransposeToKey = function(targetKey) {
    const curKey = window.getCurrentSongKey();
    const curUpper = curKey.toUpperCase();
    const targetUpper = targetKey.toUpperCase();
    
    const curSemi = KEY_SEMITONES[curUpper] !== undefined ? KEY_SEMITONES[curUpper] : 0;
    const targetSemi = KEY_SEMITONES[targetUpper] !== undefined ? KEY_SEMITONES[targetUpper] : 0;
    const delta = targetSemi - curSemi;

    window.executeTranspose(delta, targetKey);
};

window.applyTransposeDelta = function(delta) {
    window.executeTranspose(delta, null);
};

window.executeTranspose = function(delta, targetKey) {
    const abcEl = document.getElementById('abc-code');
    if (abcEl) {
        const curSec = editorSections.find(s => s.id === activeTabId);
        if (curSec) curSec.content = abcEl.value;
    }
    
    let fullAbc = (typeof combineSectionsToAbc === 'function') ? combineSectionsToAbc() : '';
    if (!fullAbc || !fullAbc.trim()) {
        const totalSec = editorSections.find(s => s.isTotal);
        fullAbc = (totalSec && totalSec.content) ? totalSec.content : (abcEl ? abcEl.value : '');
    }
    
    if (!fullAbc || !fullAbc.trim()) {
        return alert("Không có dữ liệu bài hát để dịch giọng!");
    }

    const transposedFullAbc = window.transposeAbcText(fullAbc, delta, targetKey);

    editorSections = parseAbcToSections(transposedFullAbc);

    const activeSec = editorSections.find(s => s.id === activeTabId) || editorSections.find(s => s.isTotal) || editorSections[0];
    if (activeSec) activeTabId = activeSec.id;

    if (abcEl) {
        abcEl.value = (activeSec && activeSec.content) ? activeSec.content : transposedFullAbc;
    }

    renderEditorTabs();
    syncCurrentEditorTab();
    renderSheetMusic();
    if (window.renderStudioSheet) window.renderStudioSheet();

    window.closeTransposeModal();

    const newKey = window.getCurrentSongKey();
    alert(`✨ Đã dịch giọng bản nhạc sang Tone ${newKey}! Bạn có thể nghe thử và bấm '💾 Lưu Giọng Mới' để lưu bài này vào Thư viện.`);
};

window.saveTransposedToCloud = async function() {
    const abcEl = document.getElementById('abc-code');
    if (abcEl) {
        const curSec = editorSections.find(s => s.id === activeTabId);
        if (curSec) curSec.content = abcEl.value;
    }
    
    let abc = (typeof combineSectionsToAbc === 'function') ? combineSectionsToAbc() : '';
    if (!abc || !abc.trim()) {
        const totalSec = editorSections.find(s => s.isTotal);
        abc = (totalSec && totalSec.content) ? totalSec.content.trim() : (abcEl ? abcEl.value.trim() : '');
    }
    if (!abc) return alert("Không có dữ liệu ABC để lưu!");
    
    const key = window.getCurrentSongKey();
    let title = "Bản nhạc mới";
    const titleMatch = abc.match(/^T:\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1];
    
    let baseTitle = title.replace(/\s*\(Tone\s+[^\)]+\)/gi, '').trim();
    let newTitle = prompt("Nhập tên lưu bài với giọng mới:", `${baseTitle} (Tone ${key})`);
    if (!newTitle) return;
    
    abc = abc.replace(/^T:\s*.+$/m, `T:${newTitle}`);
    
    currentSongId = null; // Create distinct new song entry in cloud
    
    try {
        const payload = { title: newTitle, abc, folderPath: currentFolderPath || '/' };
        const res = await fetch(CF_WORKER_URL + '/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            currentSongId = data.id;
            alert(`🎉 Đã lưu bản nhạc mới '${newTitle}' vào Thư viện Cloud!`);
            window.fetchLibrary(true);
        } else {
            alert("Lỗi khi lưu: " + data.error);
        }
    } catch(err) {
        alert("Lỗi kết nối máy chủ: " + err.message);
    }
};

/* ==========================================================================
   VISUAL CARD EDITOR IMPLEMENTATION (TAB VIẾT NHẠC CARD VIEW LIKE CIRCLE 2)
   ========================================================================== */

window.currentEditorMode = 'visual';

window.switchEditorMode = function(mode) {
    window.currentEditorMode = mode;
    const visualView = document.getElementById('visual-editor-view');
    const abcView = document.getElementById('abc-view');
    const visualBtn = document.getElementById('editor-mode-visual-btn');
    const codeBtn = document.getElementById('editor-mode-code-btn');
    const visualActions = document.getElementById('visual-editor-actions');

    if (mode === 'visual') {
        if (visualView) visualView.style.display = 'block';
        if (abcView) abcView.style.display = 'none';
        if (visualActions) visualActions.style.display = 'flex';

        if (visualBtn) {
            visualBtn.style.background = '#0284c7';
            visualBtn.style.color = 'white';
            visualBtn.style.borderColor = '#0284c7';
        }
        if (codeBtn) {
            codeBtn.style.background = '#f8fafc';
            codeBtn.style.color = '#475569';
            codeBtn.style.borderColor = '#cbd5e1';
        }

        window.renderVisualEditor();
    } else {
        if (visualView) visualView.style.display = 'none';
        if (abcView) abcView.style.display = 'block';
        if (visualActions) visualActions.style.display = 'none';

        if (codeBtn) {
            codeBtn.style.background = '#0284c7';
            codeBtn.style.color = 'white';
            codeBtn.style.borderColor = '#0284c7';
        }
        if (visualBtn) {
            visualBtn.style.background = '#f8fafc';
            visualBtn.style.color = '#475569';
            visualBtn.style.borderColor = '#cbd5e1';
        }

        const abcEl = document.getElementById('abc-code');
        if (abcEl && window.combineSectionsToAbc) {
            abcEl.value = window.combineSectionsToAbc();
        }
    }
};

window.parseAbcToVisualStructure = function(abcText) {
    const rawLines = (abcText || '').split('\n');
    let title = 'Bản Nhạc Của Bé';
    let meter = '4/4';
    let key = 'C';

    let currentLineTitle = 'DÒNG 1';
    let lineBlocks = [];
    let curTrebleMeasures = [];
    let curBassMeasures = [];

    rawLines.forEach(l => {
        const trimmed = l.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('T:')) {
            title = trimmed.replace(/^T:\s*/, '').trim() || title;
        } else if (trimmed.startsWith('M:')) {
            meter = trimmed.replace(/^M:\s*/, '').trim() || meter;
        } else if (trimmed.startsWith('K:')) {
            key = trimmed.replace(/^K:\s*/, '').trim() || key;
        } else if (trimmed.startsWith('% ===')) {
            const titleMatch = trimmed.match(/%\s*==+\s*(.*?)\s*==+/);
            if (titleMatch && titleMatch[1]) {
                if (curTrebleMeasures.length > 0 || curBassMeasures.length > 0) {
                    lineBlocks.push({
                        title: currentLineTitle,
                        trebleMeasures: curTrebleMeasures,
                        bassMeasures: curBassMeasures
                    });
                    curTrebleMeasures = [];
                    curBassMeasures = [];
                }
                currentLineTitle = titleMatch[1].trim();
            }
        } else if (!trimmed.startsWith('X:') && !trimmed.startsWith('L:') && !trimmed.startsWith('Q:') && !trimmed.startsWith('%%') && !trimmed.startsWith('V:1') && !trimmed.startsWith('V:2')) {
            const measures = trimmed.split('|').map(m => m.trim()).filter((m, idx, arr) => !(idx === arr.length - 1 && m === ''));
            if (curTrebleMeasures.length === 0) {
                curTrebleMeasures = measures;
            } else if (curBassMeasures.length === 0) {
                curBassMeasures = measures;
            } else {
                lineBlocks.push({
                    title: currentLineTitle,
                    trebleMeasures: curTrebleMeasures,
                    bassMeasures: curBassMeasures
                });
                curTrebleMeasures = measures;
                curBassMeasures = [];
            }
        }
    });

    if (curTrebleMeasures.length > 0 || curBassMeasures.length > 0) {
        lineBlocks.push({
            title: currentLineTitle,
            trebleMeasures: curTrebleMeasures,
            bassMeasures: curBassMeasures
        });
    }

    if (lineBlocks.length === 0) {
        lineBlocks.push({
            title: 'DÒNG 1',
            trebleMeasures: ['"C" G3 A', 'C3 G', 'C3 E'],
            bassMeasures: ['C, E, G,2', 'C, E, G,2', 'C, E, G,2']
        });
    }

    return { title, meter, key, lineBlocks };
};

window.renderVisualEditor = function() {
    const container = document.getElementById('visual-editor-view');
    if (!container) return;

    const abcEl = document.getElementById('abc-code');
    const abcText = abcEl ? abcEl.value : '';
    const parsed = window.parseAbcToVisualStructure(abcText);

    let html = `
        <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <div style="flex: 2; min-width: 160px;">
              <label style="font-weight: 800; font-size: 0.78rem; color: #334155; display: block; margin-bottom: 3px;">🎵 Tên Bài Hát (Title):</label>
              <input type="text" id="visual-title-input" value="${parsed.title}" oninput="window.onVisualEditorChange()" style="width: 100%; padding: 6px 10px; border-radius: 8px; border: 1.5px solid #0284c7; font-weight: 700; font-size: 0.85rem; color: #0369a1; outline: none;">
            </div>
            <div style="flex: 1; min-width: 90px;">
              <label style="font-weight: 800; font-size: 0.78rem; color: #334155; display: block; margin-bottom: 3px;">⏱️ Nhịp (Meter):</label>
              <select id="visual-meter-select" onchange="window.onVisualEditorChange()" style="width: 100%; padding: 6px 8px; border-radius: 8px; border: 1.5px solid #0284c7; font-weight: 800; font-size: 0.85rem; color: #0369a1; outline: none; cursor: pointer; background: white;">
                <option value="2/4" ${parsed.meter === '2/4' ? 'selected' : ''}>2/4</option>
                <option value="3/4" ${parsed.meter === '3/4' ? 'selected' : ''}>3/4</option>
                <option value="4/4" ${parsed.meter === '4/4' ? 'selected' : ''}>4/4</option>
                <option value="6/8" ${parsed.meter === '6/8' ? 'selected' : ''}>6/8</option>
              </select>
            </div>
            <div style="flex: 1; min-width: 90px;">
              <label style="font-weight: 800; font-size: 0.78rem; color: #334155; display: block; margin-bottom: 3px;">🔑 Giọng (Key):</label>
              <select id="visual-key-select" onchange="window.onVisualEditorChange()" style="width: 100%; padding: 6px 8px; border-radius: 8px; border: 1.5px solid #0284c7; font-weight: 800; font-size: 0.85rem; color: #0369a1; outline: none; cursor: pointer; background: white;">
                <option value="C" ${parsed.key === 'C' ? 'selected' : ''}>C (Đô Trưởng)</option>
                <option value="Am" ${parsed.key === 'Am' ? 'selected' : ''}>Am (La Thứ)</option>
                <option value="G" ${parsed.key === 'G' ? 'selected' : ''}>G (Sol Trưởng)</option>
                <option value="Em" ${parsed.key === 'Em' ? 'selected' : ''}>Em (Mi Thứ)</option>
                <option value="F" ${parsed.key === 'F' ? 'selected' : ''}>F (Fa Trưởng)</option>
                <option value="Dm" ${parsed.key === 'Dm' ? 'selected' : ''}>Dm (Rê Thứ)</option>
              </select>
            </div>
          </div>
        </div>
    `;

    parsed.lineBlocks.forEach((line, lIdx) => {
        const numMeasures = Math.max(line.trebleMeasures.length, line.bassMeasures.length, 1);
        let measuresHtml = '';

        for (let mIdx = 0; mIdx < numMeasures; mIdx++) {
            const trebleVal = line.trebleMeasures[mIdx] || '';
            const bassVal = line.bassMeasures[mIdx] || '';

            measuresHtml += `
                <div style="background: white; border: 1.5px solid #86efac; border-radius: 12px; padding: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); min-width: 180px; flex: 1;">
                  <div style="font-weight: 800; color: #15803d; font-size: 0.84rem; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span>🎼 Ô Nhịp ${mIdx + 1}</span>
                    <button type="button" onclick="window.removeVisualEditorMeasure(${lIdx}, ${mIdx})" title="Xóa ô nhịp này" style="border: none; background: #fee2e2; color: #ef4444; border-radius: 6px; padding: 1px 6px; font-weight: 800; cursor: pointer; font-size: 0.72rem;">✕</button>
                  </div>

                  <div style="margin-bottom: 6px;">
                    <label style="display: block; font-weight: 700; color: #0369a1; font-size: 0.75rem; margin-bottom: 2px;">🫱 Tay Phải (Khóa Sol):</label>
                    <textarea class="visual-measure-treble" data-line="${lIdx}" data-m="${mIdx}" oninput="window.onVisualEditorChange()" style="width: 100%; height: 38px; padding: 5px 8px; border-radius: 6px; border: 1.5px solid #38bdf8; font-weight: 700; font-size: 0.82rem; color: #0369a1; outline: none; background: #f0f9ff; resize: none;">${trebleVal}</textarea>
                  </div>

                  <div>
                    <label style="display: block; font-weight: 700; color: #be123c; font-size: 0.75rem; margin-bottom: 2px;">🫲 Tay Trái (Khóa Fa):</label>
                    <textarea class="visual-measure-bass" data-line="${lIdx}" data-m="${mIdx}" oninput="window.onVisualEditorChange()" style="width: 100%; height: 38px; padding: 5px 8px; border-radius: 6px; border: 1.5px solid #f43f5e; font-weight: 700; font-size: 0.82rem; color: #881337; outline: none; background: #fff1f2; resize: none;">${bassVal}</textarea>
                  </div>
                </div>
            `;
        }

        html += `
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <span style="background: #0284c7; color: white; font-weight: 800; padding: 3px 12px; border-radius: 10px; font-size: 0.85rem;">📌 ${line.title || ('DÒNG ' + (lIdx + 1))}</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" onclick="window.addVisualEditorMeasure(${lIdx})" style="background: #0284c7; color: white; border: none; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">➕ Thêm Ô Nhịp</button>
                  ${parsed.lineBlocks.length > 1 ? `<button type="button" onclick="window.removeVisualEditorLine(${lIdx})" style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">🗑️ Xóa Dòng</button>` : ''}
                </div>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${measuresHtml}
              </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.onVisualEditorChange = function() {
    const titleInput = document.getElementById('visual-title-input');
    const meterSelect = document.getElementById('visual-meter-select');
    const keySelect = document.getElementById('visual-key-select');

    const title = titleInput ? titleInput.value.trim() || 'Bản Nhạc Của Bé' : 'Bản Nhạc Của Bé';
    const meter = meterSelect ? meterSelect.value : '4/4';
    const key = keySelect ? keySelect.value : 'C';

    const trebleEls = Array.from(document.querySelectorAll('.visual-measure-treble'));
    const bassEls = Array.from(document.querySelectorAll('.visual-measure-bass'));

    let lineMap = {};

    trebleEls.forEach(el => {
        const lIdx = parseInt(el.getAttribute('data-line'), 10);
        const mIdx = parseInt(el.getAttribute('data-m'), 10);
        if (!lineMap[lIdx]) lineMap[lIdx] = { title: `DÒNG ${lIdx + 1}`, trebleMeasures: [], bassMeasures: [] };
        lineMap[lIdx].trebleMeasures[mIdx] = el.value;
    });

    bassEls.forEach(el => {
        const lIdx = parseInt(el.getAttribute('data-line'), 10);
        const mIdx = parseInt(el.getAttribute('data-m'), 10);
        if (!lineMap[lIdx]) lineMap[lIdx] = { title: `DÒNG ${lIdx + 1}`, trebleMeasures: [], bassMeasures: [] };
        lineMap[lIdx].bassMeasures[mIdx] = el.value;
    });

    let output = [
        `X:1`,
        `T:${title}`,
        `M:${meter}`,
        `L:1/4`,
        `K:${key}`,
        `%%score {1 | 2}`
    ];

    Object.keys(lineMap).sort((a, b) => a - b).forEach((lIdxKey) => {
        const block = lineMap[lIdxKey];
        output.push(`\n% ===================================`);
        output.push(`% ${block.title}`);
        output.push(`% ===================================`);

        const numM = Math.max(block.trebleMeasures.length, block.bassMeasures.length, 1);
        let trebleParts = [];
        let bassParts = [];

        for (let i = 0; i < numM; i++) {
            trebleParts.push((block.trebleMeasures[i] || 'z4').trim());
            bassParts.push((block.bassMeasures[i] || 'z4').trim());
        }

        output.push('V:1 clef=treble');
        output.push(trebleParts.join(' | ') + ' |');
        output.push('V:2 clef=bass');
        output.push(bassParts.join(' | ') + ' |');
    });

    const fullAbc = output.join('\n');
    const abcEl = document.getElementById('abc-code');
    if (abcEl) {
        abcEl.value = fullAbc;
        if (window.parseAbcToSections) {
            window.editorSections = window.parseAbcToSections(fullAbc);
            if (window.renderEditorTabs) window.renderEditorTabs();
        }
    }

    if (window.renderSheetMusic) window.renderSheetMusic();
};

window.addVisualEditorLine = function() {
    const abcEl = document.getElementById('abc-code');
    const abcText = abcEl ? abcEl.value : '';
    const parsed = window.parseAbcToVisualStructure(abcText);
    const nextLineNum = parsed.lineBlocks.length + 1;

    parsed.lineBlocks.push({
        title: `DÒNG ${nextLineNum}`,
        trebleMeasures: ['C D E F', 'G A B c'],
        bassMeasures: ['C, E, G,2', 'C, E, G,2']
    });

    const compiledAbc = window.compileVisualStructureToAbc([
        `X:1`, `T:${parsed.title}`, `M:${parsed.meter}`, `L:1/4`, `K:${parsed.key}`
    ], parsed.lineBlocks);

    if (abcEl) abcEl.value = compiledAbc;
    window.renderVisualEditor();
    if (window.renderSheetMusic) window.renderSheetMusic();
};

window.removeVisualEditorLine = function(lIdx) {
    const abcEl = document.getElementById('abc-code');
    const abcText = abcEl ? abcEl.value : '';
    const parsed = window.parseAbcToVisualStructure(abcText);

    if (parsed.lineBlocks.length <= 1) return;
    parsed.lineBlocks.splice(lIdx, 1);

    const compiledAbc = window.compileVisualStructureToAbc([
        `X:1`, `T:${parsed.title}`, `M:${parsed.meter}`, `L:1/4`, `K:${parsed.key}`
    ], parsed.lineBlocks);

    if (abcEl) abcEl.value = compiledAbc;
    window.renderVisualEditor();
    if (window.renderSheetMusic) window.renderSheetMusic();
};

window.addVisualEditorMeasure = function(lIdx) {
    const abcEl = document.getElementById('abc-code');
    const abcText = abcEl ? abcEl.value : '';
    const parsed = window.parseAbcToVisualStructure(abcText);

    if (parsed.lineBlocks[lIdx]) {
        parsed.lineBlocks[lIdx].trebleMeasures.push('z4');
        parsed.lineBlocks[lIdx].bassMeasures.push('C, E, G,2');
    }

    const compiledAbc = window.compileVisualStructureToAbc([
        `X:1`, `T:${parsed.title}`, `M:${parsed.meter}`, `L:1/4`, `K:${parsed.key}`
    ], parsed.lineBlocks);

    if (abcEl) abcEl.value = compiledAbc;
    window.renderVisualEditor();
    if (window.renderSheetMusic) window.renderSheetMusic();
};

window.removeVisualEditorMeasure = function(lIdx, mIdx) {
    const abcEl = document.getElementById('abc-code');
    const abcText = abcEl ? abcEl.value : '';
    const parsed = window.parseAbcToVisualStructure(abcText);

    if (parsed.lineBlocks[lIdx]) {
        if (parsed.lineBlocks[lIdx].trebleMeasures.length > 1) {
            parsed.lineBlocks[lIdx].trebleMeasures.splice(mIdx, 1);
        }
        if (parsed.lineBlocks[lIdx].bassMeasures.length > 1) {
            parsed.lineBlocks[lIdx].bassMeasures.splice(mIdx, 1);
        }
    }

    const compiledAbc = window.compileVisualStructureToAbc([
        `X:1`, `T:${parsed.title}`, `M:${parsed.meter}`, `L:1/4`, `K:${parsed.key}`
    ], parsed.lineBlocks);

    if (abcEl) abcEl.value = compiledAbc;
    window.renderVisualEditor();
    if (window.renderSheetMusic) window.renderSheetMusic();
};

window.compileVisualStructureToAbc = function(headerLines, lineBlocks) {
    let output = [...headerLines];
    if (!output.some(l => l.includes('%%score'))) {
        output.push('%%score {1 | 2}');
    }

    lineBlocks.forEach((block, idx) => {
        output.push(`\n% ===================================`);
        output.push(`% ${block.title || ('DÒNG ' + (idx + 1))}`);
        output.push(`% ===================================`);

        const numM = Math.max(block.trebleMeasures.length, block.bassMeasures.length, 1);
        let trebleParts = [];
        let bassParts = [];

        for (let i = 0; i < numM; i++) {
            trebleParts.push((block.trebleMeasures[i] || 'z4').trim());
            bassParts.push((block.bassMeasures[i] || 'z4').trim());
        }

        output.push('V:1 clef=treble');
        output.push(trebleParts.join(' | ') + ' |');
        output.push('V:2 clef=bass');
        output.push(bassParts.join(' | ') + ' |');
    });

    return output.join('\n');
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('visual-editor-view')) {
            window.renderVisualEditor();
        }
    }, 500);
});
