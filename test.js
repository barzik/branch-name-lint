const test = require('ava');
const sinon = require('sinon');
const BranchNameLint = require('.');

test('See that constructor have default options', t => {
	const branchNameLint = new BranchNameLint();
	t.truthy(branchNameLint.options);
	t.is(branchNameLint.options.prefixes[0], 'feature');
});

test('See that constructor accept custom options', t => {
	const mockOptions = {
		prefixes: ['test1', 'test2']
	};
	const branchNameLint = new BranchNameLint(mockOptions);
	t.is(branchNameLint.options.prefixes[0], 'test1');
});

test('error prints error', t => {
	const branchNameLint = new BranchNameLint();
	const callback = sinon.stub(console, 'error');
	const answer = branchNameLint.error('Branch "%s" must contain a seperator "%s".', 'test1', 'test2');
	t.truthy(callback);
	t.is(answer, 1);
});

test('validateWithRegex', t => {
	const branchNameLint = new BranchNameLint();
	branchNameLint.options.regex = '^([A-Z]+-[0-9]+.{5,70})';
	const validation = branchNameLint.validateWithRegex();
	t.falsy(validation);
});

test('getCurrentBranch is working', t => {
	const childProcess = require('child_process');
	const branchNameLint = new BranchNameLint();
	sinon.stub(childProcess, 'execFileSync').returns('branch mock name');
	const name = branchNameLint.getCurrentBranch();
	t.is(name, 'branch mock name');
	childProcess.execFileSync.restore();
});

test('doValidation is working', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('feature/valid-name');
	const branchNameLint = new BranchNameLint();
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.SUCCESS_CODE);
	childProcess.execFileSync.restore();
});

test('doValidation is throwing error on prefixes', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('blah/valid-name');
	const branchNameLint = new BranchNameLint();
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.ERROR_CODE);
	childProcess.execFileSync.restore();
});

test('doValidation is throwing error on seperator', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('feature-valid-name');
	const branchNameLint = new BranchNameLint();
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.ERROR_CODE);
	childProcess.execFileSync.restore();
});

test('doValidation is throwing error on disallowed', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('master');
	const branchNameLint = new BranchNameLint();
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.ERROR_CODE);
	childProcess.execFileSync.restore();
});

test('doValidation is throwing error on banned', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('wip');
	const branchNameLint = new BranchNameLint();
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.ERROR_CODE);
	childProcess.execFileSync.restore();
});

test('doValidation is passing on skip', t => {
	const childProcess = require('child_process');
	sinon.stub(childProcess, 'execFileSync').returns('develop');
	const mockOptions = {
		skip: ['develop']
	};
	const branchNameLint = new BranchNameLint(mockOptions);
	const result = branchNameLint.doValidation();
	t.is(result, branchNameLint.SUCCESS_CODE);
	childProcess.execFileSync.restore();
});
