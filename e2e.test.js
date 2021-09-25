const test = require('ava');
const { spawnSync } = require('child_process');
const fs = require('fs');

const path = './e2e';

const callToGit = (params = []) => {
  const res = spawnSync('git', params, {
    cwd: `./${path}`,
    encoding: 'utf-8',
  });
  return res;
};

const callToBranchNameLint = () => {
  const res = spawnSync('node', ['./../bin/branch-name-lint'], {
    cwd: `./${path}`,
    encoding: 'utf-8',
  });
  return res;
};

test.before(() => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  callToGit(['init']);
  callToGit(['commit', '--allow-empty', '-n', '-m', 'Initial Commit']);
});

test.after('cleanup', () => {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true });
  }
});

test('End to End test: Should fail on linting master', (t) => {
  callToGit(['checkout', '-b', 'master']);
  const result = callToBranchNameLint();
  t.is(result.status, 1, 'Should return 1 on pushing to master');
  t.regex(result.stderr, /Branch name lint fail! Pushing to "master" is not allowed/);
});

test('End to End test: Should pass on linting feature/text', (t) => {
  callToGit(['checkout', '-b', 'feature/text']);
  const result = callToBranchNameLint();
  t.is(result.status, 0, 'Should return 0 on pushing to feature/text');
});
