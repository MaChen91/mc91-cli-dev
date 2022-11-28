const request = require('@mc91-cli-dev/request');
module.exports = function () {
  return request({
    url: '/project/template',
  });
};
