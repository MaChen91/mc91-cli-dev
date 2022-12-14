declare const Command: any;
declare class AddCommand extends Command {
    constructor(argv: any);
    init(): void;
    exec(): void;
}
declare function add(...args: any[]): AddCommand;
declare function decorator(...args: any[]): void;
