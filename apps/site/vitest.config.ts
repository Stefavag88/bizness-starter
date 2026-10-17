import {getViteConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const config={root,test:{include:['tests/footer.test.ts','tests/showcase.test.ts']}};
export default getViteConfig(config,{root});
