export const initializationCases:readonly {preset:string;languages:string[];defaultLanguage:string;articles?:boolean}[];
export function verifyInitialization(options?:{root?:string}):Promise<unknown>;
