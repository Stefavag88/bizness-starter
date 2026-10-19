// Server-only metadata facade: never import from editor/client code.
import { readValidatedSource } from './source-reader.mjs';

/** root is the repository root; uploads live at apps/site/public/uploads. */
export async function resolveSourceMedia(root, src) {
  return (await readValidatedSource(root, src)).media;
}
