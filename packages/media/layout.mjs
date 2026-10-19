// Browser-safe geometry derived from global.css: 72rem wrap, symmetric padding,
// 17rem auto-fit tracks and 2rem gaps. Density changes only vertical spacing.
const width = 'min(100vw, 72rem) - clamp(2.5rem, 8vw, 6rem)';
const full = `calc(${width})`;
const half = `calc((${width} - 2rem) / 2)`;
const third = `calc((${width} - 4rem) / 3)`;
function autoFit(itemCount) {
  const rules = [];
  if (itemCount >= 3) rules.push(`(min-width: 59.782609rem) ${third}`);
  if (itemCount >= 2) rules.push(`(min-width: 39.130435rem) ${half}`);
  return [...rules, full].join(', ');
}
export function imageSizes(layout, itemCount = 1) {
  switch (layout) {
    case 'media-text': return `(min-width: 768px) ${half}, ${full}`;
    case 'gallery':
    case 'room-card': return autoFit(itemCount);
    case 'gallery-featured-lead': return `(min-width: 768px) ${full}, ${autoFit(itemCount)}`;
    case 'gallery-featured-item': return `(min-width: 768px) ${half}, ${autoFit(itemCount)}`;
    case 'room-detail': return 'calc(min(100vw, 58rem) - clamp(2.5rem, 8vw, 6rem))';
    default: throw new Error(`Unknown image layout: ${layout}`);
  }
}
