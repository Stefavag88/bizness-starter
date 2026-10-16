import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
it('keeps production readiness blocked for the unreviewed local foundation',()=>{
 const result=spawnSync(process.execPath,['scripts/doctor.mjs','--production'],{encoding:'utf8'});
 expect(result.status).toBe(1);expect(result.stdout+result.stderr).toContain('Production readiness blocked');expect(result.stdout+result.stderr).toContain('content and legal');
});
