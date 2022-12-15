'use strict';
import Command from '@mc91-cli-dev/command';
import log from '@mc91-cli-dev/log';
class PublishCommand extends Command {
  //默认处理
  init() {
    console.log('init', this._argv);
  }

  //执行函数
  @debug
  exec() {
    throw new Error('exec error');
  }
}

function init(argv) {
  return new PublishCommand(argv);
}

function debug(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    try {
      await originalMethod.apply(this, args);
    } catch (error) {
      log.error(error.message);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(error);
      }
    }
  };
}
module.exports = init;
module.exports.PublishCommand = PublishCommand;
