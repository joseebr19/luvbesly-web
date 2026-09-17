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
                    <h3>${escapeHtml(beat.title)}</h3>
                    <span class="beat-bpm">${escapeHtml([beat.bpm, beat.key].filter(Boolean).join(' · '))}</span>
                </div>
            </div>
            <div class="beat-actions">
                <a href="${escapeAttr(beat.buyUrl)}" target="_blank" rel="noopener noreferrer" class="kit-btn">BUY LICENSE</a>
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

    const coverClass = kit.isFree ? 'kit-cover free-kit' : 'kit-cover';
    const img = `<img src="${escapeAttr(kit.coverImage)}" alt="${escapeAttr(kit.title)} cover art" loading="lazy" decoding="async">`;

    if (!kit.detailUrl || kit.detailUrl === '#') {
        return `<div class="${coverClass}">${img}</div>`;
    }

    return `<a class="kit-link" href="${escapeAttr(kit.detailUrl)}" aria-label="${escapeAttr(kit.title)} details"><div class="${coverClass}">${img}</div></a>`;
}

function kitActionHtml(kit) {
    if (kit.isLocked) {
        return `<button class="kit-btn" type="button" disabled>${escapeHtml(kit.btnText)}</button>`;
    }

    return `<a href="${escapeAttr(kit.buyUrl)}" target="_blank" rel="noopener noreferrer" class="kit-btn" aria-label="${escapeAttr(kit.btnText)} — ${escapeAttr(kit.title)}">${escapeHtml(kit.btnText)}</a>`;
}

export function kitsGridHtml(kits) {
    if (!Array.isArray(kits) || kits.length === 0) {
        return '<p class="loading-state">No kits published yet.</p>';
    }

    return kits.map((kit) => `
        <div class="kit-card">
            ${kitCoverHtml(kit)}
            <div class="kit-info">
                <h3>${escapeHtml(kit.title)}</h3>
                <p>${escapeHtml(kit.description)}</p>
                <div class="kit-footer">
                    <span class="${kit.isFree ? 'kit-price free' : 'kit-price'}">${escapeHtml(kit.price)}</span>
                    ${kitActionHtml(kit)}
                </div>
            </div>
        </div>
    `.trim()).join('\n');
}

export function kitsJsonLd(kits, pageUrl) {
    const sellable = Array.isArray(kits) ? kits.filter((kit) => !kit.isLocked) : [];
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

export function vstsGridHtml(vsts) {
    if (!Array.isArray(vsts) || vsts.length === 0) {
        return '<p class="loading-state">Archive is empty.</p>';
    }

    return vsts.map((vst) => `
        <div class="kit-card">
            <div class="kit-cover free-kit vst-cover">
                <img src="${escapeAttr(vst.image)}" alt="${escapeAttr(vst.title)} interface" loading="lazy" decoding="async">
                <!-- El fallback de imagen rota se aplica por JS (dom.js), no inline: la CSP del sitio bloquea onerror inline. -->
            </div>
            <div class="kit-info">
                <h3>${escapeHtml(vst.title)}</h3>
                <p>${escapeHtml(vst.description)}</p>
                <div class="kit-footer">
                    <span class="kit-price">${escapeHtml(vst.system)}</span>
                    <a href="${escapeAttr(vst.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="kit-btn" aria-label="Download ${escapeAttr(vst.title)}">GET VST</a>
                </div>
            </div>
        </div>
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
                <h3>${escapeHtml(video.title)}</h3>
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
