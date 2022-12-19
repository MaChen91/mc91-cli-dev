'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const simple_git_1 = require("simple-git");
const utils_1 = require("@mc91-cli-dev/utils");
const GitHub_1 = require("./GitHub");
const Gitee_1 = require("./Gitee");
const GitServer_1 = require("./GitServer");
const config_1 = require("./config");
const semver = require('semver');
const terminalLink = require('terminal-link');
const userHome = require('user-home');
const inquirer = require('inquirer');
const fs = require('fs');
const log = require('@mc91-cli-dev/log');
const fse = require('fs-extra');
const path = require('path');
const DEFAULT_CLI_HOME = (_a = process.env.CLI_HOME_PATH) !== null && _a !== void 0 ? _a : '.mc91-cli-dev';
const GIT_ROOT_DIR = '.git';
const GIT_SERVER_FILE = '.git_server';
const GIT_TOKEN_FILE = '.git_token';
const GIT_OWN_FILE = '.git_own';
const GIT_LOGIN_FILE = '.git_login';
const GIT_IGNORE_FILE = '.gitignore';
const GITHUB = 'github';
const GITEE = 'gitee';
const REPO_OWNER_USER = 'user';
const REPO_OWNER_ORG = 'org';
const GIT_PUBLISH_FILE = '.git_publish';
const VERSION_RELEASE = 'release';
const VERSION_DEVELOP = 'dev';
const TEMPLATE_TEMP_DIR = 'oss';
const COMPONENT_FILE = '.componentrc';
const GIT_OWNER_TYPE = [
    {
        name: '个人',
        value: REPO_OWNER_USER,
    },
    {
        name: '组织',
        value: REPO_OWNER_ORG,
    },
];
const GIT_OWNER_TYPE_ONLY = [
    {
        name: '个人',
        value: REPO_OWNER_USER,
    },
];
const GIT_PUBLISH_TYPE = [
    {
        name: 'OSS',
        value: 'oss',
    },
];
const GIT_SERVER_TYPE = [
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
    constructor(project, gitOpts) {
        this.remote = {
            info: null,
            token: null,
            user: null,
            orgs: null,
            owner: null,
            login: null,
            repo: null,
            branch: null,
        };
        this.options = {
            refreshServer: false,
            refreshToken: false,
            refreshOwner: false,
            buildCmd: '',
            prod: false,
            ssh: null,
        };
        this.project = project;
        this.options = Object.assign(Object.assign({}, this.options), gitOpts);
        this.git = (0, simple_git_1.simpleGit)(this.project.dir);
    }
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
    async init() {
        if (await this.getLocalRemote()) {
            return;
        }
        await this.initAndAddRemote();
        await this.initCommit();
    }
    async commit() {
        await this.getCorrectVersion();
        await this.checkStash();
        await this.checkConflicted();
        await this.checkNotCommitted();
        await this.checkoutBranch(this.remote.branch);
        await this.pullRemoteMasterAndBranch();
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
        }
        else {
            log.success(`不存在远程分支 [${this.remote.branch}]`);
        }
    }
    async checkoutBranch(branch) {
        const localBranchList = await this.git.branchLocal();
        if (localBranchList.all.indexOf(branch) >= 0) {
            await this.git.checkout(branch);
        }
        else {
            await this.git.checkoutLocalBranch(branch);
        }
    }
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
            }
            else {
                log.info('未提交的代码已经保存在stash区');
            }
        }
        else {
            log.verbose('当前stash区没有未提交的代码');
        }
    }
    async getCorrectVersion() {
        log.info('获取代码分支');
        const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE);
        console.log(remoteBranchList);
        let releaseVersion = null;
        if (remoteBranchList && remoteBranchList.length > 0) {
            releaseVersion = remoteBranchList[0];
        }
        log.verbose('线上最新版本号', releaseVersion);
        const devVersion = this.project.version;
        if (!releaseVersion) {
            this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
        }
        else if (semver.gt(this.project.version, releaseVersion)) {
            log.info('当前版本大于线上最新版本', `${devVersion} >= ${releaseVersion}`);
            this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
        }
        else {
            log.info('当前线上版本大于本地版本', `${releaseVersion} > ${devVersion}`);
            const incType = (await inquirer.prompt({
                type: 'list',
                name: 'incType',
                message: '自动升级版本，请选择升级版本类型',
                default: 'patch',
                choices: [
                    {
                        name: `小版本（${releaseVersion} -> ${semver.inc(releaseVersion, 'patch')}）`,
                        value: 'patch',
                    },
                    {
                        name: `中版本（${releaseVersion} -> ${semver.inc(releaseVersion, 'minor')}）`,
                        value: 'minor',
                    },
                    {
                        name: `大版本（${releaseVersion} -> ${semver.inc(releaseVersion, 'major')}）`,
                        value: 'major',
                    },
                ],
            })).incType;
            const incVersion = semver.inc(releaseVersion, incType);
            this.remote.branch = `${VERSION_DEVELOP}/${incVersion}`;
            this.project.version = incVersion;
        }
        log.verbose('本地开发分支', this.remote.branch);
        this.syncVersionToPackageJson();
    }
    syncVersionToPackageJson() {
        const pkg = fse.readJsonSync(`${this.project.dir}/package.json`);
        if (pkg && pkg.version !== this.project.version) {
            pkg.version = this.project.version;
            fse.writeJsonSync(`${this.project.dir}/package.json`, pkg, { spaces: 2 });
        }
    }
    async getRemoteBranchList(type) {
        const remoteList = await this.git.listRemote(['--refs']);
        let reg;
        if (type === VERSION_RELEASE) {
            reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
        }
        else {
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
                if (a === b)
                    return 0;
                return -1;
            }
            return 1;
        });
        console.log(list);
        return list;
    }
    getLocalRemote() {
        const gitPath = path.resolve(this.project.dir, GIT_ROOT_DIR);
        this.remote.info = this.gitServer.getRemote(this.project.name, this.remote.login);
        if (fs.existsSync(gitPath)) {
            log.success('git已完成初始化');
            return true;
        }
        return false;
    }
    async initAndAddRemote() {
        await this.git.init();
        const remotes = await this.git.getRemotes();
        log.verbose('git remotes', remotes);
        if (!remotes.find((item) => item.name === 'origin')) {
            await this.git.addRemote('origin', this.remote.info);
        }
    }
    async initCommit() {
        await this.checkConflicted();
        await this.checkNotCommitted();
        if (await this.checkRemoteMaster()) {
            await this.pullRemoteRepo('master', {
                '--allow-unrelated-histories': null,
            });
        }
        else {
            await this.pushRemoteRepo('master');
        }
    }
    async checkConflicted() {
        const status = await this.git.status();
        if (status.conflicted.length > 0) {
            throw new Error('当前代码存在冲突，请手动处理合并后再试！');
        }
        log.success('代码冲突检查通过');
    }
    async checkRemoteMaster() {
        return ((await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0);
    }
    async pullRemoteRepo(branchName, options = {}) {
        log.info(`同步远程${branchName}分支代码`);
        await this.git.pull('origin', branchName, options).catch((err) => {
            log.error(err.message);
        });
    }
    async pushRemoteRepo(branchName) {
        await this.git.push('origin', branchName);
    }
    async checkNotCommitted() {
        const status = await this.git.status();
        if (status.not_added.length > 0 ||
            status.created.length > 0 ||
            status.deleted.length > 0 ||
            status.modified.length > 0 ||
            status.renamed.length > 0) {
            log.verbose('status', status);
            await this.git.add(status.not_added);
            await this.git.add(status.created);
            await this.git.add(status.deleted);
            await this.git.add(status.modified);
            let message;
            while (!message) {
                message = (await inquirer.prompt({
                    type: 'text',
                    name: 'message',
                    message: '请输入commit信息：',
                })).message;
            }
            await this.git.commit(message);
            log.success('本次commit提交成功');
        }
    }
    checkHomePath() {
        var _a;
        this.homePath =
            (_a = process.env.CLI_HOME_PATH) !== null && _a !== void 0 ? _a : path.resolve(userHome, DEFAULT_CLI_HOME);
        log.verbose('homePath', this.homePath);
        fse.ensureDirSync(this.homePath);
        if (!fs.existsSync(this.homePath)) {
            throw new Error('用户主目录获取失败！');
        }
    }
    async checkLocalGitPlatform() {
        const gitServerPath = this.createPath(GIT_SERVER_FILE);
        let gitServer = (0, utils_1.readFile)(gitServerPath);
        if (!gitServer || this.options.refreshServer) {
            gitServer = (await inquirer.prompt({
                type: 'list',
                name: 'gitServer',
                message: '请选择您想要托管的Git平台',
                default: GITHUB,
                choices: GIT_SERVER_TYPE,
            })).gitServer;
            (0, utils_1.writeFile)(gitServerPath, gitServer);
            log.success('git server写入成功', `${gitServer} -> ${gitServerPath}`);
        }
        else {
            log.success('git server获取成功', gitServer);
        }
        this.gitServer = this.createGitServer(gitServer);
        if (this.gitServer === null) {
            throw new Error('GitServer初始化失败！');
        }
        console.log('git server', this.gitServer);
        Promise.resolve();
    }
    createGitServer(gitServer) {
        let server = null;
        if (gitServer == GITHUB) {
            server = new GitHub_1.default();
        }
        else if (gitServer == GITEE) {
            server = new Gitee_1.default();
        }
        return server;
    }
    async checkLocalGitToken() {
        const tokenPath = this.createPath(GIT_TOKEN_FILE);
        let token = (0, utils_1.readFile)(tokenPath);
        if (!token || this.options.refreshToken) {
            log.warn(this.gitServer.type, 'token不存在', '请先设置token ' +
                terminalLink('#点击查看帮助', this.gitServer.getTokenHelpUrl()));
            token = (await inquirer.prompt({
                type: 'password',
                name: 'token',
                message: '请将token复制到这里',
                default: '',
            })).token;
            (0, utils_1.writeFile)(tokenPath, token);
            log.success('token写入成功', `${token} -> ${tokenPath}`);
        }
        else {
            log.success('token获取成功', tokenPath);
        }
        this.remote.token = token;
        this.gitServer.setToken(token);
    }
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
    async checkGitOwner() {
        const ownerPath = this.createPath(GIT_OWN_FILE);
        const loginPath = this.createPath(GIT_LOGIN_FILE);
        let owner = (0, utils_1.readFile)(ownerPath);
        let login = (0, utils_1.readFile)(loginPath);
        if (!owner || !login || this.options.refreshOwner) {
            owner = (await inquirer.prompt({
                type: 'list',
                name: 'owner',
                message: '请选择远程仓库类型',
                default: REPO_OWNER_USER,
                choices: this.remote.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
            })).owner;
            if (owner === REPO_OWNER_USER) {
                login = this.remote.user.login;
            }
            else {
                login = (await inquirer.prompt({
                    type: 'list',
                    name: 'login',
                    message: '请选择',
                    choices: this.remote.orgs.map((item) => ({
                        name: item.login,
                        value: item.login,
                    })),
                })).login;
            }
            (0, utils_1.writeFile)(ownerPath, owner);
            (0, utils_1.writeFile)(loginPath, login);
            log.success('owner写入成功', `${owner} -> ${ownerPath}`);
            log.success('login写入成功', `${login} -> ${loginPath}`);
        }
        else {
            log.success('owner获取成功', owner);
            log.success('login获取成功', login);
        }
        this.remote.owner = owner;
        this.remote.login = login;
    }
    async checkLocalRepo() {
        let repo = await this.gitServer.getRepo(this.project.name, this.remote.login);
        if (!repo || (repo && repo.status === 404)) {
            let spinner = (0, utils_1.spinnerStart)('开始创建远程仓库...');
            try {
                if (this.remote.owner === REPO_OWNER_USER) {
                    repo = await this.gitServer.createRepo(this.project.name);
                }
                else {
                    this.gitServer.createOrgRepo(this.project.name, this.remote.login);
                }
            }
            catch (e) {
                log.error(e);
            }
            finally {
                spinner.stop(true);
            }
            if (repo) {
                log.success('远程仓库创建成功');
            }
            else {
                throw new Error('远程仓库创建失败');
            }
        }
        else {
            log.success('远程仓库信息获取成功');
        }
        this.remote.repo = repo;
    }
    async checkGitIgnore() {
        const gitIgnore = path.resolve(this.project.dir, GIT_IGNORE_FILE);
        if (!fs.existsSync(gitIgnore)) {
            (0, utils_1.writeFile)(gitIgnore, config_1.Gitnore);
            log.success(`自动写入${GIT_IGNORE_FILE}文件成功`);
        }
        else {
            log.verbose(`已存在${GIT_IGNORE_FILE}文件`);
        }
    }
    createPath(file) {
        const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR);
        const filePath = path.resolve(rootDir, file);
        fse.ensureDirSync(rootDir);
        return filePath;
    }
}
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "prepare", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "init", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "commit", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkoutBranch", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkStash", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "getCorrectVersion", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Git.prototype, "getRemoteBranchList", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Git.prototype, "getLocalRemote", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "initAndAddRemote", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "initCommit", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkConflicted", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkRemoteMaster", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], Git.prototype, "pullRemoteRepo", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Git.prototype, "pushRemoteRepo", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkNotCommitted", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Git.prototype, "checkHomePath", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkLocalGitPlatform", null);
__decorate([
    verbose(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", GitServer_1.default)
], Git.prototype, "createGitServer", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkLocalGitToken", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "getRemoteUserAndOrgs", null);
function verbose(async = true) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        if (async) {
            descriptor.value = async function (...args) {
                log.verbose('GIT', `执行ASYNC`, `${propertyKey}方法`, '参数', args);
                const res = await originalMethod.apply(this, args);
                log.verbose('GIT', `执行ASYNC`, ` ${propertyKey}方法`, 'DONE');
                return res;
            };
        }
        else {
            descriptor.value = function (...args) {
                log.verbose('GIT', `执行`, `${propertyKey}方法`, '参数', args);
                let res = originalMethod.apply(this, args);
                log.verbose('GIT', `执行`, `${propertyKey}方法`, 'DONE');
                return res;
            };
        }
    };
}
exports.default = Git;
//# sourceMappingURL=index.js.map