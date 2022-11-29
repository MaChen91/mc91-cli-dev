'use strict';
//模版脚手架
const log = require('@mc91-cli-dev/log');
const Command = require('@mc91-cli-dev/command');
const Package = require('@mc91-cli-dev/package');
const {spinnerStart, execCpAsync} = require('@mc91-cli-dev/utils');
const userHome = require('user-home');
const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');

const WhiteCommand = ['npm', 'cnpm', 'yarn'];
const getProjectTemplate = require('./getProjectTemplate');
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.opts.force;
    this.templates = [];
    this.templateInfo = null;
    this.templateNpm = null;
    //模板存储路经
    this.targetPath = path.resolve(process.cwd(), this.projectName);
    log.verbose('INIT', 'projectName:', this.projectName);
    log.verbose('INIT', 'force:', this.force);
  }

  async exec() {
    try {
      log.verbose('模板准备');
      const projectInfo = await this.prepare();

      log.verbose('模板下载');
      await this.downloadTemplate(projectInfo);

      log.verbose('模板安装');
      await this.installTemplate();
    } catch (error) {
      log.error(error.message);
    }
  }

  async installTemplate() {
    if (this.templateInfo) {
      log.verbose('安装模版类型为', this.templateInfo.type);
      switch (this.templateInfo.type) {
        case TEMPLATE_TYPE_NORMAL:
          await this.installNormalTemplate();
          break;
        case TEMPLATE_TYPE_CUSTOM:
          await this.installCustomTemplate();
          break;
        default:
          throw new Error('无效的模板类型');
      }
    } else {
      throw new Error('模板信息不存在');
    }
  }

  async installNormalTemplate() {
    const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
    log.verbose('缓存模版路径', templatePath);
    fse.ensureDirSync(this.targetPath);
    let spinner = spinnerStart('开始安装模板');
    try {
      fse.copySync(templatePath, this.targetPath);
    } catch (error) {
    } finally {
      spinner.stop();
      console.log();
      log.success('模板安装成功');
    }
    const {installCommand, startCommand} = this.templateInfo;
    //依赖安装
    if (installCommand) {
      try {
        await this.execCommand(installCommand);
        await this.execCommand(startCommand);
      } catch (error) {
        console.log(error.message);
      } finally {
        console.log();
      }
    }
  }

  //installCommand | startCommand
  async execCommand(command) {
    if (command && typeof command === 'string') {
      let [cmd, ...args] = command.split(' ');
      if (!this.checkWhiteCommand(cmd)) {
        throw new Error('执行命令不合法');
      }
      //inherit保留父进程的输出
      const res = await execCpAsync(cmd, args, {stdio: 'inherit', cwd: this.targetPath});
      if (res !== 0) {
        throw new Error(`执行 ${command} 命令失败`);
      }
    }
  }

  async installCustomTemplate() {}

  checkWhiteCommand(cmd) {
    return WhiteCommand.includes(cmd);
  }

  async downloadTemplate({projectTemplate}) {
    //1.通过项目模板API获取项目模板信息
    const find = this.templates.find(tmp => tmp.npmName == projectTemplate);
    const {npmName, version} = find;
    this.templateInfo = find;
    const targetPath = path.resolve(userHome, '.mc91-cli', 'template');
    const storeDir = path.resolve(userHome, '.mc91-cli', 'template', 'node_modules');

    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });

    let spinner = null;
    try {
      if (!(await templateNpm.exists())) {
        log.verbose('templateNpm', '开始下载模板');
        spinner = spinnerStart('开始下载模板');
        await templateNpm.install();
      } else {
        log.verbose('templateNpm', '开始检查更新模板');
        spinner = spinnerStart('开始检查更新模板');
        await templateNpm.update();
      }
      this.templateNpm = templateNpm;
    } catch (error) {
      console.log(error);
    } finally {
      if (spinner) {
        spinner.stop();
      }
    }
    //1.1 通过egg.js搭建服务端
    //1.2 通过npm存储项目模板
    //1.3 将项目模板信息存储到mongodb
    //1.4 通过egg.js提供接口获取mongodb中的项目模板信息通过API返回
  }

  async prepare() {
    //0.查询项目模版是否存在
    const templates = await getProjectTemplate();
    if (!templates || templates.length <= 0) {
      throw new Error('项目模版不存在');
    }

    log.verbose('remote', `获取到${templates.length}个模板`);
    this.templates = templates;

    const localPath = process.cwd();
    //1.判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      console.log();
      let ifContinue = true;

      //--force下跳过询问
      if (!this.force) {
        //2.是否启动强制更新
        const answer = await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空,是否继续创建项目',
        });
        ifContinue = answer.ifContinue;
      }

      if (!ifContinue) throw new Error('用户取消创建');

      if (this.force || ifContinue) {
        log.verbose('当前文件路径', localPath);
        const {confirmDelete} = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: `是否确认删除当前文件夹下的所有文件?`,
        });
        if (confirmDelete) {
          //清空当前目录
          fse.emptyDirSync(localPath);
        } else {
          throw new Error('用户取消创建');
        }
      }
    }
    //2.获取项目信息
    const projectInfo = await this.getProjectInfo();
    return projectInfo;
  }

  async getProjectInfo() {
    let obj = null;
    //3.选择创建项目或者组件
    const {type} = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT,
        },
        {
          name: '组件',
          value: TYPE_COMPONENT,
        },
      ],
    });
    if (type == TYPE_PROJECT) {
      const o = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: 'test-project',
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
              ) {
                done('输入合法项目名称');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: function (v) {
            return v;
          },
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '1.0.0',
          filter: function (v) {
            //转为标准版本号
            return semver.valid(v) ?? v;
          },
          validate: function (v) {
            // Declare function as asynchronous, and save the done callback
            const done = this.async();
            // Do async stuff
            setTimeout(function () {
              if (!!!semver.valid(v)) {
                done('请输入合法版本号');
                return;
              }
              done(null, true);
            }, 0);
          },
        },
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.createTemlateChoices(),
        },
      ]);
      obj = o;
    } else if (type == TYPE_COMPONENT) {
    }
    return obj;
  }

  //创建模板选择
  createTemlateChoices() {
    return this.templates.map(({name, npmName, version}) => {
      return {
        value: npmName,
        name: `${name}(${version})`,
      };
    });
  }

  // 当前目录是否为空
  isDirEmpty(localPath) {
    log.verbose('localPath', localPath);
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(file => {
      //过滤隐藏文件
      if (file.startsWith('.') && file !== '.git') {
        return false;
      }
      return true;
    });
    return !fileList || fileList.length <= 0;
  }
}
module.exports.InitCommand = InitCommand;

//初始化项目action 1.0.9test
function init(...args) {
  //const [name, option, cmd] = args;
  log.verbose('进入Init', '准备执行InitCommand');
  return new InitCommand(args);
}

module.exports = init;
