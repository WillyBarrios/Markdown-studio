import { reactive } from 'vue'
import * as webdav from '../lib/webdav'

const STORAGE_KEY = 'markdown-studio-nextcloud'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}

// Estado compartido: un solo módulo, un solo estado, sin importar cuántos
// componentes llamen a useNextcloud().
const state = reactive({
  config: null,       // { base, root, username, password }
  connected: false,
  connecting: false,
  path: '/',
  entries: [],
  loading: false,
  error: '',
  currentFile: null   // { path, name } del último archivo abierto/guardado en la nube
})

async function refresh() {
  if (!state.config) return
  state.loading = true
  state.error = ''
  try {
    state.entries = await webdav.propfind(state.config, state.path)
  } catch (err) {
    state.error = err.message
  } finally {
    state.loading = false
  }
}

async function connect({ url, username, password, remember }) {
  state.error = ''
  state.connecting = true
  try {
    const config = webdav.buildConfig({ url, username, password })
    await webdav.propfind(config, '/')
    state.config = config
    state.connected = true
    state.path = '/'
    state.currentFile = null
    if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, username, password }))
    else localStorage.removeItem(STORAGE_KEY)
    await refresh()
  } catch (err) {
    state.connected = false
    state.error = err.message || 'No se pudo conectar'
  } finally {
    state.connecting = false
  }
}

function disconnect() {
  state.config = null
  state.connected = false
  state.entries = []
  state.path = '/'
  state.currentFile = null
  localStorage.removeItem(STORAGE_KEY)
}

async function enter(entry) {
  if (!entry.isDir) return
  state.path = entry.path
  await refresh()
}

async function goUp() {
  if (!state.path || state.path === '/') return
  const parts = state.path.split('/').filter(Boolean)
  parts.pop()
  state.path = parts.length ? '/' + parts.join('/') : '/'
  await refresh()
}

async function openEntry(entry) {
  if (!state.config) return null
  const content = await webdav.getFile(state.config, entry.path)
  state.currentFile = { path: entry.path, name: entry.name }
  return { name: entry.name, content }
}

async function saveCurrent(content) {
  if (!state.config || !state.currentFile) throw new Error('No hay un archivo remoto activo')
  await webdav.putFile(state.config, state.currentFile.path, content)
}

async function saveAs(name, content) {
  if (!state.config) throw new Error('No hay conexión con Nextcloud')
  const finalName = name.trim().toLowerCase().endsWith('.md') ? name.trim() : `${name.trim()}.md`
  const folder = state.path === '/' ? '' : state.path
  const targetPath = `${folder}/${finalName}`
  await webdav.putFile(state.config, targetPath, content)
  state.currentFile = { path: targetPath, name: finalName }
  await refresh()
}

function tryAutoConnect() {
  const saved = loadSaved()
  if (saved && !state.connected && !state.connecting) connect({ ...saved, remember: true })
}

export function useNextcloud() {
  return { state, connect, disconnect, refresh, enter, goUp, openEntry, saveCurrent, saveAs, tryAutoConnect }
}
