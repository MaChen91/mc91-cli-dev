'use strict';

module.exports = {
  isObject,
};

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
