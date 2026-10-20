import { createElement, isValidElement, type CSSProperties } from 'react';

// Only elements created by our custom fields are styled. Native Tina fields and
// their rich-text/image controls pass through unchanged. No browser-only imports:
// the same schema is constructed by the CLI and by Node-based validation.
const control: CSSProperties = {
  boxSizing: 'border-box', minWidth: 0, maxWidth: '100%', font: 'inherit',
  color: '#334155', border: '1px solid #cbd5e1', borderRadius: 6,
  background: '#fff', padding: '10px 12px', minHeight: 40,
  outline: 'revert', outlineOffset: 3,
};
const styles: Record<string, CSSProperties> = {
  div: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, maxWidth: '100%' },
  fieldset: {
    display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0,
    margin: '4px 0 16px', padding: 16, border: '1px solid #dce2eb',
    borderRadius: 8, background: '#fff',
  },
  legend: { padding: '0 6px', color: '#475569', fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' },
  label: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, color: '#475569', fontSize: 13, fontWeight: 500 },
  p: { margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere' },
  input: { ...control, width: '100%' },
  select: { ...control, width: '100%', appearance: 'auto' },
  button: { ...control, cursor: 'pointer', fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'normal' },
};

/** Presentation only: preserve handlers, refs, names, IDs and native components. */
export const cmsElement: typeof createElement = ((type: any, props: any, ...children: any[]) => {
  if (typeof type !== 'string' || !styles[type]) return createElement(type, props, ...children);
  let style = { ...styles[type] };
  if (type === 'label' && children.some(child => isValidElement(child) && (child.props as any).type === 'checkbox')) {
    style = { ...style, flexDirection: 'row', alignItems: 'center', gap: 8 };
  }
  if (type === 'input' && props?.type === 'checkbox') {
    style = { ...style, width: 16, height: 16, minHeight: 16, flexShrink: 0, accentColor: '#2563eb', appearance: 'auto' };
  }
  if (props?.disabled || props?.readOnly) style = { ...style, background: '#f1f5f9', color: '#64748b', cursor: props.disabled ? 'not-allowed' : 'default' };
  if (props?.role === 'alert') style = { ...style, color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 6 };
  return createElement(type, { ...props, style: { ...style, ...props?.style } }, ...children);
}) as typeof createElement;
