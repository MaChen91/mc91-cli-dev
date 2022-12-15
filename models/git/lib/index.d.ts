import { SimpleGit } from 'simple-git';
interface projectInfo {
    name: string;
    version: string;
    dir: string;
}
declare class Git {
    name: string;
    version: string;
    dir: string;
    git: SimpleGit;
    constructor(projectInfo: projectInfo);
    init(): void;
}
export default Git;
