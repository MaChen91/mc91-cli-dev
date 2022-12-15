'use strict';
import { SimpleGit, simpleGit } from 'simple-git';
import { readFile, writeFile } from '@mc91-cli-dev/utils';
import GitHub from './GitHub';
import Gitee from './Gitee';
import GitServer from './GitServer';
const terminalLink = require('terminal-link');
const userHome = require('user-home');
const inquirer = require('inquirer');
const fs = require('fs');
const log = require('@mc91-cli-dev/log');
const fse = require('fs-extra');
const path = require('path');
export interface GitOptions {
  name: string;
  version: string;
  dir: string;
  refreshServer?: boolean;
}

const DEFAULT_CLI_HOME = process.env.CLI_HOME_PATH ?? '.mc91-cli-dev';
const GIT_ROOT_DIR = '.git';
const GIT_SERVER_FILE = '.git_server';
const GIT_TOKEN_FILE = '.git_token';
const GITHUB = 'github';
const GITEE = 'gitee';
const GIT_SERVER_TYPE: Array<{
  name: string;
  value: typeof GITHUB | typeof GITEE;
}> = [
  {
    name: 'Github',
    value: GITHUB,
  },
  {
    name: 'Gitee',
    value: GITEE,
  },
];

class Git {
  name: string; //#projectName
  version: string; //#projectVersion
  dir: string; //#projectDir
  refreshServer: boolean = false; //# refresh git server
  private homePath: string;
  public git: SimpleGit;
  gitServer: GitServer;
  constructor(projectInfo: GitOptions) {
    Object.keys(projectInfo).forEach((key) => {
      if (this[key] != undefined) {
        this[key] = projectInfo[key];
      }
    });
    this.git = simpleGit(this.dir);
  }

  @verbose
  async prepare() {
    this.checkHomePath();
    await this.checkGitServer();
    await this.checkGitToken();
  }

  @verbose
  init() {
    console.log('exec init git');
  }

  /**
   * 检查用户主目录
   */
  @verbose
  checkHomePath(): void {
    this.homePath =
      process.env.CLI_HOME_PATH ?? path.resolve(userHome, DEFAULT_CLI_HOME);
    log.verbose('homePath', this.homePath);
    fse.ensureDirSync(this.homePath);
    if (!fs.existsSync(this.homePath)) {
      throw new Error('用户主目录获取失败！');
    }
  }

  /**
   * 检查git server
   */
  @verbose
  async checkGitServer(): Promise<void> {
    const gitServerPath = this.createPath(GIT_SERVER_FILE);
    let gitServer = readFile(gitServerPath);
    if (!gitServer || this.refreshServer) {
      gitServer = (
        await inquirer.prompt({
          type: 'list',
          name: 'gitServer',
          message: '请选择您想要托管的Git平台',
          default: GITHUB,
          choices: GIT_SERVER_TYPE,
        })
      ).gitServer;
      writeFile(gitServerPath, gitServer);
      log.success('git server写入成功', `${gitServer} -> ${gitServerPath}`);
    } else {
      log.success('git server获取成功', gitServer);
    }
    this.gitServer = this.createGitServer(gitServer);
    if (!this.gitServer) {
      throw new Error('GitServer初始化失败！');
    }
  }

  /**
   * 创建git server类
   * @param gitServer git server
   * @returns GitServer
   */
  createGitServer(gitServer: typeof GITHUB | typeof GITEE): GitServer | null {
    if (gitServer == GITHUB) {
      return new GitHub();
    } else if (gitServer == GITEE) {
      return new Gitee();
    }
    return null;
  }

  /**
   * 检查git仓库是否存在
   */
  @verbose
  async checkGitToken() {
    const tokenpath = this.createPath(GIT_TOKEN_FILE);
    let token = readFile(tokenpath);
    if (!token) {
      log.warn(
        this.gitServer.type,
        'token不存在',
        '请先设置token ' +
          terminalLink('#点击查看帮助', this.gitServer.getTokenHelpUrl()),
      );
    }
  }

  /**
   *
   * @param file git 文件地址
   * @returns
   */
  createPath(file): string {
    const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR);
    const filePath = path.resolve(rootDir, file);
    fse.ensureDirSync(rootDir);
    return filePath;
  }
}

/**
 * 装饰器 verbose
 * @param target 类
 * @param propertyKey 方法名
 * @param descriptor 方法描述
 */
function verbose(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    log.verbose('GIT', `执行${propertyKey}方法`);
    await originalMethod.apply(this, args);
  };
}

export default Git;
