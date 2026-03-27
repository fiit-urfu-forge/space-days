const fs = require('fs');
const path = require('path');

const partnersDir = path.join(__dirname, '..', 'src', 'shared', 'image', 'partners');
const outputDir = path.join(__dirname, '..', 'src', 'generated');
const outputFile = path.join(outputDir, 'partners.json');

const exclude = ['default.png', 'Screenshot_20231224_020949.png'];

const partners = fs.readdirSync(partnersDir)
  .filter(f => f.endsWith('.png') && !exclude.includes(f))
  .map(f => f.replace('.png', ''))
  .sort();

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(partners, null, 2) + '\n');

console.log(`Generated partners.json with ${partners.length} partners`);
