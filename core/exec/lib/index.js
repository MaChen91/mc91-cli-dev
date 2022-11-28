'use strict';

module.exports = exec;
//子进程
const cp = require('child_process');
const path = require('path');
const log = require('@mc91-cli-dev/log');
const Package = require('@mc91-cli-dev/package');

const SETTINGS = {
  init: '@mc91-cli-dev/init',
};

const CACHE_DIR = 'dependencies';

async function exec(...args) {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = '';
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  const [, , cmd] = args;
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
    pkg = new Package({targetPath, storeDir, packageName, packageVersion});
    //更新package
    if (await pkg.exists()) {
      log.verbose('更新', 'package更新检查');
      await pkg.update();
    } else {
      //安装package
      await pkg.install();
    }
  } else {
    //传入pkg对象
    pkg = new Package({targetPath, packageName, packageVersion});
  }
  //console.log('exists', await pkg.exists());
  let rootFile = await pkg.getRootFilePath();
  //console.log(rootFile);
  if (rootFile) {
    try {
      const o = Array.from(arguments);
      o[o.length - 1] = {opts: cmd.opts()};
      const code = `require('${rootFile}').call(null, ${JSON.stringify(o)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
      child.on('error', e => {
        log.error('exec子进程执行失败', e.message, __dirname);
        process.exit(1);
      });

      child.on('exit', e => {
        log.verbose('exec子进程执行成功', e);
        process.exit(0);
      });
    } catch (error) {
      log.error(error.message);
    }
  }
}

//兼容windows操作系统
function spawn(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}
