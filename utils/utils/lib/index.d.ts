declare module '@mc91-cli-dev/utils' {
  /**
   * spinner 插件
   * @param text 提示文本
   */
  export function spinnerStart(text: string): void;
  /**
   * 对象判断
   */
  export function isObject(obj: any): boolean;
  /**
   * 异步执行child exec process
   * @param command 命令
   * @param args 参数
   * @param options 配置
   */
  export function execCp(
    command: string,
    args: Array<string>,
    options: any,
  ): void;
  /**
   * 同步执行child exec process
   * @param command 命令
   * @param args 参数
   * @param options 配置
   */
  export function execCpAsync(
    command: string,
    args: Array<string>,
    options: any,
  ): Promise<any>;

  interface readFileOptions {
    toJson?: boolean;
  }
  export function readFile(
    filePath: string,
    options: readFileOptions = {},
  ): any;

  interface writeFileOptions {
    rewrite?: boolean;
  }
  export function writeFile(
    filePath: string,
    data: Record<string, string>,
    options: writeFileOptions = { rewrite: true },
  ): boolean;
}
