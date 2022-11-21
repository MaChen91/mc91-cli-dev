#! /usr/bin/env node
'use strict';

//
const importLocal = require('import-local')
if (importLocal(__filename)) {
    const log = require('npmlog')
    log.info('cli', '正在使用 mc91-cli-dev 本地版本')
} else { 
    require('../lib')(process.argv.slice(2))
}