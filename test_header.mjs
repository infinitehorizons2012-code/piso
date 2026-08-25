import abcjs from 'abcjs';

const firstLineHeader = 'M:2/4\nL:1/8\nK:C';

// Step 1
const lineBlocks1 = [
    'z2 (cA) | "C" G3 A | "C" C3 G | "Am" E2 (ED) |\nw:* | Bóng trăng | * | *\nw:* | 1~2~3 * | * | *\nw:* | C~E~G * | * | *\n',
    '"Am" E3 G | "F" C2 (A,C) | "G" G,3 C | "F" (A,C) (DE) |\nw: to, có | thằng cuội * | già, ôm một * | mối *\n'
];

const abcStep1 = `X:1\nT: THẰNG CUỘI (BÀN NHẠC GIAI ĐIỆU BƯỚC 1)\n${firstLineHeader}\n${lineBlocks1.join('')}`;
const parsedStep1 = abcjs.parseOnly(abcStep1);
console.log('Step 1 lines count:', parsedStep1[0]?.lines?.length);
console.log('Step 1 warnings:', parsedStep1[0]?.warnings);

// Step 2
const lineBlocks2 = [
    'V:1 clef=treble\nz2 (cA) | "C" G3 A | "C" C3 G | "Am" E2 (ED) |\nw:* | Bóng trăng | * | *\nw:* | 1~2~3 * | * | *\nw:* | C~E~G * | * | *\nV:2 clef=bass\n z4 | C, E, G,2 | C, E, G,2 | A,, C, E,2 |',
    'V:1 clef=treble\n"Am" E3 G | "F" C2 (A,C) | "G" G,3 C | "F" (A,C) (DE) |\nw: to, có | thằng cuội * | già, ôm một * | mối *\nV:2 clef=bass\n A,, C, E,2 | F,, A,, C,2 | G,, B,, D,2 | F,, A,, C,2 |'
];

const abcStep2 = `X:1\nT: THẰNG CUỘI (2 TAY PIANO SOLO)\n${firstLineHeader}\n%%score {1 | 2}\n${lineBlocks2.join('\n')}`;
const parsedStep2 = abcjs.parseOnly(abcStep2);
console.log('Step 2 lines count:', parsedStep2[0]?.lines?.length);
console.log('Step 2 warnings:', parsedStep2[0]?.warnings);
