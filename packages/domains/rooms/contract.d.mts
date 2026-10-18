import type {ZodType} from 'zod';
import type {Room,LocalizedRoom,RoomImageCopy,RoomAmenityCopy} from './types';
import type {DomainDefinition} from '../../content/domain-contracts';
import type {SectionDefinition} from '../../content/section-registry.mjs';
export const roomSchema:ZodType<Room>;
export const imageCopySchema:ZodType<RoomImageCopy>;
export const amenityCopySchema:ZodType<RoomAmenityCopy>;
export const roomListDefinition:SectionDefinition;
export const roomsDomain:DomainDefinition<Room,LocalizedRoom>;
