// ==========================================
// VST VAULT
// ==========================================

import { el, clear, setState, loadJSON, debounce } from './dom.js';

const FALLBACK_IMAGE = '/images/vst-default.png';
const SVG_NS = 'http://www.w3.org/2000/svg';

// Icono de descarga dibujado a mano (trazo irregular, no un icon set
// genérico), para que quede claro que el nombre es el punto de
// descarga. Construido con createElementNS porque el helper el() de
// dom.js usa createElement y no sirve para nodos SVG.
function downloadIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon-sketch');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    [
        'M12 3.4 Q11.7 9.2 12.1 14.6',
        'M8.3 11.6 Q10 14.3 12.1 14.8 Q14.1 14.2 15.6 11.4',
        'M5.4 18.2 Q12 19.4 18.5 18.1',
    ].forEach((d) => {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        svg.append(path);
    });

    return svg;
}

export async function initVstsPage() {
    const grid = document.getElementById('vsts-grid');
    const search = document.getElementById('vst-search');
    const count = document.getElementById('vst-count');
    if (!grid) return;

    let vsts;
    try {
        vsts = await loadJSON('/data/vsts.json');
    } catch (error) {
        console.error(error);
        setState(grid, 'Archive unavailable right now.', true);
        return;
    }

    if (!Array.isArray(vsts) || vsts.length === 0) {
        setState(grid, 'Archive is empty.');
        return;
    }

    // Índice de búsqueda precalculado: evita recorrer y normalizar
    // 65 títulos en cada pulsación de tecla
    const index = vsts.map((vst) => ({
        vst,
        haystack: `${vst.title} ${vst.description} ${vst.system}`.toLowerCase(),
    }));

    render('');

    if (search) {
        search.addEventListener('input', debounce((event) => {
            render(event.target.value);
        }, 180));

        // Escape limpia el buscador
        search.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && search.value) {
                search.value = '';
                render('');
            }
        });
    }

    function render(term) {
        const query = term.trim().toLowerCase();
        const matches = query
            ? index.filter((entry) => entry.haystack.includes(query)).map((e) => e.vst)
            : vsts;

        clear(grid);

        if (matches.length === 0) {
            setState(grid, 'No plugins found.');
            if (count) count.textContent = `0 of ${vsts.length} plugins`;
            return;
        }

        // Un fragment: un solo reflow en vez de 65
        const fragment = document.createDocumentFragment();
        matches.forEach((vst) => fragment.append(buildCard(vst)));
        grid.append(fragment);
        grid.setAttribute('aria-busy', 'false');

        if (count) {
            count.textContent = query
                ? `${matches.length} of ${vsts.length} plugins`
                : `${vsts.length} plugins`;
        }
    }
}

// Tarjeta minimal, igual patrón que sound kits: captura flotante sin
// caja + nombre/sistema en minúscula, sin descripción ni badge. Toda
// la tarjeta enlaza directo a la descarga (no hay página de detalle
// para plugins). La descripción sigue viva en el índice de búsqueda
// de arriba, solo deja de pintarse en la tarjeta.
function buildCard(vst) {
    const image = el('img', {
        attrs: {
            src: vst.image,
            alt: `${vst.title} interface`,
            loading: 'lazy',
            decoding: 'async',
        },
    });

    // Antes esto era un onerror inline en el HTML, que una CSP
    // estricta bloquea. Como listener funciona igual y es compatible.
    image.addEventListener('error', () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = 'true';
        image.src = FALLBACK_IMAGE;
    }, { once: true });

    return el('a', {
        className: 'sk-card',
        attrs: {
            href: vst.downloadUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
        },
        children: [
            el('div', { className: 'kit-cover free-kit vst-cover product-cutout', children: [image] }),
            el('div', {
                className: 'sk-meta',
                children: [
                    el('p', {
                        className: 'sk-name',
                        // Nombre accesible calculado del propio contenido visible
                        // (título + sistema), en vez de un aria-label que lo
                        // sustituiría entero: así nunca puede desincronizarse.
                        children: [
                            el('span', { className: 'visually-hidden', text: 'Download ' }),
                            downloadIcon(),
                            el('span', { text: vst.title.toLowerCase() }),
                        ],
                    }),
                    el('p', { className: 'sk-price', text: vst.system.toLowerCase() }),
                ],
            }),
        ],
    });
}
