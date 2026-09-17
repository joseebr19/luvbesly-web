// ==========================================
// /vsts.html — inyecta el archivo de VSTs en el HTML servido
// ==========================================
// Mismo patrón que beats.html.js y kits.html.js. No se añade
// JSON-LD de producto aquí: son plugins de terceros que el sitio
// solo enlaza (no los vende), así que un Product/Offer sería
// inexacto. Se deja como listado indexable normal.

import { vstsGridHtml } from './_lib/html.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const [pageResponse, dataResponse] = await Promise.all([
        env.ASSETS.fetch(request),
        env.ASSETS.fetch(new URL('/data/vsts.json', url)),
    ]);

    if (!pageResponse.ok) return pageResponse;

    let vsts = [];
    if (dataResponse.ok) {
        try {
            vsts = await dataResponse.json();
        } catch (error) {
            console.error('vsts.json parse failed:', error);
        }
    }

    const gridHtml = vstsGridHtml(vsts);
    const count = Array.isArray(vsts) ? vsts.length : 0;

    const rewriter = new HTMLRewriter()
        .on('#vsts-grid', {
            element(el) {
                el.setInnerContent(gridHtml, { html: true });
                el.setAttribute('aria-busy', 'false');
            },
        })
        .on('#vst-count', {
            element(el) {
                el.setInnerContent(`${count} plugins`);
            },
        });

    return rewriter.transform(pageResponse);
}
