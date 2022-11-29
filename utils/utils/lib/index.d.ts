declare module 'utils' {
  export function spinnerStart(text: string): void;
  export function isObject(obj: any): boolean;
  export function execCp(command:string,args:Array<string>,options:any)
}
