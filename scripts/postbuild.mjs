// Writes Cloudflare's _headers and robots.txt into dist, based on business.json.
import { readFileSync, writeFileSync } from 'node:fs';

const business = JSON.parse(readFileSync('src/data/business.json', 'utf8'));
const hideFromSearch = business.demo === true && business.demoIndexable !== true;

const csp = [
  "default-src 'none'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://challenges.cloudflare.com',
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

const headers = [
  '/*',
  `  Content-Security-Policy: ${csp}`,
  // includeSubDomains is left out on purpose: clients may have non-HTTPS subdomains.
  '  Strict-Transport-Security: max-age=31536000',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ...(hideFromSearch ? ['  X-Robots-Tag: noindex, nofollow'] : []),
  '',
  '/_astro/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
];
writeFileSync('dist/_headers', headers.join('\n'));

const robots = hideFromSearch
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', business.url)}\n`;
writeFileSync('dist/robots.txt', robots);

// Forms are handled by the Cloudflare Function, so only this route invokes it.
writeFileSync('dist/_routes.json', JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }, null, 2));
