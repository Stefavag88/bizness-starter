import {getViteConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const config={root,test:{include:['tests/newsletter.test.ts','tests/motion.test.ts','tests/contact-social.test.ts','tests/footer.test.ts','tests/showcase.test.ts','tests/composition-b.test.ts','tests/composition-b-media.test.ts','tests/domain-rendering.test.ts','tests/rooms.test.ts','tests/media-optimization.test.ts']}};
export default getViteConfig(config,{root});
