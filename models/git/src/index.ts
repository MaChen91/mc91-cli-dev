'use strict';
import { SimpleGit, simpleGit, SimpleGitOptions } from 'simple-git';
import { readFile, writeFile, spinnerStart } from '@mc91-cli-dev/utils';
import GitHub from './GitHub';
import Gitee from './Gitee';
import GitServer from './GitServer';
import { Gitnore } from './config';
import CloudBuild from '@mc91-cli-dev/cloudbuild';
const semver = require('semver');
const terminalLink = require('terminal-link');
const userHome = require('user-home');
const inquirer = require('inquirer');
const fs = require('fs');
const log = require('@mc91-cli-dev/log');
const fse = require('fs-extra');
const path = require('path');

const DEFAULT_CLI_HOME = process.env.CLI_HOME_PATH ?? '.mc91-cli-dev';
const GIT_ROOT_DIR = '.git'; //存储本地git构建信息
const GIT_SERVER_FILE = '.git_server'; //本地gitServer
const GIT_TOKEN_FILE = '.git_token'; // 本地token
const GIT_OWN_FILE = '.git_own'; //本地所属
const GIT_LOGIN_FILE = '.git_login'; //本地用户名
const GIT_IGNORE_FILE = '.gitignore'; //git忽略文件
const GITHUB = 'github';
const GITEE = 'gitee';
const REPO_OWNER_USER = 'user'; //用户
const REPO_OWNER_ORG = 'org'; //组织

const GIT_PUBLISH_FILE = '.git_publish';
const VERSION_RELEASE = 'release'; //线上分支
const VERSION_DEVELOP = 'dev'; //开发分支
const TEMPLATE_TEMP_DIR = 'oss';
const COMPONENT_FILE = '.componentrc';

const GIT_OWNER_TYPE: Record<string, string>[] = [
  {
    name: '个人',
    value: REPO_OWNER_USER,
  },
  {
    name: '组织',
    value: REPO_OWNER_ORG,
  },
];

const GIT_OWNER_TYPE_ONLY: Record<string, string>[] = [
  {
    name: '个人',
    value: REPO_OWNER_USER,
  },
];

const GIT_PUBLISH_TYPE: Record<string, string>[] = [
  {
    name: 'OSS',
    value: 'oss',
  },
];
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

export interface ProjectOpts {
  name: string;
  version: string;
  dir: string;
}

export interface GitOpts {
  refreshServer: boolean; // 是否强制刷新远程仓库
  refreshToken: boolean; // 是否强制刷新远程仓库token
  refreshOwner: boolean; // 是否强制刷新远程仓库类型
  buildCmd: string; // 构建命令
  prod: boolean; // 是否正式发布
  ssh: {
    user: null;
    ip: null;
    path: null;
  };
}

export interface Remote {
  info: any; // 远程仓库信息
  token: string; // 远程仓库token
  user: any; // 用户信息
  orgs: any; // 用户所属组织列表
  owner: any; // 远程仓库类型
  login: any; // 远程仓库登录名
  repo: any; // 远程仓库信息
  branch: any; // 本地开发分支
  gitPublish: any; // 静态资源服务器类型
}
class Git {
  git: SimpleGit; // SimpleGit实例
  gitServer: GitServer; // GitServer实例
  homePath: string; // 本地缓存目录
  remote: Remote = {
    info: null,
    token: null,
    user: null,
    orgs: null,
    owner: null,
    login: null,
    repo: null,
    branch: null,
    gitPublish: null,
  };
  project: ProjectOpts;
  options: GitOpts = {
    refreshServer: false,
    refreshToken: false,
    refreshOwner: false,
    buildCmd: '',
    prod: false,
    ssh: null,
  };
  constructor(project: ProjectOpts, gitOpts: Partial<GitOpts>) {
    this.project = project;
    this.options = { ...this.options, ...gitOpts };
    this.git = simpleGit(this.project.dir);
  }

  @verbose()
  async prepare() {
    this.checkHomePath();
    await this.checkLocalGitPlatform();
    await this.checkLocalGitToken();
    await this.getRemoteUserAndOrgs();
    await this.checkGitOwner();

    await this.checkLocalRepo();
    await this.checkGitIgnore();
    await this.init();
  }

  /**
   * 完成本地仓库初始化
   */
  @verbose()
  async init() {
    // 检查是否已经初始化git
    if (await this.getLocalRemote()) {
      return;
    }
    // 确保origin远程仓库存在
    await this.initAndAddRemote();
    // 初始化提交
    await this.initCommit();
  }

  @verbose()
  async publish() {
    await this.preparePublish();
    const { buildCmd, prod } = this.options;
    const cloudBuild = new CloudBuild(this, {
      buildCmd,
      prod,
    });
  }

  /**
   * 检查packageJson 并执行
   */
  @verbose()
  async preparePublish() {
    const pkg = this.getPackageJson();
    if (this.options.buildCmd) {
      const buildCmdArray = this.options.buildCmd.split(' ');
      if (buildCmdArray[0] !== 'npm' && buildCmdArray[0] !== 'cnpm') {
        throw new Error('Build命令非法，必须使用npm或cnpm！');
      }
    } else {
      this.options.buildCmd = 'npm run build';
    }
    const buildCmdArray = this.options.buildCmd.split(' ');
    const lastCmd = buildCmdArray[buildCmdArray.length - 1];
    if (!pkg.scripts || !Object.keys(pkg.scripts).includes(lastCmd)) {
      throw new Error(this.options.buildCmd + '命令不存在！');
    }
    log.success('代码预检查通过');
    const gitPublishPath = this.createPath(GIT_PUBLISH_FILE);
    let gitPublish = readFile(gitPublishPath);
    if (!gitPublish) {
      gitPublish = (
        await inquirer.prompt({
          type: 'list',
          choices: GIT_PUBLISH_TYPE,
          message: '请选择您想要上传代码的平台',
          name: 'gitPublish',
        })
      ).gitPublish;
      writeFile(gitPublishPath, gitPublish);
      log.success(
        'git publish类型写入成功',
        `${gitPublish} -> ${gitPublishPath}`,
      );
    } else {
      log.success('git publish类型获取成功', gitPublish);
    }
    this.remote.gitPublish = gitPublish;
  }

  getPackageJson() {
    const pkgPath = path.resolve(this.project.dir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      throw new Error(`package.json 不存在！源码目录：${this.project.dir}`);
    }
    return fse.readJsonSync(pkgPath);
  }

  @verbose()
  async commit() {
    //1.生成开发分支
    await this.getCorrectVersion();
    // 2.检查stash区
    await this.checkStash();
    // 3.检查代码冲突
    await this.checkConflicted();
    // 4.检查未提交代码
    await this.checkNotCommitted();
    // 5.切换开发分支
    await this.checkoutBranch(this.remote.branch);
    // 6.合并远程master分支和开发分支代码
    await this.pullRemoteMasterAndBranch();
    // 7.将开发分支推送到远程仓库
    await this.pushRemoteRepo(this.remote.branch);
  }

  async pullRemoteMasterAndBranch() {
    log.info(`合并 [master] -> [${this.remote.branch}]`);
    await this.pullRemoteRepo('master');
    log.success('合并远程 [master] 分支代码成功');
    await this.checkConflicted();
    log.info('检查远程开发分支');
    const remoteBranchList = await this.getRemoteBranchList(VERSION_DEVELOP);
    if (remoteBranchList.indexOf(this.project.version) >= 0) {
      log.info(`合并 [${this.remote.branch}] -> [${this.remote.branch}]`);
      await this.pullRemoteRepo(this.remote.branch);
      log.success(`合并远程 [${this.remote.branch}] 分支代码成功`);
      await this.checkConflicted();
    } else {
      log.success(`不存在远程分支 [${this.remote.branch}]`);
    }
  }

  /**
   * 切换分支
   * @param branch
   */
  @verbose()
  async checkoutBranch(branch: string): Promise<void> {
    const localBranchList = await this.git.branchLocal();
    if (localBranchList.all.indexOf(branch) >= 0) {
      await this.git.checkout(branch);
    } else {
      await this.git.checkoutLocalBranch(branch);
    }
  }

  /**
   * 检查本地Stash区
   */
  @verbose()
  async checkStash() {
    const stashList = await this.git.stashList();
    if (stashList.all.length > 0) {
      const ifContinue = await inquirer.prompt({
        type: 'confirm',
        name: 'ifContinue',
        default: false,
        message: '当前stash区有未提交的代码，是否继续？',
      }).ifContinue;
      if (ifContinue) {
        await this.git.stash(['pop']);
        log.success('stash pop成功');
      } else {
        log.info('未提交的代码已经保存在stash区');
      }
    } else {
      log.verbose('当前stash区没有未提交的代码');
    }
  }

  @verbose()
  async getCorrectVersion() {
    // 1.获取远程分布分支
    // 版本号规范：release/x.y.z，dev/x.y.z
    // 版本号递增规范：major/minor/patch
    log.info('获取代码分支');
    const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE);
    console.log(remoteBranchList);
    let releaseVersion = null;
    if (remoteBranchList && remoteBranchList.length > 0) {
      releaseVersion = remoteBranchList[0];
    }
    log.verbose('线上最新版本号', releaseVersion);
    // 2.依据 packge.json 生成本地开发分支
    const devVersion = this.project.version;
    // 如果没有线上版本
    if (!releaseVersion) {
      this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
    } else if (semver.gt(this.project.version, releaseVersion)) {
      //当前版本大于线上最新版本
      log.info(
        '当前版本大于线上最新版本',
        `${devVersion} >= ${releaseVersion}`,
      );
      this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
    } else {
      log.info('当前线上版本大于本地版本', `${releaseVersion} > ${devVersion}`);
      const incType = (
        await inquirer.prompt({
          type: 'list',
          name: 'incType',
          message: '自动升级版本，请选择升级版本类型',
          default: 'patch',
          choices: [
            {
              name: `小版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'patch',
              )}）`,
              value: 'patch',
            },
            {
              name: `中版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'minor',
              )}）`,
              value: 'minor',
            },
            {
              name: `大版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'major',
              )}）`,
              value: 'major',
            },
          ],
        })
      ).incType;
      const incVersion = semver.inc(releaseVersion, incType);
      this.remote.branch = `${VERSION_DEVELOP}/${incVersion}`;
      this.project.version = incVersion;
    }
    log.verbose('本地开发分支', this.remote.branch);
    this.syncVersionToPackageJson();
  }

  /**
   * 同步版本号到package.json
   */
  syncVersionToPackageJson() {
    const pkg = fse.readJsonSync(`${this.project.dir}/package.json`);
    if (pkg && pkg.version !== this.project.version) {
      pkg.version = this.project.version;
      fse.writeJsonSync(`${this.project.dir}/package.json`, pkg, { spaces: 2 });
    }
  }

  /**
   *
   * @param type
   * @returns
   */
  @verbose()
  async getRemoteBranchList(type): Promise<any> {
    const remoteList = await this.git.listRemote(['--refs']);
    let reg;
    if (type === VERSION_RELEASE) {
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
    } else {
      reg = /.+?refs\/heads\/dev\/(\d+\.\d+\.\d+)/g;
    }
    let list = remoteList
      .split('\n')
      .map((remote) => {
        const match = reg.exec(remote);
        reg.lastIndex = 0;
        if (match && semver.valid(match[1])) {
          return match[1];
        }
      })
      .filter((_) => _)
      .sort((a, b) => {
        if (semver.lte(b, a)) {
          if (a === b) return 0;
          return -1;
        }
        return 1;
      });
    console.log(list);
    return list;
  }

  /**
   * 本地是否已经初始化git
   * @returns
   */
  @verbose()
  getLocalRemote() {
    const gitPath = path.resolve(this.project.dir, GIT_ROOT_DIR);
    this.remote.info = this.gitServer.getRemote(
      this.project.name,
      this.remote.login,
    );
    if (fs.existsSync(gitPath)) {
      log.success('git已完成初始化');
      return true;
    }
    return false;
  }

  /**
   * 初始化git 并确保远程仓库origin存在
   * 如果没找到origin,添加远程仓库origin
   */
  @verbose()
  async initAndAddRemote() {
    await this.git.init();
    const remotes = await this.git.getRemotes();
    log.verbose('git remotes', remotes);
    if (!remotes.find((item) => item.name === 'origin')) {
      await this.git.addRemote('origin', this.remote.info);
    }
  }

  /**
   * 初始化提交
   */
  @verbose()
  async initCommit() {
    //没有冲突
    await this.checkConflicted();
    //准备提交
    await this.checkNotCommitted();
    //检查是否有远程Master分支
    if (await this.checkRemoteMaster()) {
      await this.pullRemoteRepo('master', {
        '--allow-unrelated-histories': null, //允许不相关的历史记录
      });
    } else {
      //推送到远程master
      await this.pushRemoteRepo('master');
    }
  }

  /**
   * 检查本地冲突
   */
  @verbose()
  async checkConflicted() {
    const status = await this.git.status();
    if (status.conflicted.length > 0) {
      throw new Error('当前代码存在冲突，请手动处理合并后再试！');
    }
    log.success('代码冲突检查通过');
  }

  @verbose()
  async checkRemoteMaster() {
    return (
      (await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0
    );
  }

  /**
   * 同步远程分支代码
   * @param branchName
   * @param options
   */
  @verbose()
  async pullRemoteRepo(branchName: string, options = {}) {
    log.info(`同步远程${branchName}分支代码`);
    await this.git.pull('origin', branchName, options).catch((err) => {
      log.error(err.message);
    });
  }

  /**
   * 推送远程分支
   * @param branchName
   */
  @verbose()
  async pushRemoteRepo(branchName) {
    await this.git.push('origin', branchName);
  }

  /**
   * 检查本地未提交代码 并提交
   */
  @verbose()
  async checkNotCommitted() {
    const status = await this.git.status();
    if (
      status.not_added.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.modified.length > 0 ||
      status.renamed.length > 0
    ) {
      log.verbose('status', status);
      await this.git.add(status.not_added);
      await this.git.add(status.created);
      await this.git.add(status.deleted);
      await this.git.add(status.modified);
      let message;
      while (!message) {
        message = (
          await inquirer.prompt({
            type: 'text',
            name: 'message',
            message: '请输入commit信息：',
          })
        ).message;
      }
      await this.git.commit(message);
      log.success('本次commit提交成功');
    }
  }

  //检查用户主目录
  @verbose()
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
   * 确保｜初始化 本地git仓库平台选择
   */
  @verbose()
  async checkLocalGitPlatform(): Promise<void> {
    const gitServerPath = this.createPath(GIT_SERVER_FILE);
    let gitServer = readFile(gitServerPath);
    if (!gitServer || this.options.refreshServer) {
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

    if (this.gitServer === null) {
      throw new Error('GitServer初始化失败！');
    }
    console.log('git server', this.gitServer);
    Promise.resolve();
  }

  /**
   * 依据git平台创建对应的gitServer
   * @param gitServer
   * @returns
   */
  @verbose(false)
  createGitServer(gitServer: typeof GITHUB | typeof GITEE): GitServer | null {
    let server = null;
    if (gitServer == GITHUB) {
      server = new GitHub();
    } else if (gitServer == GITEE) {
      server = new Gitee();
    }
    return server;
  }

  /**
   * 确保｜初始化 本地是否设置了git token
   */
  @verbose()
  async checkLocalGitToken() {
    const tokenPath = this.createPath(GIT_TOKEN_FILE);
    let token = readFile(tokenPath);
    if (!token || this.options.refreshToken) {
      log.warn(
        this.gitServer.type,
        'token不存在',
        '请先设置token ' +
          terminalLink('#点击查看帮助', this.gitServer.getTokenHelpUrl()),
      );
      token = (
        await inquirer.prompt({
          type: 'password',
          name: 'token',
          message: '请将token复制到这里',
          default: '',
        })
      ).token;
      writeFile(tokenPath, token);
      log.success('token写入成功', `${token} -> ${tokenPath}`);
    } else {
      log.success('token获取成功', tokenPath);
    }
    this.remote.token = token;
    this.gitServer.setToken(token);
  }

  /**
   * 获取远程Git的用户与组织信息
   */
  @verbose()
  async getRemoteUserAndOrgs() {
    this.remote.user = await this.gitServer.getUser();
    if (!this.remote.user) {
      throw new Error('用户信息失败');
    }
    this.remote.orgs = await this.gitServer.getOrg(this.remote.user.login);
    if (!this.remote.orgs) {
      throw new Error('组织信息获取失败');
    }
  }

  /**
   * 确保｜初始化 本地化用户与组织信息
   */
  async checkGitOwner() {
    const ownerPath = this.createPath(GIT_OWN_FILE);
    const loginPath = this.createPath(GIT_LOGIN_FILE);
    let owner = readFile(ownerPath);
    let login = readFile(loginPath);
    if (!owner || !login || this.options.refreshOwner) {
      owner = (
        await inquirer.prompt({
          type: 'list',
          name: 'owner',
          message: '请选择远程仓库类型',
          default: REPO_OWNER_USER,
          choices:
            this.remote.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
        })
      ).owner;
      if (owner === REPO_OWNER_USER) {
        login = this.remote.user.login;
      } else {
        login = (
          await inquirer.prompt({
            type: 'list',
            name: 'login',
            message: '请选择',
            choices: this.remote.orgs.map((item) => ({
              name: item.login,
              value: item.login,
            })),
          })
        ).login;
      }
      writeFile(ownerPath, owner);
      writeFile(loginPath, login);
      log.success('owner写入成功', `${owner} -> ${ownerPath}`);
      log.success('login写入成功', `${login} -> ${loginPath}`);
    } else {
      log.success('owner获取成功', owner);
      log.success('login获取成功', login);
    }
    this.remote.owner = owner;
    this.remote.login = login;
  }

  /**
   * 确保｜初始化 远程仓库在本地创建
   */
  async checkLocalRepo() {
    let repo = await this.gitServer.getRepo(
      this.project.name,
      this.remote.login,
    );
    if (!repo || (repo && repo.status === 404)) {
      let spinner = spinnerStart('开始创建远程仓库...');
      try {
        if (this.remote.owner === REPO_OWNER_USER) {
          repo = await this.gitServer.createRepo(this.project.name);
        } else {
          this.gitServer.createOrgRepo(this.project.name, this.remote.login);
        }
      } catch (e) {
        log.error(e);
      } finally {
        spinner.stop(true);
      }
      if (repo) {
        log.success('远程仓库创建成功');
      } else {
        throw new Error('远程仓库创建失败');
      }
    } else {
      log.success('远程仓库信息获取成功');
    }
    //log.verbose('repo', repo);
    this.remote.repo = repo;
  }

  /**
   * 确保｜初始化 .gitignore文件
   */
  async checkGitIgnore() {
    const gitIgnore = path.resolve(this.project.dir, GIT_IGNORE_FILE);
    if (!fs.existsSync(gitIgnore)) {
      writeFile(gitIgnore, Gitnore);
      log.success(`自动写入${GIT_IGNORE_FILE}文件成功`);
    } else {
      log.verbose(`已存在${GIT_IGNORE_FILE}文件`);
    }
  }

  /**
   * 创建文件地址
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

export function verbose(async = true) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (async) {
      descriptor.value = async function (...args: any[]) {
        log.verbose('GIT', `执行ASYNC`, `${propertyKey}方法`, '参数', args);
        const res = await originalMethod.apply(this, args);
        log.verbose('GIT', `执行ASYNC`, ` ${propertyKey}方法`, 'DONE');
        return res;
      };
    } else {
      descriptor.value = function (...args: any[]) {
        log.verbose('GIT', `执行`, `${propertyKey}方法`, '参数', args);
        let res = originalMethod.apply(this, args);
        log.verbose('GIT', `执行`, `${propertyKey}方法`, 'DONE');
        return res;
      };
    }
  };
}

export default Git;
