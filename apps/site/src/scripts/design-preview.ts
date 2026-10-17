import {previewURL,resolvePreviewState,type PreviewOptions,type PreviewState} from '../lib/design-preview';
import themes from '../../../../packages/design-system/themes.generated.json';
const toolbar=document.querySelector<HTMLElement>('#showcase-toolbar');
if(toolbar){
 const theme=document.querySelector<HTMLSelectElement>('#showcase-theme')!;
 const density=document.querySelector<HTMLSelectElement>('#showcase-density')!;
 const language=document.querySelector<HTMLSelectElement>('#showcase-language')!;
 const reset=document.querySelector<HTMLButtonElement>('#showcase-reset')!;
 const options:PreviewOptions={themes:Object.keys(themes),languages:Array.from(language.options,o=>o.value),defaults:{theme:toolbar.dataset.defaultTheme!,density:toolbar.dataset.defaultDensity as PreviewState['density'],lang:toolbar.dataset.defaultLanguage!}};
 function apply(state:PreviewState){
  // Recover focus before hiding any currently focused language sample.
  const groups=document.querySelectorAll<HTMLElement>('[data-sample-language]');
  if(Array.from(groups).some(group=>group.dataset.sampleLanguage!==state.lang&&group.contains(document.activeElement))) language.focus();
  document.documentElement.dataset.theme=state.theme;document.documentElement.dataset.density=state.density;document.documentElement.lang=state.lang;
  theme.value=state.theme;density.value=state.density;language.value=state.lang;
  groups.forEach(group=>{group.hidden=group.dataset.sampleLanguage!==state.lang;});
  const selected=themes[state.theme as keyof typeof themes];
  document.querySelectorAll<HTMLElement>('[data-color-token]').forEach(element=>{const role=element.dataset.colorToken as keyof typeof selected.semanticColors;element.textContent=selected.primitiveColors[selected.semanticColors[role] as keyof typeof selected.primitiveColors];});
  document.querySelectorAll<HTMLElement>('[data-theme-token]').forEach(element=>{const key=element.dataset.themeToken as 'radius'|'sectionSpace'|'mobileSectionSpace';element.textContent=String(selected[key])+(key==='radius'?'':'px');});
 }
 apply(resolvePreviewState(new URL(location.href).searchParams,options));
 [theme,density,language,reset].forEach(control=>{control.disabled=false;});
 [theme,density,language].forEach(control=>control.addEventListener('change',()=>{const state=resolvePreviewState(new URLSearchParams({theme:theme.value,density:density.value,lang:language.value}),options);history.pushState(null,'',previewURL(new URL(location.href),state));apply(state);}));
 reset.addEventListener('click',()=>{history.pushState(null,'',previewURL(new URL(location.href),null));apply(options.defaults);});
 window.addEventListener('popstate',()=>apply(resolvePreviewState(new URL(location.href).searchParams,options)));
}

