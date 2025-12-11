const fs = require('fs');
const path = require('path');

function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles('app');
let totalFixed = 0;
let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let modified = false;

  // Find all lines with "const X = await user.getIdToken()"
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line has the pattern and doesn't already have a null check before it
    if (line.match(/const\s+\w+\s*=\s*await\s+user\.getIdToken\(\)/) &&
        (i === 0 || !lines[i-1].includes('if (!user)'))) {

      // Get the indentation
      const indent = line.match(/^(\s*)/)[1];

      // Add null check before the getIdToken line
      newLines.push(`${indent}if (!user) { console.error('No user found'); return; }`);
      newLines.push(line);
      totalFixed++;
      modified = true;
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    fs.writeFileSync(file, newLines.join('\n'));
    console.log(`✅ Fixed ${path.basename(file)}`);
    filesModified++;
  }
}

console.log(`\n🎉 Total: ${filesModified} files modified, ${totalFixed} fixes applied`);
