'use strict';
module.exports = core;

const path = require('path');
const constant = require('./constant');
const semver = require('semver');
const pkg = require('../package.json');
const log = require('@mc91-cli-dev/log');
const colors = require('colors');
const userHome = require('user-home');
const commander = require('commander');
const exec = require('@mc91-cli-dev/exec');
const add = require('@mc91-cli-dev/add');

const program = new commander.Command();
async function core() {
  try {
    await prepare();
    registerCommand(); //注册命令
  } catch (e) {
    log.error(e.message);
  }
}

async function prepare() {
  checkPkgVersion(); //检查包版本
  await checkRoot(); //检查Root权限
  await checkUserHome(); //检查用户主目录
  await checkEnv(); //检查环境变量
  await checkGlobalUpdate(); //检查当前是否是最新版本
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件', '');

  //action(name, options, command)
  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制执行', false)
    .action(exec);

  //add Template
  program
    .command('add [templateName]')
    .option('-f, --force', '是否强制添加代码', false)
    .action(exec);

  program
    .command('publish')
    .option('--refreshServer', '强制刷新远程仓库平台')
    .option('--refreshToken', '强制刷新远程仓库Token')
    .option('--refreshOwner', '强制刷新远程仓库类型')
    .action(exec);

  //指定targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = program.opts().targetPath;
  });
  //debug模式开启
  program.on('option:debug', function () {
    //debug 需要在opts里获取
    const opts = program.opts();
    if (opts.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose('开启调试DEBUG模式');
  });

  //未知命令监听
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red('未知的命令：' + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + availableCommands.join(',')));
    }
  });
  program.parse(process.argv);

  //没有输入命令判断需要放在parse后面
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

//检查包版本
function checkPkgVersion() {
  log.info('mc91当前版本为:', pkg.version);
}

//检查Root权限
async function checkRoot() {
  const rootCheck = (await import('root-check')).default;
  rootCheck();
}

//检查用户主目录
async function checkUserHome() {
  const { pathExistsSync } = await import('path-exists');
  log.info('用户主目录:', userHome);
  if (!userHome || !pathExistsSync(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'));
  }
}

//检查环境变量
async function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  const { pathExistsSync } = await import('path-exists');
  if (pathExistsSync(dotenvPath)) {
    const config = dotenv.config({
      path: dotenvPath,
    });
    log.info('启用用户环境变量', dotenvPath, config);
  }
  createDefaultConfig();
  //log.verbose('环境变量', process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };

  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  return cliConfig;
}

async function checkGlobalUpdate() {
  //1.获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersion } = require('@mc91-cli-dev/get-npm-info');
  //2.调用npm API，获取所有版本号
  //3.提取所有版本号，比对哪些版本号是大于当前版本号
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  //4.获取最新的版本号，提示用户更新到该版本
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      '更新提示',
      colors.yellow(
        `请手动更新${npmName},当前版本：${currentVersion},最新版本：${lastVersion}
更新命令：npm install -g ${npmName}`,
      ),
    );
  }
}
