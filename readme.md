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
    npx branch-name-lint [configfileLocation JSON]

  Examples
    $ branch-name-lint
    $ branch-name-lint config-file.json
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
        "msgBranchBanned": "Branches with the name \"%s\" are not allowed.",
        "msgBranchDisallowed": "Pushing to \"%s\" is not allowed, use git-flow.",
        "msgPrefixNotAllowed": "Branch prefix \"%s\" is not allowed.",
        "msgPrefixSuggestion": "Instead of \"%s\" try \"%s\".",
        "msgSeparatorRequired": "Branch \"%s\" must contain a separator \"%s\"."
    }
}
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
