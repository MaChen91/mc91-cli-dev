declare abstract class Comannd {
  protected _argv: Array<string>;
  protected _cmd: string;
  constructor(argv: Array<any>);
  public abstract init(): void | Promise<void>;
  public abstract exec(): void | Promise<void>;
}

exports.default = Comannd;
