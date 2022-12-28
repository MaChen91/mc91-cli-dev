'use strict';
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const log = require('@mc91-cli-dev/log');
const request = require('@mc91-cli-dev/request');
const inquirer = require('inquirer');
const WS_SERVER = (_a = process.env.MC91_CLI_SOCKET_URL) !== null && _a !== void 0 ? _a : 'ws://localhost:3002';
const TIME_OUT = 5 * 60 * 1000;
const CONNECT_TIME_OUT = 5 * 1000;
const FAILED_CODE = [
    'prepare failed',
    'download failed',
    'install failed',
    'build failed',
    'pre-publish failed',
    'publish failed',
];
class CloudBuild {
    constructor(git, options) {
        this.prod = false;
        this.timeout = TIME_OUT;
        this.timer = null;
        this.socket = null;
        this.git = git;
        this.buildCmd = options.buildCmd;
        this.prod = options.prod;
    }
    doTimeout(fn, timeout) {
        this.timer && clearTimeout(this.timer);
        log.info('设置任务超时时间：', `${timeout / 1000}秒`);
        this.timer = setTimeout(fn, timeout);
    }
    async prepare() {
        if (this.prod) {
            const projectName = this.git.project.name;
            const projectType = this.prod ? 'prod' : 'dev';
            const ossProject = await request({
                url: `/io/oss/${projectName}/${projectType}`,
            });
            log.verbose('ossProject', ossProject);
            if (ossProject.errno === 0 && ossProject.data.Contents.length > 0) {
                const cover = (await inquirer.prompt({
                    type: 'list',
                    name: 'cover',
                    choices: [
                        {
                            name: '覆盖发布',
                            value: true,
                        },
                        {
                            name: '放弃发布',
                            value: false,
                        },
                    ],
                    defaultValue: true,
                    message: `OSS已存在 [${projectName}] 项目，是否强行覆盖发布？`,
                })).cover;
                if (!cover) {
                    throw new Error('发布终止');
                }
            }
        }
    }
    init() {
        return new Promise((resolve, reject) => {
            console.log('WS_SERVER', WS_SERVER);
            const socket = (0, socket_io_client_1.io)(WS_SERVER, {
                query: {
                    name: this.git.project.name,
                    version: this.git.project.version,
                    branch: this.git.remote.branch,
                    repo: this.git.remote.repo.clone_url,
                    buildCmd: this.buildCmd,
                    prod: this.prod,
                },
                extraHeaders: {
                    user: 'string',
                    pwd: 'string',
                },
            });
            socket.on('connect', () => {
                clearTimeout(this.timer);
                const { id } = socket;
                log.success('云构建任务创建成功', `任务ID: ${id}`);
                socket.on(id, (msg) => {
                    log.success(msg);
                });
                resolve();
            });
            const disconnect = () => {
                clearTimeout(this.timer);
                socket.disconnect();
                socket.close();
            };
            this.doTimeout(() => {
                log.error('云构建服务连接超时，自动终止');
                disconnect();
            }, CONNECT_TIME_OUT);
            socket.on('disconnect', () => {
                log.success('disconnect', '云构建任务断开');
                disconnect();
            });
            socket.on('error', (err) => {
                log.error('error', '云构建出错！', err);
                disconnect();
                reject(err);
            });
            this.socket = socket;
        });
    }
    build() {
        let ret = true;
        return new Promise((resolve, reject) => {
            this.socket.emit('build');
            this.socket.on('build', (msg) => {
                log.success(msg);
            });
            this.socket.on('building', (msg) => {
                console.log(msg);
            });
            this.socket.on('disconnect', () => {
                resolve(ret);
            });
            this.socket.on('error', (err) => {
                reject(err);
            });
        });
    }
}
exports.default = CloudBuild;
