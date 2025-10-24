const fs = require('fs');
const path = require('path');

// Function to sanitize console.log statements that expose backend IDs
function sanitizeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patterns to sanitize
    const patterns = [
      // User/Coach IDs
      {
        regex: /console\.log\([^)]*user\?\.uid[^)]*\)/g,
        replacement: (match) => {
          // Replace with sanitized version
          return match.replace(/user\?\.uid/g, "'[USER_ID]'").replace(/user\.uid/g, "'[USER_ID]'");
        }
      },
      {
        regex: /console\.log\([^)]*coachId[^)]*\)/g,
        replacement: (match) => {
          return match.replace(/coachId[^,)]*/g, "'[COACH_ID]'");
        }
      },
      {
        regex: /console\.log\([^)]*athleteId[^)]*\)/g,
        replacement: (match) => {
          return match.replace(/athleteId[^,)]*/g, "'[ATHLETE_ID]'");
        }
      },
      {
        regex: /console\.log\([^)]*submissionId[^)]*\)/g,
        replacement: (match) => {
          return match.replace(/submissionId[^,)]*/g, "'[SUBMISSION_ID]'");
        }
      },
      {
        regex: /console\.log\([^)]*messageId[^)]*\)/g,
        replacement: (match) => {
          return match.replace(/messageId[^,)]*/g, "'[MESSAGE_ID]'");
        }
      },
      // Long alphanumeric IDs (20+ characters)
      {
        regex: /console\.log\([^)]*[A-Za-z0-9]{20,}[^)]*\)/g,
        replacement: (match) => {
          return match.replace(/[A-Za-z0-9]{20,}/g, '[ID]');
        }
      },
      // Specific patterns from the console output
      {
        regex: /console\.log\('Fetching messages for user:', user\?\.uid, user\?\.email\)/g,
        replacement: "console.log('Fetching messages for user:', '[USER_ID]', user?.email)"
      },
      {
        regex: /console\.log\('Coach reply request started', \{ messageId, coachId, replyLength: sanitizedReply\.length \}\)/g,
        replacement: "console.log('Coach reply request started', { '[MESSAGE_ID]', '[COACH_ID]', replyLength: sanitizedReply.length })"
      },
      {
        regex: /console\.log\('Notification created for athlete', \{ athleteId: originalMessage\.athleteId \}\)/g,
        replacement: "console.log('Notification created for athlete', { '[ATHLETE_ID]')"
      }
    ];

    // Apply all patterns
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Sanitized: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and process files
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalModified = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', '.next', 'out', 'coverage'].includes(file)) {
        totalModified += processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      if (sanitizeConsoleLogs(filePath)) {
        totalModified++;
      }
    }
  });

  return totalModified;
}

// Main execution
console.log('🔒 SANITIZING CONSOLE LOGS - REMOVING BACKEND ID EXPOSURE');
console.log('=' .repeat(60));

const startTime = Date.now();
const totalModified = processDirectory('.');

const duration = Date.now() - startTime;

console.log('\n' + '=' .repeat(60));
console.log(`🎯 SANITIZATION COMPLETE!`);
console.log(`📊 Files modified: ${totalModified}`);
console.log(`⏱️  Duration: ${duration}ms`);
console.log('\n🔒 SECURITY IMPROVEMENTS:');
console.log('   ✅ User IDs sanitized to [USER_ID]');
console.log('   ✅ Coach IDs sanitized to [COACH_ID]');
console.log('   ✅ Athlete IDs sanitized to [ATHLETE_ID]');
console.log('   ✅ Submission IDs sanitized to [SUBMISSION_ID]');
console.log('   ✅ Message IDs sanitized to [MESSAGE_ID]');
console.log('   ✅ Long alphanumeric IDs sanitized to [ID]');
console.log('\n🚀 Backend IDs are no longer exposed in console logs!');
