#!/usr/bin/env node
'use strict';
const fs = require('fs');
const resolve = require('path').resolve;
const findup = require('findup');
const meow = require('meow');
const BranchNameLint = require('./index.js');

const cli = meow(`
	Usage
	  $ branch-name-lint [input]

	Options
	  --foo  Lorem ipsum [Default: false]

	Examples
	  $ branch-name-lint
	  unicorns & rainbows
	  $ branch-name-lint ponies
	  ponies & rainbows
`);
const configFileName = cli.input[0];

class BranchNameLintCli {
	constructor() {
		this.options = this.loadConfiguration(configFileName);
		const branchNameLint = new BranchNameLint(this.options);
		const answer = branchNameLint.doValidation();
		if (answer === 1) {
			throw new Error();
		}
	}

	loadConfiguration(filename = 'package.json') {
		const pkgFile = findup.sync(process.cwd(), filename);
		const pkg = JSON.parse(fs.readFileSync(resolve(pkgFile, filename)));
		return (pkg.branchNameLinter) || {};
	}
}

new BranchNameLintCli(); // eslint-disable-line no-new
