const fs = require('fs');

const modalHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/piano solo/scratch/theory_modal.html', 'utf8').trim();
let indexHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/piano solo/index.html', 'utf8');

const startTag = '<!-- THEORY MODAL -->';
const endTag = '<!-- END THEORY MODAL -->';

const startIndex = indexHtml.indexOf(startTag);
const endIndex = indexHtml.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    indexHtml = indexHtml.substring(0, startIndex) + modalHtml + '\n    ' + endTag + indexHtml.substring(endIndex + endTag.length);
    fs.writeFileSync('C:/Users/DT.HANG/Downloads/piano solo/index.html', indexHtml);
    console.log('Successfully injected updated theory modal into index.html!');
} else {
    console.error('Could not find modal tags in index.html');
}
