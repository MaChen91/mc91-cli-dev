'use strict';
const Command = require('@mc91-cli-dev/command');
const log = require('@mc91-cli-dev/log');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
import Git from '@mc91-cli-dev/git';

interface projectInfo {
  name: string;
  version: string;
  dir: string;
}
class PublishCommand extends Command {
  protected _argv;
  protected projectInfo: projectInfo;
  constructor(argv) {
    super(argv);
  }

  /**
   * 初始化
   */
  init() {
    //console.log('init', this._argv);
  }

  //执行函数
  @debug
  async exec() {
    const startTime = new Date().getTime();
    //1.初始化检查
    await this.prepare();
    const git = new Git(this.projectInfo);
    await git.prepare();
    git.init();

    const endTime = new Date().getTime();
    log.info(
      'PUBLISH',
      '本次发布耗时',
      Math.floor((endTime - startTime) / 1000),
      'ms',
    );
  }

  /**
   * Package 检查
   */
  async prepare() {
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');
    log.verbose('package.json', pkgPath);
    if (!fs.existsSync(pkgPath)) {
      throw new Error('package.json不存在！');
    }

    // 2.确认是否包含name、version、build命令
    const pkg = fse.readJsonSync(pkgPath);
    const { name, version, scripts } = pkg;
    log.verbose('package.json', name, version, scripts);
    if (!name || !version || !scripts || !scripts.build) {
      throw new Error(
        'package.json信息不全，请检查是否存在name、version和scripts（需提供build命令）！',
      );
    }
    this.projectInfo = { name, version, dir: projectPath };
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
