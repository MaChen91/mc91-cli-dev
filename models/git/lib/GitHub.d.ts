import GitServer from './GitServer';
declare class GitHub extends GitServer {
    constructor();
    createRepo(name: string): Promise<void>;
    createOrgRepo(name: string, login: string): Promise<void>;
    getRemote(): Promise<void>;
    getUser(): Promise<void>;
    getOrg(): Promise<void>;
    getTokenUrl(): string;
    getTokenHelpUrl(): string;
}
export default GitHub;
