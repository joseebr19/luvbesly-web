# luvbesly.com

Web oficial y plataforma de venta de beats de **luvbesly**. Sitio estático sin
framework ni paso de compilación, con una función de servidor para el feed de
YouTube. Desplegado en Cloudflare Pages.

🔗 [luvbesly.com](https://luvbesly.com)

---

## Stack

HTML, CSS y JavaScript con módulos ES nativos. Sin dependencias en tiempo de
ejecución y sin bundler: lo que hay en `public/` es exactamente lo que se sirve.
Wrangler solo se usa para el entorno local y el despliegue.

---

## Estructura

```
.
├── public/                 Raíz pública. Todo lo de aquí se sirve tal cual
│   ├── *.html              Páginas
│   ├── _headers            Cabeceras de seguridad y caché
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js         Router: menú y carga perezosa de módulos
│   │   ├── dom.js          Helpers de creación de DOM y fetch
│   │   ├── player.js       Reproductor global de audio
│   │   ├── beats.js        Página de beats
│   │   ├── kits.js         Página de sound kits
│   │   ├── vsts.js         VST Vault con buscador
│   │   └── videos.js       Feed de YouTube (cliente)
│   ├── data/               Contenido editable sin tocar código
│   │   ├── beats.json
│   │   ├── kits.json
│   │   └── vsts.json
│   ├── images/
│   └── audio/
├── functions/
│   └── api/videos.js       Proxy cacheado a la API de YouTube
├── check.sh                Verificación de estructura e integridad
├── wrangler.jsonc
└── .dev.vars               Secretos locales — ignorado por git
```

---

## Desarrollo

Requiere Node.js 20 o superior.

```bash
git clone https://github.com/joseebr19/luvbesly-web.git
cd luvbesly-web
npx wrangler pages dev
```

Levanta en `http://localhost:8788`. No abras los HTML con doble clic: usan rutas
absolutas y `fetch`, así que necesitan servirse desde un servidor.

Antes de desplegar conviene pasar la verificación:

```bash
bash check.sh
```

Comprueba que la estructura está completa, que las rutas de los JSON apuntan a
archivos que existen y que no hay claves sueltas en `public/`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `YOUTUBE_KEY` | Clave de YouTube Data API v3, restringida a esa única API |
| `YOUTUBE_CHANNEL_ID` | ID del canal, empieza por `UC` |

**En local:** archivo `.dev.vars` en la raíz.

```
YOUTUBE_KEY=...
YOUTUBE_CHANNEL_ID=UC...
```

**En producción:** panel de Cloudflare Pages → Settings → Variables and Secrets,
entorno Production. `YOUTUBE_KEY` debe marcarse como **Secret**.

Las variables se inyectan al desplegar, así que después de añadirlas o
cambiarlas hay que relanzar el despliegue.

---

## Despliegue

Cada push a `main` despliega automáticamente. Manualmente:

```bash
npx wrangler pages deploy
```

---

## Editar contenido

El contenido vive en `public/data/`, no en el código. Para publicar un beat
nuevo, añade una entrada a `beats.json` y sube el MP3 a `public/audio/`:

```json
{
  "id": 7,
  "title": "NOMBRE",
  "bpm": "150 BPM",
  "key": "C MAJOR",
  "audioUrl": "/audio/Nombre.mp3",
  "buyUrl": "https://www.beatstars.com/luvbesly"
}
```

Mismo procedimiento para `kits.json` y `vsts.json`.

> **Importante:** Cloudflare distingue mayúsculas y minúsculas en los nombres de
> archivo; Windows no. Un `Beat.mp3` referenciado como `beat.mp3` funciona en
> local y falla en producción. `check.sh` detecta estos casos.

---

## Notas de seguridad

- Ninguna credencial llega al cliente. El navegador llama a `/api/videos`, y la
  clave vive como secreto del servidor.
- La función usa `playlistItems` (1 unidad de cuota) en lugar de `search` (100),
  con caché de una hora en el borde. Consumo aproximado: 24 unidades diarias
  frente a las 10.000 disponibles.
- Todo el DOM se construye con `textContent`; no se interpolan datos en HTML.
- CSP estricta en `_headers`, sin `unsafe-inline` ni `unsafe-eval`. Si en algún
  momento hace falta un estilo o script en línea, hay que declarar su hash en
  lugar de aflojar la política.

---

## Licencia

El **código fuente** de este repositorio se publica bajo licencia MIT (ver
[LICENSE](LICENSE)).

Esa licencia **no** cubre el contenido creativo: los archivos de audio de
`public/audio/`, las portadas e imágenes de `public/images/`, el logotipo ni la
identidad de marca **luvbesly**. Todos los derechos sobre ese material quedan
reservados. Su uso, distribución o reventa requiere autorización expresa.

Los enlaces del VST Vault apuntan a software de terceros alojado externamente.
Este repositorio no distribuye ni almacena ninguno de esos archivos.

---

## Contacto

luvbeslymail@gmail.com · [@luvbesly](https://instagram.com/luvbesly) ·
[BeatStars](https://www.beatstars.com/luvbesly)
