const childProcess = require('child_process');
const util = require('util');

class BranchNameLint {
  constructor(options) {
    const defaultOptions = {
      prefixes: ['feature', 'hotfix', 'release'],
      suggestions: {
        features: 'feature', feat: 'feature', fix: 'hotfix', releases: 'release',
      },
      banned: ['wip'],
      skip: [],
      disallowed: ['master', 'develop', 'staging'],
      separator: '/',
      msgBranchBanned: 'Branches with the name "%s" are not allowed.',
      msgBranchDisallowed: 'Pushing to "%s" is not allowed, use git-flow.',
      msgPrefixNotAllowed: 'Branch prefix "%s" is not allowed.',
      msgPrefixSuggestion: 'Instead of "%s" try "%s".',
      msgseparatorRequired: 'Branch "%s" must contain a separator "%s".',
      msgDoesNotMatchRegex: 'Branch "%s" does not match the allowed pattern: "%s"',
    };

    this.options = Object.assign(defaultOptions, options);
    this.branch = this.getCurrentBranch();
    this.ERROR_CODE = 1;
    this.SUCCESS_CODE = 0;
  }

  validateWithRegex() {
    if (this.options.regex) {
      const REGEX = new RegExp(this.options.regex, this.options.regexOptions);
      return REGEX.test(this.branch);
    }

    return true;
  }

  doValidation() {
    const parts = this.branch.split(this.options.separator);
    const prefix = parts[0];
    let name = null;
    if (parts[1]) {
      const [, second] = parts;
      name = second;
    }

    if (this.options.skip.length > 0 && this.options.skip.includes(this.branch)) {
      return this.SUCCESS_CODE;
    }

    if (this.options.banned.includes(this.branch)) {
      return this.error(this.options.msgBranchBanned, this.branch);
    }

    if (this.options.disallowed.includes(this.branch)) {
      return this.error(this.options.msgBranchDisallowed, this.branch);
    }

    if (this.branch.includes(this.options.separator) === false) {
      return this.error(this.options.msgseparatorRequired, this.branch, this.options.separator);
    }

    if (!this.validateWithRegex()) {
      return this.error(this.options.msgDoesNotMatchRegex, this.branch, this.options.regex);
    }

    if (this.options.prefixes.includes(prefix) === false) {
      if (this.options.suggestions[prefix]) {
        this.error(
          this.options.msgPrefixSuggestion,
          [prefix, name].join(this.options.separator),
          [this.options.suggestions[prefix], name].join(this.options.separator),
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
    this.branch = branch;
    return this.branch.trim();
  }

  error() {
    console.error('Branch name lint fail!', Reflect.apply(util.format, null, arguments)); // eslint-disable-line prefer-rest-params
    return this.ERROR_CODE;
  }
}

module.exports = BranchNameLint;
