"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const BASE_URL = 'https://gitee.com/api/v5';
class GitRequest {
    constructor(token) {
        this.token = token;
        this.service = axios_1.default.create({ baseURL: BASE_URL, timeout: 5000 });
        this.service.interceptors.response.use((response) => {
            return response.data;
        }, (error) => {
            if (error.response && error.response.data) {
                return error.response;
            }
            else {
                return Promise.reject(error);
            }
        });
    }
    get(url, params = null, headers = null) {
        return this.service({
            url,
            params: Object.assign(Object.assign({}, params), { access_token: this.token }),
            method: 'get',
            headers,
        });
    }
    post(url, data, headers) {
        return this.service({
            url,
            params: {
                access_token: this.token,
            },
            data,
            method: 'post',
            headers,
        });
    }
}
exports.default = GitRequest;
