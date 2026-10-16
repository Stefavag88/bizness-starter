import { defineConfig } from 'tinacms';
import descriptor from '../.generated/cms.json';
import { parseProject } from '../packages/config/project.mjs';
import { buildCollections } from './collections';
const project=parseProject(descriptor.project);
export default defineConfig({branch:process.env.TINA_BRANCH||'main',clientId:process.env.TINA_CLIENT_ID||'',token:process.env.TINA_TOKEN||'',build:{outputFolder:'cms',publicFolder:'apps/site/public'},media:{tina:{publicFolder:'apps/site/public',mediaRoot:'uploads'}},schema:{collections:buildCollections(project)}});
