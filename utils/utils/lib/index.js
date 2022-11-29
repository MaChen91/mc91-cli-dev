'use strict';

module.exports = {
  isObject,
  spinnerStart,
  execCp,
};

function spinnerStart(msg = '正在加载中...') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(`${msg} %s`);
  spinner.setSpinnerString('|/-\\');
  spinner.start();
  return spinner;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

//兼容windows操作系统
function execCp(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}
