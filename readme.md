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
    npx branch-name-lint [configfileLocation JSON|JS]

  Options
    --help   - to get this screen
    --branch - specify a custom branch name to check instead of the current git branch

  Examples
    $ branch-name-lint
    $ branch-name-lint config-file.json
    $ branch-name-lint config-file.js
    $ branch-name-lint --branch feature/my-new-feature
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
        },
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
        "branchNameEnvVariable": false,
        "branch": false,
        "msgBranchBanned": "Branches with the name \"%s\" are not allowed.",
        "msgBranchDisallowed": "Pushing to \"%s\" is not allowed, use git-flow.",
        "msgPrefixNotAllowed": "Branch prefix \"%s\" is not allowed.",
        "msgPrefixSuggestion": "Instead of \"%s\" try \"%s\".",
        "msgSeparatorRequired": "Branch \"%s\" must contain a separator \"%s\"."
    }
}
```

### Specifying a Custom Branch Name

You can specify a custom branch name to validate instead of using the current git branch in two ways:

1. Using the CLI flag:
   ```
   $ npx branch-name-lint --branch feature/my-custom-branch
   ```

2. Using configuration:
   ```json
   {
     "branchNameLinter": {
       "branch": "feature/my-custom-branch"
     }
   }
   ```

3. Using an environment variable:
   ```json
   {
     "branchNameLinter": {
       "branchNameEnvVariable": "CI_BRANCH_NAME"
     }
   }
   ```

   Then set the environment variable:
   ```
   CI_BRANCH_NAME=feature/my-custom-branch npx branch-name-lint
   ```

This is useful for CI/CD environments where you might want to validate branch names from environment variables.

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

## GitHub Actions Usage

You can integrate branch-name-lint into your GitHub Actions workflows to enforce branch naming conventions across your team. This is especially useful for maintaining consistent branch naming in collaborative projects.

### Basic Example

Create a workflow file at `.github/workflows/branch-name-lint.yml`:

```yaml
name: Branch Name Lint

on:
  push:
    branches-ignore:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

jobs:
  lint-branch-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install branch-name-lint --no-save
      - name: Extract branch name
        shell: bash
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            # For pull requests, use the head branch name
            echo "BRANCH_NAME=${{ github.head_ref }}" >> $GITHUB_ENV
          else
            # For pushes, extract from GITHUB_REF
            echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_ENV
          fi
      - name: Check branch name
        run: npx branch-name-lint
        env:
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
```

### Advanced Example with Custom Configuration

For more advanced use cases, create a custom configuration file:

1. First, create a config file at `.github/branch-name-lint.json`:

```json
{
  "branchNameLinter": {
    "prefixes": [
      "feature",
      "hotfix",
      "release",
      "docs",
      "chore",
      "fix",
      "ci",
      "test"
    ],
    "suggestions": {
      "features": "feature",
      "feat": "feature", 
      "fix": "hotfix", 
      "releases": "release"
    },
    "banned": ["wip"],
    "skip": ["main", "master", "develop", "staging"],
    "disallowed": [],
    "separator": "/",
    "branchNameEnvVariable": "BRANCH_NAME",
    "msgBranchBanned": "Branches with the name \"%s\" are not allowed.",
    "msgPrefixNotAllowed": "Branch prefix \"%s\" is not allowed.",
    "msgPrefixSuggestion": "Instead of \"%s\" try \"%s\".",
    "msgSeparatorRequired": "Branch \"%s\" must contain a separator \"%s\"."
  }
}
```

2. Then reference this configuration in your workflow:

```yaml
name: Branch Name Lint

on:
  push:
    branches-ignore:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

jobs:
  lint-branch-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install branch-name-lint --no-save
      - name: Extract branch name
        shell: bash
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            echo "BRANCH_NAME=${{ github.head_ref }}" >> $GITHUB_ENV
          else
            echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_ENV
          fi
      - name: Check branch name
        run: npx branch-name-lint .github/branch-name-lint.json
        env:
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
```

### Handling Different Operating Systems

When using branch-name-lint in a matrix strategy with multiple operating systems, ensure you use environment variables in a cross-platform way:

```yaml
jobs:
  lint-branch-name:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install branch-name-lint --no-save
      - name: Extract branch name
        shell: bash
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            echo "BRANCH_NAME=${{ github.head_ref }}" >> $GITHUB_ENV
          else
            echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_ENV
          fi
      - name: Check branch name
        run: npx branch-name-lint .github/branch-name-lint.json
        env:
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
```

This setup ensures that your branch naming conventions are enforced consistently across all contributions to your repository.

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
  msgBranchBanned: 'Branches with the name "%s" are not allowed.',
  msgBranchDisallowed: 'Pushing to "%s" is not allowed, use git-flow.',
  msgPrefixNotAllowed: 'Branch prefix "%s" is not allowed.',
  msgPrefixSuggestion: 'Instead of "%s" try "%s".',
  msgSeparatorRequired: 'Branch "%s" must contain a separator "%s".'
}
```

## License

MIT © [Ran Bar-Zik](https://internet-israel.com)
