import { Socket } from 'socket.io-client';
import Git from './index';
declare class CloudBuild {
    git: Git;
    buildCmd: string;
    prod: boolean;
    timeout: number;
    timer: any;
    socket: Socket;
    constructor(git: Git, options: {
        buildCmd: string;
        prod: boolean;
    });
    doTimeout(fn: any, timeout: any): void;
    prepare(): Promise<void>;
    init(): Promise<void>;
    build(): Promise<unknown>;
}
export default CloudBuild;
