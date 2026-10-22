export interface ReleaseSelection {target:'production';artifact:string;accountId:string;databaseId:string;execute?:boolean}
export function parseReleaseCommandArgs(args:string[]):ReleaseSelection;
export function planReleaseCommand(operation:string,options:ReleaseSelection):{operation:string;artifact:string;releaseId:string;accountId:string;databaseId:string;target:'production';status:'blocked';executable:false;command:{tool:string;args:string[]};issues:string[];note:string};
