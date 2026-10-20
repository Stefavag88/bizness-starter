import {motionSchema} from '../config/project.mjs';
/** Only validated numbers are interpolated; safe to construct in Node or browser. */
export function motionCSS(raw){
 const m=motionSchema.parse(raw ?? {});
 return `:root{--motion-duration:${m.durationMs}ms;--motion-distance:${m.distancePx}px;--motion-stagger:${m.staggerMs}ms;--motion-interaction-duration:${m.interactionMs}ms}\n`;
}
