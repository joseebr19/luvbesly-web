# luvbesly.com

Official website and beat-selling platform for **luvbesly**. A static site with
no framework and no build step, plus a handful of Cloudflare Pages Functions:
a cached proxy for the YouTube feed and server-side rendering of the catalog
pages for SEO. Deployed on Cloudflare Pages.

🔗 [luvbesly.com](https://luvbesly.com)

---

## Stack

HTML, CSS, and JavaScript with native ES modules. No runtime dependencies and
no bundler: what's in `public/` is exactly what gets served. Wrangler is only
used for local dev and deployment.

---

## Structure

```
.
├── public/                 Public root. Everything here is served as-is
│   ├── *.html              Pages
│   ├── _headers            Security and cache headers
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js         Router: nav and lazy module loading
│   │   ├── dom.js          DOM-creation and fetch helpers
│   │   ├── player.js       Global audio player
│   │   ├── icons.js        Inline SVG icons for the player controls
│   │   ├── beats.js        Beats page
│   │   ├── kits.js         Sound kits page
│   │   ├── vsts.js         VST Vault with search
│   │   └── videos.js       YouTube feed (client)
│   ├── data/               Catalog content (see "Editing content" below)
│   │   ├── beats.json
│   │   ├── kits.json
│   │   └── vsts.json
│   ├── images/
│   └── audio/
├── functions/
│   ├── api/videos.js       Cached proxy to the YouTube API
│   ├── index.js            Server-renders the latest-kits preview on the home page (/)
│   ├── beats.js            Server-renders the beat list at /beats
│   ├── kits.js             Server-renders the kits grid at /kits
│   ├── vsts.js             Server-renders the VST grid at /vsts
│   ├── videos.js           Server-renders the YouTube feed at /videos
│   └── _lib/
│       ├── html.js         Render/escape helpers for the above
│       └── assets.js       Fetches a static asset, following redirects
├── check.sh                Structure and integrity check
├── wrangler.jsonc
└── .dev.vars               Local secrets — git-ignored
```

---

## Development

Requires Node.js 20 or newer.

```bash
git clone https://github.com/joseebr19/luvbesly-web.git
cd luvbesly-web
npx wrangler pages dev
```

Runs on `http://localhost:8788`. Don't open the HTML files by double-clicking
them: they use absolute paths and `fetch`, so they need to be served from a
server.

Before deploying, run the check:

```bash
bash check.sh
```

It verifies the structure is complete, that JSON references point to files
that actually exist, and that there are no stray keys in `public/`.

---

## Environment variables

| Variable | Description |
|---|---|
| `YOUTUBE_KEY` | YouTube Data API v3 key, restricted to that single API |
| `YOUTUBE_CHANNEL_ID` | Channel ID, starts with `UC` |

**Locally:** `.dev.vars` file at the project root.

```
YOUTUBE_KEY=...
YOUTUBE_CHANNEL_ID=UC...
```

**In production:** Cloudflare Pages dashboard → Settings → Variables and
Secrets, Production environment. `YOUTUBE_KEY` must be marked as **Secret**.

Variables are injected at deploy time, so after adding or changing one you
need to redeploy.

---

## Deployment

Every push to `main` deploys automatically. Manually:

```bash
npx wrangler pages deploy
```

---

## Editing content

Catalog content lives in `public/data/`, not in the code. To publish a new
beat, add an entry to `beats.json` and upload the MP3 to `public/audio/`:

```json
{
  "id": 7,
  "title": "NAME",
  "bpm": "150 BPM",
  "key": "C MAJOR",
  "audioUrl": "/audio/Name.mp3",
  "buyUrl": "https://www.beatstars.com/luvbesly"
}
```

**Plugins** (`vsts.json`) work the same way: add an entry and put its
screenshot in `public/images/`. No other step.

**Sound kits** (`kits.json`) need a few more steps, because each kit has a
hand-written detail page:

1. Add the entry to `kits.json` (`detailUrl` is the extensionless route, e.g.
   `/kit-name`) and put the cover in `public/images/soundkits/`.
2. Create `public/kit-name.html` by copying an existing kit page and editing
   its title, description, price, BeatStars link, content list and JSON-LD.
3. Add the new URL to `public/sitemap.xml`.
4. Optionally add it to the "You may also like" block of the other kit pages.

> **Important:** Cloudflare is case-sensitive for filenames; Windows isn't. A
> `Beat.mp3` referenced as `beat.mp3` works locally and fails in production.
> `check.sh` catches these cases.

---

## SEO / server-side rendering

`index.html`, `beats.html`, `kits.html`, `vsts.html` and `videos.html` are
static files whose lists used to be empty until client JS fetched
`data/*.json` (or `/api/videos`) and built the DOM. That left crawlers and
link-preview bots (which mostly don't run JS) seeing "Loading…" instead of
the actual catalog.

`functions/index.js`, `beats.js`, `kits.js`, `vsts.js` and `videos.js`
intercept those routes, fetch the original HTML and JSON straight from
`ASSETS` (`videos.js` calls `/api/videos` instead), and use `HTMLRewriter`
to inject the same markup the client would build, plus JSON-LD
(`MusicRecording` for beats, `Product`/`Offer` for purchasable kits,
`VideoObject` for videos; the home only gets the kit preview). The
client JS is untouched: on load it still clears the container and rebuilds
it with working listeners (play/pause, search), so the server-rendered
markup is only what a non-JS visitor or a crawler sees before that happens.
Editing `data/*.json` is still the only thing needed to publish a new
beat/kit/plugin — nothing else to update.

**Why these functions live at `/beats`, not `/beats.html`:** Cloudflare
Pages redirects requests for `*.html` to the extensionless URL by default
(`/beats.html` → `/beats`, 308). That redirect happens even for a request
routed through a Pages Function that calls `env.ASSETS.fetch()` — the
`.html` route would just receive the redirect response and pass it
through unmodified. So every internal link, canonical tag, Open Graph
`url`, and `sitemap.xml` entry uses the extensionless form, matching the
URL Cloudflare actually serves content at (and that Google actually
indexes). `functions/_lib/assets.js` follows a stray redirect defensively,
but in normal operation none of these functions should hit one.

Purchases still go through BeatStars exactly as before; this only changes
what's visible in the initial HTML response, not the buy links.

## Security notes

- No credentials reach the client. The browser calls `/api/videos`, and the
  key lives as a server-side secret.
- The function uses `playlistItems` (1 quota unit) instead of `search` (100),
  with a one-hour edge cache. Approximate usage: ~24 units/day against a
  10,000 daily quota.
- In the browser, all DOM is built with `textContent`. The server-side
  renderers (`functions/_lib/html.js`) do build HTML strings, so every value
  goes through `escapeHtml` / `escapeAttr` first.
- Strict CSP in `_headers`, no `unsafe-inline` or `unsafe-eval`. If an inline
  style or script is ever needed, its hash should be declared rather than
  loosening the policy.

---

## License

No license is granted for reuse — see [LICENSE](LICENSE). This repository is
public for portfolio purposes only. This covers both the source code and the
creative content (audio, artwork, and the **luvbesly** brand identity).

VST Vault links point to third-party software hosted externally. This
repository doesn't distribute or store any of those files.
