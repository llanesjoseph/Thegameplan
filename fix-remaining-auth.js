const fs = require('fs');

const files = [
  'app/dashboard/coach/resources/page.tsx',
  'app/dashboard/coach/videos/page.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add useEffect and useRouter to imports
  content = content.replace(
    /import { useState, Suspense } from 'react'/,
    "import { useState, useEffect, Suspense } from 'react'"
  );
  content = content.replace(
    /import { useSearchParams } from 'next\/navigation'/,
    "import { useSearchParams, useRouter } from 'next/navigation'"
  );

  // 2. Add router variable after searchParams
  content = content.replace(
    /(const searchParams = useSearchParams\(\)\s+const embedded = searchParams\.get\('embedded'\) === 'true')/,
    (match) => {
      // Check if router is already added
      if (content.includes('const router = useRouter()')) {
        return match;
      }
      return `const { user, loading: authLoading } = useAuth()\n  const router = useRouter()\n  ${match}`;
    }
  );

  // 3. Remove duplicate auth checks outside component (at the end of file)
  content = content.replace(
    /\n\s*\/\/ Authentication check\s+useEffect\(\(\) => \{[\s\S]*?\}, \[user, authLoading, embedded, router\]\)\s*$/,
    ''
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
});
