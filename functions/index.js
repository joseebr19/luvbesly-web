// ==========================================
// / — inyecta el preview de kits (3 más recientes) en el home
// ==========================================
// Mismo patrón que functions/kits.js: el contenedor #home-showcase-grid
// llega vacío en el HTML estático y el JS lo rellena desde
// /data/kits.json. Aquí lo renderizamos server-side para que sea
// visible sin JS.

import { kitsGridHtml } from './_lib/html.js';
import { fetchAsset } from './_lib/assets.js';

const HOME_SHOWCASE_LIMIT = 3;

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const [pageResponse, dataResponse] = await Promise.all([
        fetchAsset(env, request),
        fetchAsset(env, new URL('/data/kits.json', url)),
    ]);

    if (!pageResponse.ok) return pageResponse;

    let kits = [];
    if (dataResponse.ok) {
        try {
            kits = await dataResponse.json();
        } catch (error) {
            console.error('kits.json parse failed:', error);
        }
    }

    const gridHtml = kitsGridHtml(kits, { limit: HOME_SHOWCASE_LIMIT });

    const rewriter = new HTMLRewriter().on('#home-showcase-grid', {
        element(el) {
            el.setInnerContent(gridHtml, { html: true });
            el.setAttribute('aria-busy', 'false');
        },
    });

    return rewriter.transform(pageResponse);
}
