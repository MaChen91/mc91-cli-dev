import GitServer from './GitServer';
import GiteeRequest from './GiteeRequest';
declare class Gitee extends GitServer {
    request: GiteeRequest;
    constructor();
    setToken(token: any): void;
    getRepo(login: any, name: any): Promise<unknown>;
    createRepo(name: string): Promise<any>;
    createOrgRepo(name: string, login: string): Promise<any>;
    getRemote(name: string, login: string): string;
    getUser(): Promise<any>;
    getOrg(username: string): Promise<any>;
    getTokenUrl(): string;
    getTokenHelpUrl(): string;
}
export default Gitee;
