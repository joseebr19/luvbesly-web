// ==========================================
// VST VAULT
// ==========================================

import { el, externalLink, clear, setState, loadJSON, debounce } from './dom.js';

const FALLBACK_IMAGE = '/images/vst-default.png';

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
            setState(grid, 'NO PLUGINS FOUND');
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

    const download = externalLink(vst.downloadUrl, 'GET VST', 'kit-btn');
    download.setAttribute('aria-label', `Download ${vst.title}`);

    return el('div', {
        className: 'kit-card',
        children: [
            el('div', { className: 'kit-cover free-kit', children: [image] }),
            el('div', {
                className: 'kit-info',
                children: [
                    el('h3', { text: vst.title }),
                    el('p', { text: vst.description }),
                    el('div', {
                        className: 'kit-footer',
                        children: [
                            el('span', { className: 'kit-price', text: vst.system }),
                            download,
                        ],
                    }),
                ],
            }),
        ],
    });
}
