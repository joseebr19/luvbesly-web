# luvbesly.com

Web oficial y plataforma de venta de beats.
Estática, desplegada en Cloudflare Pages.

## Estructura
    public/         lo que se publica (html, css, js, data, assets)
    functions/api/  endpoints de servidor
    .dev.vars       secretos locales — NO se sube

## Desarrollo
    npx wrangler pages dev

## Despliegue
    npx wrangler pages deploy

## Variables necesarias
    YOUTUBE_KEY          clave de la API de YouTube Data v3
    YOUTUBE_CHANNEL_ID   ID del canal (empieza por UC)

En local van en .dev.vars. En producción, en el panel de
Cloudflare Pages, en Settings > Environment variables.
