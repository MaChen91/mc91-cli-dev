import Git from './index';
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
