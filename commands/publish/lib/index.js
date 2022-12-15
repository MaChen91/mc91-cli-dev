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
Object.defineProperty(exports, "__esModule", { value: true });
const Command = require('@mc91-cli-dev/command');
const log = require('@mc91-cli-dev/log');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const git_1 = require("@mc91-cli-dev/git");
class PublishCommand extends Command {
    constructor(argv) {
        super(argv);
    }
    init() {
        console.log('init', this._argv);
    }
    async exec() {
        const startTime = new Date().getTime();
        await this.prepare();
        const git = new git_1.default(this.projectInfo);
        git.init();
        const endTime = new Date().getTime();
        log.info('本次发布耗时', Math.floor((endTime - startTime) / 1000), 'ms');
    }
    async prepare() {
        const projectPath = process.cwd();
        const pkgPath = path.resolve(projectPath, 'package.json');
        log.verbose('package.json', pkgPath);
        if (!fs.existsSync(pkgPath)) {
            throw new Error('package.json不存在！');
        }
        const pkg = fse.readJsonSync(pkgPath);
        const { name, version, scripts } = pkg;
        log.verbose('package.json', name, version, scripts);
        if (!name || !version || !scripts || !scripts.build) {
            throw new Error('package.json信息不全，请检查是否存在name、version和scripts（需提供build命令）！');
        }
        this.projectInfo = { name, version, dir: projectPath };
    }
}
__decorate([
    debug,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublishCommand.prototype, "exec", null);
function init(argv) {
    return new PublishCommand(argv);
}
function debug(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            await originalMethod.apply(this, args);
        }
        catch (error) {
            log.error(error.message);
            if (process.env.LOG_LEVEL === 'verbose') {
                console.log(error);
            }
        }
    };
}
module.exports = init;
module.exports.PublishCommand = PublishCommand;
//# sourceMappingURL=index.js.map