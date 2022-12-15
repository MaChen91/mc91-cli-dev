"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitServer_1 = require("./GitServer");
class Gitee extends GitServer_1.default {
    constructor() {
        super('gitee');
    }
    async createRepo(name) {
        console.log('createRepo');
    }
    async createOrgRepo(name, login) {
        console.log('createOrgRepo');
    }
    async getRemote() {
        console.log('getRomte');
    }
    async getUser() {
        console.log('getUser');
    }
    async getOrg() {
        console.log('getOrg');
    }
    getTokenUrl() {
        return 'https://gitee.com/personal_access_tokens';
    }
    getTokenHelpUrl() {
        return 'https://gitee.com/help/articles/4191';
    }
}
exports.default = Gitee;
//# sourceMappingURL=Gitee.js.map