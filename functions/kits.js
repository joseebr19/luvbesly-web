// ==========================================
// /kits — inyecta la rejilla de kits en el HTML servido
// ==========================================
// Vive en la ruta sin extensión por el mismo motivo que beats.js:
// Cloudflare Pages redirige /kits.html -> /kits automáticamente, y
// esa es la URL que realmente ve el visitante (y Google), así que la
// función tiene que engancharse ahí para que el renderizado no se
// pierda tras la redirección.
//
// El contenedor #kits-grid llega vacío en el HTML estático y el JS
// lo rellena desde /data/kits.json. Aquí lo renderizamos server-side
// para que sea visible sin JS, y añadimos JSON-LD (Product/Offer)
// solo para los kits comprables (no para el que está bloqueado). El
// botón "DOWNLOAD"/"BUY KIT" sigue enlazando a BeatStars igual que
// antes; esto no toca el flujo de compra.

import { kitsGridHtml, kitsJsonLd, jsonLdScript } from './_lib/html.js';
import { fetchAsset } from './_lib/assets.js';

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

    const gridHtml = kitsGridHtml(kits);
    const jsonLd = kitsJsonLd(kits, `${url.origin}/kits`);

    const rewriter = new HTMLRewriter().on('#kits-grid', {
        element(el) {
            el.setInnerContent(gridHtml, { html: true });
            el.setAttribute('aria-busy', 'false');
        },
    });

    if (jsonLd) {
        rewriter.on('head', {
            element(el) {
                el.append(jsonLdScript(jsonLd), { html: true });
            },
        });
    }

    return rewriter.transform(pageResponse);
}
