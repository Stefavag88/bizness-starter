import type { TinaField } from 'tinacms';
import { text } from './common';

export function contactFields(): TinaField[] {
  return [
    {
      ...text('email'),
      type: 'string',
      ui: undefined,
      label: 'Email',
      required: true,
      description: 'Required contact mailbox, shared across languages.',
    },
    {
      ...text('phone'),
      type: 'string',
      ui: undefined,
      label: 'Phone',
      description: 'Optional display number. Callable numbers use 3–20 ASCII digits, an optional leading +, and spaces, hyphens, parentheses or periods. Other display text appears without a telephone link. Do not guess a country code.',
    },
    {
      ...text('address'),
      type: 'string',
      label: 'Address',
      description: 'Optional address text; translate it for each language. Line breaks are preserved.',
      ui: { component: 'textarea' },
    },
  ];
}

export function socialFields(): TinaField[] {
  return [
    ...[
      ['instagram', 'Instagram', 'instagram.com'],
      ['linkedin', 'LinkedIn', 'linkedin.com'],
      ['facebook', 'Facebook', 'facebook.com'],
    ].map(([name, label, domain]): TinaField => ({
      ...text(name),
      type: 'string',
      ui: undefined,
      label: `${label} URL`,
      description: `Optional HTTPS URL on ${domain} or one of its subdomains. Leave blank to hide this channel.`,
    })),
    {
      ...text('whatsapp'),
      type: 'string',
      ui: undefined,
      label: 'WhatsApp international number',
      description: 'Optional international number: + followed by 8–15 digits, for example +302101234567. Use no spaces or separators; do not enter a URL or guess a country code. Leave blank to hide WhatsApp.',
    },
    {
      name: 'showInHeader',
      type: 'boolean',
      label: 'Show social icons in header',
      description: 'Show configured social channels in the header. Off by default.',
    },
  ];
}
