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
  if (/[\u0000-\u001f\u007f-\u009f\\\uFFFD]/u.test(link) || link.startsWith('//')) return false;
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
markdown.renderer.rules.link_open = (tokens,index,options,env,self) => {
  if(env.links===false)return '';
  if(env.resolveHref){const target=env.resolveHref(tokens[index].attrGet('href'));tokens[index].attrSet('href',isSafeLink(target)?target:'#');}
  return renderLink ? renderLink(tokens,index,options,env,self) : self.renderToken(tokens,index,options);
};
markdown.renderer.rules.link_close = (tokens,index,options,env,self) => env.links === false ? '' : self.renderToken(tokens,index,options);
export function renderRichText(body,options={}) { return markdown.render(body,options); }
export function renderInlineRichText(body,options={}) { return markdown.renderInline(body,{...options,links:options.links !== false}); }
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

// Parse all destinations for validation, including schemes the safe renderer suppresses.
const validationMarkdown=new MarkdownIt({html:true,linkify:false});
validationMarkdown.validateLink=()=>true;
export function isSafeMarkdown(value,inline=false) {
 if(typeof value!=='string')return false;
 const allowed=new Set(['paragraph_open','paragraph_close','inline','text','softbreak','hardbreak','strong_open','strong_close','em_open','em_close','link_open','link_close',...(inline?[]:['heading_open','heading_close','bullet_list_open','bullet_list_close','ordered_list_open','ordered_list_close','list_item_open','list_item_close','blockquote_open','blockquote_close'])]);
 const walk=tokens=>tokens.every(token=>allowed.has(token.type)&&(!token.type.startsWith('heading_')||['h2','h3'].includes(token.tag))&&(token.type!=='link_open'||isSafeLink(token.attrGet('href')))&&(!token.children||walk(token.children)));
 return walk(validationMarkdown.parse(value,{}));
}
