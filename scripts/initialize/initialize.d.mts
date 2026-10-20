import type {InitializeOptions} from './options.mjs';
export function initializeProject(input:{source:string;options:InitializeOptions;dryRun?:boolean}):Promise<{destination:string;createdFiles:string[];plannedFiles?:string[];revision:string;nextCommands:string[]}>;
