'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const simple_git_1 = require("simple-git");
class Git {
    constructor(projectInfo) {
        Object.keys(projectInfo).forEach((key) => {
            this[key] = projectInfo[key];
        });
        this.git = (0, simple_git_1.simpleGit)(this.dir);
        console.log('project info git', this.git);
    }
    init() {
        console.log('exec init git');
    }
}
exports.default = Git;
//# sourceMappingURL=index.js.map