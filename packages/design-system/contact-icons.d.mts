import type {ContactLink} from '../content/types';
export const contactIcons:Readonly<Record<ContactLink['id']|'address',readonly {d:string;fillRule?:'evenodd'|'nonzero'}[]>>;
