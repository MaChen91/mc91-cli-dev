'use strict';
const semver = require('semver');
const colors = require('colors');
const log = require('@mc91-cli-dev/log');
const LOWEST_NODE_VERSION = '12.0.0';
class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error(`${__filename} 参数不能为空`);
    }

    if (!Array.isArray(argv)) {
      throw new Error(`${__filename} 必须为数组`);
    }

    this._argv = argv[0];
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch(err => {
        log.error(err.message);
      });
    });
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  checkNodeVersion() {
    //获取当前node版本号
    const currentVersion = process.version;
    //比对最低版本号
    if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(colors.red(`mc91-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`));
    }
  }

  init() {
    throw new Error(`${__dirname} init必须实现'`);
  }

  exec() {
    throw new Error(`${__dirname} 'exec必须实现`);
  }
}

module.exports = Command;
