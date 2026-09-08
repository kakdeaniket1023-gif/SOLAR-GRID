const fs = require('fs');
const path = require('path');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDir(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const rootDir = process.cwd();
const allFiles = scanDir(rootDir).map(f => path.relative(rootDir, f).replace(/\\/g, '/'));

const appPages = allFiles.filter(f => f.startsWith('app/') && (f.endsWith('page.tsx') || f.endsWith('page.ts') || f.endsWith('page.jsx') || f.endsWith('page.js')));
const appRoutes = allFiles.filter(f => f.startsWith('app/') && (f.endsWith('route.ts') || f.endsWith('route.js')));
const layouts = allFiles.filter(f => f.startsWith('app/') && f.includes('layout.tsx'));
const components = allFiles.filter(f => f.startsWith('components/'));
const libs = allFiles.filter(f => f.startsWith('lib/'));
const tests = allFiles.filter(f => f.startsWith('tests/'));
const database = allFiles.filter(f => f.startsWith('database/'));

console.log('=== SOLARGRID FULL INVENTORY ===');
console.log(`\n--- APP PAGES (${appPages.length}) ---`);
appPages.forEach(p => console.log('  Page:', p.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/'));

console.log(`\n--- API ROUTES (${appRoutes.length}) ---`);
appRoutes.forEach(r => console.log('  API:', r.replace(/^app/, '').replace(/\/route\.ts$/, '')));

console.log(`\n--- LAYOUTS (${layouts.length}) ---`);
layouts.forEach(l => console.log('  Layout:', l));

console.log(`\n--- COMPONENTS (${components.length}) ---`);
components.forEach(c => console.log('  Component:', c));

console.log(`\n--- LIB / ENGINES (${libs.length}) ---`);
libs.forEach(l => console.log('  Lib:', l));

console.log(`\n--- DATABASE FILES (${database.length}) ---`);
database.forEach(d => console.log('  DB:', d));

console.log(`\n--- TESTS (${tests.length}) ---`);
tests.forEach(t => console.log('  Test:', t));
