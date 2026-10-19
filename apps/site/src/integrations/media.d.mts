import type {AstroIntegration} from 'astro';
import type {MediaOptimization} from '../../../../packages/config/project.mjs';
export default function mediaIntegration(options:{root:string;policy:MediaOptimization}):AstroIntegration;
