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
		const answer = new BranchNameLint(this.options);
		console.log(answer.doValidation());
	}

	loadConfiguration(filename = 'package.json') {
		const pkgFile = findup.sync(process.cwd(), filename);
		const pkg = JSON.parse(fs.readFileSync(resolve(pkgFile, filename)));
		return (pkg && pkg.config && pkg.config.branchNameLinter) || {};
	}
}

new BranchNameLintCli(); // eslint-disable-line no-new
