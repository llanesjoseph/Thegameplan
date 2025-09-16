const fs = require('fs');
const path = require('path');

// List of files that need import fixes
const filesToFix = [
  'app/dashboard/requests/page.tsx',
  'app/admin/seed-complete/page.tsx',
  'app/admin/seed-direct/page.tsx',
  'app/api/provision-superadmin/route.ts',
  'hooks/use-auth.ts',
  'app/dashboard/superadmin/page.tsx',
  'app/contributors/page.tsx',
  'app/contributors/apply/page.tsx',
  'app/dashboard/admin/creator-applications/page.tsx',
  'app/dashboard/creator/page.tsx',
  'app/dashboard/creator/requests/page.tsx',
  'app/dashboard/creator/schedule/page.tsx',
  'lib/disclaimer-tracking.ts',
  'app/gear/page.tsx',
  'app/lessons/page.tsx',
  'components/gear/CreatorGearManager.tsx',
  'app/dashboard/page.tsx',
  'components/auth/GoogleSignInButton.tsx',
  'app/onboarding/page.tsx',
  'app/dashboard/coaching/page.tsx',
  'components/auth/AppleSignInButton.tsx',
  'components/auth/EmailSignInButton.tsx',
  'app/admin/contributors/page.tsx',
  'components/ContributorsClient.tsx',
  'hooks/use-user-creation.ts',
  'hooks/use-role.ts',
  'hooks/useUserProfile.ts',
  'lib/analytics.ts',
  'components/subscription/CheckoutButton.tsx',
  'components/ui/UserProfileDropdown.tsx',
  'app/dashboard/profile/page.tsx',
  'app/dashboard/creator/page-original.tsx',
  'app/dashboard/overview/page-old.tsx',
  'app/dashboard/creator-simple/page.tsx',
  'app/dashboard/schedule/page.tsx',
  'app/dashboard/progress/page.tsx',
  'app/dashboard/admin/users/page.tsx',
  'app/dashboard/admin/analytics/page.tsx',
  'app/dashboard/admin/content/page.tsx',
  'app/dashboard/admin/settings/page.tsx',
  'app/dashboard/superadmin/analytics/page.tsx'
];

function fixFirebaseImport(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the import
    const oldImport = "import { db } from '@/lib/firebase'";
    const newImport = "import { db } from '@/lib/firebase.client'";
    
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No fix needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing Firebase imports for deployment...\n');
  
  let fixedCount = 0;
  let totalCount = filesToFix.length;
  
  filesToFix.forEach(filePath => {
    if (fixFirebaseImport(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalCount}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files skipped: ${totalCount - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✅ Firebase import fixes completed!');
  } else {
    console.log('\n⏭️  No Firebase imports needed fixing.');
  }
}

main();
