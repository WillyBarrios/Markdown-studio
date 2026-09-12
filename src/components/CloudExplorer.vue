<script setup>
import { reactive } from 'vue'
import { useNextcloud } from '../composables/useNextcloud'

const emit = defineEmits(['open'])
const { state, connect, disconnect, refresh, enter, goUp, openEntry } = useNextcloud()

const form = reactive({ url: '', username: '', password: '', remember: true })

async function handleConnect() {
  await connect({ ...form })
}

async function handleClick(entry) {
  if (entry.isDir) { await enter(entry); return }
  try {
    const file = await openEntry(entry)
    if (file) emit('open', file)
  } catch (err) {
    state.error = err.message || 'No se pudo abrir el archivo'
  }
}

function isMarkdown(entry) {
  return entry.isDir || /\.(md|markdown|txt)$/i.test(entry.name)
}
</script>

<template>
  <aside class="cloud-explorer">
    <div class="cloud-header">
      <span>☁ Nextcloud</span>
      <div class="cloud-header-actions">
        <button v-if="state.connected" class="icon-btn" title="Actualizar" @click="refresh">⟳</button>
        <button v-if="state.connected" class="icon-btn" title="Desconectar" @click="disconnect">⏻</button>
      </div>
    </div>

    <form v-if="!state.connected" class="cloud-form" @submit.prevent="handleConnect">
      <label>
        URL del servidor
        <input v-model="form.url" placeholder="https://nube.midominio.com" required autocomplete="off">
      </label>
      <label>
        Usuario
        <input v-model="form.username" placeholder="usuario" required autocomplete="off">
      </label>
      <label>
        App password
        <input v-model="form.password" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" required autocomplete="new-password">
      </label>
      <label class="checkbox">
        <input v-model="form.remember" type="checkbox">
        Recordar en este navegador
      </label>
      <button class="primary" type="submit" :disabled="state.connecting">
        {{ state.connecting ? 'Conectando…' : 'Conectar' }}
      </button>
      <p class="cloud-hint">
        Crea una <em>app password</em> en Nextcloud: Configuración → Seguridad → Contraseñas de dispositivo.
        Tu servidor debe permitir CORS para este origen.
      </p>
      <p v-if="state.error" class="cloud-error">{{ state.error }}</p>
    </form>

    <div v-else class="cloud-browser">
      <div class="cloud-path">
        <button class="icon-btn" title="Subir un nivel" :disabled="state.path === '/'" @click="goUp">↑</button>
        <span class="path-text" :title="state.path">{{ state.path === '/' ? 'Raíz' : state.path }}</span>
      </div>
      <p v-if="state.error" class="cloud-error">{{ state.error }}</p>
      <p v-if="state.loading" class="cloud-status">Cargando…</p>
      <ul v-else class="cloud-list">
        <li
          v-for="entry in state.entries"
          :key="entry.path"
          :class="{ 'is-dir': entry.isDir, 'is-muted': !isMarkdown(entry) }"
          @click="handleClick(entry)"
        >
          <span class="entry-icon">{{ entry.isDir ? '📁' : '📄' }}</span>
          <span class="entry-name">{{ entry.name }}</span>
        </li>
        <li v-if="!state.entries.length" class="cloud-empty">Carpeta vacía</li>
      </ul>
    </div>
  </aside>
</template>
