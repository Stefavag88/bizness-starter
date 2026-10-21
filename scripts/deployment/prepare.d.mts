export interface ProductionPlan {format:1;application:string;target:'production';status:'blocked';deployable:false;note:string;accountId:string;siteUrl:string;profile:string;targetFingerprint:string;fingerprints:Record<string,string>;worker:Record<string,any>;issues:string[]}
export function parsePreparationArgs(args:string[]):{target:'production';config:string};
export function prepareProduction(root:string,args:string[]):Promise<ProductionPlan>;
