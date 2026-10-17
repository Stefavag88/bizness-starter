import { z } from 'zod';
// Configuration and verified JWT identities use the same normalization.
export const accessEmail = z.string().trim().toLowerCase().pipe(z.email());
export const accessEmails = z.array(accessEmail).refine(
  values => new Set(values).size === values.length,
  'Access email lists must not contain duplicate identities',
);
