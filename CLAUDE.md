# JP Management Global · model acquisition

Static marketing + application site at **jp-management-global.com**. Pulled out of Hostinger Business Web Hosting on 2026-04-30 to run on Netlify (auto-deploy from `main`).

## Stack

- **Static HTML / CSS / JS** (no build step)
- Webflow-exported markup (classes prefixed `cmp--*`, `fs-richtext-*`)
- 2 languages: `/` (EN, default) + `/es/` (Spanish parallel structure)
- Hosted on **Netlify**, deployed from `site/`
- Headers + redirects in `netlify.toml` + `site/_redirects`

## Repo layout

```
jp-management-global/
├── netlify.toml           # build config + security headers + cache rules
├── site/                  # what ships to production
│   ├── index.html, apply.html, contact.html, join.html, ...
│   ├── es/                # Spanish mirror (empezar, aplicar, unirse, ...)
│   ├── blog/              # blog index + posts
│   ├── Casestudies/, showcases/, test-eng/, test-es/
│   ├── img/, videos/, css/, js/, locales/
│   ├── _redirects         # 301s (EN-prefix strip, ES aliases, .html strip)
│   ├── robots.txt, sitemap.xml
│   └── googleXXX.html     # Search Console verification
└── .gitignore             # excludes .bak files + Hostinger leftovers
```

## What's still on Hostinger (NOT in repo)

- **`~/*.py` maintenance scripts** (fix_seo, update_footer, insert_images, ...) - one-off Python tools used to bulk-edit the static HTML. Live in the SSH home dir, outside `public_html`. Pulled separately if needed.
- **`.bak`, `.bak2`, `.bak3`** of `thank-you.html` - kept on prod, gitignored here.

## Funnel role

Top-of-agency-funnel for **model acquisition**: creators apply via the contact / apply / join forms, get qualified, get onboarded into JP Management. This is the **agency-side** complement to jp-modelmarket.com (which serves AI-Hybrid + real-creator buyers).

## Forms - current state

All "Apply" / "Join" CTAs link to **Tally** (`tally.so/r/mY6Ykq`) on 16 pages. Conversion concern: external redirect kills Meta-Pixel `Lead` events and breaks brand trust. Replacement plan tracked separately - keep custom-form work in this repo (Netlify Forms or direct n8n webhook).

## Deploy

`main` -> Netlify -> jp-management-global.com. No build command. Publish dir: `site/`.

## Migration notes (2026-04-30)

- Hostinger Business Web Hosting expires 2026-08-16 (auto-renew off, 203,88€ avoided)
- Hostinger SSH password rotated after pull
- DNS will point at Netlify once Netlify deploy is verified - until then, prod stays on Hostinger
