// ==========================================
// PÁGINA DE SOUND KITS
// ==========================================

import { el, clear, setState, loadJSON } from './dom.js';

export async function initKitsPage() {
    return renderKitsInto('kits-grid');
}

// Preview del home: solo los 3 kits más recientes, con enlace
// "View all kits" al catálogo completo.
export async function initHomeShowcase() {
    return renderKitsInto('home-showcase-grid', { limit: 3 });
}

// Más reciente primero. Un kit sin "publishedAt" válido (p.ej. un
// futuro placeholder "coming soon") siempre queda al final, sin
// importar su posición en el JSON.
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

async function renderKitsInto(gridId, { limit } = {}) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    let kits;
    try {
        kits = await loadJSON('/data/kits.json');
    } catch (error) {
        console.error(error);
        setState(grid, 'Kits unavailable right now.', true);
        return;
    }

    if (!Array.isArray(kits) || kits.length === 0) {
        setState(grid, 'No kits published yet.');
        return;
    }

    const sorted = sortKitsByDate(kits);
    const visible = limit ? sorted.slice(0, limit) : sorted;

    clear(grid);
    visible.forEach((kit) => grid.append(buildCard(kit)));
    grid.setAttribute('aria-busy', 'false');
}

// Tarjeta minimal: imagen flotante + nombre + precio, sin badge, sin
// descripción, sin botón. Toda la tarjeta es el enlace a la ficha del
// kit (si tiene página de detalle real).
function buildCard(kit) {
    const children = [buildCover(kit), buildMeta(kit)];

    if (!kit.detailUrl || kit.detailUrl === '#') {
        return el('div', { className: 'sk-card', children });
    }

    return el('a', {
        className: 'sk-card',
        attrs: { href: kit.detailUrl, 'aria-label': `${kit.title} details` },
        children,
    });
}

function buildCover(kit) {
    // Sin imagen (kit bloqueado): un placeholder con el texto
    if (!kit.coverImage) {
        return el('div', {
            className: 'kit-cover',
            children: [el('span', { text: kit.coverText || kit.title })],
        });
    }

    return el('div', {
        className: kit.isFree ? 'kit-cover free-kit product-cutout' : 'kit-cover product-cutout',
        children: [
            el('img', {
                attrs: {
                    src: kit.coverImage,
                    alt: `${kit.title} cover art`,
                    loading: 'lazy',
                    decoding: 'async',
                },
            }),
        ],
    });
}

function buildMeta(kit) {
    return el('div', {
        className: 'sk-meta',
        children: [
            el('p', { className: 'sk-name', text: String(kit.title ?? '').toLowerCase() }),
            el('p', { className: 'sk-price', text: String(kit.price ?? '').toLowerCase() }),
        ],
    });
}
