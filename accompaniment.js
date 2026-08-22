// accompaniment.js
// Auto-generates Bass and Drum tracks based on chords in the ABC notation.

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
    
    const kIndex = header.findIndex(l => l.startsWith('K:'));
    if (kIndex !== -1) {
        header.splice(kIndex, 0, '%%score 1');
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
            drumMeasure = `[c2F2] [c2F2]`; 
        } else if (beatsPerMeasure === 3) {
            bassMeasure = `${bassNote} ${bassNote} ${bassNote}`;
            drumMeasure = `[cF] [cF] [cF]`; 
        } else if (beatsPerMeasure === 2) {
            bassMeasure = `${bassNote}2`;
            drumMeasure = `[c2F2]`;
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
