// Webpack-safe Jest Worker mock that prevents crashes but maintains compatibility
module.exports = {
  Worker: class WebpackSafeWorker {
    constructor(workerPath, options = {}) {
      this.workerPath = workerPath;
      this.options = options;
      console.log('🛡️ Using webpack-safe Jest worker mock for:', workerPath);
    }
    
    getStdout() { 
      return { 
        pipe: () => {},
        on: () => {},
        once: () => {}
      }; 
    }
    
    getStderr() { 
      return { 
        pipe: () => {},
        on: () => {},
        once: () => {}
      }; 
    }
    
    end() { 
      return Promise.resolve(); 
    }
    
    send(method, args, callback) { 
      // For compilation tasks, return the input unchanged
      if (callback && typeof callback === 'function') {
        setImmediate(() => callback(null, args[0] || ''));
      }
      return Promise.resolve(args[0] || ''); 
    }
    
    // Specific method mocks for different worker types
    transform(code, options) {
      return Promise.resolve(code);
    }
    
    transformAsync(code, options) {
      return Promise.resolve(code);
    }
    
    loadStaticPaths() {
      return Promise.resolve([]);
    }
    
    // Event emitter compatibility
    on() {}
    once() {}
    emit() {}
    removeListener() {}
  }
};