/* eslint-disable global-require */
const test = require('ava');
const sinon = require('sinon');
const BranchNameLint = require('.');

test('See that constructor have default options', (t) => {
  const branchNameLint = new BranchNameLint();
  t.truthy(branchNameLint.options);
  t.is(branchNameLint.options.prefixes[0], 'feature');
});

test('See that constructor accept custom options', (t) => {
  const mockOptions = {
    prefixes: ['test1', 'test2'],
  };
  const branchNameLint = new BranchNameLint(mockOptions);
  t.is(branchNameLint.options.prefixes[0], 'test1');
});

test('error prints error', (t) => {
  const branchNameLint = new BranchNameLint();
  const callback = sinon.stub(console, 'error');
  const answer = branchNameLint.error('Branch "%s" must contain a separator "%s".', 'test1', 'test2');
  t.truthy(callback);
  t.is(answer, 1);
});

test('validateWithRegex - fail', (t) => {
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  const validation = branchNameLint.validateWithRegex();
  t.falsy(validation);
});

test('validateWithRegex - pass with correct regex', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('regex-pattern-test');
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  const validation = branchNameLint.validateWithRegex();
  t.truthy(validation);
  childProcess.execFileSync.restore();
});

test('validateWithRegex and options', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('REGEX-PATTERN-TEST');
  const branchNameLint = new BranchNameLint();
  branchNameLint.options.regex = '^regex.*-test$';
  branchNameLint.options.regexOptions = 'i';
  const validation = branchNameLint.validateWithRegex();
  t.truthy(validation);
  childProcess.execFileSync.restore();
});

test('getCurrentBranch is working', (t) => {
  const childProcess = require('child_process');
  const branchNameLint = new BranchNameLint();
  sinon.stub(childProcess, 'execFileSync').returns('branch mock name');
  const name = branchNameLint.getCurrentBranch();
  t.is(name, 'branch mock name');
  childProcess.execFileSync.restore();
});

test('doValidation is working', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('feature/valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.SUCCESS_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on prefixes', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('blah/valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on separator', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('feature-valid-name');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on disallowed', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('master');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is throwing error on banned', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('wip');
  const branchNameLint = new BranchNameLint();
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.ERROR_CODE);
  childProcess.execFileSync.restore();
});

test('doValidation is using correct error message on regex mismatch', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('feature/invalid_characters');
  const branchNameLint = new BranchNameLint({
    msgDoesNotMatchRegex: 'my error message',
    regex: '^[a-z0-9/-]+$',
    regexOptions: 'i'
  });
  const errorStub = sinon.stub(branchNameLint, 'error');
  branchNameLint.doValidation();
  t.true(errorStub.calledWith('my error message', 'feature/invalid_characters', '^[a-z0-9/-]+$'));
  errorStub.restore();
  childProcess.execFileSync.restore();
});

test('doValidation is passing on skip', (t) => {
  const childProcess = require('child_process');
  sinon.stub(childProcess, 'execFileSync').returns('develop');
  const mockOptions = {
    skip: ['develop'],
  };
  const branchNameLint = new BranchNameLint(mockOptions);
  const result = branchNameLint.doValidation();
  t.is(result, branchNameLint.SUCCESS_CODE);
  childProcess.execFileSync.restore();
});
