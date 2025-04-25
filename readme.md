# branch-name-lint ![Build Status](https://github.com/barzik/branch-name-lint/workflows/Branch%20Lint%20Name%20CI/badge.svg) [![Known Vulnerabilities](https://snyk.io/test/github/barzik/branch-name-lint/badge.svg)](https://snyk.io/test/github/barzik//branch-name-lint) ![npm](https://img.shields.io/npm/dt/branch-name-lint)

Validating and linting the git branch name. Create a config file or use the default configuration file. Use it in husky config file to make sure that your branch will not be rejected by some pesky Jenkins branch name conventions. You may use it as part of a CI process or just as an handy `npx` command.

## Install

```
$ npm install branch-name-lint
```

## CLI usage

```
$ npx branch-name-lint
```

```
$ npx branch-name-lint --help

  Usage
    npx branch-name-lint [configfileLocation JSON|JS] [options]

  Options
    --help             - to get this screen
    --branch <name>    - specify branch name manually (overrides environment variable)

  Environment Variables
    GITHUB_REF         - can be used to specify branch name (e.g., refs/heads/feature-branch-1)

  Examples
    $ branch-name-lint
    $ branch-name-lint config-file.json
    $ branch-name-lint config-file.js
    $ branch-name-lint --branch feature/my-branch
    $ GITHUB_REF=refs/heads/feature/my-branch branch-name-lint
```

### CLI options.json

Any Valid JSON file with `branchNameLinter` attribute.

```
{
    "branchNameLinter": {
        "prefixes": [
            "feature",
            "hotfix",
            "release"
        ],
        "suggestions": {
            "features": "feature",
            "feat": "feature",
            "fix": "hotfix",
            "releases": "release"
        ],
        "banned": [
            "wip"
        ],
        "skip": [
            "skip-ci"
        ],
        "disallowed": [
            "master",
            "develop",
            "staging"
        ],
        "separator": "/",
        "msgBranchBanned": "Branches with the name \"%s\" are not allowed.",
        "msgBranchDisallowed": "Pushing to \"%s\" is not allowed, use git-flow.",
        "msgPrefixNotAllowed": "Branch prefix \"%s\" is not allowed.",
        "msgPrefixSuggestion": "Instead of \"%s\" try \"%s\".",
        "msgSeparatorRequired": "Branch \"%s\" must contain a separator \"%s\"."
    }
}
```

### Disabling Checks

You can disable prefix or separator checks by setting their respective configuration values to `false`:

```
{
    "branchNameLinter": {
        "prefixes": false,  // Disables the prefix validation check
        "separator": false, // Disables the separator validation check
        "regex": "^(revert|master|develop|issue|release|hotfix/|feature/|support/|shift-)"
    }
}
```

When `prefixes` is set to `false`, any branch prefix will be allowed. When `separator` is set to `false`, branches without separators will be allowed.

### Branch Name Environment Variable

You can specify a branch name using environment variables:

```
{
    "branchNameLinter": {
        "branchEnvVariable": "MY_CUSTOM_BRANCH_ENV",
        // other settings...
    }
}
```

By default, the tool looks for the `GITHUB_REF` environment variable. When using the `GITHUB_REF` environment variable specifically, the tool automatically extracts the branch name from GitHub-style refs format (e.g., `refs/heads/feature-branch-1` will be converted to `feature-branch-1`).

If you use a custom environment variable name (not `GITHUB_REF`), the tool will use the exact value without any extraction:

```bash
# Using GITHUB_REF - extracts branch name automatically
GITHUB_REF=refs/heads/feature/branch npx branch-name-lint
# Branch name will be "feature/branch"

# Using custom environment variable - uses exact value
MY_CUSTOM_VAR=refs/heads/feature/branch npx branch-name-lint
# Branch name will be "refs/heads/feature/branch"
```

You can override any environment variable using the `--branch` command line option:

```bash
# CLI option takes precedence
GITHUB_REF=refs/heads/feature1 npx branch-name-lint --branch feature/cli-branch
# Branch name will be "feature/cli-branch"
```

### CLI options.js

You can also use a JavaScript file for configuration, which allows for more dynamic configuration with variables and imports:

```js
// config-file.js
// Define constants that can be reused 
const COMMON_PREFIXES = ['feature', 'bugfix', 'hotfix', 'release'];
const CI_PREFIXES = ['ci', 'build'];

// Combine arrays for configuration
const ALL_PREFIXES = [...COMMON_PREFIXES, ...CI_PREFIXES];

// Export the configuration object
module.exports = {
  prefixes: ALL_PREFIXES, // Set to false to disable prefix check
  suggestions: {
    feat: 'feature'
  },
  banned: ['wip', 'tmp'],
  skip: ['develop', 'master', 'main'],
  separator: '/', // Set to false to disable separator check
  disallowed: ['master', 'develop', 'main'],
  branchEnvVariable: 'GITHUB_REF', // Name of environment variable to use for branch name
  // other options...
};
```

## Usage with regex

In order to check the branch name with a regex you can add a a regex as a string under the branchNameLinter in your config JSON. You can also pass any options for the regex (e.g. case insensitive: 'i')

```
{
    "branchNameLinter": {
		"regex": "^([A-Z]+-[0-9]+.{5,70})",
        "regexOptions": "i",
		...
        "msgDoesNotMatchRegex": 'Branch "%s" does not match the allowed pattern: "%s"'
	}
}
```

## Husky usage

After installation, just add in any husky hook as node modules call.

```
"husky": {
    "hooks": {
        "pre-push": "npx branch-name-lint [sample-configuration.json]"
    }
},
```

Or with a JavaScript configuration file:

```
"husky": {
    "hooks": {
        "pre-push": "npx branch-name-lint [sample-configuration.js]"
    }
},
```

## CI usage

In CI environments like GitHub Actions, you can use environment variables to specify the branch name:

```yaml
- name: Lint branch name
  run: npx branch-name-lint
  env:
    GITHUB_REF: ${{ github.ref }}
```

The `GITHUB_REF` environment variable is already available in GitHub Actions, so you don't need to set it explicitly. The tool will automatically extract the branch name from the `refs/heads/branch-name` format.

## Usage in Node.js

```js
const branchNameLint = require('branch-name-lint');

branchNameLint();
//=> 1 OR 0.
```

## API

### branchNameLint([options])

#### options

Type: `object`
Default:

```
{
  prefixes: ['feature', 'hotfix', 'release'],
  suggestions: {features: 'feature', feat: 'feature', fix: 'hotfix', releases: 'release'},
  banned: ['wip'],
  skip: [],
  disallowed: ['master', 'develop', 'staging'],
  separator: '/',
  branchEnvVariable: 'GITHUB_REF',
  msgBranchBanned: 'Branches with the name "%s" are not allowed.',
  msgBranchDisallowed: 'Pushing to "%s" is not allowed, use git-flow.',
  msgPrefixNotAllowed: 'Branch prefix "%s" is not allowed.',
  msgPrefixSuggestion: 'Instead of "%s" try "%s".',
  msgSeparatorRequired: 'Branch "%s" must contain a separator "%s".'
}
```

## License

MIT © [Ran Bar-Zik](https://internet-israel.com)
