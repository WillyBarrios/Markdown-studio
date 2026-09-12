// Cliente WebDAV minimalista para hablar con Nextcloud desde el navegador.
// Usa Basic Auth con una "app password" (Configuración > Seguridad > Contraseñas de dispositivo).

function toBase64(text) {
  return window.btoa(unescape(encodeURIComponent(text)))
}

function trimSlashes(value) {
  return value.replace(/^\/+/, '').replace(/\/+$/, '')
}

export function joinPath(...parts) {
  const cleaned = parts.map(trimSlashes).filter(Boolean)
  return '/' + cleaned.join('/')
}

export function buildConfig({ url, username, password }) {
  const base = url.trim().replace(/\/+$/, '')
  const root = `${base}/remote.php/dav/files/${encodeURIComponent(username.trim())}`
  return { base, root, username: username.trim(), password }
}

function authHeader(config) {
  return 'Basic ' + toBase64(`${config.username}:${config.password}`)
}

function friendlyError(status) {
  if (status === 401) return 'Usuario o app password incorrectos'
  if (status === 403) return 'Acceso denegado por el servidor'
  if (status === 404) return 'Ruta no encontrada'
  if (status === 0) return 'No se pudo contactar al servidor (revisa CORS o la URL)'
  return `El servidor respondió con un error (${status})`
}

async function request(config, path, options = {}) {
  const url = config.root + joinPath(path)
  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: { Authorization: authHeader(config), ...(options.headers || {}) }
    })
  } catch {
    throw new Error(friendlyError(0))
  }
  if (!res.ok) throw new Error(friendlyError(res.status))
  return res
}

export async function propfind(config, path = '/') {
  const res = await request(config, path, {
    method: 'PROPFIND',
    headers: { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
    body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
    <d:getcontentlength/>
    <d:getlastmodified/>
  </d:prop>
</d:propfind>`
  })
  const text = await res.text()
  return parsePropfind(text, config, path)
}

function parsePropfind(xmlText, config, requestedPath) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
  const responses = Array.from(doc.getElementsByTagNameNS('DAV:', 'response'))
  const rootPath = decodeURIComponent(new URL(config.root).pathname).replace(/\/+$/, '')
  const currentRel = trimSlashes(requestedPath)
  const entries = []

  for (const r of responses) {
    const hrefEl = r.getElementsByTagNameNS('DAV:', 'href')[0]
    if (!hrefEl) continue
    const hrefPath = decodeURIComponent(new URL(hrefEl.textContent, config.base).pathname).replace(/\/+$/, '')
    if (!hrefPath.startsWith(rootPath)) continue
    const relative = trimSlashes(hrefPath.slice(rootPath.length))
    if (relative === currentRel) continue // es la carpeta actual, no una entrada

    const isDir = !!r.getElementsByTagNameNS('DAV:', 'resourcetype')[0]
      ?.getElementsByTagNameNS('DAV:', 'collection')[0]
    const sizeEl = r.getElementsByTagNameNS('DAV:', 'getcontentlength')[0]
    const modifiedEl = r.getElementsByTagNameNS('DAV:', 'getlastmodified')[0]
    const name = relative.split('/').pop()

    entries.push({
      name,
      path: '/' + relative,
      isDir,
      size: sizeEl ? Number(sizeEl.textContent) : null,
      modified: modifiedEl ? modifiedEl.textContent : null
    })
  }

  entries.sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)))
  return entries
}

export async function getFile(config, path) {
  const res = await request(config, path)
  return res.text()
}

export async function putFile(config, path, content) {
  await request(config, path, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    body: content
  })
}

export async function makeFolder(config, path) {
  await request(config, path, { method: 'MKCOL' })
}
