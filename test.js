import test from 'ava';
import sinon from 'sinon';
import BranchNameLint from '.';

test('See that constructor have default options', t => {
	const branchNameLint = new BranchNameLint();
	t.truthy(branchNameLint.options);
	t.is(branchNameLint.options.prefixes[0], 'feature');
});

test('See that constructor accept costum options', t => {
	const mockOptions = {
		prefixes: ['test1', 'test2']
	};
	const branchNameLint = new BranchNameLint(mockOptions);
	t.is(branchNameLint.options.prefixes[0], 'test1');
});

test('error prints error', t => {
	const branchNameLint = new BranchNameLint();
	const callback = sinon.spy(console, 'error');
	const answer = branchNameLint.error('Branch "%s" must contain a seperator "%s".', 'test1', 'test2');
	t.truthy(callback);
	t.is(answer, 1);
});

test('getCurrentBranch is working', t => {
	const branchNameLint = new BranchNameLint();
	const callback = sinon.stub(require('child_process'), 'execSync').returns('masteraaaa');
	callback.onCall(0).returns(1);
	branchNameLint.getCurrentBranch();
	t.truthy(callback);
});
