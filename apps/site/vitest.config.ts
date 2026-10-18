import {getViteConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const config={root,test:{include:['tests/footer.test.ts','tests/showcase.test.ts','tests/composition-b.test.ts','tests/composition-b-media.test.ts','tests/domain-rendering.test.ts']}};
export default getViteConfig(config,{root});
