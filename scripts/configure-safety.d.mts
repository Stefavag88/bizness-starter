export function syncMigrations(root:string):string[];
export function withConfigureLock<T>(root:string,run:()=>T|Promise<T>):Promise<T>;
