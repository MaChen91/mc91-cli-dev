type gitType = 'github' | 'gitee';
declare abstract class GitServer {
    type: gitType;
    token: string;
    constructor(type: gitType);
    abstract createRepo(name: string): Promise<any>;
    abstract createOrgRepo(name: string, login: string): Promise<any>;
    abstract getRepo(name: string, login: string): Promise<any>;
    abstract getRemote(name: string, login: string): string;
    abstract getUser(): Promise<any>;
    abstract getOrg(username: string): Promise<any>;
    abstract getTokenUrl(): string;
    abstract getTokenHelpUrl(): string;
    setToken(token: string): void;
    isHttpResponse: (response: any) => any;
    handleResponse: (response: any) => any;
}
export default GitServer;
