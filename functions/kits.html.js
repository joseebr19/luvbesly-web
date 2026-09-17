// ==========================================
// /kits.html — inyecta la rejilla de kits en el HTML servido
// ==========================================
// Mismo motivo y mismo patrón que functions/beats.html.js: el
// contenedor #kits-grid llega vacío en el HTML estático y el JS lo
// rellena desde /data/kits.json. Aquí lo renderizamos server-side
// para que sea visible sin JS, y añadimos JSON-LD (Product/Offer)
// solo para los kits comprables (no para el que está bloqueado).
// El botón "DOWNLOAD"/"BUY KIT" sigue enlazando a BeatStars igual
// que antes; esto no toca el flujo de compra.

import { kitsGridHtml, kitsJsonLd, jsonLdScript } from './_lib/html.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const [pageResponse, dataResponse] = await Promise.all([
        env.ASSETS.fetch(request),
        env.ASSETS.fetch(new URL('/data/kits.json', url)),
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
    const jsonLd = kitsJsonLd(kits, `${url.origin}/kits.html`);

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
