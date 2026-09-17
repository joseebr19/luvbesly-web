// ==========================================
// Helper compartido — obtiene un asset estático siguiendo redirecciones
// ==========================================
// Cloudflare Pages resuelve URLs "limpias" (sin .html) internamente,
// pero una petición a env.ASSETS.fetch() para la ruta con extensión
// puede devolver un 308 hacia la versión sin extensión en vez del
// HTML directamente. Como nuestras funciones ya viven en la ruta sin
// extensión (para no perder el renderizado tras la redirección del
// navegador), esto normalmente no debería redirigir más — pero lo
// seguimos por seguridad en vez de asumirlo.

export async function fetchAsset(env, url, maxRedirects = 2) {
    let response = await env.ASSETS.fetch(url);
    let hops = 0;

    while (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.has('location') &&
        hops < maxRedirects
    ) {
        const next = new URL(response.headers.get('location'), url);
        response = await env.ASSETS.fetch(next);
        hops += 1;
    }

    return response;
}
