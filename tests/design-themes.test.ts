import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { colorRoles, themeByName, themeCSS, validateDesign, validateTheme } from '../packages/design-system/theme.mjs';
import { parseProject } from '../packages/config/project.mjs';

const names = ['neutral', 'trades', 'accommodation', 'wellness'];
describe('source design themes', () => {
  it.each(names)('%s validates and generates every semantic role with supported bilingual fonts', (name) => {
    const theme = themeByName(name);
    expect(validateDesign({ theme: name, density: 'comfortable' })).toEqual({ theme: name, density: 'comfortable' });
    const css = themeCSS(name, theme);
    expect(css).toContain(`html[data-theme="${name}"]`);
    for (const role of colorRoles) {
      const token = role.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
      const primitive = theme.semanticColors[role].replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
      expect(css).toContain(`--color-${token}: var(--palette-${primitive});`);
      expect(css).toContain(`--palette-${primitive}: ${theme.primitiveColors[theme.semanticColors[role]]};`);
    }
    for (const role of ['heading', 'body', 'greekHeading', 'greekBody']) {
      expect(theme.fonts[role]).toBe("'Noto Sans', system-ui, sans-serif");
    }
  });

  it.each([
    ['textPrimary', 'surface'], ['textMuted', 'surface'], ['textMuted', 'surfaceMuted'],
    ['brandAccent', 'surfaceMuted'], ['onAction', 'actionPrimary'],
    ['controlBorder', 'surfaceMuted'], ['focus', 'surface'],
    ['feedbackError', 'errorSurface'], ['feedbackSuccess', 'successSurface'],
  ])('rejects insufficient %s contrast on %s without weakening protections', (foreground, background) => {
    const theme = structuredClone(themeByName('neutral'));
    theme.semanticColors[foreground] = theme.semanticColors[background];
    expect(() => validateTheme(theme)).toThrow('Insufficient contrast');
    expect(() => themeCSS('invalid-palette', theme)).toThrow('Insufficient contrast');
  });

  it('generating all themes preserves the neutral source and current project configuration', () => {
    const neutralPath = new URL('../packages/design-system/themes/neutral.json', import.meta.url);
    const projectPath = new URL('../project.json', import.meta.url);
    const neutralBefore = readFileSync(neutralPath, 'utf8');
    const projectBefore = readFileSync(projectPath, 'utf8');
    const raw = JSON.parse(projectBefore);
    const parsed = parseProject(raw);
    for (const name of names) themeCSS(name, themeByName(name));
    expect(readFileSync(neutralPath, 'utf8')).toBe(neutralBefore);
    expect(readFileSync(projectPath, 'utf8')).toBe(projectBefore);
    expect(parseProject(raw)).toEqual(parsed);
    expect(raw).toEqual(JSON.parse(projectBefore));
  });
});
