// ==========================================
// PÁGINA DE SOUND KITS
// ==========================================

import { el, externalLink, clear, setState, loadJSON } from './dom.js';

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

function buildCard(kit) {
    return el('div', {
        className: 'kit-card',
        children: [buildCover(kit), buildInfo(kit)],
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

    const cover = el('div', {
        className: kit.isFree ? 'kit-cover free-kit' : 'kit-cover',
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

    // Solo enlazamos si hay página de detalle real
    if (!kit.detailUrl || kit.detailUrl === '#') return cover;

    return el('a', {
        className: 'kit-link',
        attrs: { href: kit.detailUrl, 'aria-label': `${kit.title} details` },
        children: [cover],
    });
}

function buildInfo(kit) {
    let action;

    if (kit.isLocked) {
        action = el('button', {
            className: 'kit-btn',
            text: kit.btnText,
            attrs: { type: 'button', disabled: true },
        });
    } else {
        action = externalLink(
            kit.buyUrl,
            kit.btnText,
            kit.isFree ? 'kit-btn free-btn' : 'kit-btn',
        );
        action.setAttribute('aria-label', `${kit.btnText} — ${kit.title}`);
    }

    return el('div', {
        className: 'kit-info',
        children: [
            el('h3', { text: kit.title }),
            el('p', { text: kit.description }),
            el('div', {
                className: 'kit-footer',
                children: [
                    el('span', {
                        className: kit.isFree ? 'kit-price free' : 'kit-price',
                        text: kit.price,
                    }),
                    action,
                ],
            }),
        ],
    });
}
