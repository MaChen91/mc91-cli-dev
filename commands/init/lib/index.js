'use strict';

const log = require('@mc91-cli-dev/log');

module.exports = init;

//初始化项目action
function init(...args) {
  const [name, option, cmd] = args;
  log.info('projectName', name);
  log.info('option', option);
  //log.info('command', cmd);
  log.info('targetPath', process.env.CLI_TARGET_PATH);
}
