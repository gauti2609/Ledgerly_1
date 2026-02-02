
import * as fs from 'fs';
import * as path from 'path';

const dir = './recovered_json';
if (!fs.existsSync(dir)) {
    console.error('Directory not found:', dir);
    process.exit(1);
}
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let allGroupings = new Set();
const regex = /\"code\":\"([A-Z]\.\d+(\.\d+)?)\",\"name\":\"(.*?)\"/g;

files.forEach(f => {
    try {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            allGroupings.add(`${match[1]} | ${match[3]}`);
        }
    } catch (e) { }
});

console.log('--- Found Groupings ---');
Array.from(allGroupings).sort().forEach(g => console.log(g));
