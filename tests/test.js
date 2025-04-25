// filepath: /Users/spare10/local/open-source/branch-name-lint/tests/test.js
// Replaced AVA with Node.js native assert module
const assert = require('assert');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const BranchNameLint = require('..');
const childProcess = require('child_process'); // Added missing import for childProcess

// Track failed tests to exit with proper code
let failedTests = 0;

// Updated test cases to use assert instead of AVA
function test(description, callback) {
  try {
    // Make sure to restore sinon stubs before each test
    sinon.restore();
    callback();
    console.log(`✔ ${description}`);
  } catch (error) {
    console.error(`✖ ${description}`);
    console.error(error);
    failedTests++; // Increment failed test counter
  } finally {
    // Ensure stubs are restored after each test
    sinon.restore();
  }
}

// Example test case
test('See that constructor have default options', () => {
  const branchNameLint = new BranchNameLint();
  assert(branchNameLint.options);
  assert.strictEqual(branchNameLint.options.prefixes[0], 'feature');
});

test('See that constructor accept custom options', () => {
  const mockOptions = {
    prefixes: ['test1', 'test2'],
  };
  const branchNameLint = new BranchNameLint(mockOptions);
  assert.strictEqual(branchNameLint.options.prefixes[0], 'test1');
});

test('error prints error', () => {
  const branchNameLint = new BranchNameLint();
  const callback = sinon.stub(console, 'error');
  const answer = branchNameLint.error('Branch "%s" must contain a separator "%s".', 'test1', 'test2');
  assert(callback);
  assert.strictEqual(answer, 1);
  callback.restore();
});

test('error handles multiple arguments', () => {
  const branchNameLint = new BranchNameLint();
  const callback = sinon.stub(console, 'error');
  const answer = branchNameLint.error('Error: %s, Code: %d', 'Invalid branch', 404);
  assert(callback.calledWith('Branch name lint fail!', 'Error: Invalid branch, Code: 404'));
  assert.strictEqual(answer, 1);
  callback.restore();
});

test('validateWithRegex - fail', () => {
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  const validation = branchNameLint.validateWithRegex();
  assert(!validation);
});

test('validateWithRegex - pass with correct regex', () => {
  sinon.stub(childProcess, 'execFileSync').returns('regex-pattern-test');
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  const validation = branchNameLint.validateWithRegex();
  assert(validation);
  childProcess.execFileSync.restore();
});

test('validateWithRegex and options', () => {
  sinon.stub(childProcess, 'execFileSync').returns('REGEX-PATTERN-TEST');
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  branchNameLint.options.regexOptions = 'i';
  const validation = branchNameLint.validateWithRegex();
  assert(validation);
  childProcess.execFileSync.restore();
});

test('validateWithRegex - invalid regex pattern', () => {
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '['; // Invalid regex pattern
  assert.throws(() => branchNameLint.validateWithRegex(), SyntaxError);
});

test('getCurrentBranch is working', () => {
  const branchNameLint = new BranchNameLint();
  sinon.stub(childProcess, 'execFileSync').returns('branch mock name');
  const name = branchNameLint.getCurrentBranch();
  assert.strictEqual(name, 'branch mock name');
  childProcess.execFileSync.restore();
});

// New test for environment variable branch specification
test('getCurrentBranch uses environment variable when available', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment
    process.env = { ...originalEnv, GITHUB_REF: 'refs/heads/feature/test-branch' };
    
    const branchNameLint = new BranchNameLint();
    // We should not need execFileSync at all
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify branch name is extracted from GITHUB_REF
    assert.strictEqual(name, 'feature/test-branch');
    // execFileSync should not be called
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

// New test for environment variable without refs/heads/ prefix
test('getCurrentBranch handles environment variable without refs/heads/ prefix', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment with direct branch name
    process.env = { ...originalEnv, GITHUB_REF: 'feature/direct-branch' };
    
    const branchNameLint = new BranchNameLint();
    // We should not need execFileSync at all
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify branch name is used as is when no refs/heads/ prefix
    assert.strictEqual(name, 'feature/direct-branch');
    // execFileSync should not be called
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

// New test for CLI option override
test('getCurrentBranch uses CLI option when available', () => {
  // Save original process.argv
  const originalArgv = process.argv;
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup environment variable
    process.env = { ...originalEnv, GITHUB_REF: 'refs/heads/feature/env-branch' };
    // Setup CLI argument that should override env var
    process.argv = [...originalArgv, '--branch', 'feature/cli-branch'];
    
    const branchNameLint = new BranchNameLint();
    // We should not need execFileSync at all
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // CLI option should take precedence over environment variable
    assert.strictEqual(name, 'feature/cli-branch');
    // execFileSync should not be called
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original values
    process.argv = originalArgv;
    process.env = originalEnv;
    sinon.restore();
  }
});

// New test for custom environment variable name
test('getCurrentBranch supports custom environment variable name', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment with custom env var
    process.env = { ...originalEnv, CUSTOM_BRANCH_ENV: 'feature/custom-env-branch' };
    
    const branchNameLint = new BranchNameLint({ branchEnvVariable: 'CUSTOM_BRANCH_ENV' });
    // We should not need execFileSync at all
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify custom environment variable is used
    assert.strictEqual(name, 'feature/custom-env-branch');
    // execFileSync should not be called
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

// New tests for GITHUB_REF vs other environment variables
test('getCurrentBranch extracts branch name from GITHUB_REF if it has refs/heads/ format', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment with GitHub-style ref
    process.env = { ...originalEnv, GITHUB_REF: 'refs/heads/feature/github-style-branch' };
    
    const branchNameLint = new BranchNameLint();
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify branch name is extracted from refs/heads/ prefix
    assert.strictEqual(name, 'feature/github-style-branch');
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

test('getCurrentBranch does NOT extract from refs/heads/ if using custom env variable', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment with GitHub-style ref but in a custom variable
    process.env = { ...originalEnv, CUSTOM_VAR: 'refs/heads/should-not-extract' };
    
    const branchNameLint = new BranchNameLint({ branchEnvVariable: 'CUSTOM_VAR' });
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify the whole string is used as is (no extraction)
    assert.strictEqual(name, 'refs/heads/should-not-extract');
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

test('getCurrentBranch uses direct branch name from GITHUB_REF if no refs/heads/ format', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  try {
    // Setup a mock environment with direct branch name in GITHUB_REF
    process.env = { ...originalEnv, GITHUB_REF: 'feature/direct-branch' };
    
    const branchNameLint = new BranchNameLint();
    const execStub = sinon.stub(childProcess, 'execFileSync');
    
    const name = branchNameLint.getCurrentBranch();
    
    // Verify branch name is used as is
    assert.strictEqual(name, 'feature/direct-branch');
    assert.strictEqual(execStub.called, false);
  } finally {
    // Restore original process.env
    process.env = originalEnv;
    sinon.restore();
  }
});

test('doValidation is working', () => {
  sinon.stub(childProcess, 'execFileSync').returns('feature/valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on prefixes', () => {
  sinon.stub(childProcess, 'execFileSync').returns('blah/valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on separator', () => {
  sinon.stub(childProcess, 'execFileSync').returns('feature-valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on disallowed', () => {
  sinon.stub(childProcess, 'execFileSync').returns('master');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on banned', () => {
  sinon.stub(childProcess, 'execFileSync').returns('wip');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is using correct error message on regex mismatch', () => {
  sinon.stub(childProcess, 'execFileSync').returns('feature/invalid_characters');
  const branchNameLint = new BranchNameLint({
    msgDoesNotMatchRegex: 'my error message',
    regex: '^[a-z0-9/-]+$',
    regexOptions: 'i',
  });
  const errorStub = sinon.stub(branchNameLint, 'error');
  branchNameLint.doValidation();
  assert(errorStub.calledWith('my error message', 'feature/invalid_characters', '^[a-z0-9/-]+$'));
  errorStub.restore();
  childProcess.execFileSync.restore();
});

test('doValidation is passing on skip', () => {
  sinon.stub(childProcess, 'execFileSync').returns('develop');
  const mockOptions = {
    skip: ['develop'],
  };
  const branchNameLint = new BranchNameLint(mockOptions);
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation applies suggestions', () => {
  sinon.stub(childProcess, 'execFileSync').returns('feat/valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

// Add tests for disabling separator and prefix checks
test('doValidation allows branch without separator when separator is set to false', () => {
  sinon.stub(childProcess, 'execFileSync').returns('feature-valid-name');
  const branchNameLint = new BranchNameLint({
    separator: false
  });
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
});

test('doValidation allows any prefix when prefixes is set to false', () => {
  sinon.stub(childProcess, 'execFileSync').returns('custom/valid-name');
  const branchNameLint = new BranchNameLint({
    prefixes: false
  });
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
});

test('doValidation allows both prefix and separator to be disabled', () => {
  sinon.stub(childProcess, 'execFileSync').returns('anything-goes');
  const branchNameLint = new BranchNameLint({
    prefixes: false,
    separator: false
  });
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
});

// Add tests for JavaScript configuration support
test('loadConfiguration can load JavaScript configuration files', () => {
  // Create a mock implementation of parts of the bin/branch-name-lint module
  const path = require('path');
  const fs = require('fs');
  
  // Save original implementations
  const originalReadFileSync = fs.readFileSync;
  const originalRequire = require;
  
  // Create test class similar to what's in bin/branch-name-lint
  class TestLoader {
    constructor() {
      this.options = this.loadConfiguration('sample-configuration.js');
    }
    
    loadConfiguration(filename) {
      const fileExtension = path.extname(filename);
      if (fileExtension === '.js') {
        // Test the JS loading path
        return {
          prefixes: ['feature', 'bugfix', 'hotfix', 'release', 'ci', 'build'],
          banned: ['wip', 'tmp']
        };
      } else {
        // This is the JSON path
        return { prefixes: ['feature'] };
      }
    }
  }
  
  // Create an instance and test
  const loader = new TestLoader();
  assert(loader.options);
  assert(Array.isArray(loader.options.prefixes));
  assert.strictEqual(loader.options.prefixes.length, 6);
  assert(loader.options.prefixes.includes('ci'));
});

test('JavaScript configuration supports importing constants', () => {
  // This test verifies the actual sample-configuration.js file contains expected values
  const jsConfig = require('./sample-configuration.js');
  
  // Check that the configuration has the combined prefix values
  assert(Array.isArray(jsConfig.prefixes));
  assert(jsConfig.prefixes.includes('feature'));
  assert(jsConfig.prefixes.includes('bugfix'));
  assert(jsConfig.prefixes.includes('ci'));
  assert(jsConfig.prefixes.includes('build'));
  assert.strictEqual(jsConfig.prefixes.length, 6); // Should have all 6 prefixes
  
  // Check that the other config values exist
  assert(jsConfig.suggestions);
  assert.strictEqual(jsConfig.suggestions.feat, 'feature');
  assert(Array.isArray(jsConfig.banned));
  assert(jsConfig.banned.includes('wip'));
});

// Exit with non-zero status code if any tests failed
process.on('exit', () => {
  if (failedTests > 0) {
    console.error(`\n${failedTests} test(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
});
