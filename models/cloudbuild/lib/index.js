'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const log = require('@imooc-cli-dev/log');
const request = require('@imooc-cli-dev/request');
const WS_SERVER = process.env.MC91_CLI_BASE_URL;
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
        this.git = git;
        this.buildCmd = options.buildCmd;
        this.prod = options.prod;
    }
}
exports.default = CloudBuild;
