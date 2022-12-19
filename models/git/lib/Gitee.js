"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitServer_1 = require("./GitServer");
const GiteeRequest_1 = require("./GiteeRequest");
class Gitee extends GitServer_1.default {
    constructor() {
        super('gitee');
    }
    setToken(token) {
        super.setToken(token);
        this.request = new GiteeRequest_1.default(token);
    }
    getRepo(login, name) {
        return new Promise((resolve, reject) => {
            this.request
                .get(`/repos/${login}/${name}`)
                .then((response) => {
                resolve(response);
            })
                .catch((err) => reject(err));
        });
    }
    createRepo(name) {
        return this.request.post('/user/repos', {
            name,
        });
    }
    createOrgRepo(name, login) {
        return this.request.post(`/orgs/${login}/repos`, {
            name,
        });
    }
    getRemote(name, login) {
        return `git@gitee.com:${login}/${name}.git`;
    }
    getUser() {
        return this.request.get('/user');
    }
    async getOrg(username) {
        return this.request.get(`/users/${username}/orgs`, {
            page: 1,
            per_page: 100,
        });
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