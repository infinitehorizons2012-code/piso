const fs = require('fs');

let indexHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/piano solo/index.html', 'utf8');
const modalHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/piano solo/scratch/theory_modal.html', 'utf8');

// Remove any existing theory-modal if present
indexHtml = indexHtml.replace(/<!-- THEORY MODAL -->[\s\S]*?<!-- END THEORY MODAL -->/, '');

const targetTag = '<!-- Global functions export for onclick handlers -->';
const replacement = '<!-- THEORY MODAL -->' + modalHtml + '\n    <!-- END THEORY MODAL -->\n\n    ' + targetTag;

indexHtml = indexHtml.replace(targetTag, replacement);

fs.writeFileSync('C:/Users/DT.HANG/Downloads/piano solo/index.html', indexHtml);
console.log('Successfully injected theory modal into index.html!');
