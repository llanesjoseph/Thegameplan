const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all route.ts files in app/api
const findApiRoutes = (dir) => {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findApiRoutes(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  }

  return results;
};

const apiRoutes = findApiRoutes(path.join(__dirname, '..', 'app', 'api'));

console.log(`Found ${apiRoutes.length} API routes to fix`);

let fixed = 0;
let skipped = 0;

for (const routePath of apiRoutes) {
  const content = fs.readFileSync(routePath, 'utf-8');

  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`✓ Already fixed: ${routePath}`);
    skipped++;
    continue;
  }

  // Find the first import statement
  const importMatch = content.match(/^import .+$/m);

  if (!importMatch) {
    console.log(`⚠ No imports found, skipping: ${routePath}`);
    skipped++;
    continue;
  }

  // Find where imports end (last import statement)
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    console.log(`⚠ Could not find import section, skipping: ${routePath}`);
    skipped++;
    continue;
  }

  // Insert the dynamic config after imports
  lines.splice(lastImportIndex + 1, 0, '');
  lines.splice(lastImportIndex + 2, 0, '// Force dynamic rendering for API route');
  lines.splice(lastImportIndex + 3, 0, 'export const dynamic = \'force-dynamic\'');
  lines.splice(lastImportIndex + 4, 0, 'export const runtime = \'nodejs\'');

  const newContent = lines.join('\n');
  fs.writeFileSync(routePath, newContent, 'utf-8');

  console.log(`✅ Fixed: ${routePath}`);
  fixed++;
}

console.log(`\n✅ Fixed ${fixed} routes`);
console.log(`⏭ Skipped ${skipped} routes (already fixed or no imports)`);
