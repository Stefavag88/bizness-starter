export interface VisitorState {version:1;promptsAllowed:boolean;lastAutoShownAt:number;dismissedUntil:number;acceptedUntil:number}
export interface VisitorSnapshot {status:'empty'|'valid'|'invalid'|'blocked';state:VisitorState}
export interface VisitorStorage {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export type VisitorChange='autoShown'|'dismissed'|'accepted'|{promptsAllowed:boolean};
export type SuppressionPolicy={dismissDays:number;acceptedDays:number};
export function visitorStorageKey(name:string):string;
export function readVisitorState(storage:VisitorStorage,key:string,now:number):VisitorSnapshot;
export function canAutoPrompt(snapshot:VisitorSnapshot,policy:SuppressionPolicy,now:number):boolean;
export function updateVisitorState(storage:VisitorStorage,key:string,change:VisitorChange,policy:SuppressionPolicy,now:number):VisitorSnapshot;
export function resetVisitorState(storage:VisitorStorage,key:string,now:number):VisitorSnapshot;
