// ==========================================
// NÚCLEO — se carga en todas las páginas
// ==========================================
// Solo trae el menú y el año. Todo lo demás se importa bajo demanda
// según lo que exista en el DOM, así la home no descarga el catálogo
// de 65 plugins.

initNav();
initYear();
initPage();

// ------------------------------------------
// MENÚ
// ------------------------------------------
function initNav() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');
    if (!hamburger || !nav) return;

    const setOpen = (open) => {
        hamburger.classList.toggle('active', open);
        nav.classList.toggle('open', open);
        // Antes esto no se actualizaba nunca: el lector de pantalla
        // siempre anunciaba el menú como cerrado
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    hamburger.addEventListener('click', () => {
        setOpen(hamburger.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    // Escape cierra y devuelve el foco al botón
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            hamburger.focus();
        }
    });

    // Un clic fuera también cierra
    document.addEventListener('click', (event) => {
        if (hamburger.getAttribute('aria-expanded') !== 'true') return;
        if (nav.contains(event.target) || hamburger.contains(event.target)) return;
        setOpen(false);
    });
}

// ------------------------------------------
// AÑO DEL FOOTER
// ------------------------------------------
function initYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
}

// ------------------------------------------
// ROUTER
// ------------------------------------------
async function initPage() {
    try {
        if (document.getElementById('beats-list')) {
            const { initBeatsPage } = await import('./beats.js');
            await initBeatsPage();
        } else if (document.getElementById('kits-grid')) {
            const { initKitsPage } = await import('./kits.js');
            await initKitsPage();
        } else if (document.getElementById('vsts-grid')) {
            const { initVstsPage } = await import('./vsts.js');
            await initVstsPage();
        } else if (document.getElementById('videos-grid')) {
            const { initVideosPage } = await import('./videos.js');
            await initVideosPage();
        }
    } catch (error) {
        // Un fallo aquí no debe tumbar el menú, que ya está montado
        console.error('Page module failed:', error);
    }
}
