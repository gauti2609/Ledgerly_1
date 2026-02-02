
import * as fs from 'fs';
import * as path from 'path';

const walFiles = [
    '000000010000000000000008',
    '000000010000000000000009'
];
const walDir = 'C:/Program Files/PostgreSQL/16/data/pg_wal';
const outputDir = 'recovered_json';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function recoverJSON() {
    let count = 0;
    const keyword = Buffer.from('ledger');

    for (const walFile of walFiles) {
        const filePath = path.join(walDir, walFile);
        if (!fs.existsSync(filePath)) {
            console.log(`WAL file ${walFile} not found, skipping.`);
            continue;
        }
        console.log(`Processing ${walFile}...`);
        const buffer = fs.readFileSync(filePath);
        let pos = 0;

        while ((pos = buffer.indexOf(keyword, pos)) !== -1) {
            let start = pos;
            for (let i = 0; i < 2000 && start > 0; i++) {
                if (buffer[start] === 123) break;
                start--;
            }

            if (buffer[start] === 123) {
                let end = start;
                let braceCount = 0;
                let found = false;
                while (end < Math.min(start + 200000, buffer.length)) {
                    if (buffer[end] === 123) braceCount++;
                    if (buffer[end] === 125) braceCount--;
                    if (braceCount === 0 && end > start) {
                        found = true;
                        break;
                    }
                    end++;
                }

                if (found) {
                    const jsonStr = buffer.slice(start, end + 1).toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
                    if (jsonStr.length > 500) {
                        fs.writeFileSync(`${outputDir}/recovered_${walFile}_${count}.json`, jsonStr);
                        console.log(`Saved recovered_${walFile}_${count}.json (Length: ${jsonStr.length})`);
                        count++;
                    }
                }
            }
            pos += keyword.length;
        }
    }
}

recoverJSON();
