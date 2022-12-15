type gitType = 'github' | 'gitee';
declare abstract class GitServer {
    type: gitType;
    token: string;
    constructor(type: gitType);
    abstract createRepo(name: string): Promise<any>;
    abstract createOrgRepo(name: string, login: string): Promise<any>;
    abstract getRemote(): Promise<any>;
    abstract getUser(): Promise<any>;
    abstract getOrg(): Promise<any>;
    abstract getTokenUrl(): string;
    abstract getTokenHelpUrl(): string;
    setToken(token: string): void;
    isHttpResponse: (response: any) => any;
    handleResponse: (response: any) => any;
}
export default GitServer;
