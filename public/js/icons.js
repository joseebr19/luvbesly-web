// ==========================================
// ICONOS DEL REPRODUCTOR
// ==========================================
// SVG inline con currentColor en vez de glifos Unicode (▶ ⏸ ⏮ ⏭ 🔊):
// esos caracteres se dibujan como emoji a color en Windows, iOS y
// Android, y rompen la estética en blanco y negro. Los mismos trazos
// están duplicados como strings en functions/_lib/html.js y en
// public/beats.html (que generan HTML server-side / estático).

import { clear } from './dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Cada trazo: d = path, fill = relleno sólido o solo contorno
const ICONS = {
    play: [{ d: 'M8 5.2 Q8.1 12 8 18.8 Q14.6 15.6 18.8 12.1 Q14.5 8.7 8 5.2 Z', fill: true }],
    pause: [
        { d: 'M7 5.2 H10.2 V18.8 H7 Z', fill: true },
        { d: 'M13.8 5.2 H17 V18.8 H13.8 Z', fill: true },
    ],
    prev: [
        { d: 'M6 5.5 V18.5' },
        { d: 'M18.5 5.8 V18.2 L9 12 Z', fill: true },
    ],
    next: [
        { d: 'M18 5.5 V18.5' },
        { d: 'M5.5 5.8 V18.2 L15 12 Z', fill: true },
    ],
    volume: [
        { d: 'M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z', fill: true },
        { d: 'M16 9 Q18 12 16 15' },
        { d: 'M18.5 6.5 Q22 12 18.5 17.5' },
    ],
};

/** Devuelve un <svg> con el icono `name`, dibujado en currentColor. */
export function icon(name, size = 16) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon-sketch');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    ICONS[name].forEach(({ d, fill }) => {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        if (fill) path.setAttribute('fill', 'currentColor');
        svg.append(path);
    });

    return svg;
}

/** Sustituye el contenido de `node` por el icono `name`. */
export function setIcon(node, name, size = 16) {
    clear(node);
    node.append(icon(name, size));
}
