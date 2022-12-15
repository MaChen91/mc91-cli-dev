import { SimpleGit } from 'simple-git';
import GitServer from './GitServer';
export interface GitOptions {
    name: string;
    version: string;
    dir: string;
    refreshServer?: boolean;
}
declare const GITHUB = "github";
declare const GITEE = "gitee";
declare class Git {
    name: string;
    version: string;
    dir: string;
    refreshServer: boolean;
    private homePath;
    git: SimpleGit;
    gitServer: GitServer;
    constructor(projectInfo: GitOptions);
    prepare(): Promise<void>;
    init(): void;
    checkHomePath(): void;
    checkGitServer(): Promise<void>;
    createGitServer(gitServer: typeof GITHUB | typeof GITEE): GitServer | null;
    checkGitToken(): Promise<void>;
    createPath(file: any): string;
}
export default Git;
