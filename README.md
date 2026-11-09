# Local Business Starter

A static Astro site for local service businesses, built for Cloudflare Pages' free plan. Everything specific to a business lives in `src/data/business.json`.

## Commands

```bash
npm install
npm run dev     # local site at http://localhost:4321
npm run check   # type checks
npm run build   # production output in dist/
```

Node 20 works for building. Deploying with `wrangler` needs Node 22 or newer, or connect the private GitHub repository to Cloudflare Pages and let it build there.

## Create a client preview
1. Copy this folder for the client.
2. Edit `src/data/business.json`: name, phone, license, services, cities, reviews, theme colors.
3. Keep `"demo": true` for previews. It shows the demo banner, stops the form from sending and hides the site from search engines. Set `"demoIndexable": true` to let search engines index a demo while keeping the banner.
4. Change the demo banner wording for a real prospect, in `src/layouts/Base.astro`, so it says "Concept preview".
5. Run `npm run build`, then review every page on a phone.

## Add real photos
Put files in `src/assets/projects/` and set `"image": "file.jpg"` on the hero, service or gallery item. Astro converts them to responsive WebP at build time. Without an image, the item shows an illustration.

The demo's photos are licensed stock from Unsplash, listed in `src/assets/projects/CREDITS.md`. Replace them for a real client, and never present stock photos as that client's actual work. Don't take images from Google Images, because most are copyrighted.

## Go live
1. Confirm every license number, insurance claim and review with the client. Remove anything unconfirmed, including `reviewSummary` figures.
2. Set `"demo": false`, remove `demoIndexable`, and set the real `url` and `turnstileSiteKey`.
3. In the Pages project, add encrypted variables: `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`. The form returns an error until all four are set.
4. Add a Cloudflare WAF rate limiting rule for `/api/contact`. The limit in the function is per-instance and only best effort.
5. Send a real test request and confirm it arrives.
6. Run Lighthouse on the live URL: mobile 95+, LCP under 2.5s, CLS under 0.1.

## Copy rules for roofers
- Never invent reviews, ratings, licenses, warranties or years in business.
- Avoid wording about insurance claims, deductibles or free inspections until Florida's contractor advertising rules (believed to be Fla. Stat. 489.147) have been checked. The demo copy avoids these on purpose.
- Show the contractor's license number. It appears on the home page and in the footer automatically.

## Security notes
- `scripts/postbuild.mjs` generates `dist/_headers`, including a strict Content Security Policy with no inline scripts or styles. Adding a third-party script or inline style means updating that policy.
- HSTS leaves out `includeSubDomains` on purpose, because a client may have non-HTTPS subdomains.
- Never put API keys in `business.json` or anything under `src/`. They'd ship to browsers.

## Not built yet
Call-click and form tracking, which the delivery checklist requires, will be added once the analytics approach is chosen.
