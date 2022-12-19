import GitServer from './GitServer';
import GitHubRequest from './GitHubRequest';
declare class GitHub extends GitServer {
    request: GitHubRequest;
    constructor();
    setToken(token: any): void;
    getRepo(name: string, login: string): Promise<unknown>;
    getRemote(name: string, login: string): string;
    getUser(): Promise<any>;
    getOrg(username: string): Promise<any>;
    createRepo(name: string): Promise<any>;
    createOrgRepo(name: string, login: string): Promise<any>;
    getTokenUrl(): string;
    getTokenHelpUrl(): string;
}
export default GitHub;
