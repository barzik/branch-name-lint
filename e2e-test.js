#!/usr/bin/env node

/**
 * End-to-end test for branch-name-lint
 * This script tests the module by:
 * 1. Creating a test directory
 * 2. Initializing a git repo
 * 3. Linking the current module
 * 4. Testing with a bad branch name (should fail)
 * 5. Testing with a good branch name (should pass)
 * 6. Cleaning up the test directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

// Configuration
const TEST_DIR = path.join(__dirname, 'e2e-test-dir');
const GOOD_BRANCH_NAME = 'feature/valid-branch';
const BAD_BRANCH_NAME = 'invalid-branch';
const CONFIG_PATH = path.join(__dirname, 'sample-configuration.json');

// Utility function to execute commands with better error handling
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
    console.log(`✅ Successfully ran: ${cmd}`);
    return { success: true, output: result };
  } catch (error) {
    if (options.expectError) {
      console.log(`✅ Expected error from: ${cmd}`);
      return { success: false, error };
    }
    console.error(`❌ Error running: ${cmd}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Create test directory
console.log('\n🚀 Starting branch-name-lint end-to-end test\n');
console.log('1️⃣  Creating test directory...');
if (fs.existsSync(TEST_DIR)) {
  rimraf.sync(TEST_DIR);
}
fs.mkdirSync(TEST_DIR);

// Move to test directory
process.chdir(TEST_DIR);
console.log(`   Changed to directory: ${TEST_DIR}`);

// Initialize git repo
console.log('\n2️⃣  Initializing git repository...');
runCommand('git init');
runCommand('git config user.email "e2e-test@example.com"');
runCommand('git config user.name "E2E Test"');

// Create a dummy file and commit it
fs.writeFileSync(path.join(TEST_DIR, 'dummy.txt'), 'Initial commit file');
runCommand('git add dummy.txt');
runCommand('git commit -m "Initial commit"');

// Link the current module
console.log('\n3️⃣  Linking branch-name-lint module...');
runCommand('npm link "' + path.dirname(CONFIG_PATH) + '"');

// Test with BAD branch name
console.log('\n4️⃣  Testing with BAD branch name...');
runCommand(`git checkout -b ${BAD_BRANCH_NAME}`);
console.log(`   Created branch: ${BAD_BRANCH_NAME}`);

// Run branch-name-lint - should fail
console.log('\n   Running branch-name-lint - expecting failure:');
const badResult = runCommand(`npx branch-name-lint ${CONFIG_PATH}`, { expectError: true });
if (!badResult.success) {
  console.log('   ✅ Lint correctly failed for invalid branch name');
} else {
  console.error('   ❌ Lint unexpectedly passed for invalid branch name');
  process.exit(1);
}

// Test with GOOD branch name
console.log('\n5️⃣  Testing with GOOD branch name...');
runCommand(`git checkout -b ${GOOD_BRANCH_NAME}`);
console.log(`   Created branch: ${GOOD_BRANCH_NAME}`);

// Run branch-name-lint - should pass
console.log('\n   Running branch-name-lint - expecting success:');
runCommand(`npx branch-name-lint ${CONFIG_PATH}`);
console.log('   ✅ Lint correctly passed for valid branch name');

// Clean up
console.log('\n6️⃣  Cleaning up...');
process.chdir(__dirname);
rimraf.sync(TEST_DIR);
console.log(`   Removed test directory: ${TEST_DIR}`);

console.log('\n✨ End-to-end test completed successfully! ✨\n');