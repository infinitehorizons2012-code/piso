const fs = require('fs');

const mainJs = fs.readFileSync('main.js', 'utf8');
const engineJs = fs.readFileSync('piano-solo-engine.js', 'utf8');

console.log('--- SEARCH IN MAIN.JS ---');
mainJs.split('\n').forEach((line, idx) => {
    if (/library|thư viện|localstorage|presets/i.test(line)) {
        console.log(`main.js:${idx+1}: ${line.trim().slice(0, 100)}`);
    }
});

console.log('--- SEARCH IN PIANO-SOLO-ENGINE.JS ---');
engineJs.split('\n').forEach((line, idx) => {
    if (/library|thư viện|localstorage|presets/i.test(line)) {
        console.log(`piano-solo-engine.js:${idx+1}: ${line.trim().slice(0, 100)}`);
    }
});
