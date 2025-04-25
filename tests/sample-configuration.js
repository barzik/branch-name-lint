// Sample JavaScript configuration file for branch-name-lint
// This demonstrates the ability to use JavaScript variables and imports

// Define constants that can be reused 
const COMMON_PREFIXES = ['feature', 'bugfix', 'hotfix', 'release'];
const CI_PREFIXES = ['ci', 'build'];

// Combine arrays for configuration
const ALL_PREFIXES = [...COMMON_PREFIXES, ...CI_PREFIXES];

// Export the configuration object
module.exports = {
  prefixes: ALL_PREFIXES,
  suggestions: {
    feat: 'feature'
  },
  banned: ['wip', 'tmp'],
  skip: ['develop', 'master', 'main'],
  separator: '/',
  disallowed: ['master', 'develop', 'main'],
  regex: '^[a-z0-9/-]+$',
  regexOptions: 'i',
  msgBranchBanned: 'Branch name "%s" is banned.',
  msgBranchDisallowed: 'Branch name "%s" is disallowed.',
  msgPrefixNotAllowed: 'Branch prefix "%s" is not allowed.',
  msgSeparatorRequired: 'Branch "%s" must contain a separator "%s".',
  msgDoesNotMatchRegex: 'Branch "%s" does not match regex pattern: %s',
};