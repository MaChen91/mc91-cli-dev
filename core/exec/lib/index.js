'use strict';

module.exports = exec;
const path = require('path');
const log = require('@mc91-cli-dev/log');
const Package = require('@mc91-cli-dev/package');
const { execCp } = require('@mc91-cli-dev/utils');

const SETTINGS = {
  init: '@mc91-cli-dev/init',
  add: '@mc91-cli-dev/add',
  publish: '@mc91-cli-dev/publish',
};

const CACHE_DIR = 'dependencies';

/**
 * 首先获取Command指令,通过Package类安装指令相关依赖
 * 其次执行指令内部的init方法
 */
async function exec(...args) {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = '';
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  const cmd = args[args.length - 1];
  //console.log(cmd);
  //获取cmd命令名称
  const cmdName = cmd.name();
  //获取对应包名称
  const packageName = SETTINGS[cmdName];
  //设定对应包版本 默认latest
  const packageVersion = 'latest';

  let pkg = null;
  //如果targetPath不存在
  if (!targetPath) {
    //生成缓存路径todo
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);

    //传入pkg对象
    pkg = new Package({ targetPath, storeDir, packageName, packageVersion });
    //更新package
    if (await pkg.exists()) {
      log.verbose('更新', 'package更新检查');
      await pkg.update();
    } else {
      //安装package
      await pkg.install();
      log.verbose('完成安装');
    }
  } else {
    //传入pkg对象
    pkg = new Package({ targetPath, packageName, packageVersion });
  }
  //console.log('exists', await pkg.exists());
  let rootFile = await pkg.getRootFilePath();
  //console.log(rootFile);
  if (rootFile) {
    try {
      const o = Array.from(arguments);
      o[o.length - 1] = { opts: cmd.opts() };
      const code = `require('${rootFile}').call(null, ${JSON.stringify(o)})`;
      const child = execCp('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
      child.on('error', (e) => {
        log.error('exec子进程执行失败', e.message, __dirname);
        process.exit(1);
      });

      child.on('exit', (e) => {
        log.verbose('exec子进程执行成功', e);
        process.exit(0);
      });
    } catch (error) {
      log.error(error.message);
    }
  }
}
