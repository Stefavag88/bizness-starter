import type { ZodType } from 'zod';
import type { Page,Settings,PageDocument,SettingsDocument } from './types';
export type { PageDocument, SettingsDocument, PersistedCopyEntry } from './types';
export const pageDocumentSchema:ZodType<PageDocument>;
export const settingsDocumentSchema:ZodType<SettingsDocument>;
export function normalizePageDocument(raw:unknown):Page;
export function normalizeSettingsDocument(raw:unknown):Settings;
