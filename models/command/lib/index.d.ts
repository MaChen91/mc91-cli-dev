declare class Comannd {
  constructor(argv: Array);
  public init(): void | Promise<void>;
  public exec(): void | Promise<void>;
}
