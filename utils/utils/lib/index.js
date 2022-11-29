'use strict';

module.exports = {
  isObject,
  spinnerStart,
  execCp,
  execCpAsync,
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

//同步执行child exec process
function execCpAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = execCp(command, args, options);
    p.on('error', reject);
    p.on('exit', resolve);
  });
}
