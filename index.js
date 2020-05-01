const childProcess = require('child_process');
const util = require('util');

class BranchNameLint {
	constructor(options) {
		const defaultOptions = {
			prefixes: ['feature', 'hotfix', 'release'],
			suggestions: {features: 'feature', feat: 'feature', fix: 'hotfix', releases: 'release'},
			banned: ['wip'],
			skip: [],
			disallowed: ['master', 'develop', 'staging'],
			seperator: '/',
			msgBranchBanned: 'Branches with the name "%s" are not allowed.',
			msgBranchDisallowed: 'Pushing to "%s" is not allowed, use git-flow.',
			msgPrefixNotAllowed: 'Branch prefix "%s" is not allowed.',
			msgPrefixSuggestion: 'Instead of "%s" try "%s".',
			msgSeperatorRequired: 'Branch "%s" must contain a seperator "%s".'
		};

		this.options = Object.assign(defaultOptions, options);
		this.branch = this.getCurrentBranch();
		this.ERROR_CODE = 1;
		this.SUCCESS_CODE = 0;
	}

	doValidation() {
		const parts = this.branch.split(this.options.seperator);
		const prefix = parts[0].toLowerCase();
		let name = null;
		if (parts[1]) {
			name = parts[1].toLowerCase();
		}

		if (this.options.skip.length > 0 && this.branch.includes(this.options.skip)) {
			return this.SUCCESS_CODE;
		}

		if (this.options.banned.includes(this.branch)) {
			return this.error(this.options.msgBranchBanned, this.branch);
		}

		if (this.options.disallowed.includes(this.branch)) {
			return this.error(this.options.msgBranchDisallowed, this.branch);
		}

		if (this.branch.includes(this.options.seperator) === false) {
			return this.error(this.options.msgSeperatorRequired, this.branch, this.options.seperator);
		}

		if (this.options.prefixes.includes(prefix) === false) {
			if (this.options.suggestions[prefix]) {
				this.error(
					this.options.msgPrefixSuggestion,
					[prefix, name].join(this.options.seperator),
					[this.options.suggestions[prefix], name].join(this.options.seperator)
				);
			} else {
				this.error(this.options.msgPrefixNotAllowed, prefix);
			}

			return this.ERROR_CODE;
		}

		return this.SUCCESS_CODE;
	}

	getCurrentBranch() {
		const branch = childProcess.execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).toString();
		return branch;
	}

	error() {
		console.error('Branch name lint fail!', Reflect.apply(util.format, null, arguments)); // eslint-disable-line prefer-rest-params
		return this.ERROR_CODE;
	}
}

module.exports = BranchNameLint;
