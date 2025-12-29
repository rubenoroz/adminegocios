
const XLSX = require('xlsx');
const fs = require('fs');
const path = '/Users/rubenoroz/adminegocios/Referencias';

const files = [
    'HORARIOS 2021.xlsx',
    'Nomina Colima .xls',
    'RELACION COLIMA 2019.xlsx',
    'MANZANERO 2021.xlsx'
];

files.forEach(file => {
    try {
        const filePath = path + '/' + file;
        if (fs.existsSync(filePath)) {
            console.log(`\n--- ANALYZING: ${file} ---`);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Get range
            const range = XLSX.utils.decode_range(sheet['!ref']);
            console.log(`Dimensions: ${range.e.r + 1} rows, ${range.e.c + 1} columns`);

            // Print first 5 rows to understand structure
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' });
            console.log('First 5 rows:');
            data.slice(0, 5).forEach((row, i) => {
                console.log(`Row ${i}:`, JSON.stringify(row));
            });
        } else {
            console.log(`File not found: ${file}`);
        }
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
