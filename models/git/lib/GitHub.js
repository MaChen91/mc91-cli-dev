"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitServer_1 = require("./GitServer");
class GitHub extends GitServer_1.default {
    constructor() {
        super('github');
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
        return 'https://github.com/settings/tokens';
    }
    getTokenHelpUrl() {
        return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh';
    }
}
exports.default = GitHub;
//# sourceMappingURL=GitHub.js.map