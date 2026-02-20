import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '../../src/data');

function readJsonFile(filename: string) {
  const filePath = path.join(dataDir, filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

const employees = readJsonFile('employees.json');

// Find Emily Chen
const emily = employees.find((e: any) => e.name === 'Emily Chen');

console.log('Emily Chen from employees.json:');
console.log(JSON.stringify(emily, null, 2));
console.log('\n_id field type:', typeof emily._id);
console.log('_id value:', emily._id);
