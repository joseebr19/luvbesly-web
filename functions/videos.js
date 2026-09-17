// ==========================================
// /videos — inyecta el feed de YouTube en el HTML servido
// ==========================================
// Mismo motivo que beats.js, kits.js y vsts.js: Cloudflare Pages
// redirige /videos.html -> /videos, que es la ruta que realmente ve
// el visitante y Google, así que la función tiene que engancharse
// ahí para que el renderizado no se pierda tras la redirección.
//
// A diferencia de esas tres, aquí no hay un JSON estático en
// public/data que leer con fetchAsset: los vídeos vienen de
// /api/videos, que es otra Function (no un asset de ASSETS), así
// que se pide con un fetch() normal a la propia ruta. Esa Function
// ya cachea la respuesta de YouTube en el borde durante una hora, así
// que esto no gasta cuota extra de la API.

import { videosGridHtml, videosJsonLd, jsonLdScript } from './_lib/html.js';
import { fetchAsset } from './_lib/assets.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const [pageResponse, apiResponse] = await Promise.all([
        fetchAsset(env, request),
        fetch(new URL('/api/videos', url), { headers: { Accept: 'application/json' } }),
    ]);

    if (!pageResponse.ok) return pageResponse;

    let videos = [];
    if (apiResponse.ok) {
        try {
            videos = normalize(await apiResponse.json());
        } catch (error) {
            console.error('videos payload parse failed:', error);
        }
    }

    const gridHtml = videosGridHtml(videos);
    const jsonLd = videosJsonLd(videos, `${url.origin}/videos`);

    const rewriter = new HTMLRewriter().on('#videos-grid', {
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

/** Misma forma que espera public/js/videos.js: { id, title }. */
function normalize(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];

    return items
        .map((item) => ({
            id: item?.snippet?.resourceId?.videoId || item?.id?.videoId || null,
            title: item?.snippet?.title || 'Untitled',
        }))
        .filter((video) => video.id && video.title !== 'Private video');
}
