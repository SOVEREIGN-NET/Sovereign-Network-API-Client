#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.map.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      // Fix relative imports without .js extension
      // Match: from './something' or '../something' but exclude cases where path already ends with .js
      content = content.replace(
        /from\s+['"](\.[^'"]+)['"];/g,
        (match, importPath) => {
          // Only add .js if it doesn't already have it
          if (!importPath.endsWith('.js')) {
            return `from '${importPath}.js';`;
          }
          return match;
        }
      );

      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    }
  }
}

fixImports(path.join(__dirname, '..', 'dist'));
console.log('✅ All imports fixed with .js extensions');
