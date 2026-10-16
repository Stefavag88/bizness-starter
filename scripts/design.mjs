import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { themes, themeCSS, validateDesign } from '../packages/design-system/theme.mjs';
export function generateDesign(design) {
  validateDesign(design);

  const path = 'apps/site/src/styles/themes.generated.css';
  const css =
    '/* Generated from packages/design-system/themes. Edit theme JSON, then run pnpm configure. */\n' +
    Object.entries(themes)
      .map(([name, theme]) => themeCSS(name, theme))
      .join('\n');
  const registryPath = 'packages/design-system/themes.generated.json';
  const registry = JSON.stringify(themes, null, 2) + '\n';
  if (!existsSync(registryPath) || readFileSync(registryPath, 'utf8') !== registry)
    writeFileSync(registryPath, registry);
  if (!existsSync(path) || readFileSync(path, 'utf8') !== css) writeFileSync(path, css);
}
