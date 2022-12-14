declare abstract class Comannd {
  constructor(argv: Array<any>);
  public abstract init(): void | Promise<void>;
  public abstract exec(): void | Promise<void>;
}
