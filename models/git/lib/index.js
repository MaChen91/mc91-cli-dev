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
exports.verbose = void 0;
const simple_git_1 = require("simple-git");
const utils_1 = require("@mc91-cli-dev/utils");
const GitHub_1 = require("./GitHub");
const Gitee_1 = require("./Gitee");
const GitServer_1 = require("./GitServer");
const config_1 = require("./config");
const cloudbuild_1 = require("./cloudbuild");
const Listr = require('listr');
const { Observable } = require('rxjs');
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
        name: '??????',
        value: REPO_OWNER_USER,
    },
    {
        name: '??????',
        value: REPO_OWNER_ORG,
    },
];
const GIT_OWNER_TYPE_ONLY = [
    {
        name: '??????',
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
            gitPublish: null,
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
    async publish() {
        await this.preparePublish();
        const { buildCmd, prod } = this.options;
        const cloudBuild = new cloudbuild_1.default(this, {
            buildCmd,
            prod,
        });
        log.verbose('prod', prod);
        await cloudBuild.prepare();
        await cloudBuild.init();
        await cloudBuild.build();
        if (this.options.prod) {
            this.runCreateTagTask();
        }
    }
    runCreateTagTask() {
        const delay = (fn) => setTimeout(fn, 1000);
        const tasks = new Listr([
            {
                title: '????????????????????????Tag',
                task: () => new Listr([
                    {
                        title: '??????Tag',
                        task: () => {
                            return new Observable((o) => {
                                o.next('????????????Tag');
                                delay(() => {
                                    this.checkTag().then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                    {
                        title: '???????????????master',
                        task: () => {
                            return new Observable((o) => {
                                o.next('????????????master??????');
                                delay(() => {
                                    this.checkoutBranch('master').then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                    {
                        title: '??????????????????????????????master',
                        task: () => {
                            return new Observable((o) => {
                                o.next('???????????????master??????');
                                delay(() => {
                                    this.mergeBranchToMaster().then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                    {
                        title: '????????????????????????master',
                        task: () => {
                            return new Observable((o) => {
                                o.next('????????????master??????');
                                delay(() => {
                                    this.pushRemoteRepo('master').then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                    {
                        title: '????????????????????????',
                        task: () => {
                            return new Observable((o) => {
                                o.next('??????????????????????????????');
                                delay(() => {
                                    this.deleteLocalBranch().then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                    {
                        title: '????????????????????????',
                        task: () => {
                            return new Observable((o) => {
                                o.next('??????????????????????????????');
                                delay(() => {
                                    this.deleteRemoteBranch().then(() => {
                                        o.complete();
                                    });
                                });
                            });
                        },
                    },
                ]),
            },
        ]);
        tasks.run();
    }
    async deleteLocalBranch() {
        await this.git.deleteLocalBranch(this.remote.branch);
    }
    async deleteRemoteBranch() {
        await this.git.push(['origin', '--delete', this.remote.branch]);
    }
    async mergeBranchToMaster() {
        await this.git.mergeFromTo(this.remote.branch, 'master');
    }
    async checkTag() {
        const tag = `${VERSION_RELEASE}/${this.project.version}`;
        const tagList = await this.getRemoteBranchList(VERSION_RELEASE);
        if (tagList.includes(this.project.version)) {
            await this.git.push(['origin', `:refs/tags/${tag}`]);
        }
        const localTagList = await this.git.tags();
        if (localTagList.all.includes(tag)) {
            await this.git.tag(['-d', tag]);
        }
        await this.git.addTag(tag);
        await this.git.pushTags('origin');
    }
    async preparePublish() {
        const pkg = this.getPackageJson();
        if (this.options.buildCmd) {
            const buildCmdArray = this.options.buildCmd.split(' ');
            if (buildCmdArray[0] !== 'npm' && buildCmdArray[0] !== 'cnpm') {
                throw new Error('Build???????????????????????????npm???cnpm???');
            }
        }
        else {
            this.options.buildCmd = 'npm run build';
        }
        const buildCmdArray = this.options.buildCmd.split(' ');
        const lastCmd = buildCmdArray[buildCmdArray.length - 1];
        if (!pkg.scripts || !Object.keys(pkg.scripts).includes(lastCmd)) {
            throw new Error(this.options.buildCmd + '??????????????????');
        }
        log.success('?????????????????????');
        const gitPublishPath = this.createPath(GIT_PUBLISH_FILE);
        let gitPublish = (0, utils_1.readFile)(gitPublishPath);
        if (!gitPublish) {
            gitPublish = (await inquirer.prompt({
                type: 'list',
                choices: GIT_PUBLISH_TYPE,
                message: '???????????????????????????????????????',
                name: 'gitPublish',
            })).gitPublish;
            (0, utils_1.writeFile)(gitPublishPath, gitPublish);
            log.success('git publish??????????????????', `${gitPublish} -> ${gitPublishPath}`);
        }
        else {
            log.success('git publish??????????????????', gitPublish);
        }
        this.remote.gitPublish = gitPublish;
    }
    getPackageJson() {
        const pkgPath = path.resolve(this.project.dir, 'package.json');
        if (!fs.existsSync(pkgPath)) {
            throw new Error(`package.json ???????????????????????????${this.project.dir}`);
        }
        return fse.readJsonSync(pkgPath);
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
        log.info(`?????? [master] -> [${this.remote.branch}]`);
        await this.pullRemoteRepo('master');
        log.success('???????????? [master] ??????????????????');
        await this.checkConflicted();
        log.info('????????????????????????');
        const remoteBranchList = await this.getRemoteBranchList(VERSION_DEVELOP);
        if (remoteBranchList.indexOf(this.project.version) >= 0) {
            log.info(`?????? [${this.remote.branch}] -> [${this.remote.branch}]`);
            await this.pullRemoteRepo(this.remote.branch);
            log.success(`???????????? [${this.remote.branch}] ??????????????????`);
            await this.checkConflicted();
        }
        else {
            log.success(`????????????????????? [${this.remote.branch}]`);
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
                message: '??????stash??????????????????????????????????????????',
            }).ifContinue;
            if (ifContinue) {
                await this.git.stash(['pop']);
                log.success('stash pop??????');
            }
            else {
                log.info('?????????????????????????????????stash???');
            }
        }
        else {
            log.verbose('??????stash???????????????????????????');
        }
    }
    async getCorrectVersion() {
        log.info('??????????????????');
        const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE);
        console.log(remoteBranchList);
        let releaseVersion = null;
        if (remoteBranchList && remoteBranchList.length > 0) {
            releaseVersion = remoteBranchList[0];
        }
        log.verbose('?????????????????????', releaseVersion);
        const devVersion = this.project.version;
        if (!releaseVersion) {
            this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
        }
        else if (semver.gt(this.project.version, releaseVersion)) {
            log.info('????????????????????????????????????', `${devVersion} >= ${releaseVersion}`);
            this.remote.branch = `${VERSION_DEVELOP}/${devVersion}`;
        }
        else {
            log.info('????????????????????????????????????', `${releaseVersion} > ${devVersion}`);
            const incType = (await inquirer.prompt({
                type: 'list',
                name: 'incType',
                message: '????????????????????????????????????????????????',
                default: 'patch',
                choices: [
                    {
                        name: `????????????${releaseVersion} -> ${semver.inc(releaseVersion, 'patch')}???`,
                        value: 'patch',
                    },
                    {
                        name: `????????????${releaseVersion} -> ${semver.inc(releaseVersion, 'minor')}???`,
                        value: 'minor',
                    },
                    {
                        name: `????????????${releaseVersion} -> ${semver.inc(releaseVersion, 'major')}???`,
                        value: 'major',
                    },
                ],
            })).incType;
            const incVersion = semver.inc(releaseVersion, incType);
            this.remote.branch = `${VERSION_DEVELOP}/${incVersion}`;
            this.project.version = incVersion;
        }
        log.verbose('??????????????????', this.remote.branch);
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
            log.success('git??????????????????');
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
            throw new Error('????????????????????????????????????????????????????????????');
        }
        log.success('????????????????????????');
    }
    async checkRemoteMaster() {
        return ((await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0);
    }
    async pullRemoteRepo(branchName, options = {}) {
        log.info(`????????????${branchName}????????????`);
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
            await this.git.add(status.renamed);
            let message;
            while (!message) {
                message = (await inquirer.prompt({
                    type: 'text',
                    name: 'message',
                    message: '?????????commit?????????',
                })).message;
            }
            await this.git.commit(message);
            log.success('??????commit????????????');
        }
    }
    checkHomePath() {
        var _a;
        this.homePath =
            (_a = process.env.CLI_HOME_PATH) !== null && _a !== void 0 ? _a : path.resolve(userHome, DEFAULT_CLI_HOME);
        log.verbose('homePath', this.homePath);
        fse.ensureDirSync(this.homePath);
        if (!fs.existsSync(this.homePath)) {
            throw new Error('??????????????????????????????');
        }
    }
    async checkLocalGitPlatform() {
        const gitServerPath = this.createPath(GIT_SERVER_FILE);
        let gitServer = (0, utils_1.readFile)(gitServerPath);
        if (!gitServer || this.options.refreshServer) {
            gitServer = (await inquirer.prompt({
                type: 'list',
                name: 'gitServer',
                message: '???????????????????????????Git??????',
                default: GITHUB,
                choices: GIT_SERVER_TYPE,
            })).gitServer;
            (0, utils_1.writeFile)(gitServerPath, gitServer);
            log.success('git server????????????', `${gitServer} -> ${gitServerPath}`);
        }
        else {
            log.success('git server????????????', gitServer);
        }
        this.gitServer = this.createGitServer(gitServer);
        if (this.gitServer === null) {
            throw new Error('GitServer??????????????????');
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
            log.warn(this.gitServer.type, 'token?????????', '????????????token ' +
                terminalLink('#??????????????????', this.gitServer.getTokenHelpUrl()));
            token = (await inquirer.prompt({
                type: 'password',
                name: 'token',
                message: '??????token???????????????',
                default: '',
            })).token;
            (0, utils_1.writeFile)(tokenPath, token);
            log.success('token????????????', `${token} -> ${tokenPath}`);
        }
        else {
            log.success('token????????????', tokenPath);
        }
        this.remote.token = token;
        this.gitServer.setToken(token);
    }
    async getRemoteUserAndOrgs() {
        this.remote.user = await this.gitServer.getUser();
        if (!this.remote.user) {
            throw new Error('??????????????????');
        }
        this.remote.orgs = await this.gitServer.getOrg(this.remote.user.login);
        if (!this.remote.orgs) {
            throw new Error('????????????????????????');
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
                message: '???????????????????????????',
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
                    message: '?????????',
                    choices: this.remote.orgs.map((item) => ({
                        name: item.login,
                        value: item.login,
                    })),
                })).login;
            }
            (0, utils_1.writeFile)(ownerPath, owner);
            (0, utils_1.writeFile)(loginPath, login);
            log.success('owner????????????', `${owner} -> ${ownerPath}`);
            log.success('login????????????', `${login} -> ${loginPath}`);
        }
        else {
            log.success('owner????????????', owner);
            log.success('login????????????', login);
        }
        this.remote.owner = owner;
        this.remote.login = login;
    }
    async checkLocalRepo() {
        let repo = await this.gitServer.getRepo(this.project.name, this.remote.login);
        if (!repo || (repo && repo.status === 404)) {
            let spinner = (0, utils_1.spinnerStart)('????????????????????????...');
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
                log.success('????????????????????????');
            }
            else {
                throw new Error('????????????????????????');
            }
        }
        else {
            log.success('??????????????????????????????');
        }
        log.verbose('repo', repo);
        this.remote.repo = repo;
    }
    async checkGitIgnore() {
        const gitIgnore = path.resolve(this.project.dir, GIT_IGNORE_FILE);
        if (!fs.existsSync(gitIgnore)) {
            (0, utils_1.writeFile)(gitIgnore, config_1.Gitnore);
            log.success(`????????????${GIT_IGNORE_FILE}????????????`);
        }
        else {
            log.verbose(`?????????${GIT_IGNORE_FILE}??????`);
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
], Git.prototype, "publish", null);
__decorate([
    verbose(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "preparePublish", null);
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
                log.verbose('GIT', `??????ASYNC`, `${propertyKey}??????`, '??????', args);
                const res = await originalMethod.apply(this, args);
                log.verbose('GIT', `??????ASYNC`, ` ${propertyKey}??????`, 'DONE');
                return res;
            };
        }
        else {
            descriptor.value = function (...args) {
                log.verbose('GIT', `??????`, `${propertyKey}??????`, '??????', args);
                let res = originalMethod.apply(this, args);
                log.verbose('GIT', `??????`, `${propertyKey}??????`, 'DONE');
                return res;
            };
        }
    };
}
exports.verbose = verbose;
exports.default = Git;
