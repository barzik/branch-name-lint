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
      branchEnvVariable: 'GITHUB_REF',
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
    if (this.options.skip.length > 0 && this.options.skip.includes(this.branch)) {
      return this.SUCCESS_CODE;
    }

    if (this.options.banned.includes(this.branch)) {
      return this.error(this.options.msgBranchBanned, this.branch);
    }

    if (this.options.disallowed.includes(this.branch)) {
      return this.error(this.options.msgBranchDisallowed, this.branch);
    }

    // Skip separator check if separator is explicitly set to false
    if (this.options.separator !== false && this.branch.includes(this.options.separator) === false) {
      return this.error(this.options.msgseparatorRequired, this.branch, this.options.separator);
    }

    if (!this.validateWithRegex()) {
      return this.error(this.options.msgDoesNotMatchRegex, this.branch, this.options.regex);
    }

    // If separator is disabled, skip the prefix check
    if (this.options.separator === false) {
      return this.SUCCESS_CODE;
    }

    // Process prefix only if separator is enabled
    const parts = this.branch.split(this.options.separator);
    const prefix = parts[0];
    let name = null;
    
    if (parts[1]) {
      const [, second] = parts;
      name = second;
    }

    // Skip prefix check if prefixes is explicitly set to false
    if (this.options.prefixes !== false && this.options.prefixes.includes(prefix) === false) {
      if (this.options.suggestions[prefix]) {
        const separator = this.options.separator || '/';
        this.error(
          this.options.msgPrefixSuggestion,
          [prefix, name].join(separator),
          [this.options.suggestions[prefix], name].join(separator),
        );
      } else {
        this.error(this.options.msgPrefixNotAllowed, prefix);
      }

      return this.ERROR_CODE;
    }

    return this.SUCCESS_CODE;
  }

  getCurrentBranch() {
    // Check if specified as CLI argument via --branch
    if (process.argv.includes('--branch')) {
      const branchIndex = process.argv.indexOf('--branch');
      if (branchIndex !== -1 && branchIndex + 1 < process.argv.length) {
        return process.argv[branchIndex + 1].trim();
      }
    }
    
    // Check if branch is specified as an environment variable
    if (this.options.branchEnvVariable && process.env[this.options.branchEnvVariable]) {
      const envBranch = process.env[this.options.branchEnvVariable];
      
      // Only extract from refs/heads/ if the env variable is specifically GITHUB_REF
      if (this.options.branchEnvVariable === 'GITHUB_REF' && envBranch.startsWith('refs/heads/')) {
        return envBranch.replace('refs/heads/', '').trim();
      }
      return envBranch.trim();
    }
    
    // Fall back to git command if no branch is specified via environment variable or CLI
    const branch = childProcess.execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).toString();
    this.branch = branch;
    return this.branch.trim();
  }

  error() {
    /* eslint-disable no-console */
    console.error('Branch name lint fail!', Reflect.apply(util.format, null, arguments)); // eslint-disable-line prefer-rest-params
    /* eslint-enable no-console */
    return this.ERROR_CODE;
  }
}

module.exports = BranchNameLint;
