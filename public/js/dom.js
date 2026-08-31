// ==========================================
// HELPERS COMPARTIDOS
// ==========================================

/**
 * Crea un elemento. `text` se asigna con textContent, nunca con
 * innerHTML: así ningún dato puede inyectar HTML en la página.
 */
export function el(tag, { className, text, attrs, children } = {}) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text != null) node.textContent = text;

    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            if (value == null || value === false) continue;
            node.setAttribute(key, value === true ? '' : String(value));
        }
    }

    if (children) {
        for (const child of children) {
            if (child) node.append(child);
        }
    }

    return node;
}

/** Enlace externo, siempre con rel de seguridad. */
export function externalLink(href, text, className) {
    return el('a', {
        className,
        text,
        attrs: { href, target: '_blank', rel: 'noopener noreferrer' },
    });
}

/** Vacía un contenedor sin usar innerHTML. */
export function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

/** Sustituye el contenido de un contenedor por un mensaje de estado. */
export function setState(container, message, isError = false) {
    clear(container);
    container.append(el('p', {
        className: isError ? 'loading-state is-error' : 'loading-state',
        text: message,
    }));
    container.setAttribute('aria-busy', 'false');
}

/**
 * Carga un JSON con timeout, para que un servidor colgado no deje
 * la página en "Loading…" indefinidamente.
 */
export async function loadJSON(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

/** Retrasa la ejecución hasta que pasen `wait` ms sin nuevas llamadas. */
export function debounce(fn, wait = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

/** Segundos -> "m:ss". Devuelve "0:00" si el valor no es válido. */
export function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}
