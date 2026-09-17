# Hinglish Converter & Translator

A hyper-specific, bilingual (English & Hindi) static web application for Hinglish language tools, built for **[hinglish.openpixal.com](https://hinglish.openpixal.com)**.

## Features

- **Converters & Translators:**
  - Hinglish → Hindi (Romanized to Devanagari)
  - Hinglish → English
  - English → Hinglish
  - Hindi → Hinglish (Devanagari to Roman)
- **Scope Control:** Switch between *Word*, *Sentence*, *Paragraph*, and *Full text* modes.
- **Caption Generator:** Ready-to-post Hinglish captions for Instagram, status, and reels.
- **Day/Night Mode:** Instant client-side dark theme toggle.
- **Full SEO & AI-Search Optimized:** JSON-LD schema (FAQPage, HowTo, WebSite, Breadcrumbs), OpenGraph, Twitter Cards, `hreflang` tags (en/hi), and sitemap.
- **Google AdSense Ready:** Clean structure with responsive ad slot placeholders.
- **Zero Cost Stack:** Pure static HTML/CSS/JS deployed via GitHub Actions to Cloudflare Pages ($0/mo).

## Architecture

- Pure HTML5 + CSS3 (custom variables) + Vanilla JS.
- No build steps or heavy node frameworks needed — lightning fast load times.
- Host: Cloudflare Pages
- DNS: Cloudflare DNS with wildcard subdomain routing to canonical `hinglish.openpixal.com`.

## Deployment

Deployments are handled automatically via GitHub Actions on `push` to `main`.

### GitHub Secrets Required:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages Edit permissions.
- `CLOUDFLARE_ACCOUNT_ID` — `62550cdb205c5034439fe3e689ab95d5`
