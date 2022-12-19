import Git from '@mc91-cli-dev/git';
declare class CloudBuild {
    git: Git;
    buildCmd: string;
    prod: boolean;
    timeout: number;
    constructor(git: Git, options: {
        buildCmd: string;
        prod: boolean;
    });
}
export default CloudBuild;
