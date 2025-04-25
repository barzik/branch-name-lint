#!/usr/bin/env node

/**
 * End-to-end test for branch-name-lint
 * This script tests the module by:
 * 1. Creating a test directory
 * 2. Initializing a git repo
 * 3. Linking the current module
 * 4. Testing with a bad branch name (should fail)
 * 5. Testing with a good branch name (should pass)
 * 6. Testing with JavaScript configuration file
 * 7. Testing with disabled separator and prefix checks
 * 8. Testing with --branch CLI option
 * 9. Testing with branchNameEnvVariable configuration
 * 10. Cleaning up the test directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

// Configuration
const TEST_DIR = path.join(__dirname, 'e2e-test-dir');
const GOOD_BRANCH_NAME = 'feature/valid-branch';
const BAD_BRANCH_NAME = 'invalid-branch';
const CI_BRANCH_NAME = 'ci/build-test'; // For testing JS config with extra prefixes
const NO_SEPARATOR_BRANCH = 'anyprefix-no-separator'; // For testing disabled separator check
const JSON_CONFIG_PATH = path.join(__dirname, 'sample-configuration.json');
const JS_CONFIG_PATH = path.join(__dirname, 'sample-configuration.js');
const DISABLED_CONFIG_PATH = path.join(TEST_DIR, 'disabled-config.json');
const ENV_VAR_CONFIG_PATH = path.join(TEST_DIR, 'env-var-config.json'); // For testing branchNameEnvVariable
const PROJECT_ROOT = path.join(__dirname, '..');

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
runCommand(`npm link "${PROJECT_ROOT}"`);

// Test with BAD branch name
console.log('\n4️⃣  Testing with BAD branch name...');
runCommand(`git checkout -b ${BAD_BRANCH_NAME}`);
console.log(`   Created branch: ${BAD_BRANCH_NAME}`);

// Run branch-name-lint - should fail
console.log('\n   Running branch-name-lint with JSON config - expecting failure:');
const badResult = runCommand(`npx branch-name-lint ${JSON_CONFIG_PATH}`, { expectError: true });
if (!badResult.success) {
  console.log('   ✅ Lint correctly failed for invalid branch name with JSON config');
} else {
  console.error('   ❌ Lint unexpectedly passed for invalid branch name');
  process.exit(1);
}

// Test with GOOD branch name
console.log('\n5️⃣  Testing with GOOD branch name...');
runCommand(`git checkout -b ${GOOD_BRANCH_NAME}`);
console.log(`   Created branch: ${GOOD_BRANCH_NAME}`);

// Run branch-name-lint - should pass
console.log('\n   Running branch-name-lint with JSON config - expecting success:');
runCommand(`npx branch-name-lint ${JSON_CONFIG_PATH}`);
console.log('   ✅ Lint correctly passed for valid branch name with JSON config');

// Test with JavaScript config file
console.log('\n6️⃣  Testing with JavaScript configuration file...');

// Test with a CI branch name which is only valid in the JS config that has extended prefixes
runCommand(`git checkout -b ${CI_BRANCH_NAME}`);
console.log(`   Created branch: ${CI_BRANCH_NAME}`);

// This should fail with JSON config (doesn't have 'ci' prefix)
console.log('\n   Running branch-name-lint with JSON config for CI branch - expecting failure:');
const ciWithJsonResult = runCommand(`npx branch-name-lint ${JSON_CONFIG_PATH}`, { expectError: true });
if (!ciWithJsonResult.success) {
  console.log('   ✅ Lint correctly failed for CI branch with JSON config');
} else {
  console.error('   ❌ Lint unexpectedly passed for CI branch with JSON config');
  process.exit(1);
}

// But should pass with JavaScript config (has 'ci' prefix)
console.log('\n   Running branch-name-lint with JavaScript config for CI branch - expecting success:');
runCommand(`npx branch-name-lint ${JS_CONFIG_PATH}`);
console.log('   ✅ Lint correctly passed for CI branch with JavaScript config');

// Test validation still works correctly with JS config
console.log('\n   Testing that validation still works with JavaScript config');
runCommand(`git checkout -b ${BAD_BRANCH_NAME}-js-test`);
const badWithJsResult = runCommand(`npx branch-name-lint ${JS_CONFIG_PATH}`, { expectError: true });
if (!badWithJsResult.success) {
  console.log('   ✅ Lint correctly failed for invalid branch with JavaScript config');
} else {
  console.error('   ❌ Lint unexpectedly passed for invalid branch with JavaScript config');
  process.exit(1);
}

// Test with disabled separator and prefix checks
console.log('\n7️⃣  Testing with disabled separator and prefix checks...');

// Create a configuration file with disabled separator and prefix checks
const disabledConfig = {
  branchNameLinter: {
    prefixes: false,
    separator: false,
    regex: ".*" // Use a permissive regex pattern that allows any string
  }
};

fs.writeFileSync(DISABLED_CONFIG_PATH, JSON.stringify(disabledConfig, null, 2));
console.log(`   Created disabled configuration at: ${DISABLED_CONFIG_PATH}`);

// Create a branch without separator - this would normally fail but should pass with disabled checks
runCommand(`git checkout -b ${NO_SEPARATOR_BRANCH}`);
console.log(`   Created branch without separator: ${NO_SEPARATOR_BRANCH}`);

// Run branch-name-lint with disabled config - should pass despite no separator and invalid prefix
console.log('\n   Running branch-name-lint with disabled checks - expecting success:');
runCommand(`npx branch-name-lint ${DISABLED_CONFIG_PATH}`);
console.log('   ✅ Lint correctly passed for branch with disabled checks');

// Test with --branch CLI option
console.log('\n8️⃣  Testing with --branch CLI option...');

// Test with an invalid branch name via CLI (should be on a valid git branch now)
console.log('\n   Testing --branch with an invalid branch name:');
const badCliResult = runCommand(`npx branch-name-lint ${JSON_CONFIG_PATH} --branch invalid-cli-branch`, { expectError: true });
if (!badCliResult.success) {
  console.log('   ✅ Lint correctly failed for invalid branch name provided via --branch');
} else {
  console.error('   ❌ Lint unexpectedly passed for invalid branch name provided via --branch');
  process.exit(1);
}

// Test with a valid branch name via CLI
console.log('\n   Testing --branch with a valid branch name:');
runCommand(`npx branch-name-lint ${JSON_CONFIG_PATH} --branch feature/valid-cli-branch`);
console.log('   ✅ Lint correctly passed for valid branch name provided via --branch');

// Test with branchNameEnvVariable configuration
console.log('\n9️⃣  Testing with branchNameEnvVariable configuration...');

// Create a configuration file that specifies an environment variable
const envVarConfig = {
  branchNameLinter: {
    branchNameEnvVariable: "TEST_BRANCH_NAME",
    prefixes: ["feature", "hotfix", "release"]
  }
};

fs.writeFileSync(ENV_VAR_CONFIG_PATH, JSON.stringify(envVarConfig, null, 2));
console.log(`   Created environment variable configuration at: ${ENV_VAR_CONFIG_PATH}`);

// Test with an invalid branch name via environment variable
console.log('\n   Testing branchNameEnvVariable with an invalid branch name:');
const badEnvVarResult = runCommand(`TEST_BRANCH_NAME=invalid-env-branch npx branch-name-lint ${ENV_VAR_CONFIG_PATH}`, { expectError: true });
if (!badEnvVarResult.success) {
  console.log('   ✅ Lint correctly failed for invalid branch name provided via environment variable');
} else {
  console.error('   ❌ Lint unexpectedly passed for invalid branch name provided via environment variable');
  process.exit(1);
}

// Test with a valid branch name via environment variable
console.log('\n   Testing branchNameEnvVariable with a valid branch name:');
runCommand(`export TEST_BRANCH_NAME=feature/valid-env-branch npx branch-name-lint ${ENV_VAR_CONFIG_PATH}`);
console.log('   ✅ Lint correctly passed for valid branch name provided via environment variable');

// Clean up
console.log('\n🔟  Cleaning up...');
process.chdir(PROJECT_ROOT);
rimraf.sync(TEST_DIR);
console.log(`   Removed test directory: ${TEST_DIR}`);

console.log('\n✨ End-to-end test completed successfully! ✨\n');