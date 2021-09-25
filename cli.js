#!/usr/bin/env node

const childProcess = require('child_process');

process.emitWarning(
  'branch-name-lint will stop using ./cli.js path in the future. Please use npx branch-name-lint',
);

childProcess.fork('./bin/branch-name-lint');
