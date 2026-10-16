export interface Theme {
  label: string;
  description: string;
  primitiveColors: Record<string, string>;
  semanticColors: Record<string, string>;
  fonts: Record<string, string>;
  radius: string;
  sectionSpace: number;
  mobileSectionSpace: number;
  layout: { hero: 'split' | 'centered'; card: 'plain' | 'surface' };
}
export const themes: Record<string, Theme>;
export const colorRoles: string[];
export function contrast(first: string, second: string): number;
export function validateTheme(theme: Theme): Theme;
export function validateDesign(design: { theme: string; density: string }): {
  theme: string;
  density: string;
};
export function themeByName(name: string): Theme;
export function themeCSS(name: string, theme: Theme): string;
export function kebab(value: string): string;
