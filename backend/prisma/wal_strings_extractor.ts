
import * as fs from 'fs';

const filePath = 'C:/Program Files/PostgreSQL/16/data/pg_wal/000000010000000000000009';
const outputFile = 'recovered_strings.txt';

function extractStrings() {
    const buffer = fs.readFileSync(filePath);
    let currentString = '';
    const strings = [];

    for (let i = 0; i < buffer.length; i++) {
        const charCode = buffer[i];
        if (charCode >= 32 && charCode <= 126) {
            currentString += String.fromCharCode(charCode);
        } else {
            if (currentString.length > 5) {
                strings.push(currentString);
            }
            currentString = '';
        }
    }

    fs.writeFileSync(outputFile, strings.join('\n'));
    console.log(`Extracted strings to ${outputFile}`);
}

extractStrings();
