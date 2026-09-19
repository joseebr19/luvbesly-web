// ==========================================
// HELPERS COMPARTIDOS — renderizado server-side
// ==========================================
// Genera el mismo marcado que el cliente construye en public/js/*.js,
// para que el catálogo sea visible en el HTML inicial (SEO, crawlers,
// previews de redes sociales) sin depender de que se ejecute JS.
// El JS del cliente sigue funcionando igual: al cargar, limpia estos
// nodos y los reconstruye con los listeners de interactividad.

/** Escapa texto para insertarlo entre etiquetas HTML. */
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Escapa texto para insertarlo dentro de un atributo entre comillas dobles. */
export function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
}

/** Serializa un objeto JSON-LD como <script> listo para inyectar. */
export function jsonLdScript(data) {
    // JSON.stringify no puede producir "</script>" salvo que el propio
    // texto lo contenga; lo neutralizamos igualmente por seguridad.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    return `<script type="application/ld+json">${json}</script>`;
}

export function beatsListHtml(beats) {
    if (!Array.isArray(beats) || beats.length === 0) {
        return '<p class="loading-state">No beats published yet.</p>';
    }

    return beats.map((beat) => `
        <div class="beat-row">
            <div class="beat-main">
                <button class="play-btn" type="button" aria-label="Play ${escapeAttr(beat.title)}">▶</button>
                <div class="beat-details">
                    <h2>${escapeHtml(beat.title)}</h2>
                    <span class="beat-bpm">${escapeHtml([beat.bpm, beat.key].filter(Boolean).join(' · '))}</span>
                </div>
            </div>
            <div class="beat-actions">
                <a href="${escapeAttr(beat.buyUrl)}" target="_blank" rel="noopener noreferrer" class="kit-btn">Buy license</a>
            </div>
        </div>
    `.trim()).join('\n');
}

export function beatsJsonLd(beats, pageUrl) {
    if (!Array.isArray(beats) || beats.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: pageUrl,
        itemListElement: beats.map((beat, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'MusicRecording',
                name: beat.title,
                url: beat.buyUrl,
                ...(beat.bpm ? { additionalProperty: { '@type': 'PropertyValue', name: 'BPM', value: beat.bpm } } : {}),
            },
        })),
    };
}

function kitCoverHtml(kit) {
    if (!kit.coverImage) {
        return `<div class="kit-cover"><span>${escapeHtml(kit.coverText || kit.title)}</span></div>`;
    }

    const coverClass = kit.isFree ? 'kit-cover free-kit product-cutout' : 'kit-cover product-cutout';
    const img = `<img src="${escapeAttr(kit.coverImage)}" alt="${escapeAttr(kit.title)} cover art" loading="lazy" decoding="async">`;
    return `<div class="${coverClass}">${img}</div>`;
}

// Tarjeta minimal: imagen flotante + nombre + precio en texto plano,
// sin badge, sin descripción, sin botón — igual que public/js/kits.js.
function kitMetaHtml(kit) {
    return `<div class="sk-meta"><p class="sk-name">${escapeHtml(kit.title.toLowerCase())}</p><p class="sk-price">${escapeHtml(kit.price.toLowerCase())}</p></div>`;
}

// Más reciente primero. Un kit sin "publishedAt" válido (p.ej. un
// futuro placeholder "coming soon") siempre queda al final, sin
// importar su posición en el JSON. Duplicado en public/js/kits.js
// para que cliente y servidor generen exactamente el mismo orden.
function sortKitsByDate(kits) {
    return [...kits].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : NaN;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : NaN;
        const validA = !Number.isNaN(dateA);
        const validB = !Number.isNaN(dateB);
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;
        return dateB - dateA;
    });
}

export function kitsGridHtml(kits, { limit } = {}) {
    if (!Array.isArray(kits) || kits.length === 0) {
        return '<p class="loading-state">No kits published yet.</p>';
    }

    const sorted = sortKitsByDate(kits);
    const visible = limit ? sorted.slice(0, limit) : sorted;

    return visible.map((kit) => {
        const inner = `${kitCoverHtml(kit)}${kitMetaHtml(kit)}`;
        if (!kit.detailUrl || kit.detailUrl === '#') {
            return `<div class="sk-card">${inner}</div>`;
        }
        return `<a class="sk-card" href="${escapeAttr(kit.detailUrl)}" aria-label="${escapeAttr(kit.title)} details">${inner}</a>`;
    }).join('\n');
}

export function kitsJsonLd(kits, pageUrl) {
    const sellable = Array.isArray(kits) ? sortKitsByDate(kits.filter((kit) => !kit.isLocked)) : [];
    if (sellable.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: pageUrl,
        itemListElement: sellable.map((kit, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Product',
                name: kit.title,
                description: kit.description,
                url: kit.buyUrl,
                offers: {
                    '@type': 'Offer',
                    price: kit.isFree ? '0' : String(kit.price).replace(/[^0-9.]/g, ''),
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                    url: kit.buyUrl,
                },
            },
        })),
    };
}

// Icono de descarga dibujado a mano, igual que el que construye
// public/js/vsts.js — aquí va como string porque este archivo genera
// HTML server-side, no nodos DOM.
const DOWNLOAD_ICON_SVG = '<svg class="icon-sketch" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3.4 Q11.7 9.2 12.1 14.6"></path><path d="M8.3 11.6 Q10 14.3 12.1 14.8 Q14.1 14.2 15.6 11.4"></path><path d="M5.4 18.2 Q12 19.4 18.5 18.1"></path></svg>';

export function vstsGridHtml(vsts) {
    if (!Array.isArray(vsts) || vsts.length === 0) {
        return '<p class="loading-state">Archive is empty.</p>';
    }

    // Mismo patrón minimal que sound kits: captura flotante sin caja +
    // nombre/sistema en minúscula, sin descripción ni badge. Toda la
    // tarjeta enlaza directo a la descarga (no hay página de detalle).
    // Nombre accesible calculado del propio contenido visible (título +
    // sistema) vía el span visually-hidden, en vez de un aria-label que
    // lo sustituiría entero: así nunca puede desincronizarse.
    return vsts.map((vst) => `
        <a class="sk-card" href="${escapeAttr(vst.downloadUrl)}" target="_blank" rel="noopener noreferrer">
            <div class="kit-cover free-kit vst-cover product-cutout">
                <img src="${escapeAttr(vst.image)}" alt="${escapeAttr(vst.title)} interface" loading="lazy" decoding="async">
                <!-- El fallback de imagen rota se aplica por JS (dom.js), no inline: la CSP del sitio bloquea onerror inline. -->
            </div>
            <div class="sk-meta">
                <p class="sk-name"><span class="visually-hidden">Download </span>${DOWNLOAD_ICON_SVG}<span>${escapeHtml(vst.title.toLowerCase())}</span></p>
                <p class="sk-price">${escapeHtml(vst.system.toLowerCase())}</p>
            </div>
        </a>
    `.trim()).join('\n');
}

export function videosGridHtml(videos) {
    if (!Array.isArray(videos) || videos.length === 0) {
        return '<p class="loading-state">No videos published yet.</p>';
    }

    return videos.map((video) => `
        <div class="video-card">
            <div class="video-wrapper">
                <iframe src="https://www.youtube-nocookie.com/embed/${escapeAttr(video.id)}" title="${escapeAttr(video.title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
            <div class="video-info">
                <h2>${escapeHtml(video.title)}</h2>
            </div>
        </div>
    `.trim()).join('\n');
}

export function videosJsonLd(videos, pageUrl) {
    if (!Array.isArray(videos) || videos.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: pageUrl,
        itemListElement: videos.map((video, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'VideoObject',
                name: video.title,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
                thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            },
        })),
    };
}
