// Every external link on the site, in one place. The real addresses are not in yet, so each is a `#`
// placeholder with the Sample flag; swap the href and drop the flag when it arrives.

export interface ExternalLink {
  label: string;
  href: string;
  sample: boolean;
}

export const links = {
  github: { label: 'GitHub', href: '#', sample: true } as ExternalLink,
  discord: { label: 'Discord', href: '#', sample: true } as ExternalLink,
  email: { label: 'Email', href: '#', sample: true } as ExternalLink,
};

// the licence line in the footer and on About
export const licence = { text: 'Free and open source. Code: AGPL-3.0. Art: CC-BY-4.0.', sample: false };
