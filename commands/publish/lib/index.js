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
const command_1 = require("@mc91-cli-dev/command");
const log_1 = require("@mc91-cli-dev/log");
class PublishCommand extends command_1.default {
    init() {
        console.log('init', this._argv);
    }
    exec() {
        throw new Error('exec error');
    }
}
__decorate([
    debug,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
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
            log_1.default.error(error.message);
            if (process.env.LOG_LEVEL === 'verbose') {
                console.log(error);
            }
        }
    };
}
module.exports = init;
module.exports.PublishCommand = PublishCommand;
//# sourceMappingURL=index.js.map