# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS, and JavaScript with native ES modules. No framework, no
bundler, no runtime dependencies — what's in `public/` is served as-is.
Wrangler is used only for local dev and deployment to Cloudflare Pages. A
handful of Cloudflare Pages Functions (`functions/`) server-render the
catalog pages for SEO/crawlers and proxy the YouTube API.

## Users

Beat buyers and artists — rappers, singers, and other artists browsing to
license a beat, grab a free sound kit, or find VST plugins for their own
production. The catalog and buy flow (through BeatStars) are the point of
the site, not a producer-community resource hub.

## Product Purpose

The official site and beat-selling platform for luvbesly. It showcases and
sells original beats, offers free and paid sound kits, curates a page of
VST plugin links, and surfaces a YouTube video feed — all pointing toward
licensing a beat or downloading a kit.

## Positioning

An independent, anti-industry stance: "besly sound system — we don't play
by their rules." The brand's edge isn't the storefront mechanics (any site
can sell via BeatStars) — it's the explicit DIY, no-gatekeepers, no
major-label-polish identity that the raw/experimental/underground trap
sound and site voice both carry.

## Operating Context

- Purchases route through BeatStars (`beatstars.com/luvbesly` and per-kit
  BeatStars links); this site never handles payment itself.
- Content (beats, kits, VSTs) is edited via `public/data/*.json`, no code
  changes needed to publish new items.
- A separate linked application, Send Log (`app.luvbesly.com`), is an
  outreach tracker for producers with its own Google Sign-In — it is
  referenced in nav and covered by the shared privacy policy but is not
  part of this site's codebase or design system.
- Deployed on Cloudflare Pages; every push to `main` deploys automatically.

## Capabilities and Constraints

- Cloudflare is case-sensitive for filenames; Windows dev machines aren't —
  `check.sh` catches mismatches before deploy.
- `functions/beats.js`, `kits.js`, `vsts.js` server-render the catalog
  lists (plus JSON-LD) so crawlers and link-preview bots see real content
  instead of a client-rendered "Loading…" state; client JS still rebuilds
  the DOM on load for interactivity (play/pause, search).
- Internal links, canonical tags, OG `url`, and `sitemap.xml` all use the
  extensionless route form (`/beats`, not `/beats.html`) to match what
  Cloudflare Pages actually serves and what Google indexes.
- Strict CSP in `_headers`: no `unsafe-inline`, no `unsafe-eval`. All DOM
  is built with `textContent`, no HTML interpolation from data.
- No credentials reach the client; the YouTube API key is a server-side
  secret used behind `/api/videos` with a one-hour edge cache.
- VST Vault links point to third-party software hosted externally; this
  repo doesn't distribute or store any of those files.

## Brand Commitments

- Name: **luvbesly**. Tagline: "besly sound system — we don't play by
  their rules."
- Genres: Trap, Experimental, Underground Hip Hop (per the site's
  `MusicGroup` structured data).
- Channels: Instagram `@luvbesly`, BeatStars `beatstars.com/luvbesly`,
  contact email `luvbeslymail@gmail.com`.
- Licensing/legal: no license is granted for reuse of the source, audio,
  artwork, or brand identity — the repo is public for portfolio purposes
  only.

## Evidence on Hand

- Catalog content lives in `public/data/beats.json`, `kits.json`,
  `vsts.json` — real product data, not placeholders.
- Two shipped kit detail pages (`kit-luvme.html` free, `kit-summer.html`
  paid) and product imagery under `public/images/`.
- No testimonials, press, case studies, or usage metrics on hand — future
  work must not fabricate these.

## Product Principles

1. The buy/download path (BeatStars, kit downloads) is the site's actual
   job; every surface should keep that path short and unmistakable.
2. Preserve the independent/DIY voice — copy and tone should never read as
   corporate, agency, or major-label polish.
3. Content changes (new beats/kits/VSTs) must stay data-only; don't couple
   catalog updates to code or template changes.
4. Crawlers and non-JS visitors see the same real content as JS-enabled
   visitors — server-rendered parity is a constraint, not a nice-to-have.
5. No third-party credential or payment surface belongs on this domain;
   purchases stay delegated to BeatStars.
