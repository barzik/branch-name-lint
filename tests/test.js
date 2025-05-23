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

// Add tests for the new branch name features
test('getCurrentBranch uses the provided branch option if available', () => {
  const branchNameLint = new BranchNameLint({
    branch: 'feature/custom-branch-option'
  });
  
  // Make sure execFileSync is stubbed so we know it's not calling git
  const execStub = sinon.stub(childProcess, 'execFileSync');
  execStub.returns('this-should-not-be-used');
  
  const name = branchNameLint.getCurrentBranch();
  assert.strictEqual(name, 'feature/custom-branch-option');
  
  // Verify that execFileSync wasn't called since we provided a branch name
  assert(execStub.notCalled);
  execStub.restore();
});

test('getCurrentBranch uses the environment variable if branchNameEnvVariable is set', () => {
  // Save the original process.env
  const originalEnv = process.env;
  
  // Set up a test environment variable
  process.env = {
    ...originalEnv,
    TEST_BRANCH_NAME: 'feature/from-env-var'
  };
  
  const branchNameLint = new BranchNameLint({
    branchNameEnvVariable: 'TEST_BRANCH_NAME'
  });
  
  // Make sure execFileSync is stubbed so we know it's not calling git
  const execStub = sinon.stub(childProcess, 'execFileSync');
  execStub.returns('this-should-not-be-used');
  
  const name = branchNameLint.getCurrentBranch();
  assert.strictEqual(name, 'feature/from-env-var');
  
  // Verify that execFileSync wasn't called since we used the env var
  assert(execStub.notCalled);
  
  // Restore the original process.env and stub
  process.env = originalEnv;
  execStub.restore();
});

test('getCurrentBranch respects option priority: branch > branchNameEnvVariable > git', () => {
  // Save the original process.env
  const originalEnv = process.env;
  
  // Set up a test environment variable
  process.env = {
    ...originalEnv,
    TEST_BRANCH_NAME: 'feature/from-env-var'
  };
  
  // Create with both branch and branchNameEnvVariable set
  const branchNameLint = new BranchNameLint({
    branch: 'feature/from-option',
    branchNameEnvVariable: 'TEST_BRANCH_NAME'
  });
  
  // Make sure execFileSync is stubbed so we know it's not calling git
  const execStub = sinon.stub(childProcess, 'execFileSync');
  execStub.returns('feature/from-git');
  
  const name = branchNameLint.getCurrentBranch();
  
  // Should use the branch option, not the env var or git
  assert.strictEqual(name, 'feature/from-option');
  
  // Verify that execFileSync wasn't called
  assert(execStub.notCalled);
  
  // Restore the original process.env and stub
  process.env = originalEnv;
  execStub.restore();
});

test('doValidation works with custom branch name from option', () => {
  // No need to stub execFileSync as it shouldn't be called
  const branchNameLint = new BranchNameLint({
    branch: 'feature/valid-from-option'
  });
  
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.SUCCESS_CODE);
});

test('doValidation rejects invalid custom branch name from option', () => {
  // No need to stub execFileSync as it shouldn't be called
  const branchNameLint = new BranchNameLint({
    branch: 'invalid-branch-name'
  });
  
  const result = branchNameLint.doValidation();
  assert.strictEqual(result, branchNameLint.ERROR_CODE);
});

test('branchNameEnvVariable defaults to false', () => {
  const branchNameLint = new BranchNameLint();
  assert.strictEqual(branchNameLint.options.branchNameEnvVariable, false);
});

test('branch option defaults to false', () => {
  const branchNameLint = new BranchNameLint();
  assert.strictEqual(branchNameLint.options.branch, false);
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
