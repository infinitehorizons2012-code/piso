const fs = require('fs');

let mainJs = fs.readFileSync('C:/Users/DT.HANG/Downloads/piano solo/main.js', 'utf8');

// Find the second occurrence of /* --- EDITOR SECTION TAB MANAGER --- */
const firstIndex = mainJs.indexOf('/* --- EDITOR SECTION TAB MANAGER --- */');
const secondIndex = mainJs.indexOf('/* --- EDITOR SECTION TAB MANAGER --- */', firstIndex + 1);

if (secondIndex !== -1) {
    const endTarget = 'window.openTheoryModal = function()';
    const endIndex = mainJs.indexOf(endTarget, secondIndex);
    if (endIndex !== -1) {
        mainJs = mainJs.substring(0, secondIndex) + mainJs.substring(endIndex);
        fs.writeFileSync('C:/Users/DT.HANG/Downloads/piano solo/main.js', mainJs);
        console.log('Successfully cleaned duplicate Section Tab Manager in main.js!');
    }
}
