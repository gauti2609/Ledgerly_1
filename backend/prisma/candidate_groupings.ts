
import * as fs from 'fs';
import * as path from 'path';

const STANDARD_NAMES = new Set([
    'Land', 'Buildings', 'Plant & Machinery', 'Furniture & Fixtures', 'Vehicles', 'Office Equipment', 'Computers / IT Equipment', 'Electrical Installations', 'Leasehold Improvements', 'Assets under Finance Lease', 'Other PPE',
    'Goodwill', 'Computer Software', 'Brands / Trademarks', 'Licences & Franchises', 'Patents & Copyrights', 'Technical Know-how', 'Other Intangible Assets',
    'Capital Advances', 'Loans to Related Parties', 'Security Deposits', 'Other Long-term Advances', 'Advance Income-tax (LT portion)',
    'Salaries & Wages', 'PF / ESI / Superannuation', 'Staff Welfare', 'Finance Costs', 'Other Expenses'
    // ... add more if needed
]);

const file = './recovered_json/recovered_000000010000000000000009_15.json';
const content = fs.readFileSync(file, 'utf8');

// Match Title Case strings (2-5 words)
const regex = /[A-Z][a-z]+( [A-Z][a-z]+){1,4}/g;
const matches = content.match(regex);

const uniqueCustom = new Set();
if (matches) {
    matches.forEach(m => {
        if (!STANDARD_NAMES.has(m) && m.length > 5 && m.length < 40) {
            uniqueCustom.add(m);
        }
    });
}

console.log('--- Custom Grouping Candidates ---');
Array.from(uniqueCustom).sort().forEach(c => console.log(c));
