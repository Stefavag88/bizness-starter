import { expect, it } from 'vitest';
import { renderRichText, renderInlineRichText, plainText, isSafeLink } from '../packages/content/rich-text.mjs';
it('escapes HTML, downgrades H1 and forbids content images',()=>{
 const html=renderRichText('# Heading\n\n<script>alert(1)</script>\n\n![image](https://example.com/a.png)');
 expect(html).toContain('<h2>Heading</h2>');expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html).not.toContain('<img');
});
it('removes all linked-card summary anchors while preserving emphasis',()=>expect(renderInlineRichText('**Read** [more](/about)',{links:false})).toBe('<strong>Read</strong> more'));
it.each(['javascript:alert(1)','data:text/html,hi','//evil.com','\\\\evil.com','https://good.com\\evil','java\nscript:foo','/a\u0000b','https:%2f%2fevil.com','%2f%2fevil.com','/%5cevil.com','javascript&#58;alert(1)','/%0ab','%252f%252fevil.com','https://user:pass@example.com'])('rejects unsafe link %s',href=>{expect(isSafeLink(href)).toBe(false);expect(renderRichText('[link]('+href+')')).not.toContain('<a ');});
it.each(['https://example.com/a','http://example.com','mailto:hello@example.com','tel:+301234','/about','../about','about','#details','?page=2'])('supports safe link %s',href=>{expect(isSafeLink(href)).toBe(true);expect(renderInlineRichText('[link]('+href+')')).toContain('<a href=');});
it('extracts plain Unicode metadata without splitting surrogate pairs or retaining markup',()=>{expect(plainText('**Γεια** [κόσμε](/hello) &amp; 😀')).toBe('Γεια κόσμε & 😀');expect(plainText('😀😀😀',2)).toBe('😀😀');expect(plainText('# Title\n\nParagraph')).toBe('Title Paragraph');});
it.each(['https://example.com/a%20b','https://example.com/?q=two%20words','/some%20path','?q=two%20words'])('preserves safe encoded spaces in URL %s',href=>{
 expect(isSafeLink(href)).toBe(true);
 expect(renderInlineRichText('[link]('+href+')')).toContain('href="'+href.replace('&','&amp;')+'"');
});
