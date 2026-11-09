import business from '../data/business.json';

export const site = business;
export const hideFromSearch = business.demo && !business.demoIndexable;
export type Service = (typeof business.services)[number];
export type ArtVariant = 'shingle' | 'tile' | 'metal' | 'repair' | 'inspect' | 'storm';

export const telHref = `tel:${business.phoneE164}`;
export const yearsInBusiness = new Date().getFullYear() - business.founded;
export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.mapsQuery)}`;

export const nav = [
  { href: '/services/', label: 'Services' },
  { href: '/about/', label: 'About' },
  { href: '/projects/', label: 'Projects & reviews' },
  { href: '/contact/', label: 'Contact' },
];
