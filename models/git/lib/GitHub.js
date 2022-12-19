"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitServer_1 = require("./GitServer");
const GitHubRequest_1 = require("./GitHubRequest");
class GitHub extends GitServer_1.default {
    constructor() {
        super('github');
    }
    setToken(token) {
        super.setToken(token);
        this.request = new GitHubRequest_1.default(token);
    }
    getRepo(name, login) {
        return new Promise((resolve, reject) => {
            this.request
                .get(`/repos/${login}/${name}`)
                .then((response) => {
                resolve(response);
            })
                .catch((err) => reject(err));
        });
    }
    getRemote(name, login) {
        return `git@github.com:${login}/${name}.git`;
    }
    async getUser() {
        return this.request.get('/user');
    }
    async getOrg(username) {
        return this.request.get(`/users/${username}/orgs`, {
            page: 1,
            per_page: 100,
        });
    }
    async createRepo(name) {
        return this.request.post('/user/repos', { name }, { Accept: 'application/vnd.github.v3+json' });
    }
    async createOrgRepo(name, login) {
        return this.request.post(`/orgs/${login}/repos`, { name }, { Accept: 'application/vnd.github.v3+json' });
    }
    getTokenUrl() {
        return 'https://github.com/settings/tokens';
    }
    getTokenHelpUrl() {
        return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh';
    }
}
exports.default = GitHub;
