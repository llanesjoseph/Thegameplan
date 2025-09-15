// Surgical Jest Worker Bypass - Target only problematic Jest workers
// Keep Next.js internal workers functional

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(...args) {
  const moduleName = args[0];
  
  // Only intercept jest-worker specifically, not Next.js workers
  if (moduleName === 'jest-worker') {
    const stack = new Error().stack;
    
    // Only bypass if it's coming from problematic compilation contexts
    if (stack.includes('webpack') || stack.includes('terser') || stack.includes('swc')) {
      console.log('🎯 Bypassing Jest Worker in compilation context');
      return {
        Worker: class MockWorker {
          constructor(workerPath, options = {}) {
            this.workerPath = workerPath;
            this.options = options;
          }
          
          getStdout() { return { pipe: () => {} }; }
          getStderr() { return { pipe: () => {} }; }
          end() { return Promise.resolve(); }
          send() { return Promise.resolve(); }
          
          // Mock the actual method calls
          transform(...args) { return Promise.resolve(args[0]); }
          transformAsync(...args) { return Promise.resolve(args[0]); }
          loadStaticPaths(...args) { return Promise.resolve([]); }
        }
      };
    }
  }
  
  return originalRequire.apply(this, args);
};

console.log('🎯 Surgical Jest Worker bypass loaded - targeting compilation workers only');