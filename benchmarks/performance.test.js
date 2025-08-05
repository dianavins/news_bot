const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

describe('Performance Benchmarks', () => {
  test('package.json parsing performance', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      JSON.parse(fs.readFileSync('package.json', 'utf8'));
    }
    
    const end = performance.now();
    const avgTime = (end - start) / 1000;
    
    console.log(`Average package.json parse time: ${avgTime.toFixed(3)}ms`);
    expect(avgTime).toBeLessThan(1); // Should parse in less than 1ms on average
  });

  test('file system operations performance', () => {
    const start = performance.now();
    
    // Test directory listing performance
    const dirs = ['src', 'lite', 'public', 'electron'];
    
    for (let i = 0; i < 100; i++) {
      dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir);
        }
      });
    }
    
    const end = performance.now();
    const totalTime = end - start;
    
    console.log(`Directory listing performance: ${totalTime.toFixed(2)}ms for 100 iterations`);
    expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
  });

  test('memory usage baseline', () => {
    const before = process.memoryUsage();
    
    // Simulate some work
    const data = [];
    for (let i = 0; i < 10000; i++) {
      data.push({ id: i, title: `Test Story ${i}` });
    }
    
    const after = process.memoryUsage();
    const heapUsed = (after.heapUsed - before.heapUsed) / 1024 / 1024; // MB
    
    console.log(`Memory usage for 10k objects: ${heapUsed.toFixed(2)} MB`);
    expect(heapUsed).toBeLessThan(50); // Should use less than 50MB for test data
    
    // Clean up
    data.length = 0;
  });

  test('TypeScript compilation readiness', () => {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    // Check that essential compilation options are optimized
    expect(tsConfig.compilerOptions.target).toBeDefined();
    expect(tsConfig.compilerOptions.module).toBeDefined();
    expect(tsConfig.compilerOptions.jsx).toBe('react-jsx');
    
    // Ensure source maps and other dev features are configured
    expect(tsConfig.compilerOptions.skipLibCheck).toBe(true);
    expect(tsConfig.compilerOptions.esModuleInterop).toBe(true);
  });

  test('dependency count benchmark', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const totalDeps = Object.keys(packageJson.dependencies || {}).length + 
                     Object.keys(packageJson.devDependencies || {}).length;
    
    console.log(`Total dependencies: ${totalDeps}`);
    
    // Ensure we have reasonable number of dependencies
    expect(totalDeps).toBeGreaterThan(10); // Should have core dependencies
    expect(totalDeps).toBeLessThan(50); // But not too many
  });
});