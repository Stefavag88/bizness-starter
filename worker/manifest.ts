import generated from '../.generated/manifest.json';
import type {createManifest} from '../scripts/manifest.mjs';
// configure validates canonical input and writes this contract. JSON inference
// must not turn empty optional datasets into never[] in independent clients.
const manifest=generated as ReturnType<typeof createManifest>;
export default manifest;
