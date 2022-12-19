"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitServer {
    constructor(type) {
        this.isHttpResponse = (response) => {
            return response && response.status;
        };
        this.handleResponse = (response) => {
            if (this.isHttpResponse(response) && response !== 200) {
                return null;
            }
            else {
                return response;
            }
        };
        this.type = type;
    }
    setToken(token) {
        this.token = token;
    }
}
exports.default = GitServer;
