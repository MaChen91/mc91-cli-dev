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
const Command = require('@mc91-cli-dev/command');
let AddCommand = class AddCommand extends Command {
    constructor(argv) {
        super(argv);
        console.log(argv);
    }
    init() {
        console.log('add command init');
    }
    exec() {
        console.log('add command');
    }
};
AddCommand = __decorate([
    decorator,
    __metadata("design:paramtypes", [Object])
], AddCommand);
module.exports = add;
module.exports.AddCommand = AddCommand;
function add(...args) {
    return new AddCommand(args);
}
function decorator(...args) {
    args.forEach((arg, index) => {
        console.log(`参数${index}`, arg);
    });
}
//# sourceMappingURL=index.js.map