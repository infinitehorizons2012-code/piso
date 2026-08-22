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

function renderSheetMusic() {
  const abcCode = abcTextarea.value;
  // Render using abcjs
  abcjs.renderAbc("paper", abcCode, {
    add_classes: true,
    staffwidth: 700,
  });
}

// Render on startup
renderSheetMusic();

// Two-way binding (Text -> Sheet)
abcTextarea.addEventListener('input', () => {
  renderSheetMusic();
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
