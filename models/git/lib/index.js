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
const GITHUB = 'github';
const GITEE = 'gitee';
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
    constructor(projectInfo) {
        this.refreshServer = false;
        Object.keys(projectInfo).forEach((key) => {
            if (this[key] != undefined) {
                this[key] = projectInfo[key];
            }
        });
        this.git = (0, simple_git_1.simpleGit)(this.dir);
    }
    async prepare() {
        this.checkHomePath();
        await this.checkGitServer();
        await this.checkGitToken();
    }
    init() {
        console.log('exec init git');
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
    async checkGitServer() {
        const gitServerPath = this.createPath(GIT_SERVER_FILE);
        let gitServer = (0, utils_1.readFile)(gitServerPath);
        if (!gitServer || this.refreshServer) {
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
        if (!this.gitServer) {
            throw new Error('GitServer初始化失败！');
        }
    }
    createGitServer(gitServer) {
        if (gitServer == GITHUB) {
            return new GitHub_1.default();
        }
        else if (gitServer == GITEE) {
            return new Gitee_1.default();
        }
        return null;
    }
    async checkGitToken() {
        const tokenpath = this.createPath(GIT_TOKEN_FILE);
        let token = (0, utils_1.readFile)(tokenpath);
        if (!token) {
            log.warn(this.gitServer.type, 'token不存在', '请先设置token ' +
                terminalLink('#点击查看帮助', this.gitServer.getTokenHelpUrl()));
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
    verbose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "prepare", null);
__decorate([
    verbose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Git.prototype, "init", null);
__decorate([
    verbose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Git.prototype, "checkHomePath", null);
__decorate([
    verbose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkGitServer", null);
__decorate([
    verbose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Git.prototype, "checkGitToken", null);
function verbose(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        log.verbose('GIT', `执行${propertyKey}方法`);
        await originalMethod.apply(this, args);
    };
}
exports.default = Git;
//# sourceMappingURL=index.js.map