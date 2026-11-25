// Las pruebas nunca piden anuncios de verdad: serían tráfico inválido para la cuenta de AdSense
// (y sin red, el código de Google tira errores que no son de la app). anuncios.mjs usa uno simulado.
export const DOMINIOS_ANUNCIOS =
  /^https?:\/\/([^/]+\.)?(googlesyndication\.com|doubleclick\.net|googleadservices\.com|adtrafficquality\.google|fundingchoicesmessages\.google\.com)\//;

export const sinAnuncios = (ctx) =>
  ctx.route(DOMINIOS_ANUNCIOS, (r) => r.abort());
