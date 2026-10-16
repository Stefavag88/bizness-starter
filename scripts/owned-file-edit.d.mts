export interface OwnedFileEdit {original:Buffer;backupPath:string;readonly conflictPath:string|null;replace(value:Uint8Array|string):void;restore():boolean}
export function createOwnedFileEdit(path:string,backupDirectory:string):OwnedFileEdit;
export function cleanupOwnedEdit(edit:Pick<OwnedFileEdit,'restore'>,stop:()=>Promise<void>):Promise<void>;
