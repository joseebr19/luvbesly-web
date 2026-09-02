// ==========================================
// /api/videos — proxy a la API de YouTube
// ==========================================
// La clave vive como secreto del servidor y nunca sale de aquí.
//
// Usa playlistItems (1 unidad de cuota) en vez de search (100). Con la
// cuota diaria de 10.000, search se agotaba en 100 visitas. Con esto y
// la caché de una hora, el gasto es de unas 24 unidades al día.

const CACHE_SECONDS = 3600;
const MAX_RESULTS = 6;

export async function onRequestGet(context) {
    const { env, request, waitUntil } = context;

    const key = env.YOUTUBE_KEY;
    const channelId = env.YOUTUBE_CHANNEL_ID;

    if (!key || !channelId) {
        return json(
            { error: 'Feed not configured' },
            500,
            { 'Cache-Control': 'no-store' },
        );
    }

    // Rate limiting por IP: protege la cuota de YouTube ante un pico
    // de peticiones directo al endpoint, saltándose la caché de borde.
    if (env.API_LIMITER) {
        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        const { success } = await env.API_LIMITER.limit({ key: ip });
        if (!success) {
            return json({ error: 'Too many requests' }, 429, { 'Cache-Control': 'no-store' });
        }
    }

    // Caché de borde: la mayoría de visitas no llegan a YouTube
    const cache = caches.default;
    const cacheKey = new Request(new URL('/api/videos', request.url), { method: 'GET' });

    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    // El ID de la lista de subidas de un canal es el suyo con UC -> UU
    const uploadsPlaylist = channelId.replace(/^UC/, 'UU');

    const upstream = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    upstream.searchParams.set('key', key);
    upstream.searchParams.set('playlistId', uploadsPlaylist);
    upstream.searchParams.set('part', 'snippet');
    upstream.searchParams.set('maxResults', String(MAX_RESULTS));

    let payload;
    try {
        const response = await fetch(upstream, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            console.error('YouTube API error', response.status, await response.text());
            return json({ error: 'Upstream unavailable' }, 502, { 'Cache-Control': 'no-store' });
        }

        payload = await response.json();
    } catch (error) {
        console.error('YouTube fetch failed:', error);
        return json({ error: 'Upstream unavailable' }, 502, { 'Cache-Control': 'no-store' });
    }

    // Devolvemos solo lo que la página necesita. Así el cliente no
    // recibe URLs de miniaturas, descripciones ni metadatos de más.
    const items = (payload.items || [])
        .map((item) => ({
            snippet: {
                title: item?.snippet?.title || 'Untitled',
                resourceId: { videoId: item?.snippet?.resourceId?.videoId || null },
            },
        }))
        .filter((item) => item.snippet.resourceId.videoId);

    const result = json({ items }, 200, {
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    });

    waitUntil(cache.put(cacheKey, result.clone()));
    return result;
}

function json(body, status, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            ...headers,
        },
    });
}
