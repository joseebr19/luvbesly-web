// ==========================================
// PÁGINA DE VÍDEOS
// ==========================================
// No hay ninguna clave de API aquí. El navegador llama a /api/videos,
// que es una Function de Cloudflare; la clave vive como secreto en el
// servidor y nunca llega al cliente.

import { el, clear, setState, loadJSON } from './dom.js';

export async function initVideosPage() {
    const grid = document.getElementById('videos-grid');
    if (!grid) return;

    let payload;
    try {
        payload = await loadJSON('/api/videos');
    } catch (error) {
        console.error(error);
        setState(grid, 'Feed temporarily unavailable. Check back later.', true);
        return;
    }

    const videos = normalize(payload);

    if (videos.length === 0) {
        setState(grid, 'No videos published yet.');
        return;
    }

    clear(grid);
    videos.forEach((video) => grid.append(buildCard(video)));
    grid.setAttribute('aria-busy', 'false');
}

/**
 * Acepta tanto la forma de playlistItems (resourceId.videoId) como la
 * de search (id.videoId), para no romperse si cambiamos de endpoint.
 */
function normalize(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];

    return items
        .map((item) => ({
            id: item?.snippet?.resourceId?.videoId || item?.id?.videoId || null,
            title: item?.snippet?.title || 'Untitled',
        }))
        .filter((video) => video.id && video.title !== 'Private video');
}

function buildCard(video) {
    const iframe = el('iframe', {
        attrs: {
            // nocookie: no deja cookies de seguimiento hasta que se reproduce
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}`,
            title: video.title,
            loading: 'lazy',
            allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: true,
            referrerpolicy: 'strict-origin-when-cross-origin',
        },
    });

    return el('div', {
        className: 'video-card',
        children: [
            el('div', { className: 'video-wrapper', children: [iframe] }),
            el('div', {
                className: 'video-info',
                children: [el('h3', { text: video.title })],
            }),
        ],
    });
}
