// ==========================================
// /beats.html — inyecta el catálogo en el HTML servido
// ==========================================
// El HTML estático de public/beats.html llega con la lista vacía
// ("Loading beats…"); el JS del cliente la rellena leyendo
// /data/beats.json. Eso deja la página sin contenido real para
// crawlers y bots que no ejecutan JS (SEO, previews de redes).
//
// Esta función intercepta la petición, pide el HTML y el JSON
// originales a ASSETS (sin tocar public/), y usa HTMLRewriter para
// insertar el mismo marcado que el cliente construiría, más JSON-LD.
// El JS del cliente sigue funcionando igual: al cargar, limpia el
// contenedor y lo reconstruye con los listeners de interactividad
// (play/pause). No cambia nada del flujo de compra: los enlaces
// "BUY LICENSE" siguen apuntando a BeatStars.

import { beatsListHtml, beatsJsonLd, jsonLdScript } from './_lib/html.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const [pageResponse, dataResponse] = await Promise.all([
        env.ASSETS.fetch(request),
        env.ASSETS.fetch(new URL('/data/beats.json', url)),
    ]);

    if (!pageResponse.ok) return pageResponse;

    let beats = [];
    if (dataResponse.ok) {
        try {
            beats = await dataResponse.json();
        } catch (error) {
            console.error('beats.json parse failed:', error);
        }
    }

    const listHtml = beatsListHtml(beats);
    const jsonLd = beatsJsonLd(beats, `${url.origin}/beats.html`);

    const rewriter = new HTMLRewriter().on('#beats-list', {
        element(el) {
            el.setInnerContent(listHtml, { html: true });
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
