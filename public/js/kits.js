// ==========================================
// PÁGINA DE SOUND KITS
// ==========================================

import { el, clear, setState, loadJSON } from './dom.js';

export async function initKitsPage() {
    const grid = document.getElementById('kits-grid');
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

    clear(grid);
    kits.forEach((kit) => grid.append(buildCard(kit)));
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
            el('p', { className: 'sk-name', text: kit.title.toLowerCase() }),
            el('p', { className: 'sk-price', text: kit.price.toLowerCase() }),
        ],
    });
}
