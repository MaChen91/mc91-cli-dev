/// <reference types="typescript" />
interface IOptions {
  targetPath: string; // Path to the target directory
  storeDir: string; // Path to the store directory
  packageName: string; // Name of the package
  packageVersion: string; // Version of the package
}

declare class Package {
  readonly targetPath: string;
  readonly storeDir: string;
  readonly packageName: string;
  packageVersion: string;
  readonly cacheFilePathPrefix: string;
  private pathExists: Function | null;
  constructor(options: IOptions);
  public prepare(): Promise<void>;
  public install(): Promise<void>;
  public update(): Promise<void>;
  public getRootFilePath(): string;
  public exists(): Promise<boolean>;
}
