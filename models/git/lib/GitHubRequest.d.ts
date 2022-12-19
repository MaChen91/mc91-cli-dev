import { AxiosInstance } from 'axios';
declare class GitHubRequest {
    token: string;
    service: AxiosInstance;
    constructor(token: any);
    get(url: string, params?: Record<string, string | number> | null, headers?: any | null): Promise<any>;
    post(url: string, data: Record<string, string | number>, headers: any): Promise<any>;
}
export default GitHubRequest;
