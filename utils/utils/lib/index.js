'use strict';

module.exports = {
  isObject,
  spinnerStart,
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
