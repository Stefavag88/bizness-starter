import MarkdownIt from 'markdown-it';

/** Shared by persisted links and the native editor's detached link projection. */
export function isSafeLink(value) {
  if (typeof value !== 'string' || !value) return false;
  if (/[\s\u0000-\u001f\u007f-\u009f\\\uFFFD]/u.test(value)) return false;
  if (/^https?:/i.test(value) && !/^https?:\/\//i.test(value)) return false;
  let link = markdown.utils.unescapeAll(value);
  try {
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(link);
      if (decoded === link) break;
      link = decoded;
    }
  } catch { return false; }
  if (/[\s\u0000-\u001f\u007f-\u009f\\\uFFFD]/u.test(link) || link.startsWith('//')) return false;
  if (/^https?:/i.test(link)) {
    if (!/^https?:\/\//i.test(link)) return false;
    try { const url = new URL(link); return !!url.hostname && !url.username && !url.password; } catch { return false; }
  }
  if (/^(mailto|tel):/i.test(link)) return /^(mailto|tel):[^:]+$/i.test(link);
  // Colon before a path/query/fragment delimiter denotes a URI scheme.
  return !/^[^/?#]*:/.test(link) && !link.startsWith('//');
}

const markdown = new MarkdownIt({html:false,linkify:false,typographer:false,breaks:false});
markdown.validateLink = isSafeLink;
markdown.disable(['image']);
const heading = markdown.renderer.rules.heading_open;
markdown.renderer.rules.heading_open = (tokens,index,options,env,self) => {
  if (tokens[index].tag === 'h1') tokens[index].tag = 'h2';
  return heading ? heading(tokens,index,options,env,self) : self.renderToken(tokens,index,options);
};
markdown.renderer.rules.heading_close = (tokens,index,options,_env,self) => {
  if (tokens[index].tag === 'h1') tokens[index].tag = 'h2';
  return self.renderToken(tokens,index,options);
};
const renderLink = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens,index,options,env,self) =>
  env.links === false ? '' : renderLink ? renderLink(tokens,index,options,env,self) : self.renderToken(tokens,index,options);
markdown.renderer.rules.link_close = (tokens,index,options,env,self) => env.links === false ? '' : self.renderToken(tokens,index,options);

export function renderRichText(body) { return markdown.render(body); }
export function renderInlineRichText(body, options = {}) { return markdown.renderInline(body,{links:options.links !== false}); }
export function plainText(body, limit) {
  const walk = tokens => tokens.map(token => {
    if (token.children) return walk(token.children);
    if (['text','code_inline','code_block','fence'].includes(token.type)) return token.content;
    if (['softbreak','hardbreak'].includes(token.type) || token.block) return ' ';
    return '';
  }).join('');
  const text = walk(markdown.parse(body,{})).replace(/\s+/gu,' ').trim();
  if (limit === undefined) return text;
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('Plain text limit must be a nonnegative integer');
  return Array.from(text).slice(0,limit).join('');
}
