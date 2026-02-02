
import fs from 'fs';
import path from 'path';

const dir = 'recovered_json';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let maxGroupings = 0;
let bestFile = '';

files.forEach(f => {
    try {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        // Simple regex to count occurrences of "code":"
        // or try to find the "groupings" array length if it's clean JSON
        let groupingsMatch = content.match(/"groupings"\s*:\s*\[(.*?)\]/s);
        if (groupingsMatch) {
            const count = (groupingsMatch[1].match(/"code"/g) || []).length;
            if (count > maxGroupings) {
                maxGroupings = count;
                bestFile = f;
            }
        }
    } catch (e) { }
});

console.log(`Best File: ${bestFile} with ${maxGroupings} groupings.`);
