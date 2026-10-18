export type RoomItemKind='images'|'amenities';
export function addRoomItem<T>(values:T,kind:RoomItemKind,item:{id:string;copy:any;media?:unknown}):T;
export function moveRoomItem<T>(values:T,kind:RoomItemKind,id:string,direction:'up'|'down'):T;
export function removeRoomItem<T>(values:T,kind:RoomItemKind,id:string):T;
export function initializeRoomItemTranslation<T>(values:T,locale:string,kind:RoomItemKind,id:string,copy:any):T;
export function initializeRoomTranslation<T>(values:T,locale:string):T;
export function setRoomMedia<T>(values:T,id:string,media:unknown):T;
