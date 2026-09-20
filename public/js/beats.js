// ==========================================
// PÁGINA DE BEATS
// ==========================================

import { el, externalLink, clear, setState, loadJSON } from './dom.js';
import { createPlayer } from './player.js';
import { icon, setIcon } from './icons.js';

export async function initBeatsPage() {
    const list = document.getElementById('beats-list');
    if (!list) return;

    let beats;
    try {
        beats = await loadJSON('/data/beats.json');
    } catch (error) {
        console.error(error);
        setState(list, 'Catalog unavailable. Browse the full catalog on BeatStars.', true);
        return;
    }

    if (!Array.isArray(beats) || beats.length === 0) {
        setState(list, 'No beats published yet.');
        return;
    }

    const player = createPlayer(beats, { onTrackChange: syncRows });
    const rows = [];

    clear(list);

    beats.forEach((beat, index) => {
        const playBtn = el('button', {
            className: 'play-btn',
            attrs: { type: 'button', 'aria-label': `Play ${beat.title}` },
            children: [icon('play')],
        });

        playBtn.addEventListener('click', () => player?.select(index));

        const row = el('div', {
            className: 'beat-row',
            children: [
                el('div', {
                    className: 'beat-main',
                    children: [
                        playBtn,
                        el('div', {
                            className: 'beat-details',
                            children: [
                                el('h2', { text: beat.title }),
                                el('span', {
                                    className: 'beat-bpm',
                                    text: [beat.bpm, beat.key].filter(Boolean).join(' · '),
                                }),
                            ],
                        }),
                    ],
                }),
                externalLink(beat.buyUrl, 'Buy license', 'btn btn-primary'),
            ],
        });

        // Escalona la entrada de las filas
        row.style.animationDelay = `${Math.min(index * 60, 400)}ms`;

        rows.push({ row, playBtn });
        list.append(row);
    });

    list.setAttribute('aria-busy', 'false');

    function syncRows(activeIndex, state) {
        rows.forEach(({ row, playBtn }, index) => {
            const isActive = index === activeIndex;
            const isPlaying = isActive && state === 'playing';

            setIcon(playBtn, isPlaying ? 'pause' : 'play');
            playBtn.setAttribute(
                'aria-label',
                `${isPlaying ? 'Pause' : 'Play'} ${beats[index].title}`,
            );
            row.classList.toggle('is-playing', isActive && state !== 'error');

            // El botón sigue activo: pulsarlo de nuevo reintenta la carga
            if (isActive && state === 'error') {
                playBtn.setAttribute('aria-label', `${beats[index].title} unavailable, press to retry`);
            }
        });
    }
}
