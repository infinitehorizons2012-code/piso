// accompaniment.js
// Auto-generates Bass and Drum tracks based on chords in the ABC notation for audio synthesis.

window.generateAccompaniment = function(abcCode) {
    const drumStyleEl = document.getElementById('drumStyle');
    const style = drumStyleEl ? drumStyleEl.value : 'pop';
    
    if (style === 'none') {
        // Strip out chords so no piano accompaniment is generated
        return abcCode.replace(/"[^"]*"/g, '');
    }

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
        let bassNote = root + accidental + ','; 
        
        let bassMeasure = '';
        let drumMeasure = '';
        
        if (beatsPerMeasure === 4) {
            if (style === 'pop') {
                bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`;
                drumMeasure = `[C,^F,] ^F, [D,^F,] ^F, [C,^F,] ^F, [D,^F,] ^F,`; // 8-beat hi-hat
            } else if (style === 'disco') {
                bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`; // Four on the floor
                drumMeasure = `[C,^F,] [C,^F,] [C,D,^F,] [C,^F,] [C,^F,] [C,^F,] [C,D,^F,] [C,^F,]`; 
            } else if (style === 'swing') {
                bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`; // Walking bass idea
                drumMeasure = `[C,^F,] z/2 ^F,/2 [D,^F,] ^F, [C,^F,] z/2 ^F,/2 [D,^F,] ^F,`; // Swing ride
            } else if (style === 'ballad') {
                bassMeasure = `${bassNote}4`; // Whole note bass
                drumMeasure = `[C,^F,] ^F, [D,^F,] ^F, [C,^F,] ^F, [D,^F,] ^F,`; // Slow 8-beat
            } else {
                bassMeasure = `${bassNote} ${bassNote} ${bassNote} ${bassNote}`;
                drumMeasure = `[C,^F,] D, [C,^F,] D,`; 
            }
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
    
    const volMelody = document.getElementById('volMelody') ? parseFloat(document.getElementById('volMelody').value) : 1;
    const volChord = document.getElementById('volChord') ? parseFloat(document.getElementById('volChord').value) : 0.8;
    const volBass = document.getElementById('volBass') ? parseFloat(document.getElementById('volBass').value) : 0.8;
    const volDrum = document.getElementById('volDrum') ? parseFloat(document.getElementById('volDrum').value) : 1;
    
    let newAbc = header.join('\n') + '\n';
    newAbc += 'V:1 name="Melody"\n';
    newAbc += `%%MIDI control 7 ${Math.round(volMelody * 127)}\n`;
    newAbc += `%%MIDI chordvol ${Math.round(volChord * 127)}\n`;
    newAbc += `%%MIDI chordprog 0\n`; // Default Piano for chords
    newAbc += bodyText + '\n\n';
    
    newAbc += 'V:2 name="Bass" clef=bass\n';
    newAbc += 'L:1/4\n';
    if (style === 'pop' || style === 'disco' || style === 'swing') newAbc += 'L:1/8\n';
    if (style === 'ballad') newAbc += 'L:1/4\n';
    
    newAbc += '%%MIDI program 33\n'; // Electric Bass
    newAbc += `%%MIDI control 7 ${Math.round(volBass * 127)}\n`;
    
    // Adjust bass track parsing if L is changed
    let finalBassTrack = bassTrack.join(' | ');
    if (style === 'pop' || style === 'disco' || style === 'swing') {
        // If we switched to L:1/8, we need to double the lengths of our 1/4 notes
        finalBassTrack = finalBassTrack.replace(/([A-Ga-g][#b]?,+,?)/g, "$12");
    }

    newAbc += finalBassTrack + ' |]\n\n';
    
    newAbc += 'V:3 name="Drums" clef=perc\n';
    newAbc += 'L:1/8\n'; // Drums always use 1/8 for more granularity
    newAbc += '%%MIDI channel 10\n';
    newAbc += `%%MIDI control 7 ${Math.round(volDrum * 127)}\n`;
    
    // Our drum strings were written with L:1/4 in mind previously, need to adjust for L:1/8
    let finalDrumTrack = drumTrack.join(' | ');
    // Not adjusting manually for now because the new strings above are written assuming L:1/8 for pop/disco/swing/ballad 
    // Wait, the generic ones assumed L:1/4. Let's fix generic ones too:
    if (beatsPerMeasure === 3) {
        finalDrumTrack = drumTrack.map(m => `[C,^F,]2 D,2 D,2`).join(' | ');
    } else if (beatsPerMeasure === 2 && timeSignature !== '6/8') {
        finalDrumTrack = drumTrack.map(m => `[C,^F,]2 D,2`).join(' | ');
    }
    
    newAbc += finalDrumTrack + ' |]\n';
    
    return newAbc;
};
