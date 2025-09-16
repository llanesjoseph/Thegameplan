const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase Hosting Deployment...\n');

// Step 1: Fix dynamic routes for static export
console.log('📝 Step 1: Fixing dynamic routes for static export...');

const dynamicRoutes = [
  'app/contributors/[creatorId]/page.tsx',
  'app/dashboard/creator/[creatorId]/page.tsx'
];

dynamicRoutes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add generateStaticParams if not present
    if (!content.includes('generateStaticParams')) {
      const generateStaticParams = `
export async function generateStaticParams() {
  // Return empty array for now - will be populated at runtime
  return [];
}
`;
      
      // Insert before the default export
      content = content.replace(
        /export default function/,
        `${generateStaticParams}\n\nexport default function`
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Added generateStaticParams to ${routePath}`);
    }
  }
});

// Step 2: Update Next.js config for deployment
console.log('\n📝 Step 2: Updating Next.js configuration...');

const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Update config for better deployment
nextConfig = nextConfig.replace(
  /output: 'export',/,
  "output: 'export',\n  skipTrailingSlashRedirect: true,\n  skipMiddlewareUrlNormalize: true,"
);

fs.writeFileSync(nextConfigPath, nextConfig);
console.log('✅ Updated Next.js config for deployment');

// Step 3: Build the application
console.log('\n🔨 Step 3: Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Deploy to Firebase Hosting
console.log('\n🚀 Step 4: Deploying to Firebase Hosting...');
try {
  execSync('firebase deploy --only hosting --project gameplan-787a2', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Deployment completed successfully!');
console.log('🌐 Your app is live at: https://cruciblegameplan.web.app');
