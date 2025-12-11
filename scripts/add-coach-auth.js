const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/coach/lessons/create/page.tsx',
  'app/dashboard/coach/invite/page.tsx',
  'app/dashboard/coach/videos/page.tsx',
  'app/dashboard/coach/resources/page.tsx',
  'app/dashboard/coach/analytics/page.tsx',
  'app/dashboard/coach/announcements/page.tsx',
  'app/dashboard/coach/assistants/page.tsx',
  'app/dashboard/coach/profile/page.tsx'
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has auth check
    if (content.includes('Verifying access...')) {
      console.log(`✓ ${path.basename(filePath)} already has auth check`);
      return;
    }

    // 1. Add AlertCircle to imports if not present
    if (!content.includes('AlertCircle')) {
      content = content.replace(
        /} from 'lucide-react'/,
        `,\n  AlertCircle\n} from 'lucide-react'`
      );
    }

    // 2. Update useAuth to get loading state
    content = content.replace(
      /const { user } = useAuth\(\)/g,
      'const { user, loading: authLoading } = useAuth()'
    );

    // 3. Find the component function and add auth check useEffect
    const functionMatch = content.match(/function (\w+Content)\(\) {/);
    if (functionMatch) {
      const authCheck = `
  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[${functionMatch[1].replace('Content', '')}] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])
`;

      // Insert after first useState/useEffect declarations
      const insertPoint = content.indexOf('  const [');
      if (insertPoint > -1) {
        const endOfDeclarations = content.indexOf('\n\n', insertPoint);
        content = content.slice(0, endOfDeclarations) + '\n' + authCheck + content.slice(endOfDeclarations);
      }
    }

    // 4. Add auth loading and error states before return
    const returnMatch = content.match(/  return \(/);
    if (returnMatch) {
      const authStates = `  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  `;

      content = content.replace('  return (', authStates + 'return (');
    }

    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${path.basename(filePath)} updated with auth check`);

  } catch (error) {
    console.error(`✗ Error processing ${path.basename(filePath)}:`, error.message);
  }
});

console.log('\nAuth checks added to all coach pages!');
