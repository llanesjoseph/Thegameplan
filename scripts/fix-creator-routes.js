// Script to update all /dashboard/creator references to /dashboard/coach-unified or /dashboard
const fs = require('fs');
const path = require('path');

const updates = [
  // Component files - route to /dashboard for bulletproof routing
  {
    file: 'app/dashboard/overview/page.tsx',
    find: "router.replace('/dashboard/creator')",
    replace: "router.replace('/dashboard/coach-unified')"
  },
  {
    file: 'app/dashboard/layout.tsx',
    find: "const isCreatorPage = pathname?.startsWith('/dashboard/creator')",
    replace: "const isCreatorPage = false // Legacy creator page removed"
  },
  {
    file: 'app/dashboard/creator-simple/page.tsx',
    find: 'href="/dashboard/creator"',
    replace: 'href="/dashboard/coach-unified"',
    replaceAll: true
  },
  {
    file: 'components/ui/SuperAdminTabs.tsx',
    find: "defaultPath: '/dashboard/creator'",
    replace: "defaultPath: '/dashboard/coach-unified'"
  },
  {
    file: 'components/ui/AdminTabs.tsx',
    find: "defaultPath: '/dashboard/creator'",
    replace: "defaultPath: '/dashboard/coach-unified'"
  },
  {
    file: 'app/contributors/[creatorId]/client-component.tsx',
    find: "router.push('/dashboard/creator')",
    replace: "router.push('/dashboard/coach-unified')"
  },
  {
    file: 'app/contributors/apply/page.tsx',
    find: "router.push('/dashboard/creator')",
    replace: "router.push('/dashboard/coach-unified')"
  },
  {
    file: 'app/dashboard/admin/creator-applications/page.tsx',
    find: "router.push('/dashboard/creator')",
    replace: "router.push('/dashboard')"
  },
  {
    file: 'app/emergency-fix/page.tsx',
    find: "window.location.href = '/dashboard/creator'",
    replace: "window.location.href = '/dashboard/coach-unified'"
  },
  // Email templates
  {
    file: 'lib/email-service.ts',
    find: '${APP_URL}/dashboard/creator/athletes',
    replace: '${APP_URL}/dashboard/coach/athletes'
  },
  {
    file: 'app/api/coach-application/approve/route.ts',
    find: 'https://playbookd.com/dashboard/creator',
    replace: 'https://playbookd.com/dashboard/coach-unified'
  },
  // Breadcrumb
  {
    file: 'components/DashboardBreadcrumb.tsx',
    find: " '/dashboard/creator': 'Lesson Studio',\n '/dashboard/creator/requests': 'Coaching Requests',\n '/dashboard/creator/schedule': 'My Schedule',\n '/dashboard/creator/analytics': 'Analytics',",
    replace: " '/dashboard/coach-unified': 'Coach Dashboard',"
  }
];

console.log('🔧 Updating /dashboard/creator references...\n');

let successCount = 0;
let failCount = 0;

updates.forEach(update => {
  const filePath = path.join(__dirname, '..', update.file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${update.file}`);
      failCount++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    if (update.replaceAll) {
      // Replace all occurrences
      const regex = new RegExp(update.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, update.replace);
    } else {
      // Replace first occurrence
      content = content.replace(update.find, update.replace);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${update.file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Error updating ${update.file}:`, error.message);
    failCount++;
  }
});

console.log(`\n📊 Results: ${successCount} updated, ${failCount} failed`);
console.log('✨ Done! Remember to update test files manually if needed.');
