<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const starter = `# Mi nuevo documento

Escribe aquí. Selecciona un texto y usa la barra de herramientas para darle formato.

## Ideas principales

- Markdown es fácil de leer y compartir.
- La vista previa muestra el resultado al instante.

| Concepto | Estado |
| --- | --- |
| Editor | Listo |
| Vista previa | Activa |
`

const content = ref(localStorage.getItem('markdown-studio-content') || starter)
const fileName = ref(localStorage.getItem('markdown-studio-name') || 'mi-documento.md')
const isDark = ref(localStorage.getItem('markdown-studio-theme') === 'dark')

const editor = ref(null)
const fileInput = ref(null)
const status = ref('Listo para editar')
const saveLocation = ref('Descargas del navegador')
const directoryHandle = ref(null)

watch([content, fileName], () => {
  localStorage.setItem('markdown-studio-content', content.value)
  localStorage.setItem('markdown-studio-name', fileName.value)
}, { deep: true })

watch(isDark, (val) => {
  const theme = val ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('markdown-studio-theme', theme)
}, { immediate: true })

function toggleTheme(event) {
  const nextTheme = !isDark.value
  
  if (!document.startViewTransition) {
    isDark.value = nextTheme
    return
  }

  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    isDark.value = nextTheme
  })

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ]
    document.documentElement.animate(
      { clipPath },
      {
        duration: 450,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  })
}

const rendered = computed(() => renderMarkdown(content.value))
const wordCount = computed(() => content.value.trim() ? content.value.trim().split(/\s+/).length : 0)

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(text) {
  let safe = escapeHtml(text)
  safe = safe.replace(/&lt;span style=&quot;font-size:\s*(\d{1,3})(px|em|rem|%)&quot;&gt;([\s\S]*?)&lt;\/span&gt;/g, (_, size, unit, value) => `<span style="font-size:${Math.min(Number(size), 200)}${unit}">${value}</span>`)
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>')
  safe = safe.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img alt="$1" src="$2">')
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  safe = safe.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  safe = safe.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  safe = safe.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  return safe
}

function isTableSeparator(line) { return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line) }
function tableCells(line) { return line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()) }

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n')
  let html = ''; let i = 0; let inCode = false; let code = []; let list = null
  const closeList = () => { if (list) { html += `</${list}>`; list = null } }
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      closeList()
      if (inCode) { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = []; inCode = false } else inCode = true
      i++; continue
    }
    if (inCode) { code.push(line); i++; continue }
    if (i + 1 < lines.length && line.includes('|') && isTableSeparator(lines[i + 1])) {
      closeList(); const headers = tableCells(line); i += 2; const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(tableCells(lines[i])); i++ }
      html += `<div class="table-wrap"><table><thead><tr>${headers.map(x => `<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, n) => `<td>${inline(row[n] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    const quote = line.match(/^>\s?(.*)$/)
    const unordered = line.match(/^[-*+]\s+(.+)$/)
    const ordered = line.match(/^\d+\.\s+(.+)$/)
    if (heading) { closeList(); const level = heading[1].length; html += `<h${level}>${inline(heading[2])}</h${level}>` }
    else if (quote) { closeList(); html += `<blockquote>${inline(quote[1])}</blockquote>` }
    else if (unordered) { if (list !== 'ul') { closeList(); list = 'ul'; html += '<ul>' } html += `<li>${inline(unordered[1])}</li>` }
    else if (ordered) { if (list !== 'ol') { closeList(); list = 'ol'; html += '<ol>' } html += `<li>${inline(ordered[1])}</li>` }
    else { closeList(); if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) html += '<hr>'; else if (line.trim()) html += `<p>${inline(line)}</p>`; else html += '<div class="spacer"></div>' }
    i++
  }
  closeList()
  if (inCode) html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`
  return html || '<p class="empty">Comienza a escribir para ver tu documento.</p>'
}

function selection() { const el = editor.value; return { start: el.selectionStart, end: el.selectionEnd, text: content.value.slice(el.selectionStart, el.selectionEnd) } }
function replaceSelection(value, caretOffset = value.length) {
  const { start, end } = selection(); content.value = content.value.slice(0, start) + value + content.value.slice(end)
  nextTick(() => { editor.value.focus(); editor.value.setSelectionRange(start + caretOffset, start + caretOffset) })
}
function wrap(before, after = before, placeholder = 'texto') { const s = selection(); replaceSelection(before + (s.text || placeholder) + after, before.length + (s.text || placeholder).length + after.length) }
function linePrefix(prefix) { const s = selection(); const start = content.value.lastIndexOf('\n', s.start - 1) + 1; const endBreak = content.value.indexOf('\n', s.end); const end = endBreak === -1 ? content.value.length : endBreak; const block = content.value.slice(start, end); content.value = content.value.slice(0, start) + block.split('\n').map(line => prefix + line).join('\n') + content.value.slice(end); nextTick(() => editor.value.focus()) }
function heading(level) { const s = selection(); const start = content.value.lastIndexOf('\n', s.start - 1) + 1; const end = content.value.indexOf('\n', s.end) === -1 ? content.value.length : content.value.indexOf('\n', s.end); const clean = content.value.slice(start, end).replace(/^#{1,6}\s*/, ''); content.value = content.value.slice(0, start) + '#'.repeat(level) + ' ' + clean + content.value.slice(end); nextTick(() => editor.value.focus()) }
function insertTable() { replaceSelection('\n| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| Dato | Dato | Dato |\n') }
function changeSize(size) { const s = selection(); wrap(`<span style="font-size: ${size}">`, '</span>', 'texto') }
function newDocument() { if (confirm('¿Crear un documento nuevo? El contenido actual seguirá guardado en este navegador.')) { content.value = '# Nuevo documento\n\n'; fileName.value = 'mi-documento.md'; status.value = 'Documento nuevo creado' } }
function normalizeName() { const base = fileName.value.trim() || 'mi-documento'; return base.toLowerCase().endsWith('.md') ? base : `${base}.md` }
function download() { const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = normalizeName(); link.click(); URL.revokeObjectURL(link.href); status.value = 'Archivo descargado' }
async function saveFile() {
  try {
    if (directoryHandle.value) {
      const handle = await directoryHandle.value.getFileHandle(normalizeName(), { create: true })
      const writable = await handle.createWritable(); await writable.write(content.value); await writable.close()
      status.value = 'Archivo guardado en la carpeta configurada'; return
    }
    if (!('showSaveFilePicker' in window)) { download(); return }
    const handle = await window.showSaveFilePicker({ suggestedName: normalizeName(), types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] })
    const writable = await handle.createWritable(); await writable.write(content.value); await writable.close(); fileName.value = handle.name; saveLocation.value = `Ubicación seleccionada: ${handle.name}`; status.value = 'Archivo guardado correctamente'
  } catch (error) { if (error.name !== 'AbortError') status.value = 'No se pudo guardar el archivo' }
}
async function configureFolder() {
  if (!('showDirectoryPicker' in window)) { saveLocation.value = 'Usa Guardar archivo para elegir ubicación'; status.value = 'Este navegador no permite seleccionar carpetas'; return }
  try { directoryHandle.value = await window.showDirectoryPicker({ mode: 'readwrite' }); saveLocation.value = `Carpeta configurada: ${directoryHandle.value.name}`; status.value = 'Ruta de guardado configurada' } catch (error) { if (error.name !== 'AbortError') status.value = 'No se pudo seleccionar la carpeta' }
}
async function openFile(event) { const file = event.target.files?.[0]; if (!file) return; content.value = await file.text(); fileName.value = file.name; status.value = `Archivo cargado: ${file.name}`; event.target.value = '' }
onMounted(() => { if (!('showSaveFilePicker' in window)) saveLocation.value = 'Descargas del navegador (tu navegador no permite elegir carpeta)' })
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">M</div>
        <span>Markdown Studio</span>
        <small>Editor y lector</small>
      </div>
      <div class="header-actions">
        <button
          class="theme-switch-btn"
          :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          :title="isDark ? 'Modo claro (Sol)' : 'Modo oscuro (Luna)'"
          @click="toggleTheme"
        >
          <svg class="switch-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
          <div class="switch-knob">
            <svg v-if="!isDark" class="switch-knob-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
            <svg v-else class="switch-knob-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          </div>
          <svg class="switch-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        </button>

        <button class="ghost" @click="newDocument">＋ Nuevo</button>
        <button class="ghost" @click="fileInput.click()">↥ Abrir .md</button>
        <button class="ghost" @click="configureFolder">⌁ Carpeta</button>
        <button class="primary" @click="saveFile">Guardar archivo</button>
        <input ref="fileInput" type="file" accept=".md,text/markdown,text/plain" hidden @change="openFile">
      </div>
    </header>
    <section class="document-bar">
      <input v-model="fileName" aria-label="Nombre del archivo">
      <span class="location">⌁ {{ saveLocation }}</span>
      <span class="status">● {{ status }}</span>
    </section>
    <section class="workspace">
      <article class="pane editor-pane">
        <div class="pane-title"><span>EDITOR</span><span>{{ wordCount }} palabras</span></div>
        <div class="toolbar">
          <select aria-label="Encabezado" @change="heading(Number($event.target.value)); $event.target.value = ''">
            <option value="">Encabezado</option>
            <option value="1">Título H1</option>
            <option value="2">Subtítulo H2</option>
            <option value="3">Sección H3</option>
          </select>
          <button title="Negrita" @click="wrap('**')"><b>B</b></button>
          <button title="Cursiva" @click="wrap('*')"><i>I</i></button>
          <button title="Tachado" @click="wrap('~~')">S̶</button>
          <button title="Código" @click="wrap('`')">&lt;/&gt;</button>
          <span></span>
          <button title="Lista" @click="linePrefix('- ')">☷</button>
          <button title="Lista numerada" @click="linePrefix('1. ')">☷₁</button>
          <button title="Cita" @click="linePrefix('&gt; ')">❝</button>
          <button title="Insertar tabla" @click="insertTable">▦</button>
          <button title="Enlace" @click="wrap('[', '](https://)', 'texto del enlace')">↗</button>
          <span></span>
          <select aria-label="Tamaño de letra" @change="changeSize($event.target.value); $event.target.value = ''">
            <option value="">Tamaño</option>
            <option value="14px">Pequeño</option>
            <option value="18px">Normal</option>
            <option value="24px">Grande</option>
            <option value="32px">Muy grande</option>
          </select>
        </div>
        <textarea ref="editor" v-model="content" spellcheck="true" aria-label="Editor Markdown"></textarea>
      </article>
      <article class="pane preview-pane">
        <div class="pane-title"><span>VISTA PREVIA</span><span class="live">● En vivo</span></div>
        <div class="preview-content" v-html="rendered"></div>
      </article>
    </section>
    <footer>
      <span>Compatible con archivos Markdown (.md)</span>
      <span>Los cambios se conservan localmente mientras editas</span>
    </footer>
  </main>
</template>
