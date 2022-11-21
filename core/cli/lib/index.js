'use strict';

module.exports = core;

const constant = require('./constant');
const semver = require('semver');
const pkg = require('../package.json');
const log = require('@mc91-cli-dev/log');
const colors = require('colors');
function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
  } catch (e) {
    log.error(e.message);
  }
}

//检查包版本
function checkPkgVersion() {
  log.info('cli', pkg.version);
}

function checkNodeVersion() {
  //获取当前node版本号
  const currentVersion = process.version;
  //获取最低版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`mc91-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`));
  }
}
