import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Features',
      href: getPermalink('/#features'),
    },
    {
      text: 'Pricing',
      href: getPermalink('/#pricing'),
    },
    {
      text: 'Join Waitlist',
      href: getPermalink('/#join-waitlist'),
    },
  ],
  actions: [{ text: 'Join Waitlist', href: getPermalink('/#join-waitlist') }],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: getPermalink('/#features') },
        { text: 'Pricing', href: getPermalink('/#pricing') },
        { text: 'Join Waitlist', href: getPermalink('/#join-waitlist') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'Privacy', href: getPermalink('/privacy') },
        { text: 'Terms', href: getPermalink('/terms') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/BenTremblay1/hoa-connect-landing' },
  ],
  footNote: `
    © ${new Date().getFullYear()} HOA Connect. All rights reserved.
  `,
};
