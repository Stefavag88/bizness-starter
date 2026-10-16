import type { ProjectConfig } from '../config/project.mjs';
import type { ContentSnapshot } from './types';
export type { ContentSnapshot } from './types';
/** root is the project directory, containing content/. Validates all configured locales. */
export function readContent(root:string,project:ProjectConfig,options?:{now?:Date}):ContentSnapshot;
