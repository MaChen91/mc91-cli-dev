import { SimpleGit } from 'simple-git';
import GitServer from './GitServer';
declare const GITHUB = "github";
declare const GITEE = "gitee";
export interface ProjectOpts {
    name: string;
    version: string;
    dir: string;
}
export interface GitOpts {
    refreshServer: boolean;
    refreshToken: boolean;
    refreshOwner: boolean;
    buildCmd: string;
    prod: boolean;
    ssh: {
        user: null;
        ip: null;
        path: null;
    };
}
export interface Remote {
    info: any;
    token: string;
    user: any;
    orgs: any;
    owner: any;
    login: any;
    repo: any;
    branch: any;
}
declare class Git {
    git: SimpleGit;
    gitServer: GitServer;
    homePath: string;
    remote: Remote;
    project: ProjectOpts;
    options: GitOpts;
    constructor(project: ProjectOpts, gitOpts: Partial<GitOpts>);
    prepare(): Promise<void>;
    init(): Promise<void>;
    commit(): Promise<void>;
    pullRemoteMasterAndBranch(): Promise<void>;
    checkoutBranch(branch: string): Promise<void>;
    checkStash(): Promise<void>;
    getCorrectVersion(): Promise<void>;
    syncVersionToPackageJson(): void;
    getRemoteBranchList(type: any): Promise<any>;
    getLocalRemote(): boolean;
    initAndAddRemote(): Promise<void>;
    initCommit(): Promise<void>;
    checkConflicted(): Promise<void>;
    checkRemoteMaster(): Promise<boolean>;
    pullRemoteRepo(branchName: string, options?: {}): Promise<void>;
    pushRemoteRepo(branchName: any): Promise<void>;
    checkNotCommitted(): Promise<void>;
    checkHomePath(): void;
    checkLocalGitPlatform(): Promise<void>;
    createGitServer(gitServer: typeof GITHUB | typeof GITEE): GitServer | null;
    checkLocalGitToken(): Promise<void>;
    getRemoteUserAndOrgs(): Promise<void>;
    checkGitOwner(): Promise<void>;
    checkLocalRepo(): Promise<void>;
    checkGitIgnore(): Promise<void>;
    createPath(file: any): string;
}
export default Git;
