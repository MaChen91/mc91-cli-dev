'use strict';

const git = require('../lib');
const assert = require('assert').strict;

assert.strictEqual(git(), 'Hello from git');
console.info('git tests passed');
