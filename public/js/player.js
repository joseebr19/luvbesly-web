// ==========================================
// REPRODUCTOR GLOBAL
// ==========================================

import { formatTime } from './dom.js';

export function createPlayer(tracks, { onTrackChange } = {}) {
    const root = document.getElementById('global-player');
    if (!root) return null;

    const ui = {
        title: document.getElementById('player-title'),
        bpm: document.getElementById('player-bpm'),
        play: document.getElementById('player-play-btn'),
        prev: document.getElementById('player-prev-btn'),
        next: document.getElementById('player-next-btn'),
        progress: document.getElementById('progress-bar-container'),
        bar: document.getElementById('progress-bar'),
        current: document.getElementById('player-current-time'),
        duration: document.getElementById('player-duration'),
        volume: document.getElementById('player-volume'),
    };

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = ui.volume ? Number(ui.volume.value) : 0.8;

    let index = -1;

    // ------------------------------------------
    // ESTADO
    // ------------------------------------------
    function notify(state) {
        onTrackChange?.(index, state);
        if (ui.play) {
            const playing = state === 'playing';
            ui.play.textContent = playing ? '⏸' : '▶';
            ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        }
    }

    function select(nextIndex) {
        if (!tracks.length) return;

        // Envuelve por los dos extremos
        const target = (nextIndex + tracks.length) % tracks.length;

        if (target === index) {
            toggle();
            return;
        }

        index = target;
        const track = tracks[index];

        audio.pause();
        audio.src = track.audioUrl;

        root.classList.remove('hidden');
        if (ui.title) ui.title.textContent = track.title;
        if (ui.bpm) ui.bpm.textContent = [track.bpm, track.key].filter(Boolean).join(' · ');
        if (ui.bar) ui.bar.style.width = '0%';
        if (ui.current) ui.current.textContent = '0:00';
        if (ui.duration) ui.duration.textContent = '0:00';

        notify('loading');
        play();
    }

    function play() {
        // play() devuelve una promesa que se rechaza si el archivo no
        // existe o si el navegador bloquea el autoplay. Antes esto solo
        // se registraba en consola y el usuario no veía nada.
        audio.play().catch((error) => {
            if (error.name === 'AbortError') return; // cambio de pista, normal
            console.warn('Playback failed:', error);
            notify('error');
        });
    }

    function toggle() {
        if (index === -1) {
            select(0);
        } else if (audio.paused) {
            play();
        } else {
            audio.pause();
        }
    }

    function seekTo(ratio) {
        if (!Number.isFinite(audio.duration)) return;
        audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
    }

    // ------------------------------------------
    // EVENTOS DEL AUDIO
    // ------------------------------------------
    audio.addEventListener('play', () => notify('playing'));
    audio.addEventListener('pause', () => notify('paused'));

    audio.addEventListener('error', () => {
        console.warn('Audio file unavailable:', tracks[index]?.audioUrl);
        if (ui.title) ui.title.textContent = 'TRACK UNAVAILABLE';
        notify('error');
    });

    audio.addEventListener('loadedmetadata', () => {
        if (ui.duration) ui.duration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        if (!Number.isFinite(audio.duration) || audio.duration === 0) return;

        const percent = (audio.currentTime / audio.duration) * 100;
        if (ui.bar) ui.bar.style.width = `${percent}%`;
        if (ui.current) ui.current.textContent = formatTime(audio.currentTime);

        // La barra declara role="slider": hay que mantener el valor
        // sincronizado o miente a los lectores de pantalla
        if (ui.progress) {
            ui.progress.setAttribute('aria-valuenow', String(Math.round(percent)));
            ui.progress.setAttribute('aria-valuetext', formatTime(audio.currentTime));
        }
    });

    audio.addEventListener('ended', () => {
        if (index < tracks.length - 1) {
            select(index + 1);
        } else {
            index = -1;
            notify('paused');
        }
    });

    // ------------------------------------------
    // CONTROLES
    // ------------------------------------------
    ui.play?.addEventListener('click', toggle);
    ui.next?.addEventListener('click', () => select(index + 1));

    ui.prev?.addEventListener('click', () => {
        // Convención habitual: si ya suena hace más de 3s, reinicia
        if (audio.currentTime > 3) audio.currentTime = 0;
        else select(index - 1);
    });

    ui.volume?.addEventListener('input', (event) => {
        audio.volume = Number(event.target.value);
    });

    if (ui.progress) {
        ui.progress.addEventListener('click', (event) => {
            const rect = ui.progress.getBoundingClientRect();
            seekTo((event.clientX - rect.left) / rect.width);
        });

        // La barra tiene tabindex: sin esto se puede enfocar pero no usar
        ui.progress.addEventListener('keydown', (event) => {
            const step = event.shiftKey ? 30 : 5;
            const keys = {
                ArrowRight: () => (audio.currentTime += step),
                ArrowLeft: () => (audio.currentTime -= step),
                Home: () => (audio.currentTime = 0),
                End: () => (audio.currentTime = audio.duration || 0),
                ' ': toggle,
            };
            if (!keys[event.key]) return;
            event.preventDefault();
            keys[event.key]();
        });
    }

    // Controles del sistema operativo y de los auriculares
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', toggle);
        navigator.mediaSession.setActionHandler('pause', toggle);
        navigator.mediaSession.setActionHandler('previoustrack', () => select(index - 1));
        navigator.mediaSession.setActionHandler('nexttrack', () => select(index + 1));
    }

    return { select, toggle, get index() { return index; } };
}
