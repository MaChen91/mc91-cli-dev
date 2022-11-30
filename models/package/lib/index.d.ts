/// <reference types="node" />

//abc
export declare class Package {
  readonly targetPath: string;
  readonly storeDir: string;
  readonly packageName: string;
  packageVersion: string;
  readonly cacheFilePathPrefix: string;
  private pathExists: Function | null;
  /**
   * 类构造函数
   * @param options.targetPath 包管理目录
   * @param options.storeDir 存储pkg目录
   * @param options.packageName 包名
   * @param options.packageVersion 版本号
   */
  constructor(options: {
    targetPath: string;
    storeDir: string;
    packageName: string;
    packageVersion: string;
  });
  public prepare(): Promise<void>;
  public install(): Promise<void>;
  public update(): Promise<void>;
  public getRootFilePath(): Promise<string>;
  public exists(): Promise<boolean>;
}

//abc
export = Package;
